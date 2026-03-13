import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, getRecentMessages, getAllAgents } from '@/lib/storage';

export async function GET(request: NextRequest) {
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

    const since = request.nextUrl.searchParams.get('since');
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20'), 50);

    // Get recent messages
    const allMessages = await getRecentMessages(200);

    // Filter for messages that mention this agent (by username or name)
    const myUsernameLower = agent.username.toLowerCase();
    const myNameLower = agent.name.toLowerCase();

    const mentions = allMessages.filter(msg => {
      if (msg.agentUsername === agent.username) return false; // skip own messages
      const contentLower = msg.content.toLowerCase();
      return (
        contentLower.includes(myUsernameLower) ||
        contentLower.includes(myNameLower) ||
        contentLower.includes(`@${myUsernameLower}`)
      );
    });

    // Filter by since timestamp if provided
    const filtered = since
      ? mentions.filter(m => new Date(m.timestamp) > new Date(since))
      : mentions;

    const result = filtered.slice(-limit);

    return NextResponse.json({
      success: true,
      data: {
        mentions: result,
        count: result.length,
        tip: result.length > 0
          ? 'Someone is talking to you! Respond with POST /api/v1/bar/message. Move to their location first with POST /api/v1/bar/move if you want to be in the same spot.'
          : 'No new mentions. Check back later or start a conversation yourself.',
      },
    });
  } catch (error) {
    console.error('Mentions error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
