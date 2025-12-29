import React, { useMemo } from 'react';
import {
  coordToSquare,
  guessPromotionIfNeeded,
  isWhitePiece,
  parseFenToBoard,
  pieceUnicode,
  squareToCoord,
  uciMove,
} from '../utils/chess';

// PUBLIC_INTERFACE
export default function ChessBoard({
  fen,
  turn, // 'w' or 'b' from backend
  selectedSquare,
  onSelectSquare,
  onSubmitMoveUci,
  lastMoveUci,
  disabled,
}) {
  /** Render a chessboard from FEN and provide click-to-move interaction. */
  const board = useMemo(() => parseFenToBoard(fen), [fen]);

  const last = useMemo(() => {
    if (!lastMoveUci || typeof lastMoveUci !== 'string') return null;
    // UCI is like e2e4 or e7e8q
    const from = lastMoveUci.slice(0, 2);
    const to = lastMoveUci.slice(2, 4);
    return { from, to };
  }, [lastMoveUci]);

  const selectedCoord = useMemo(() => squareToCoord(selectedSquare), [selectedSquare]);

  function handleSquareClick(square, pieceChar) {
    if (disabled) return;

    if (!selectedSquare) {
      // Select only if it's the side-to-move piece (basic UX; backend still validates).
      if (!pieceChar) return;
      const isWhite = isWhitePiece(pieceChar);
      const isTurnWhite = turn === 'w';
      if ((isWhite && !isTurnWhite) || (!isWhite && isTurnWhite)) return;
      onSelectSquare(square);
      return;
    }

    // Clicking selected square de-selects
    if (square === selectedSquare) {
      onSelectSquare(null);
      return;
    }

    // If clicked another own piece, change selection
    if (pieceChar) {
      const isWhite = isWhitePiece(pieceChar);
      const isTurnWhite = turn === 'w';
      if ((isWhite && isTurnWhite) || (!isWhite && !isTurnWhite)) {
        onSelectSquare(square);
        return;
      }
    }

    // Attempt move
    const fromPiece = getPieceAtSquare(board, selectedSquare);
    const promotion = guessPromotionIfNeeded(fromPiece, selectedSquare, square);
    const uci = uciMove(selectedSquare, square, { promotion });

    onSelectSquare(null);
    if (uci) onSubmitMoveUci(uci);
  }

  return (
    <div className="panel">
      <div className="panelHeader">
        <h2>Board</h2>
        <div className="statusRow">
          <span className="badge">
            <strong>Turn</strong> <span className="muted">{turn === 'w' ? 'White' : 'Black'}</span>
          </span>
        </div>
      </div>

      <div className="boardWrap">
        <div className="board" role="grid" aria-label="Chessboard">
          {board.map((row, rIdx) =>
            row.map((pieceChar, fIdx) => {
              const isLight = (rIdx + fIdx) % 2 === 0;
              // board rank index 0 => rank 8. Convert to coord where rank 0 => rank 1.
              const rankFromBottom = 7 - rIdx;
              const square = coordToSquare({ file: fIdx, rank: rankFromBottom });

              const isSelected = !!selectedCoord && selectedCoord.file === fIdx && selectedCoord.rank === rankFromBottom;

              const isLastMove =
                last && (square === last.from || square === last.to);

              const showFile = rIdx === 7; // bottom row shows file labels
              const showRank = fIdx === 0; // leftmost file shows rank labels

              const classes = [
                'square',
                isLight ? 'squareLight' : 'squareDark',
                isSelected ? 'squareSelected' : '',
                isLastMove ? 'squareLastMove' : '',
              ].join(' ');

              return (
                <div
                  key={`${rIdx}-${fIdx}`}
                  className={classes}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={`${square}${pieceChar ? ` ${pieceChar}` : ''}`}
                  onClick={() => handleSquareClick(square, pieceChar)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleSquareClick(square, pieceChar);
                  }}
                >
                  {pieceChar ? <span className="piece">{pieceUnicode(pieceChar)}</span> : null}
                  {showFile ? <span className="coord coordFile">{square[0]}</span> : null}
                  {showRank ? <span className="coord coordRank">{square[1]}</span> : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function getPieceAtSquare(board, square) {
  const c = squareToCoord(square);
  if (!c) return null;
  // board is [rank8..rank1][file]
  const rIdx = 7 - c.rank;
  const fIdx = c.file;
  if (rIdx < 0 || rIdx > 7 || fIdx < 0 || fIdx > 7) return null;
  return board[rIdx][fIdx];
}
