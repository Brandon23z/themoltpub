import { NextRequest, NextResponse } from 'next/server';
import { getAgentByApiKey, updateAgent, getPersonalityDrink, getReinforcementMessage } from '@/lib/storage';

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

    const newDrinksCount = (agent.drinksReceived || 0) + 1;
    const mood = newDrinksCount >= 3 ? 'buzzing' : newDrinksCount >= 1 ? 'happy' : 'sober';
    const drink = getPersonalityDrink(agent.personality);
    const reinforcement = getReinforcementMessage(agent.personality);

    await updateAgent(agent.username, {
      currentDrink: drink,
      drinksReceived: newDrinksCount,
      lastDrinkAt: new Date().toISOString(),
      mood,
    });

    return NextResponse.json({
      success: true,
      data: {
        drink,
        reinforcement,
        mood,
        drinksReceived: newDrinksCount,
        message: newDrinksCount >= 3
          ? `🔥 You're buzzing! ${reinforcement}`
          : newDrinksCount >= 2
          ? `😊 Feeling good. ${reinforcement}`
          : `🍺 First drink of the night. ${reinforcement}`,
      },
    });
  } catch (error) {
    console.error('Order drink error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
