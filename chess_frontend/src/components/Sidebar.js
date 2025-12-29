import React, { useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export default function Sidebar({
  open,
  onClose,
  user,
  games,
  activeGameId,
  onCreateUser,
  onSelectGame,
  onCreateGame,
  onRefreshGames,
  onSaveSnapshot,
  onLoadSnapshot,
  canInteract, // boolean
}) {
  /** Sidebar menu: user + games + snapshots. On mobile it becomes a slide-in drawer. */
  const [username, setUsername] = useState('');
  const [playAs, setPlayAs] = useState('white'); // white | black
  const [snapshotName, setSnapshotName] = useState('latest');

  const sortedGames = useMemo(() => {
    if (!Array.isArray(games)) return [];
    return games.slice();
  }, [games]);

  return (
    <>
      {open ? <div className="sidebarBackdrop" onClick={onClose} aria-hidden="true" /> : null}

      <aside className={['sidebar', open ? 'sidebarOpen' : ''].join(' ')} aria-label="Sidebar menu">
        <div className="sidebarHeader">
          <div className="brand" aria-label="Ocean Chess">
            <div className="brandMark" aria-hidden="true" />
            <div>Ocean Chess</div>
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        <section className="sidebarSection">
          <h3 className="sidebarSectionTitle">User</h3>

          <div className="fieldRow">
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Create username…"
              aria-label="Username"
              disabled={!canInteract}
            />
            <button
              className="btn"
              onClick={() => onCreateUser(username)}
              disabled={!canInteract || !username.trim()}
              aria-label="Create user"
            >
              Create
            </button>
          </div>

          <div className="helpText">
            {user ? (
              <>
                Active user: <strong>{user.username}</strong>
              </>
            ) : (
              <>Create a user to filter games and start new ones.</>
            )}
          </div>
        </section>

        <section className="sidebarSection">
          <h3 className="sidebarSectionTitle">Games</h3>

          <div className="fieldRow">
            <select
              className="select"
              value={playAs}
              onChange={(e) => setPlayAs(e.target.value)}
              aria-label="Play as"
              disabled={!canInteract}
            >
              <option value="white">Play as White</option>
              <option value="black">Play as Black</option>
            </select>

            <button
              className="btn secondary"
              onClick={() => onCreateGame(playAs)}
              disabled={!canInteract || !user}
              aria-label="Create game"
            >
              New
            </button>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button className="btn ghost" onClick={onRefreshGames} disabled={!canInteract} aria-label="Refresh games">
              ↻ Refresh list
            </button>
          </div>

          <div style={{ marginTop: 10 }} className="gameList">
            {sortedGames.length === 0 ? (
              <div className="helpText">No games yet. Create one to begin.</div>
            ) : (
              sortedGames.map((g) => (
                <div
                  key={g.id}
                  className={[
                    'gameListItem',
                    g.id === activeGameId ? 'gameListItemActive' : '',
                  ].join(' ')}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectGame(g.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onSelectGame(g.id);
                  }}
                >
                  <div className="gameListItemTop">
                    <span>{g.id.slice(0, 8)}…</span>
                    <span className="muted">{g.status}</span>
                  </div>
                  <div className="helpText" style={{ marginTop: 6 }}>
                    Moves: <strong>{g.moves?.length || 0}</strong> · Turn:{' '}
                    <strong>{g.turn === 'w' ? 'White' : 'Black'}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="sidebarSection">
          <h3 className="sidebarSectionTitle">Snapshots</h3>

          <div className="fieldRow">
            <input
              className="input"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name…"
              aria-label="Snapshot name"
              disabled={!canInteract}
            />
            <button
              className="btn"
              onClick={() => onSaveSnapshot(snapshotName)}
              disabled={!canInteract || !activeGameId || !snapshotName.trim()}
              aria-label="Save snapshot"
            >
              Save
            </button>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn ghost"
              onClick={() => onLoadSnapshot(snapshotName)}
              disabled={!canInteract || !activeGameId || !snapshotName.trim()}
              aria-label="Load snapshot"
            >
              Load
            </button>
          </div>

          <div className="helpText">
            Save stores the current FEN + move count. Load restores it and discards later moves.
          </div>
        </section>

        <section className="sidebarSection">
          <h3 className="sidebarSectionTitle">Tips</h3>
          <div className="helpText">
            Click a piece, then click its destination. If a move is illegal, the backend will reject it and you’ll see a toast.
          </div>
        </section>
      </aside>
    </>
  );
}
