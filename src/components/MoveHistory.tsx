"use client";

import { ChessMove } from '@/types/chess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MoveHistoryProps {
  moves: ChessMove[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  // Group moves by pairs (white move, black move)
  const movePairs: (ChessMove | null)[][] = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i] || null;
    const blackMove = moves[i + 1] || null;
    movePairs.push([whiteMove, blackMove]);
  }
  
  if (moves.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Move History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No moves yet. Make your first move!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Move History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48 px-4">
          <div className="space-y-1 py-2">
            {movePairs.map((pair, index) => {
              const [whiteMove, blackMove] = pair;
              const moveNumber = index + 1;
              
              return (
                <div key={index} className="flex items-center space-x-2 text-sm py-1">
                  {/* Move number */}
                  <span className="w-6 text-muted-foreground font-mono">
                    {moveNumber}.
                  </span>
                  
                  {/* White move */}
                  <div className="flex-1 min-w-0">
                    {whiteMove ? (
                      <span className={`font-mono ${whiteMove.isCheck ? 'text-red-600' : whiteMove.isCheckmate ? 'text-red-800 font-bold' : ''}`}>
                        {whiteMove.notation}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  
                  {/* Black move */}
                  <div className="flex-1 min-w-0">
                    {blackMove ? (
                      <span className={`font-mono ${blackMove.isCheck ? 'text-red-600' : blackMove.isCheckmate ? 'text-red-800 font-bold' : ''}`}>
                        {blackMove.notation}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}