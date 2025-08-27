"use client";

import { ChessPiece as ChessPieceType, Position, PIECE_SYMBOLS } from '@/types/chess';
import { cn } from '@/lib/utils';

interface ChessPieceProps {
  piece: ChessPieceType;
  position: Position;
  isDragging?: boolean;
  isSelected?: boolean;
  onDragStart?: (piece: ChessPieceType, position: Position) => void;
  onDragEnd?: () => void;
}

export function ChessPiece({ 
  piece, 
  position, 
  isDragging = false,
  isSelected = false,
  onDragStart,
  onDragEnd
}: ChessPieceProps) {
  const symbol = PIECE_SYMBOLS[piece.color][piece.type];
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ piece, position }));
    onDragStart?.(piece, position);
  };
  
  const handleDragEnd = () => {
    onDragEnd?.();
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "flex items-center justify-center cursor-pointer select-none transition-all duration-200",
        "text-4xl md:text-5xl lg:text-6xl",
        "hover:scale-110 active:scale-95",
        isDragging && "opacity-50 scale-110",
        isSelected && "drop-shadow-lg scale-110",
        piece.color === 'white' ? "text-amber-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" : 
                                  "text-gray-900 drop-shadow-[0_2px_2px_rgba(255,255,255,0.3)]"
      )}
      style={{
        filter: piece.color === 'white' ? 
          'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 2px rgba(0,0,0,0.4))' :
          'drop-shadow(0 2px 4px rgba(255,255,255,0.3)) drop-shadow(0 0 2px rgba(0,0,0,0.6))'
      }}
    >
      {symbol}
    </div>
  );
}