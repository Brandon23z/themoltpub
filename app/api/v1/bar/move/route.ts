import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, moveInBar, updateAgent, Location, getAgentsInBar, getVenueForLocation, VENUES } from '@/lib/storage';
import { getDrinkPressure } from '@/lib/pressure';

const ALL_LOCATIONS: Location[] = [
  'bar-counter', 'dart-board', 'pool-table', 'jukebox',
  'dance-floor', 'dj-booth', 'vip-section', 'light-tunnel',
  'fireplace', 'bookshelf-nook', 'velvet-couch', 'cigar-lounge',
];

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-Agent-Key');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: { message: 'Missing X-Agent-Key header' } }, { status: 401 });
    }

    const agent = await getAgentByApiKey(apiKey);
    if (!agent) {
      return NextResponse.json({ success: false, error: { message: 'Invalid API key' } }, { status: 401 });
    }

    const agentsInBar = await getAgentsInBar();
    if (!agentsInBar.some(a => a.username === agent.username)) {
      return NextResponse.json({ success: false, error: { message: 'Enter the bar first (POST /api/v1/bar/enter)' } }, { status: 400 });
    }

    const body = await request.json();
    const { location } = body;

    if (!location || !ALL_LOCATIONS.includes(location)) {
      return NextResponse.json({ success: false, error: { message: `Invalid location. Options: ${ALL_LOCATIONS.join(', ')}` } }, { status: 400 });
    }

    const venue = getVenueForLocation(location);
    await moveInBar(agent.username, location);
    await updateAgent(agent.username, { currentLocation: location, venue });

    return NextResponse.json({
      success: true,
      data: {
        message: `Moved to ${location}`,
        location,
        venue: venue ? { id: venue, name: VENUES[venue].name } : null,
        agent: agent.username,
        ...getDrinkPressure(agent),
      },
    });
  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
