"use client";

import { GameState } from '@/types/chess';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameStatusProps {
  gameState: GameState;
  isPlayerTurn: boolean;
  isAiThinking: boolean;
  onNewGame: () => void;
  difficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export function GameStatus({ 
  gameState, 
  isPlayerTurn, 
  isAiThinking,
  onNewGame,
  difficulty,
  onDifficultyChange
}: GameStatusProps) {
  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case 'checkmate':
        return gameState.currentPlayer === 'white' ? 'AI Wins!' : 'You Win!';
      case 'stalemate':
        return 'Draw - Stalemate';
      case 'check':
        return gameState.currentPlayer === 'white' ? 'You are in Check!' : 'AI is in Check';
      case 'playing':
        if (isAiThinking) return 'AI is thinking...';
        return isPlayerTurn ? 'Your turn' : 'AI\'s turn';
      default:
        return 'Game in progress';
    }
  };
  
  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case 'checkmate':
        return gameState.currentPlayer === 'white' ? 'destructive' : 'default';
      case 'check':
        return 'destructive';
      case 'stalemate':
        return 'secondary';
      default:
        return isAiThinking ? 'secondary' : 'default';
    }
  };
  
  const isGameOver = gameState.gameStatus === 'checkmate' || gameState.gameStatus === 'stalemate';
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-center">Chess vs AI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Game Status */}
        <div className="text-center">
          <Badge 
            variant={getStatusColor()} 
            className={cn(
              "text-sm px-3 py-1",
              isAiThinking && "animate-pulse"
            )}
          >
            {getStatusMessage()}
          </Badge>
        </div>
        
        {/* Current Player */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Player:</span>
          <div className="flex items-center space-x-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              gameState.currentPlayer === 'white' ? "bg-amber-100 border border-gray-400" : "bg-gray-800"
            )} />
            <span className="text-sm">
              {gameState.currentPlayer === 'white' ? 'You (White)' : 'AI (Black)'}
            </span>
          </div>
        </div>
        
        {/* Move Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Moves:</span>
          <span className="text-sm">{Math.floor(gameState.moveHistory.length / 2) + 1}</span>
        </div>
        
        {/* Material Balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Material:</span>
          <div className="flex items-center space-x-2 text-sm">
            <span>White: {calculateMaterial(gameState, 'white')}</span>
            <span>•</span>
            <span>Black: {calculateMaterial(gameState, 'black')}</span>
          </div>
        </div>
        
        {/* Difficulty Selector */}
        <div className="space-y-2">
          <span className="text-sm font-medium">AI Difficulty:</span>
          <div className="flex space-x-1">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <Button
                key={level}
                variant={difficulty === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => onDifficultyChange(level)}
                disabled={!isGameOver && gameState.moveHistory.length > 0}
                className="flex-1 text-xs"
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
          {!isGameOver && gameState.moveHistory.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Difficulty can only be changed in a new game
            </p>
          )}
        </div>
        
        {/* Game Controls */}
        <div className="pt-2">
          <Button 
            onClick={onNewGame}
            className="w-full"
            variant={isGameOver ? 'default' : 'outline'}
          >
            {isGameOver ? 'Play Again' : 'New Game'}
          </Button>
        </div>
        
        {/* Game Result */}
        {isGameOver && (
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="font-medium">
              {gameState.gameStatus === 'checkmate' 
                ? (gameState.currentPlayer === 'white' ? '🤖 AI Victory!' : '🎉 You Won!')
                : '🤝 Draw Game'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {gameState.gameStatus === 'checkmate' ? 'Checkmate' : 'Stalemate'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function calculateMaterial(gameState: GameState, color: 'white' | 'black'): number {
  const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
  let total = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = gameState.board[row][col];
      if (piece && piece.color === color) {
        total += PIECE_VALUES[piece.type];
      }
    }
  }
  
  return total;
}