import React from 'react';

// PUBLIC_INTERFACE
export default function Header({
  user,
  game,
  statusText,
  onToggleSidebar,
  onToggleTheme,
  theme,
  onRefreshGame,
}) {
  /** Top header with sidebar toggle, status info, and quick actions. */
  return (
    <div className="header">
      <div className="headerLeft">
        <button className="btn ghost" onClick={onToggleSidebar} aria-label="Toggle menu">
          ☰
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="headerTitle">Ocean Chess</div>
          <div className="headerMeta">
            {user ? `User: ${user.username}` : 'No user selected'} ·{' '}
            {game ? `Game: ${game.id.slice(0, 8)}…` : 'No game loaded'} ·{' '}
            {statusText}
          </div>
        </div>
      </div>

      <div className="headerRight">
        <button className="btn ghost" onClick={onRefreshGame} disabled={!game} aria-label="Refresh game">
          ↻ Refresh
        </button>
        <button className="btn secondary" onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </div>
  );
}
