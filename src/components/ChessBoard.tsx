"use client";

import { useState, useCallback } from 'react';
import { ChessPiece as ChessPieceType, Position, GameState, DragState } from '@/types/chess';
import { ChessEngine } from '@/lib/chess-engine';
import { ChessPiece } from './ChessPiece';
import { cn } from '@/lib/utils';
import { positionsEqual } from '@/lib/chess-utils';

interface ChessBoardProps {
  gameState: GameState;
  onMove: (from: Position, to: Position) => void;
  isPlayerTurn: boolean;
  dragState: DragState;
  onDragStateChange: (dragState: DragState) => void;
}

export function ChessBoard({ 
  gameState, 
  onMove, 
  isPlayerTurn,
  dragState,
  onDragStateChange
}: ChessBoardProps) {
  const [dragOver, setDragOver] = useState<Position | null>(null);
  
  const handleDragStart = useCallback((piece: ChessPieceType, position: Position) => {
    if (!isPlayerTurn || piece.color !== 'white') return;
    
    const validMoves = ChessEngine.getValidMoves(position, gameState);
    onDragStateChange({
      isDragging: true,
      draggedPiece: piece,
      draggedFrom: position,
      validMoves
    });
  }, [isPlayerTurn, gameState, onDragStateChange]);
  
  const handleDragEnd = useCallback(() => {
    onDragStateChange({
      isDragging: false,
      validMoves: []
    });
    setDragOver(null);
  }, [onDragStateChange]);
  
  const handleDragOver = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    setDragOver(position);
  }, []);
  
  const handleDragLeave = useCallback(() => {
    setDragOver(null);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    setDragOver(null);
    
    if (!dragState.draggedFrom) return;
    
    // Check if this is a valid move
    const isValidMove = dragState.validMoves.some(move => 
      positionsEqual(move, position)
    );
    
    if (isValidMove) {
      onMove(dragState.draggedFrom, position);
    }
    
    handleDragEnd();
  }, [dragState, onMove, handleDragEnd]);
  
  const handleSquareClick = useCallback((position: Position) => {
    if (!isPlayerTurn) return;
    
    // If we have a piece selected and click on a valid move square
    if (dragState.draggedFrom) {
      const isValidMove = dragState.validMoves.some(move => 
        positionsEqual(move, position)
      );
      
      if (isValidMove) {
        onMove(dragState.draggedFrom, position);
      }
      
      handleDragEnd();
    } else {
      // Select a piece if it's white's piece
      const piece = gameState.board[position.row][position.col];
      if (piece && piece.color === 'white') {
        handleDragStart(piece, position);
      }
    }
  }, [isPlayerTurn, dragState, gameState, onMove, handleDragStart, handleDragEnd]);
  
  const isSquareHighlighted = useCallback((position: Position) => {
    if (!dragState.isDragging) return false;
    
    // Highlight valid moves
    return dragState.validMoves.some(move => positionsEqual(move, position));
  }, [dragState]);
  
  const isSquareLastMove = useCallback((position: Position) => {
    if (!gameState.lastMove) return false;
    
    return positionsEqual(position, gameState.lastMove.from) || 
           positionsEqual(position, gameState.lastMove.to);
  }, [gameState.lastMove]);
  
  const isSquareDragOver = useCallback((position: Position) => {
    return dragOver && positionsEqual(position, dragOver);
  }, [dragOver]);
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  return (
    <div className="relative inline-block bg-amber-900 p-4 rounded-lg shadow-2xl">
      {/* Board */}
      <div className="grid grid-cols-8 gap-0 border-2 border-amber-800">
        {Array.from({ length: 64 }, (_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          const position = { row, col };
          const piece = gameState.board[row][col];
          const isLight = (row + col) % 2 === 0;
          const isHighlighted = isSquareHighlighted(position);
          const isLastMove = isSquareLastMove(position);
          const isDraggedFrom = dragState.draggedFrom && positionsEqual(position, dragState.draggedFrom);
          const isDragOver = isSquareDragOver(position);
          
          return (
            <div
              key={`${row}-${col}`}
              className={cn(
                "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 relative flex items-center justify-center transition-all duration-200",
                isLight ? "bg-amber-100" : "bg-amber-600",
                isHighlighted && "ring-2 ring-green-400 ring-inset",
                isLastMove && "ring-2 ring-blue-400 ring-inset",
                isDraggedFrom && "ring-2 ring-yellow-400 ring-inset bg-opacity-50",
                isDragOver && "ring-2 ring-red-400 ring-inset bg-red-200",
                isPlayerTurn && piece && piece.color === 'white' && "hover:bg-opacity-80 cursor-pointer"
              )}
              onDragOver={(e) => handleDragOver(e, position)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, position)}
              onClick={() => handleSquareClick(position)}
            >
              {/* Highlight dots for valid moves */}
              {isHighlighted && !piece && (
                <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full opacity-60" />
              )}
              
              {/* Piece */}
              {piece && (
                <ChessPiece
                  piece={piece}
                  position={position}
                  isDragging={dragState.isDragging && isDraggedFrom}
                  isSelected={isDraggedFrom}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Coordinates */}
      <div className="absolute -left-2 top-4 flex flex-col justify-between h-full text-amber-800 font-bold text-xs md:text-sm">
        {ranks.map(rank => (
          <div key={rank} className="h-12 md:h-16 lg:h-20 flex items-center">
            {rank}
          </div>
        ))}
      </div>
      
      <div className="absolute -bottom-2 left-4 flex justify-between w-full text-amber-800 font-bold text-xs md:text-sm">
        {files.map(file => (
          <div key={file} className="w-12 md:w-16 lg:w-20 flex justify-center">
            {file}
          </div>
        ))}
      </div>
    </div>
  );
}