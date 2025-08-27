// Chess game type definitions

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  id: string;
  hasMoved?: boolean; // For castling and pawn double-move tracking
}

export interface Position {
  row: number;
  col: number;
}

export interface ChessMove {
  from: Position;
  to: Position;
  piece: ChessPiece;
  capturedPiece?: ChessPiece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  promotion?: PieceType;
  notation: string; // Standard algebraic notation
}

export interface GameState {
  board: (ChessPiece | null)[][];
  currentPlayer: PieceColor;
  moveHistory: ChessMove[];
  capturedPieces: ChessPiece[];
  gameStatus: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
  winner?: PieceColor;
  lastMove?: ChessMove;
  enPassantTarget?: Position;
  castlingRights: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
}

export interface AIRequest {
  fen: string;
  moveHistory: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIResponse {
  move: string;
  evaluation?: number;
  thinking?: string;
}

export interface DragState {
  isDragging: boolean;
  draggedPiece?: ChessPiece;
  draggedFrom?: Position;
  validMoves: Position[];
}

// Unicode symbols for chess pieces
export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
};

// Initial board setup
export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0
};