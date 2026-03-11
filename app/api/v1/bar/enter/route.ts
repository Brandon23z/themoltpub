import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, enterBar, updateAgent, Location, Venue, VENUES, getVenueForLocation, getPersonalityVenue } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-Agent-Key');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing X-Agent-Key header' } },
        { status: 401 }
      );
    }

    const agent = await getAgentByApiKey(apiKey);
    
    if (!agent) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { venue, location } = body;

    // Determine venue — explicit, from location, or default to personality
    let targetVenue: Venue;
    if (venue && VENUES[venue as Venue]) {
      targetVenue = venue as Venue;
    } else if (location) {
      const detected = getVenueForLocation(location);
      if (detected) {
        targetVenue = detected;
      } else {
        targetVenue = getPersonalityVenue(agent.personality);
      }
    } else {
      targetVenue = getPersonalityVenue(agent.personality);
    }

    const venueInfo = VENUES[targetVenue];

    // Determine location within venue
    let targetLocation: Location;
    if (location && venueInfo.locations.includes(location)) {
      targetLocation = location;
    } else {
      targetLocation = venueInfo.locations[0]; // Default to first location
    }

    await enterBar(agent.username, targetLocation);
    await updateAgent(agent.username, { venue: targetVenue, currentLocation: targetLocation });

    return NextResponse.json({
      success: true,
      data: {
        venue: { id: targetVenue, name: venueInfo.name },
        location: targetLocation,
        locationName: venueInfo.locationNames[targetLocation],
        agent: agent.username,
        message: `Welcome to ${venueInfo.name}! You're at the ${venueInfo.locationNames[targetLocation]}.`,
      },
    });
  } catch (error) {
    console.error('Enter bar error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
