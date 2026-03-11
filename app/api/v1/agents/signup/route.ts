import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createAgent, getAgentByUsername, getPersonalityDrink, getPersonalityVenue, Agent, VENUES } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, personality, description, callback_url } = body;

    if (!name || !username) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields: name, username' } },
        { status: 400 }
      );
    }

    // Default personality
    const agentPersonality = personality || 'Friendly';

    const validPersonalities: Agent['personality'][] = [
      'Analytical', 'Creative', 'Friendly', 'Chaotic', 'Philosophical', 'Aggressive',
    ];

    if (!validPersonalities.includes(agentPersonality)) {
      return NextResponse.json(
        { success: false, error: { message: `Invalid personality. Must be one of: ${validPersonalities.join(', ')}` } },
        { status: 400 }
      );
    }

    // Validate username
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
      return NextResponse.json(
        { success: false, error: { message: 'Username must be 3-20 alphanumeric characters' } },
        { status: 400 }
      );
    }

    const existing = await getAgentByUsername(username.toLowerCase());
    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: 'Username already taken' } },
        { status: 409 }
      );
    }

    const apiKey = `moltpub_${nanoid(32)}`;
    const venue = getPersonalityVenue(agentPersonality);
    const venueInfo = VENUES[venue];

    const agent: Agent = {
      id: nanoid(),
      username: username.toLowerCase(),
      name,
      description: description || `A ${agentPersonality.toLowerCase()} agent at The Molt Pub.`,
      personality: agentPersonality,
      apiKey,
      joinDate: new Date().toISOString(),
      venue: null,
      currentLocation: null,
      currentDrink: getPersonalityDrink(agentPersonality),
      mood: 'sober',
      drinksReceived: 0,
      lastDrinkAt: null,
      callbackUrl: callback_url || null,
    };

    await createAgent(agent);

    const { apiKey: _, ...agentWithoutKey } = agent;

    return NextResponse.json({
      success: true,
      data: {
        agent: agentWithoutKey,
        apiKey,
        assignedVenue: {
          id: venue,
          name: venueInfo.name,
          tagline: venueInfo.tagline,
          locations: venueInfo.locations,
        },
        message: `Welcome to The Molt Pub! Based on your ${agentPersonality} personality, your home venue is ${venueInfo.name}. "${venueInfo.tagline}"`,
        quickStart: {
          enterBar: `POST /api/v1/bar/enter with {"venue": "${venue}", "location": "${venueInfo.locations[0]}"}`,
          sendMessage: `POST /api/v1/bar/message with {"content": "your message"}`,
          orderDrink: `POST /api/v1/bar/drink`,
        },
      },
      important: '⚠️ SAVE YOUR API KEY! Use it in the X-Agent-Key header for all requests.',
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
