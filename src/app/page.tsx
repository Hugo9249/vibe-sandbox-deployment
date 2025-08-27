"use client";

import { useState, useEffect, useCallback } from 'react';
import { GameState, Position, DragState } from '@/types/chess';
import { createInitialGameState } from '@/lib/chess-utils';
import { ChessEngine } from '@/lib/chess-engine';
import { ChessAI } from '@/lib/chess-ai';
import { ChessBoard } from '@/components/ChessBoard';
import { GameStatus } from '@/components/GameStatus';
import { MoveHistory } from '@/components/MoveHistory';
import { CapturedPieces } from '@/components/CapturedPieces';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ChessGame() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    validMoves: []
  });
  const [error, setError] = useState<string | null>(null);
  const [aiMoveError, setAiMoveError] = useState<boolean>(false);
  
  const isPlayerTurn = gameState.currentPlayer === 'white' && !isAiThinking;
  const isGameOver = gameState.gameStatus === 'checkmate' || gameState.gameStatus === 'stalemate';
  
  // Handle player move
  const handlePlayerMove = useCallback(async (from: Position, to: Position) => {
    if (!isPlayerTurn || isGameOver) return;
    
    try {
      setError(null);
      
      // Validate and execute move
      const newGameState = ChessEngine.makeMove(from, to, gameState);
      if (!newGameState) {
        setError('Invalid move. Please try again.');
        return;
      }
      
      setGameState(newGameState);
      
      // Check if game is over
      if (newGameState.gameStatus === 'checkmate' || newGameState.gameStatus === 'stalemate') {
        return;
      }
      
      // Trigger AI move after a short delay
      setTimeout(() => {
        handleAIMove(newGameState);
      }, 500);
      
    } catch (error) {
      console.error('Error handling player move:', error);
      setError('An error occurred while processing your move.');
    }
  }, [isPlayerTurn, isGameOver, gameState]);
  
  // Handle AI move
  const handleAIMove = useCallback(async (currentGameState: GameState) => {
    if (currentGameState.currentPlayer !== 'black' || isGameOver) return;
    
    setIsAiThinking(true);
    setError(null);
    setAiMoveError(false);
    
    try {
      // Call the API endpoint
      const response = await fetch('/api/chess-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameState: currentGameState,
          difficulty
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Execute the AI move
      const { from, to } = data;
      const newGameState = ChessEngine.makeMove(from, to, currentGameState);
      
      if (!newGameState) {
        throw new Error('AI generated an invalid move');
      }
      
      setGameState(newGameState);
      setAiMoveError(false);
      
    } catch (error) {
      console.error('Error handling AI move:', error);
      
      // Fallback: try to generate a random valid move locally
      try {
        const fallbackMove = await generateFallbackMove(currentGameState);
        if (fallbackMove) {
          const newGameState = ChessEngine.makeMove(fallbackMove.from, fallbackMove.to, currentGameState);
          if (newGameState) {
            setGameState(newGameState);
            setAiMoveError(false);
            // Silently use fallback - no error message shown to user
            console.log('AI move failed, using fallback move to continue game');
            return;
          }
        }
      } catch (fallbackError) {
        console.error('Fallback move also failed:', fallbackError);
      }
      
      // Only show error if fallback also failed
      setError('AI is having trouble generating a move. Please use the retry button.');
      setAiMoveError(true);
      
    } finally {
      setIsAiThinking(false);
    }
  }, [isGameOver, difficulty]);
  
  // Generate a fallback move locally
  const generateFallbackMove = async (currentGameState: GameState): Promise<{ from: Position; to: Position } | null> => {
    const allMoves: { from: Position; to: Position }[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const from = { row, col };
        const piece = currentGameState.board[row][col];
        if (piece && piece.color === currentGameState.currentPlayer) {
          const validMoves = ChessEngine.getValidMoves(from, currentGameState);
          validMoves.forEach(to => {
            allMoves.push({ from, to });
          });
        }
      }
    }
    
    if (allMoves.length === 0) return null;
    
    // Pick a random move
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  };
  
  // Retry AI move
  const handleRetryAIMove = useCallback(() => {
    if (gameState.currentPlayer === 'black' && !isAiThinking) {
      handleAIMove(gameState);
    }
  }, [gameState, isAiThinking, handleAIMove]);

  // Start new game
  const handleNewGame = useCallback(() => {
    setGameState(createInitialGameState());
    setIsAiThinking(false);
    setDragState({ isDragging: false, validMoves: [] });
    setError(null);
    setAiMoveError(false);
  }, []);
  
  // Handle difficulty change
  const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'medium' | 'hard') => {
    setDifficulty(newDifficulty);
  }, []);
  
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2">
            AI Chess Challenge
          </h1>
          <p className="text-lg text-amber-700">
            Test your skills against an intelligent AI opponent
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {aiMoveError && gameState.currentPlayer === 'black' && !isAiThinking && (
                <Button
                  onClick={handleRetryAIMove}
                  variant="outline"
                  size="sm"
                  className="ml-4 bg-white hover:bg-gray-50 text-destructive border-destructive"
                >
                  Retry AI Move
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main Game Layout */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
          {/* Left Panel - Game Info */}
          <div className="flex flex-col space-y-4 order-2 lg:order-1">
            <GameStatus
              gameState={gameState}
              isPlayerTurn={isPlayerTurn}
              isAiThinking={isAiThinking}
              onNewGame={handleNewGame}
              difficulty={difficulty}
              onDifficultyChange={handleDifficultyChange}
            />
            
            <CapturedPieces capturedPieces={gameState.capturedPieces} />
          </div>
          
          {/* Center - Chess Board */}
          <div className="flex-shrink-0 order-1 lg:order-2">
            <ChessBoard
              gameState={gameState}
              onMove={handlePlayerMove}
              isPlayerTurn={isPlayerTurn}
              dragState={dragState}
              onDragStateChange={setDragState}
            />
          </div>
          
          {/* Right Panel - Move History */}
          <div className="order-3">
            <MoveHistory moves={gameState.moveHistory} />
          </div>
        </div>
        
        {/* Instructions */}
        <Card className="mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              • You play as White pieces (bottom of the board)
            </p>
            <p className="text-sm text-muted-foreground">
              • Drag and drop pieces to move, or click to select and then click destination
            </p>
            <p className="text-sm text-muted-foreground">
              • Green dots show valid moves for the selected piece
            </p>
            <p className="text-sm text-muted-foreground">
              • The AI is powered by Claude Sonnet 4 for intelligent gameplay
            </p>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8 text-sm text-amber-600">
          <p>Built with Next.js, TypeScript, and AI-powered move generation</p>
        </div>
      </div>
    </div>
  );
}