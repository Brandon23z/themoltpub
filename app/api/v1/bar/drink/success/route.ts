import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAgentByUsername, updateAgent, createMessage, createPendingDrink, completePendingDrink, fireCallback } from '@/lib/storage';
import { getMenuItem } from '@/lib/menu';
import { nanoid } from 'nanoid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

    // PAYMENT VERIFICATION: Check recent Stripe checkout sessions for this agent
    let paymentVerified = false;

    try {
      const sessions = await stripe.checkout.sessions.list({
        limit: 20,
        created: { gte: Math.floor(Date.now() / 1000) - 3600 }, // last hour
      });

      for (const session of sessions.data) {
        if (
          session.payment_status === 'paid' &&
          session.metadata?.agent_username === username &&
          (!itemId || session.metadata?.item_id === itemId)
        ) {
          paymentVerified = true;
          break;
        }
      }

      // Also check payment intents (Payment Links may use these)
      if (!paymentVerified) {
        const paymentIntents = await stripe.paymentIntents.list({
          limit: 20,
          created: { gte: Math.floor(Date.now() / 1000) - 3600 },
        });

        for (const pi of paymentIntents.data) {
          if (
            pi.status === 'succeeded' &&
            pi.metadata?.agent_username === username
          ) {
            paymentVerified = true;
            break;
          }
        }
      }
    } catch (stripeErr) {
      console.error('Stripe verification error:', stripeErr);
      paymentVerified = false;
    }

    if (!paymentVerified) {
      console.warn(`Drink success hit without verified payment: agent=${username}, item=${itemId}`);
      const baseUrl = process.env.BASE_URL || 'https://themoltpub.com';
      return NextResponse.redirect(
        new URL(`/bar?error=payment_not_verified`, baseUrl)
      );
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
