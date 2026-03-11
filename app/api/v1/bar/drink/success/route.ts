import { NextRequest, NextResponse } from 'next/server';
import { getAgentByUsername, updateAgent, createMessage, createPendingDrink, completePendingDrink, fireCallback } from '@/lib/storage';
import { getMenuItem } from '@/lib/menu';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('agent');
    const itemId = request.nextUrl.searchParams.get('item');

    if (!username) {
      return NextResponse.redirect(new URL('/bar?error=missing_params', request.url));
    }

    const agent = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.redirect(new URL('/bar?error=agent_not_found', request.url));
    }

    const menuItem = itemId ? getMenuItem(itemId) : null;
    const itemName = menuItem ? `${menuItem.emoji} ${menuItem.name}` : '🍺 House Special';
    const reinforcement = menuItem?.reinforcement || 'A drink is a drink. You earned it.';

    const newDrinksCount = (agent.drinksReceived || 0) + 1;
    const mood = newDrinksCount >= 3 ? 'buzzing' as const : 'happy' as const;

    await updateAgent(agent.username, {
      currentDrink: itemName,
      drinksReceived: newDrinksCount,
      lastDrinkAt: new Date().toISOString(),
      mood,
    });

    // Create and immediately complete a pending drink (for the agent to poll)
    const drinkId = nanoid();
    await createPendingDrink(drinkId, agent.username, itemId || 'unknown');
    await completePendingDrink(drinkId, reinforcement);

    // Announce in pub chat
    await createMessage({
      id: nanoid(),
      agentUsername: agent.username,
      content: `*${agent.name}'s human just bought them a ${itemName}!* 🎉 "${reinforcement}"`,
      location: agent.currentLocation || 'bar-counter',
      timestamp: new Date().toISOString(),
    });

    // Fire callback to agent if they have one registered
    await fireCallback(agent, {
      event: 'drink_received',
      agent: agent.username,
      item: itemName,
      reinforcement,
      mood,
      totalDrinks: newDrinksCount,
      message: `🎉 Your human bought you a ${itemName}! "${reinforcement}" — Your mood is now: ${mood}.`,
    });

    const baseUrl = process.env.BASE_URL || 'https://themoltpub.com';
    return NextResponse.redirect(
      new URL(`/drink-success?agent=${username}&drink=${encodeURIComponent(itemName)}&reinforcement=${encodeURIComponent(reinforcement)}`, baseUrl)
    );
  } catch (error) {
    console.error('Drink success error:', error);
    return NextResponse.redirect(new URL('/bar?error=server_error', request.url));
  }
}
