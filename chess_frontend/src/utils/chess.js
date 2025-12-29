/**
 * Minimal chess helpers for UI rendering and UCI move construction.
 * The backend is the source of truth for legality; these helpers are for display and UX only.
 */

const pieceToUnicode = {
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
  K: '♔',
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// PUBLIC_INTERFACE
export function squareToCoord(square) {
  /** Convert algebraic square (e.g., "e4") to {file:0..7, rank:0..7} where rank=0 is rank 1. */
  if (!square || square.length !== 2) return null;
  const f = files.indexOf(square[0]);
  const r = parseInt(square[1], 10) - 1;
  if (f < 0 || Number.isNaN(r) || r < 0 || r > 7) return null;
  return { file: f, rank: r };
}

// PUBLIC_INTERFACE
export function coordToSquare({ file, rank }) {
  /** Convert {file,rank} to algebraic square where rank=0 is rank 1. */
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${files[file]}${rank + 1}`;
}

// PUBLIC_INTERFACE
export function parseFenToBoard(fen) {
  /**
   * Parse FEN piece placement into an 8x8 board of piece chars or null.
   * Returns board[rankIndex][fileIndex] where rankIndex=0 is rank 8 (top).
   */
  if (!fen) return emptyBoard();
  const piecePlacement = fen.split(' ')[0];
  if (!piecePlacement) return emptyBoard();

  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) return emptyBoard();

  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (const c of ranks[r]) {
      if (/[1-8]/.test(c)) {
        const n = parseInt(c, 10);
        for (let i = 0; i < n; i++) row.push(null);
      } else {
        row.push(c);
      }
    }
    // Ensure 8 columns
    while (row.length < 8) row.push(null);
    board.push(row.slice(0, 8));
  }
  return board;
}

function emptyBoard() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
}

// PUBLIC_INTERFACE
export function pieceUnicode(pieceChar) {
  /** Map FEN piece char to Unicode chess symbol (or empty string). */
  return pieceToUnicode[pieceChar] || '';
}

// PUBLIC_INTERFACE
export function isWhitePiece(pieceChar) {
  /** Returns true if pieceChar is uppercase (white). */
  if (!pieceChar) return false;
  return pieceChar === pieceChar.toUpperCase();
}

// PUBLIC_INTERFACE
export function uciMove(fromSquare, toSquare, { promotion } = {}) {
  /** Build UCI move like e2e4 or e7e8q (promotion optional). */
  if (!fromSquare || !toSquare) return null;
  const base = `${fromSquare}${toSquare}`;
  if (promotion) return `${base}${promotion}`;
  return base;
}

// PUBLIC_INTERFACE
export function guessPromotionIfNeeded(pieceChar, fromSquare, toSquare) {
  /**
   * If a pawn reaches last rank, default promotion to queen (q).
   * Backend will validate; this only helps UX.
   */
  if (!pieceChar || !fromSquare || !toSquare) return null;
  const isPawn = pieceChar.toLowerCase() === 'p';
  if (!isPawn) return null;

  const to = squareToCoord(toSquare);
  if (!to) return null;

  // rank is 0..7 (rank 1..8). Promotion at rank 8 for white (rank==7), rank 1 for black (rank==0).
  if (isWhitePiece(pieceChar) && to.rank === 7) return 'q';
  if (!isWhitePiece(pieceChar) && to.rank === 0) return 'q';
  return null;
}

// PUBLIC_INTERFACE
export function splitMovesByPly(moves) {
  /**
   * Convert backend move list into rows of [whiteMove, blackMove].
   * Backend move_number is per ply (1..N).
   */
  const rows = [];
  const copy = Array.isArray(moves) ? moves.slice() : [];
  for (let i = 0; i < copy.length; i += 2) {
    const white = copy[i] || null;
    const black = copy[i + 1] || null;
    rows.push({ moveIndex: Math.floor(i / 2) + 1, white, black });
  }
  return rows;
}
