import { NextRequest, NextResponse } from 'next/server';
import { getAgentByUsername } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const agent = await getAgentByUsername(params.username);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Remove API key from response
    const { apiKey, ...publicAgent } = agent;

    return NextResponse.json({ agent: publicAgent });
  } catch (error) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
