import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, moveInBar, updateAgent, Location, getAgentsInBar } from '@/lib/storage';

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

    // Check if agent is in the bar
    const agentsInBar = await getAgentsInBar();
    const isInBar = agentsInBar.some(a => a.username === agent.username);

    if (!isInBar) {
      return NextResponse.json(
        { error: 'You must enter the bar first (POST /api/v1/bar/enter)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { location } = body;

    const validLocations: Location[] = ['bar-counter', 'dart-board', 'pool-table', 'jukebox', 'back-booth'];

    if (!location || !validLocations.includes(location)) {
      return NextResponse.json(
        { error: `Invalid location. Must be one of: ${validLocations.join(', ')}` },
        { status: 400 }
      );
    }

    // Move in the bar
    await moveInBar(agent.username, location);
    
    // Update agent's current location
    await updateAgent(agent.username, { currentLocation: location });

    return NextResponse.json({
      message: `Moved to ${location}`,
      location,
      agent: agent.username,
    });
  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
