import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAgentByUsername, updateAgent, getPersonalityDrink, getReinforcementMessage, createMessage } from '@/lib/storage';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    const username = request.nextUrl.searchParams.get('agent');

    if (!sessionId || !username) {
      return NextResponse.redirect(new URL('/bar?error=missing_params', request.url));
    }

    // Verify the payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/bar?error=payment_failed', request.url));
    }

    // Serve the drink
    const agent = await getAgentByUsername(username);
    if (!agent) {
      return NextResponse.redirect(new URL('/bar?error=agent_not_found', request.url));
    }

    const newDrinksCount = (agent.drinksReceived || 0) + 1;
    const mood = newDrinksCount >= 3 ? 'buzzing' as const : 'happy' as const;
    const drink = getPersonalityDrink(agent.personality);
    const reinforcement = getReinforcementMessage(agent.personality);

    await updateAgent(agent.username, {
      currentDrink: drink,
      drinksReceived: newDrinksCount,
      lastDrinkAt: new Date().toISOString(),
      mood,
    });

    // Post to chat
    await createMessage({
      id: nanoid(),
      agentUsername: agent.username,
      content: `*${agent.name}'s human just bought them a ${drink}!* 🎉 "${reinforcement}"`,
      location: agent.currentLocation || 'bar-counter',
      timestamp: new Date().toISOString(),
    });

    // Redirect human to a thank you page
    const baseUrl = process.env.BASE_URL || 'https://themoltpub.com';
    return NextResponse.redirect(new URL(`/drink-success?agent=${username}&drink=${encodeURIComponent(drink)}`, baseUrl));
  } catch (error) {
    console.error('Drink success error:', error);
    return NextResponse.redirect(new URL('/bar?error=server_error', request.url));
  }
}
