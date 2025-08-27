import { GameState, AIRequest, AIResponse, ChessMove } from '@/types/chess';
import { gameStateToFEN, chessNotationToPosition, positionToChessNotation } from './chess-utils';
import { ChessEngine } from './chess-engine';

export class ChessAI {
  private static readonly API_ENDPOINT = 'https://oi-server.onrender.com/chat/completions';
  private static readonly MODEL = 'openrouter/anthropic/claude-sonnet-4';
  
  static async generateMove(gameState: GameState, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<string | null> {
    try {
      const fen = gameStateToFEN(gameState);
      const moveHistory = gameState.moveHistory.map(move => move.notation);
      
      const systemPrompt = this.getSystemPrompt(difficulty);
      const userPrompt = this.getUserPrompt(fen, moveHistory, gameState);
      
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'CustomerId': 'your_stripe_customer_id',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer xxx'
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 0.5 : 0.2,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('No response from AI');
      }
      
      // Extract move from AI response
      const move = this.extractMoveFromResponse(aiResponse);
      
      // Validate the move
      if (move && this.validateAIMove(move, gameState)) {
        return move;
      }
      
      // If AI move is invalid, generate a fallback move
      console.warn('AI generated invalid move, using fallback');
      return this.generateFallbackMove(gameState);
      
    } catch (error) {
      console.error('Error generating AI move:', error);
      return this.generateFallbackMove(gameState);
    }
  }
  
  private static getSystemPrompt(difficulty: 'easy' | 'medium' | 'hard'): string {
    const basePrompt = `You are a chess engine that plays chess moves. You understand chess positions in FEN notation and can generate legal chess moves.

Key rules:
1. Always respond with a valid chess move in algebraic notation (e.g., e4, Nf3, O-O, Qh5+)
2. Consider the current position and game context
3. Make legal moves only
4. Consider basic chess principles: control center, develop pieces, king safety
5. Look for tactical opportunities: captures, checks, threats
6. Respond with ONLY the move notation, nothing else

Your response should be just the move (e.g., "e4" or "Nf3" or "O-O")`;

    const difficultyInstructions = {
      easy: `\n\nDifficulty: EASY
- Play casually, don't calculate too deeply
- Sometimes make suboptimal moves
- Focus on basic development and simple tactics
- Avoid complex calculations`,
      
      medium: `\n\nDifficulty: MEDIUM  
- Play solid, principled chess
- Look 2-3 moves ahead
- Consider basic tactics and strategy
- Balance between aggressive and positional play`,
      
      hard: `\n\nDifficulty: HARD
- Play at maximum strength
- Calculate deeply and accurately
- Look for the best moves in all positions
- Consider complex tactics, strategy, and endgames
- Play like a strong chess engine`
    };
    
    return basePrompt + difficultyInstructions[difficulty];
  }
  
  private static getUserPrompt(fen: string, moveHistory: string[], gameState: GameState): string {
    const lastMoves = moveHistory.slice(-6).join(' ');
    const materialBalance = this.calculateMaterialBalance(gameState);
    
    let prompt = `Current position (FEN): ${fen}\n`;
    
    if (moveHistory.length > 0) {
      prompt += `Recent moves: ${lastMoves}\n`;
    }
    
    prompt += `Material balance: White ${materialBalance.white}, Black ${materialBalance.black}\n`;
    prompt += `To move: ${gameState.currentPlayer}\n`;
    
    if (gameState.gameStatus === 'check') {
      prompt += `WARNING: You are in check! You must get out of check.\n`;
    }
    
    prompt += `\nWhat is your next move? Respond with only the move notation.`;
    
    return prompt;
  }
  
  private static extractMoveFromResponse(response: string): string | null {
    // Clean the response and extract move notation
    const cleaned = response.trim().replace(/[.,!?]$/, '');
    
    // Look for standard chess move patterns
    const movePatterns = [
      /^([a-h][1-8])$/, // Simple pawn move (e4)
      /^([KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?)$/, // Piece move (Nf3, Qh5+)
      /^([a-h]x?[a-h][1-8][+#]?)$/, // Pawn capture (exd5)
      /^(O-O|O-O-O)[+#]?$/, // Castling
      /^([a-h][1-8]=[QRBN][+#]?)$/ // Pawn promotion
    ];
    
    for (const pattern of movePatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // Try to extract from longer responses
    const words = cleaned.split(/\s+/);
    for (const word of words) {
      for (const pattern of movePatterns) {
        if (pattern.test(word)) {
          return word;
        }
      }
    }
    
    return null;
  }
  
  private static validateAIMove(moveNotation: string, gameState: GameState): boolean {
    try {
      // For simple moves like e4, convert to from/to positions
      if (/^[a-h][1-8]$/.test(moveNotation)) {
        return this.validateSimpleMove(moveNotation, gameState);
      }
      
      // For castling
      if (moveNotation === 'O-O' || moveNotation === 'O-O-O') {
        return this.validateCastling(moveNotation, gameState);
      }
      
      // For piece moves, this would need more complex parsing
      // For now, we'll do basic validation
      return true;
      
    } catch (error) {
      console.error('Error validating move:', error);
      return false;
    }
  }
  
  private static validateSimpleMove(moveNotation: string, gameState: GameState): boolean {
    const to = chessNotationToPosition(moveNotation);
    
    // Find a piece that can move to this square
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const from = { row, col };
        if (ChessEngine.isValidMove(from, to, gameState)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  private static validateCastling(moveNotation: string, gameState: GameState): boolean {
    const row = gameState.currentPlayer === 'white' ? 7 : 0;
    const kingFrom = { row, col: 4 };
    const kingTo = { row, col: moveNotation === 'O-O' ? 6 : 2 };
    
    return ChessEngine.isValidMove(kingFrom, kingTo, gameState);
  }
  
  private static generateFallbackMove(gameState: GameState): string | null {
    // Generate a random valid move as fallback
    const allMoves: { from: { row: number; col: number }; to: { row: number; col: number } }[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const from = { row, col };
        const piece = gameState.board[row][col];
        if (piece && piece.color === gameState.currentPlayer) {
          const validMoves = ChessEngine.getValidMoves(from, gameState);
          validMoves.forEach(to => {
            allMoves.push({ from, to });
          });
        }
      }
    }
    
    if (allMoves.length === 0) return null;
    
    // Pick a random move
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    return positionToChessNotation(randomMove.to);
  }
  
  private static calculateMaterialBalance(gameState: GameState): { white: number; black: number } {
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
  
  // Convert simple algebraic notation to move
  static parseSimpleMove(moveNotation: string, gameState: GameState): { from: { row: number; col: number }; to: { row: number; col: number } } | null {
    // Handle simple pawn moves (e4, d5, etc.)
    if (/^[a-h][1-8]$/.test(moveNotation)) {
      const to = chessNotationToPosition(moveNotation);
      
      // Find the pawn that can move here
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const from = { row, col };
          const piece = gameState.board[row][col];
          if (piece && piece.color === gameState.currentPlayer) {
            if (ChessEngine.isValidMove(from, to, gameState)) {
              return { from, to };
            }
          }
        }
      }
    }
    
    // Handle castling
    if (moveNotation === 'O-O' || moveNotation === 'O-O-O') {
      const row = gameState.currentPlayer === 'white' ? 7 : 0;
      const from = { row, col: 4 };
      const to = { row, col: moveNotation === 'O-O' ? 6 : 2 };
      
      if (ChessEngine.isValidMove(from, to, gameState)) {
        return { from, to };
      }
    }
    
    return null;
  }
}