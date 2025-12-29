import React, { useMemo } from 'react';
import { splitMovesByPly } from '../utils/chess';

// PUBLIC_INTERFACE
export default function MoveHistory({ moves }) {
  /** Display move history in a compact two-column (white/black) table-like list. */
  const rows = useMemo(() => splitMovesByPly(moves), [moves]);

  return (
    <div className="panel">
      <div className="panelHeader">
        <h2>Move History</h2>
        <span className="badge">
          <strong>{Array.isArray(moves) ? moves.length : 0}</strong> <span className="muted">plies</span>
        </span>
      </div>

      <div className="moveHistory" role="region" aria-label="Move history">
        {rows.length === 0 ? (
          <div className="panelBody">
            <p className="muted" style={{ margin: 0 }}>
              No moves yet. Click a piece, then click its destination. The backend validates legality.
            </p>
          </div>
        ) : (
          rows.map((r) => (
            <div className="moveRow" key={`m-${r.moveIndex}`}>
              <div className="moveNo">{r.moveIndex}.</div>
              <div className="moveSan">{r.white ? r.white.san : '—'}</div>
              <div className="moveSan">{r.black ? r.black.san : '—'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
