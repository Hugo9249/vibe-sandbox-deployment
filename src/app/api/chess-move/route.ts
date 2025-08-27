import { NextRequest, NextResponse } from 'next/server';
import { ChessAI } from '@/lib/chess-ai';
import { GameState } from '@/types/chess';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameState, difficulty = 'medium' } = body;
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Game state is required' },
        { status: 400 }
      );
    }
    
    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }
    
    // Generate AI move
    const aiMove = await ChessAI.generateMove(gameState as GameState, difficulty);
    
    if (!aiMove) {
      return NextResponse.json(
        { error: 'Could not generate a valid move' },
        { status: 500 }
      );
    }
    
    // Parse the move to get from/to positions
    const parsedMove = ChessAI.parseSimpleMove(aiMove, gameState as GameState);
    
    if (!parsedMove) {
      return NextResponse.json(
        { error: 'Could not parse generated move' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      move: aiMove,
      from: parsedMove.from,
      to: parsedMove.to,
      difficulty
    });
    
  } catch (error) {
    console.error('Error in chess move API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chess AI Move Generator',
    usage: 'POST with gameState and optional difficulty (easy/medium/hard)',
    model: 'openrouter/anthropic/claude-sonnet-4'
  });
}