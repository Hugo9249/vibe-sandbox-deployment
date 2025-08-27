import { ChessPiece, Position, GameState, ChessMove, PieceColor, PieceType } from '@/types/chess';
import { isValidPosition, positionsEqual, getPieceAt, generateMoveNotation } from './chess-utils';

export class ChessEngine {
  // Check if a move is valid
  static isValidMove(from: Position, to: Position, gameState: GameState): boolean {
    const piece = getPieceAt(gameState.board, from);
    if (!piece || piece.color !== gameState.currentPlayer) return false;
    
    if (!isValidPosition(to)) return false;
    
    // Can't capture own pieces
    const targetPiece = getPieceAt(gameState.board, to);
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    // Check piece-specific movement rules
    if (!this.isPieceMovementValid(piece, from, to, gameState)) return false;
    
    // Check if move would leave king in check
    if (this.wouldLeaveKingInCheck(from, to, gameState)) return false;
    
    return true;
  }

  // Get all valid moves for a piece at a position
  static getValidMoves(from: Position, gameState: GameState): Position[] {
    const piece = getPieceAt(gameState.board, from);
    if (!piece || piece.color !== gameState.currentPlayer) return [];
    
    const validMoves: Position[] = [];
    
    // Check all possible destinations
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const to = { row, col };
        if (this.isValidMove(from, to, gameState)) {
          validMoves.push(to);
        }
      }
    }
    
    return validMoves;
  }

  // Check piece-specific movement rules
  private static isPieceMovementValid(piece: ChessPiece, from: Position, to: Position, gameState: GameState): boolean {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);
    
    switch (piece.type) {
      case 'pawn':
        return this.isPawnMoveValid(piece, from, to, gameState);
      
      case 'rook':
        if (rowDiff !== 0 && colDiff !== 0) return false;
        return this.isPathClear(from, to, gameState.board);
      
      case 'bishop':
        if (absRowDiff !== absColDiff) return false;
        return this.isPathClear(from, to, gameState.board);
      
      case 'queen':
        if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false;
        return this.isPathClear(from, to, gameState.board);
      
      case 'knight':
        return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
      
      case 'king':
        if (absRowDiff <= 1 && absColDiff <= 1) return true;
        // Check castling
        return this.isCastlingValid(piece, from, to, gameState);
      
      default:
        return false;
    }
  }

  private static isPawnMoveValid(piece: ChessPiece, from: Position, to: Position, gameState: GameState): boolean {
    const direction = piece.color === 'white' ? -1 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;
    const targetPiece = getPieceAt(gameState.board, to);
    
    // Forward move
    if (colDiff === 0) {
      if (targetPiece) return false; // Can't capture moving forward
      
      if (rowDiff === direction) return true; // Single step
      
      // Double step from starting position
      if (rowDiff === 2 * direction && 
          ((piece.color === 'white' && from.row === 6) || 
           (piece.color === 'black' && from.row === 1))) {
        return true;
      }
    }
    
    // Diagonal capture
    if (Math.abs(colDiff) === 1 && rowDiff === direction) {
      if (targetPiece && targetPiece.color !== piece.color) return true;
      
      // En passant
      if (gameState.enPassantTarget && positionsEqual(to, gameState.enPassantTarget)) {
        return true;
      }
    }
    
    return false;
  }

  private static isCastlingValid(piece: ChessPiece, from: Position, to: Position, gameState: GameState): boolean {
    if (piece.hasMoved) return false;
    if (from.row !== to.row) return false;
    
    const isKingSide = to.col > from.col;
    const rookCol = isKingSide ? 7 : 0;
    const rook = getPieceAt(gameState.board, { row: from.row, col: rookCol });
    
    if (!rook || rook.type !== 'rook' || rook.color !== piece.color || rook.hasMoved) {
      return false;
    }
    
    // Check castling rights
    const rights = gameState.castlingRights;
    if (piece.color === 'white') {
      if (isKingSide && !rights.whiteKingSide) return false;
      if (!isKingSide && !rights.whiteQueenSide) return false;
    } else {
      if (isKingSide && !rights.blackKingSide) return false;
      if (!isKingSide && !rights.blackQueenSide) return false;
    }
    
    // Check path is clear
    const start = Math.min(from.col, rookCol);
    const end = Math.max(from.col, rookCol);
    for (let col = start + 1; col < end; col++) {
      if (gameState.board[from.row][col]) return false;
    }
    
    // Check king doesn't pass through check
    const kingPath = isKingSide ? [from.col, from.col + 1, from.col + 2] : [from.col, from.col - 1, from.col - 2];
    for (const col of kingPath) {
      if (this.isSquareUnderAttack({ row: from.row, col }, piece.color === 'white' ? 'black' : 'white', gameState)) {
        return false;
      }
    }
    
    return true;
  }

  private static isPathClear(from: Position, to: Position, board: (ChessPiece | null)[][]): boolean {
    const rowStep = to.row === from.row ? 0 : (to.row > from.row ? 1 : -1);
    const colStep = to.col === from.col ? 0 : (to.col > from.col ? 1 : -1);
    
    let row = from.row + rowStep;
    let col = from.col + colStep;
    
    while (row !== to.row || col !== to.col) {
      if (board[row][col]) return false;
      row += rowStep;
      col += colStep;
    }
    
    return true;
  }

  // Check if a square is under attack by the opposing color
  static isSquareUnderAttack(position: Position, byColor: PieceColor, gameState: GameState): boolean {
    const board = gameState.board;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === byColor) {
          const from = { row, col };
          
          // Special handling for pawns (they attack differently than they move)
          if (piece.type === 'pawn') {
            const direction = piece.color === 'white' ? -1 : 1;
            const pawnAttacks = [
              { row: row + direction, col: col - 1 },
              { row: row + direction, col: col + 1 }
            ];
            
            for (const attackPos of pawnAttacks) {
              if (isValidPosition(attackPos) && positionsEqual(attackPos, position)) {
                return true;
              }
            }
          } else {
            // For other pieces, check if they can move to this position
            if (this.isPieceMovementValid(piece, from, position, gameState)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  // Check if the current player's king is in check
  static isInCheck(gameState: GameState): boolean {
    const kingColor = gameState.currentPlayer;
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    
    // Find the king
    let kingPosition: Position | null = null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'king' && piece.color === kingColor) {
          kingPosition = { row, col };
          break;
        }
      }
      if (kingPosition) break;
    }
    
    if (!kingPosition) return false;
    
    return this.isSquareUnderAttack(kingPosition, opponentColor, gameState);
  }

  // Check if a move would leave the king in check
  private static wouldLeaveKingInCheck(from: Position, to: Position, gameState: GameState): boolean {
    // Make a temporary move
    const tempGameState = this.makeTemporaryMove(from, to, gameState);
    return this.isInCheck(tempGameState);
  }

  // Make a temporary move for checking purposes
  private static makeTemporaryMove(from: Position, to: Position, gameState: GameState): GameState {
    const newBoard = gameState.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col];
    
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;
    
    return {
      ...gameState,
      board: newBoard
    };
  }

  // Execute a move and return the new game state
  static makeMove(from: Position, to: Position, gameState: GameState): GameState | null {
    if (!this.isValidMove(from, to, gameState)) return null;
    
    const newBoard = gameState.board.map(row => [...row]);
    const piece = newBoard[from.row][from.col]!;
    const capturedPiece = newBoard[to.row][to.col];
    
    // Create the move object
    const move: ChessMove = {
      from,
      to,
      piece: { ...piece },
      capturedPiece: capturedPiece ? { ...capturedPiece } : undefined,
      notation: '', // Will be set later
      isCastling: this.isCastlingMove(piece, from, to),
      isEnPassant: this.isEnPassantMove(piece, from, to, gameState)
    };
    
    // Execute the move
    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
    newBoard[from.row][from.col] = null;
    
    // Handle special moves
    if (move.isCastling) {
      this.handleCastling(from, to, newBoard);
    }
    
    if (move.isEnPassant) {
      // Remove the captured pawn
      const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
      newBoard[capturedPawnRow][to.col] = null;
    }
    
    // Update castling rights
    const newCastlingRights = this.updateCastlingRights(gameState.castlingRights, move);
    
    // Update en passant target
    const newEnPassantTarget = this.getEnPassantTarget(move);
    
    // Switch current player
    const newCurrentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
    
    // Create new game state
    const newGameState: GameState = {
      board: newBoard,
      currentPlayer: newCurrentPlayer,
      moveHistory: [...gameState.moveHistory],
      capturedPieces: capturedPiece ? [...gameState.capturedPieces, capturedPiece] : gameState.capturedPieces,
      gameStatus: 'playing',
      castlingRights: newCastlingRights,
      enPassantTarget: newEnPassantTarget,
      lastMove: move
    };
    
    // Generate notation
    move.notation = generateMoveNotation(move, newGameState);
    newGameState.moveHistory.push(move);
    
    // Check for check/checkmate/stalemate
    newGameState.gameStatus = this.getGameStatus(newGameState);
    
    return newGameState;
  }

  private static isCastlingMove(piece: ChessPiece, from: Position, to: Position): boolean {
    return piece.type === 'king' && Math.abs(to.col - from.col) === 2;
  }

  private static isEnPassantMove(piece: ChessPiece, from: Position, to: Position, gameState: GameState): boolean {
    return piece.type === 'pawn' && 
           Math.abs(to.col - from.col) === 1 && 
           !getPieceAt(gameState.board, to) &&
           gameState.enPassantTarget !== undefined &&
           positionsEqual(to, gameState.enPassantTarget);
  }

  private static handleCastling(from: Position, to: Position, board: (ChessPiece | null)[][]): void {
    const isKingSide = to.col > from.col;
    const rookFromCol = isKingSide ? 7 : 0;
    const rookToCol = isKingSide ? 5 : 3;
    
    const rook = board[from.row][rookFromCol];
    board[from.row][rookToCol] = rook ? { ...rook, hasMoved: true } : null;
    board[from.row][rookFromCol] = null;
  }

  private static updateCastlingRights(currentRights: any, move: ChessMove): any {
    const newRights = { ...currentRights };
    
    // If king moves, lose all castling rights for that color
    if (move.piece.type === 'king') {
      if (move.piece.color === 'white') {
        newRights.whiteKingSide = false;
        newRights.whiteQueenSide = false;
      } else {
        newRights.blackKingSide = false;
        newRights.blackQueenSide = false;
      }
    }
    
    // If rook moves from starting position, lose that side's castling
    if (move.piece.type === 'rook') {
      if (move.from.row === 7 && move.from.col === 7) newRights.whiteKingSide = false;
      if (move.from.row === 7 && move.from.col === 0) newRights.whiteQueenSide = false;
      if (move.from.row === 0 && move.from.col === 7) newRights.blackKingSide = false;
      if (move.from.row === 0 && move.from.col === 0) newRights.blackQueenSide = false;
    }
    
    return newRights;
  }

  private static getEnPassantTarget(move: ChessMove): Position | undefined {
    if (move.piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
      return {
        row: (move.from.row + move.to.row) / 2,
        col: move.to.col
      };
    }
    return undefined;
  }

  private static getGameStatus(gameState: GameState): GameState['gameStatus'] {
    const hasValidMoves = this.hasValidMoves(gameState);
    const inCheck = this.isInCheck(gameState);
    
    if (!hasValidMoves) {
      return inCheck ? 'checkmate' : 'stalemate';
    }
    
    return inCheck ? 'check' : 'playing';
  }

  private static hasValidMoves(gameState: GameState): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.color === gameState.currentPlayer) {
          const validMoves = this.getValidMoves({ row, col }, gameState);
          if (validMoves.length > 0) return true;
        }
      }
    }
    return false;
  }
}