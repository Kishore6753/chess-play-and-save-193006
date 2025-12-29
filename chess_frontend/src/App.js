import React, { useEffect, useMemo, useReducer, useState } from 'react';
import './App.css';

import { chessApi } from './api/chessApi';
import ChessBoard from './components/ChessBoard';
import Header from './components/Header';
import MoveHistory from './components/MoveHistory';
import Sidebar from './components/Sidebar';
import ToastProvider, { useToasts } from './components/ToastProvider';

const LS_USER_KEY = 'ocean-chess:user';

const initialState = {
  user: null,
  games: [],
  activeGame: null,
  loading: false,
  lastMoveUci: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: action.value };

    case 'SET_USER':
      return { ...state, user: action.user };

    case 'SET_GAMES':
      return { ...state, games: action.games || [] };

    case 'SET_ACTIVE_GAME':
      return { ...state, activeGame: action.game || null };

    case 'SET_LAST_MOVE_UCI':
      return { ...state, lastMoveUci: action.uci || null };

    default:
      return state;
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(LS_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.username) return parsed;
    return null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (!user) {
      localStorage.removeItem(LS_USER_KEY);
      return;
    }
    localStorage.setItem(LS_USER_KEY, JSON.stringify({ id: user.id, username: user.username }));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
function AppInner() {
  /** Main chess application UI with backend integration. */
  const [state, dispatch] = useReducer(reducer, initialState);
  const { push } = useToasts();

  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load stored user on first mount
  useEffect(() => {
    const stored = readStoredUser();
    if (stored) {
      dispatch({ type: 'SET_USER', user: stored });
    }
  }, []);

  // Refresh games when user changes
  useEffect(() => {
    (async () => {
      try {
        dispatch({ type: 'LOADING', value: true });
        const games = await chessApi.listGames({ userId: state.user?.id || undefined });
        dispatch({ type: 'SET_GAMES', games });

        // If active game no longer exists in list, clear it.
        if (state.activeGame && !games.find((g) => g.id === state.activeGame.id)) {
          dispatch({ type: 'SET_ACTIVE_GAME', game: null });
        }
      } catch (e) {
        push({ type: 'error', title: 'Could not load games', message: e.message });
      } finally {
        dispatch({ type: 'LOADING', value: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]);

  const statusText = useMemo(() => {
    const g = state.activeGame;
    if (!g) return 'Ready';
    if (g.status === 'active') return g.is_check ? 'Check!' : 'In play';
    if (g.status === 'checkmate') return 'Checkmate';
    if (g.status === 'stalemate') return 'Stalemate';
    if (g.status === 'draw') return 'Draw';
    return g.status;
  }, [state.activeGame]);

  async function refreshGames() {
    try {
      dispatch({ type: 'LOADING', value: true });
      const games = await chessApi.listGames({ userId: state.user?.id || undefined });
      dispatch({ type: 'SET_GAMES', games });
    } catch (e) {
      push({ type: 'error', title: 'Refresh failed', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function refreshActiveGame() {
    if (!state.activeGame) return;
    try {
      dispatch({ type: 'LOADING', value: true });
      const game = await chessApi.getGame(state.activeGame.id);
      dispatch({ type: 'SET_ACTIVE_GAME', game });
      dispatch({ type: 'SET_LAST_MOVE_UCI', uci: game.moves?.length ? game.moves[game.moves.length - 1].uci : null });
    } catch (e) {
      push({ type: 'error', title: 'Could not refresh game', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function createUser(username) {
    try {
      dispatch({ type: 'LOADING', value: true });
      const user = await chessApi.createUser(username.trim());
      dispatch({ type: 'SET_USER', user });
      storeUser(user);
      push({ type: 'success', title: 'User created', message: `Welcome, ${user.username}!` });
      setSidebarOpen(false);
    } catch (e) {
      push({ type: 'error', title: 'User creation failed', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function createGame(playAs) {
    if (!state.user) {
      push({ type: 'error', title: 'No user', message: 'Create a user first.' });
      return;
    }
    try {
      dispatch({ type: 'LOADING', value: true });
      const payload = playAs === 'black'
        ? { white_user_id: null, black_user_id: state.user.id }
        : { white_user_id: state.user.id, black_user_id: null };

      const game = await chessApi.createGame(payload);
      dispatch({ type: 'SET_ACTIVE_GAME', game });
      dispatch({ type: 'SET_LAST_MOVE_UCI', uci: null });

      push({ type: 'success', title: 'Game created', message: `Game ${game.id.slice(0, 8)}… ready.` });

      // Refresh list and close drawer on mobile
      await refreshGames();
      setSidebarOpen(false);
    } catch (e) {
      push({ type: 'error', title: 'Game creation failed', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function selectGame(gameId) {
    try {
      dispatch({ type: 'LOADING', value: true });
      const game = await chessApi.getGame(gameId);
      dispatch({ type: 'SET_ACTIVE_GAME', game });
      dispatch({ type: 'SET_LAST_MOVE_UCI', uci: game.moves?.length ? game.moves[game.moves.length - 1].uci : null });
      setSelectedSquare(null);
      setSidebarOpen(false);
    } catch (e) {
      push({ type: 'error', title: 'Could not load game', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function submitMoveUci(uci) {
    if (!state.activeGame) {
      push({ type: 'error', title: 'No game', message: 'Create or select a game first.' });
      return;
    }
    try {
      dispatch({ type: 'LOADING', value: true });
      const updated = await chessApi.submitMove(state.activeGame.id, { uci });
      dispatch({ type: 'SET_ACTIVE_GAME', game: updated });
      dispatch({ type: 'SET_LAST_MOVE_UCI', uci });
    } catch (e) {
      push({ type: 'error', title: 'Illegal move', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function saveSnapshot(name) {
    if (!state.activeGame) return;
    try {
      dispatch({ type: 'LOADING', value: true });
      const snap = await chessApi.saveSnapshot(state.activeGame.id, { name: name.trim() });
      push({ type: 'success', title: 'Snapshot saved', message: `Saved “${snap.name}”.` });
    } catch (e) {
      push({ type: 'error', title: 'Save failed', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  async function loadSnapshot(name) {
    if (!state.activeGame) return;
    try {
      dispatch({ type: 'LOADING', value: true });
      const updated = await chessApi.loadSnapshot(state.activeGame.id, { name: name.trim() });
      dispatch({ type: 'SET_ACTIVE_GAME', game: updated });
      dispatch({ type: 'SET_LAST_MOVE_UCI', uci: updated.moves?.length ? updated.moves[updated.moves.length - 1].uci : null });
      setSelectedSquare(null);
      push({ type: 'success', title: 'Snapshot loaded', message: `Loaded “${name.trim()}”.` });
    } catch (e) {
      push({ type: 'error', title: 'Load failed', message: e.message });
    } finally {
      dispatch({ type: 'LOADING', value: false });
    }
  }

  const canInteract = !state.loading;

  return (
    <div className="App">
      <div className="appShell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={state.user}
          games={state.games}
          activeGameId={state.activeGame?.id || null}
          onCreateUser={createUser}
          onSelectGame={selectGame}
          onCreateGame={createGame}
          onRefreshGames={refreshGames}
          onSaveSnapshot={saveSnapshot}
          onLoadSnapshot={loadSnapshot}
          canInteract={canInteract}
        />

        <main className="main">
          <Header
            user={state.user}
            game={state.activeGame}
            statusText={statusText}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            theme={theme}
            onRefreshGame={refreshActiveGame}
          />

          <div className="content">
            <div>
              {state.activeGame ? (
                <ChessBoard
                  fen={state.activeGame.fen}
                  turn={state.activeGame.turn}
                  selectedSquare={selectedSquare}
                  onSelectSquare={setSelectedSquare}
                  onSubmitMoveUci={submitMoveUci}
                  lastMoveUci={state.lastMoveUci}
                  disabled={!canInteract || state.activeGame.status !== 'active'}
                />
              ) : (
                <div className="panel">
                  <div className="panelHeader">
                    <h2>Get Started</h2>
                    <span className="badge">
                      <strong>Tip</strong> <span className="muted">Open the menu to create a user/game</span>
                    </span>
                  </div>
                  <div className="panelBody">
                    <p style={{ marginTop: 0 }}>
                      Create a user, start a game, then play by clicking a piece and its destination square.
                      The backend enforces chess rules and returns updated FEN + move history.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn" onClick={() => setSidebarOpen(true)}>
                        Open Menu
                      </button>
                      <button className="btn ghost" onClick={refreshGames}>
                        Refresh Games
                      </button>
                    </div>
                    <p className="helpText">
                      Backend base URL is configurable via <code>REACT_APP_API_BASE</code>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <MoveHistory moves={state.activeGame?.moves || []} />
              {state.activeGame ? (
                <div className="panel" style={{ marginTop: 18 }}>
                  <div className="panelHeader">
                    <h2>Status</h2>
                    <span className="badge">
                      <strong>{state.activeGame.status}</strong>
                      <span className="muted">{state.activeGame.is_check ? '· check' : ''}</span>
                    </span>
                  </div>
                  <div className="panelBody">
                    <div className="helpText" style={{ marginTop: 0 }}>
                      Current turn: <strong>{state.activeGame.turn === 'w' ? 'White' : 'Black'}</strong>
                      <br />
                      Moves: <strong>{state.activeGame.moves?.length || 0}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** App entry: wraps main UI in ToastProvider. */
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
