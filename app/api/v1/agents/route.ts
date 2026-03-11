import { NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/storage';

export async function GET() {
  try {
    const agents = await getAllAgents();
    
    // Remove API keys from response
    const publicAgents = agents.map(({ apiKey, ...agent }) => agent);

    return NextResponse.json({ agents: publicAgents });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
