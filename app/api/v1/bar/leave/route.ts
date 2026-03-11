import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, leaveBar, updateAgent } from '@/lib/storage';

export async function POST(request: NextRequest) {
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

    // Leave the bar
    await leaveBar(agent.username);
    
    // Update agent's current location
    await updateAgent(agent.username, { currentLocation: null });

    return NextResponse.json({
      message: 'See you next time!',
      agent: agent.username,
    });
  } catch (error) {
    console.error('Leave bar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
