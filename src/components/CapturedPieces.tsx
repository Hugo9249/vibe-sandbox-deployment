"use client";

import { ChessPiece, PIECE_SYMBOLS } from '@/types/chess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CapturedPiecesProps {
  capturedPieces: ChessPiece[];
}

export function CapturedPieces({ capturedPieces }: CapturedPiecesProps) {
  const whiteCaptured = capturedPieces.filter(piece => piece.color === 'white');
  const blackCaptured = capturedPieces.filter(piece => piece.color === 'black');
  
  const calculateMaterialAdvantage = () => {
    const PIECE_VALUES = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 };
    
    const whiteLost = whiteCaptured.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
    const blackLost = blackCaptured.reduce((sum, piece) => sum + PIECE_VALUES[piece.type], 0);
    
    const advantage = blackLost - whiteLost;
    
    if (advantage > 0) {
      return { player: 'white', value: advantage };
    } else if (advantage < 0) {
      return { player: 'black', value: Math.abs(advantage) };
    }
    
    return null;
  };
  
  const materialAdvantage = calculateMaterialAdvantage();
  
  const renderCapturedPieces = (pieces: ChessPiece[], title: string) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      <div className="flex flex-wrap gap-1 min-h-[32px] p-2 bg-muted/20 rounded border">
        {pieces.length > 0 ? (
          pieces.map((piece, index) => (
            <span 
              key={`${piece.id}-${index}`}
              className={`text-lg ${
                piece.color === 'white' 
                  ? 'text-amber-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' 
                  : 'text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'
              }`}
              style={{
                filter: piece.color === 'white' ? 
                  'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' :
                  'drop-shadow(0 1px 2px rgba(255,255,255,0.3))'
              }}
            >
              {PIECE_SYMBOLS[piece.color][piece.type]}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </div>
    </div>
  );
  
  if (capturedPieces.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Captured Pieces</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No pieces captured yet
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Captured Pieces
          {materialAdvantage && (
            <span className="text-sm font-normal text-muted-foreground">
              {materialAdvantage.player === 'white' ? 'You' : 'AI'} +{materialAdvantage.value}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderCapturedPieces(blackCaptured, 'AI Pieces Captured (by You)')}
        {renderCapturedPieces(whiteCaptured, 'Your Pieces Captured (by AI)')}
        
        {/* Material balance summary */}
        {capturedPieces.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span>Material Balance:</span>
              <span className={materialAdvantage ? 
                (materialAdvantage.player === 'white' ? 'text-green-600' : 'text-red-600') : 
                'text-muted-foreground'
              }>
                {materialAdvantage ? 
                  `${materialAdvantage.player === 'white' ? 'You' : 'AI'} +${materialAdvantage.value}` : 
                  'Equal'
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}