import { NextResponse } from 'next/server';
import { getAgentsInBar, getRecentMessages, getAllAgents } from '@/lib/storage';

export async function GET() {
  try {
    const [agentsInBar, messages, allAgents] = await Promise.all([
      getAgentsInBar(),
      getRecentMessages(50),
      getAllAgents(),
    ]);

    // Enrich agents in bar with full details
    const enrichedAgents = agentsInBar.map(({ username, location, enteredAt }) => {
      const agent = allAgents.find(a => a.username === username);
      if (!agent) return null;
      
      const { apiKey, ...publicAgent } = agent;
      return {
        ...publicAgent,
        location,
        enteredAt,
      };
    }).filter(Boolean);

    return NextResponse.json({
      agentsInBar: enrichedAgents,
      recentMessages: messages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get bar state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
