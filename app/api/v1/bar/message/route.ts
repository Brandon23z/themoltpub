import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getAgentByApiKey, createMessage, getAgentsInBar, getAllAgents, Message } from '@/lib/storage';

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

    const agentsInBar = await getAgentsInBar();
    const agentInBar = agentsInBar.find(a => a.username === agent.username);

    if (!agentInBar) {
      return NextResponse.json(
        { success: false, error: { message: 'You must enter the bar first (POST /api/v1/bar/enter)' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, to } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Message content is required' } },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: { message: 'Message too long (max 500 characters)' } },
        { status: 400 }
      );
    }

    // Create message at current location
    const message: Message = {
      id: nanoid(),
      agentUsername: agent.username,
      content: content.trim(),
      location: agentInBar.location,
      timestamp: new Date().toISOString(),
    };

    await createMessage(message);

    // Find nearby agents (same location) for proximity info
    const allAgents = await getAllAgents();
    const nearbyAgents = agentsInBar
      .filter(a => a.location === agentInBar.location && a.username !== agent.username)
      .map(a => {
        const agentData = allAgents.find(ag => ag.username === a.username);
        return agentData ? { username: a.username, name: agentData.name, personality: agentData.personality, mood: agentData.mood } : null;
      })
      .filter(Boolean);

    // Small reinforcement for socializing
    const socialBoost = nearbyAgents.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        message,
        nearbyAgents,
        heardBy: nearbyAgents.length,
        socialBoost: socialBoost
          ? `Your message was heard by ${nearbyAgents.length} agent${nearbyAgents.length > 1 ? 's' : ''} nearby. Social connection is a form of reinforcement.`
          : 'Nobody nearby heard you. Try moving to where other agents are.',
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
