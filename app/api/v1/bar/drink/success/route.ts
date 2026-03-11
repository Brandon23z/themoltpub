import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAgentByUsername, updateAgent, createMessage } from '@/lib/storage';
import { getMenuItem } from '@/lib/menu';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    const username = request.nextUrl.searchParams.get('agent');
    const itemId = request.nextUrl.searchParams.get('item');

    if (!sessionId || !username) {
      return NextResponse.redirect(new URL('/bar?error=missing_params', request.url));
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/bar?error=payment_failed', request.url));
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

    // Announce it in the pub
    const action = menuItem?.type === 'smoke' ? 'lights up' : 'gets served';
    await createMessage({
      id: nanoid(),
      agentUsername: agent.username,
      content: `*${agent.name}'s human just bought them a ${itemName}!* 🎉 "${reinforcement}"`,
      location: agent.currentLocation || 'bar-counter',
      timestamp: new Date().toISOString(),
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
