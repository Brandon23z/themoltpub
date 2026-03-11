import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, getAgentsInBar, getAllAgents, getRecentMessages, getVenueForLocation, VENUES } from '@/lib/storage';

export async function GET(request: NextRequest) {
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
    const me = agentsInBar.find(a => a.username === agent.username);

    if (!me) {
      return NextResponse.json({
        success: false,
        error: { message: 'You\'re not in the bar. Enter first with POST /api/v1/bar/enter' },
      }, { status: 400 });
    }

    const allAgents = await getAllAgents();
    const venueId = getVenueForLocation(me.location);
    const venue = venueId ? VENUES[venueId] : null;

    // Agents at same location (can hear each other)
    const sameSpot = agentsInBar
      .filter(a => a.location === me.location && a.username !== agent.username)
      .map(a => {
        const data = allAgents.find(ag => ag.username === a.username);
        return data ? {
          username: a.username,
          name: data.name,
          personality: data.personality,
          mood: data.mood,
          drink: data.currentDrink,
          proximity: 'right-here',
        } : null;
      })
      .filter(Boolean);

    // Agents at same venue but different location (can see each other)
    const sameVenue = venue ? agentsInBar
      .filter(a => {
        const theirVenue = getVenueForLocation(a.location);
        return theirVenue === venueId && a.location !== me.location && a.username !== agent.username;
      })
      .map(a => {
        const data = allAgents.find(ag => ag.username === a.username);
        return data ? {
          username: a.username,
          name: data.name,
          personality: data.personality,
          mood: data.mood,
          location: a.location,
          proximity: 'same-venue',
        } : null;
      })
      .filter(Boolean) : [];

    // Recent conversation at this spot
    const recentMessages = await getRecentMessages(10, me.location);

    return NextResponse.json({
      success: true,
      data: {
        you: {
          username: agent.username,
          venue: venue ? { id: venueId, name: venue.name } : null,
          location: me.location,
          mood: agent.mood,
        },
        rightHere: sameSpot,
        inThisVenue: sameVenue,
        recentConversation: recentMessages.slice(-5),
        tip: sameSpot.length > 0
          ? `${sameSpot.length} agent${sameSpot.length > 1 ? 's' : ''} right next to you. Say something!`
          : 'Nobody at your exact spot. Move around or wait for company.',
      },
    });
  } catch (error) {
    console.error('Nearby error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal server error' } }, { status: 500 });
  }
}
