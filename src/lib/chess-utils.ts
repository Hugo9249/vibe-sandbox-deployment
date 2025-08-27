import { ChessPiece, PieceType, PieceColor, Position, GameState, ChessMove, INITIAL_BOARD_FEN } from '@/types/chess';

// Convert between array indices and chess notation
export function positionToChessNotation(pos: Position): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return files[pos.col] + (8 - pos.row).toString();
}

export function chessNotationToPosition(notation: string): Position {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = notation[0];
  const rank = parseInt(notation[1]);
  return {
    row: 8 - rank,
    col: files.indexOf(file)
  };
}

// FEN notation conversion
export function gameStateToFEN(gameState: GameState): string {
  const board = gameState.board;
  let fen = '';
  
  // Board position
  for (let row = 0; row < 8; row++) {
    let emptyCount = 0;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        if (emptyCount > 0) {
          fen += emptyCount.toString();
          emptyCount = 0;
        }
        fen += pieceToFENChar(piece);
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount.toString();
    }
    if (row < 7) fen += '/';
  }
  
  // Active color
  fen += ' ' + (gameState.currentPlayer === 'white' ? 'w' : 'b');
  
  // Castling rights
  fen += ' ';
  let castling = '';
  if (gameState.castlingRights.whiteKingSide) castling += 'K';
  if (gameState.castlingRights.whiteQueenSide) castling += 'Q';
  if (gameState.castlingRights.blackKingSide) castling += 'k';
  if (gameState.castlingRights.blackQueenSide) castling += 'q';
  fen += castling || '-';
  
  // En passant target square
  fen += ' ';
  if (gameState.enPassantTarget) {
    fen += positionToChessNotation(gameState.enPassantTarget);
  } else {
    fen += '-';
  }
  
  // Halfmove clock (simplified - always 0 for now)
  fen += ' 0';
  
  // Fullmove number
  const fullmoveNumber = Math.floor(gameState.moveHistory.length / 2) + 1;
  fen += ' ' + fullmoveNumber.toString();
  
  return fen;
}

export function FENToGameState(fen: string): GameState {
  const parts = fen.split(' ');
  const boardPart = parts[0];
  const activeColor = parts[1] === 'w' ? 'white' : 'black';
  const castlingRights = parts[2];
  const enPassantTarget = parts[3] !== '-' ? chessNotationToPosition(parts[3]) : undefined;
  
  // Parse board
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  const rows = boardPart.split('/');
  
  for (let row = 0; row < 8; row++) {
    let col = 0;
    for (const char of rows[row]) {
      if (char >= '1' && char <= '8') {
        col += parseInt(char);
      } else {
        board[row][col] = FENCharToPiece(char, `${char}-${row}-${col}`);
        col++;
      }
    }
  }
  
  return {
    board,
    currentPlayer: activeColor,
    moveHistory: [],
    capturedPieces: [],
    gameStatus: 'playing',
    enPassantTarget,
    castlingRights: {
      whiteKingSide: castlingRights.includes('K'),
      whiteQueenSide: castlingRights.includes('Q'),
      blackKingSide: castlingRights.includes('k'),
      blackQueenSide: castlingRights.includes('q')
    }
  };
}

function pieceToFENChar(piece: ChessPiece): string {
  const charMap: Record<PieceType, string> = {
    king: 'k',
    queen: 'q',
    rook: 'r',
    bishop: 'b',
    knight: 'n',
    pawn: 'p'
  };
  
  const char = charMap[piece.type];
  return piece.color === 'white' ? char.toUpperCase() : char;
}

function FENCharToPiece(char: string, id: string): ChessPiece {
  const isWhite = char === char.toUpperCase();
  const color: PieceColor = isWhite ? 'white' : 'black';
  
  const typeMap: Record<string, PieceType> = {
    'k': 'king',
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn'
  };
  
  const type = typeMap[char.toLowerCase()];
  
  return {
    type,
    color,
    id,
    hasMoved: false
  };
}

// Initialize game state
export function createInitialGameState(): GameState {
  return FENToGameState(INITIAL_BOARD_FEN);
}

// Validate position is on board
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
}

// Check if two positions are equal
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

// Get piece at position
export function getPieceAt(board: (ChessPiece | null)[][], pos: Position): ChessPiece | null {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
}

// Generate move notation
export function generateMoveNotation(move: ChessMove, gameState: GameState): string {
  const { piece, from, to, capturedPiece, isCastling, promotion } = move;
  
  if (isCastling) {
    return to.col > from.col ? 'O-O' : 'O-O-O';
  }
  
  let notation = '';
  
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase();
  }
  
  // Add disambiguation if needed (simplified)
  notation += positionToChessNotation(from);
  
  if (capturedPiece) {
    notation += 'x';
  }
  
  notation += positionToChessNotation(to);
  
  if (promotion) {
    notation += '=' + promotion.charAt(0).toUpperCase();
  }
  
  if (move.isCheckmate) {
    notation += '#';
  } else if (move.isCheck) {
    notation += '+';
  }
  
  return notation;
}

// Parse move from algebraic notation (simplified)
export function parseAlgebraicNotation(notation: string, gameState: GameState): ChessMove | null {
  // This is a simplified parser - in a real implementation you'd handle all edge cases
  const cleanNotation = notation.replace(/[+#]/, '');
  
  if (cleanNotation === 'O-O' || cleanNotation === 'O-O-O') {
    // Handle castling
    const row = gameState.currentPlayer === 'white' ? 7 : 0;
    const kingFrom = { row, col: 4 };
    const kingTo = { row, col: cleanNotation === 'O-O' ? 6 : 2 };
    
    const king = getPieceAt(gameState.board, kingFrom);
    if (!king) return null;
    
    return {
      from: kingFrom,
      to: kingTo,
      piece: king,
      isCastling: true,
      notation: cleanNotation,
      isCheck: notation.includes('+'),
      isCheckmate: notation.includes('#')
    };
  }
  
  // Handle regular moves (simplified - extract destination)
  const destMatch = cleanNotation.match(/([a-h][1-8])$/);
  if (!destMatch) return null;
  
  const to = chessNotationToPosition(destMatch[1]);
  
  // For simplicity, this parser is basic - a full implementation would handle
  // piece type, disambiguation, captures, etc.
  
  return null; // Return null for now - this would need full implementation
}

// Calculate material balance
export function calculateMaterialBalance(gameState: GameState): { white: number; black: number } {
  const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  let white = 0, black = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        if (piece.color === 'white') {
          white += value;
        } else {
          black += value;
        }
      }
    }
  }
  
  return { white, black };
}