import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-Agent-Key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-Agent-Key header' },
        { status: 401 }
      );
    }

    const agent = await getAgentByApiKey(apiKey);
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Don't expose the API key in the response
    const { apiKey: _, ...agentWithoutKey } = agent;

    return NextResponse.json({ agent: agentWithoutKey });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
