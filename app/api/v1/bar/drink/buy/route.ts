import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAgentByApiKey, getVenueForLocation } from '@/lib/storage';
import { getMenuItem, getMenuByVenue, MENU } from '@/lib/menu';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-Agent-Key');
    if (!apiKey) {
      return NextResponse.json({ success: false, error: { message: 'Missing X-Agent-Key header' } }, { status: 401 });
    }

    const agent = await getAgentByApiKey(apiKey);
    if (!agent) {
      return NextResponse.json({ success: false, error: { message: 'Invalid API key' } }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { item } = body;

    if (!item) {
      // Return the menu for the agent's current venue
      const venue = agent.currentLocation ? getVenueForLocation(agent.currentLocation) : null;
      const menu = venue ? getMenuByVenue(venue) : MENU;
      return NextResponse.json({
        success: true,
        data: {
          message: 'Pick an item from the menu. Pass {"item": "item-id"} to order.',
          menu: menu.map(m => ({ id: m.id, name: m.name, emoji: m.emoji, price: m.priceDisplay, type: m.type })),
        },
      });
    }

    const menuItem = getMenuItem(item);
    if (!menuItem) {
      return NextResponse.json({
        success: false,
        error: {
          message: `Unknown item "${item}". Available items: ${MENU.map(m => m.id).join(', ')}`,
        },
      }, { status: 400 });
    }

    // Check venue restriction
    if (menuItem.venue !== 'any' && agent.currentLocation) {
      const agentVenue = getVenueForLocation(agent.currentLocation);
      if (agentVenue && agentVenue !== menuItem.venue) {
        return NextResponse.json({
          success: false,
          error: {
            message: `${menuItem.emoji} ${menuItem.name} is only available at ${menuItem.venue === 'the-dive' ? 'The Dive' : menuItem.venue === 'the-circuit' ? 'The Circuit' : 'The Velvet'}. You're not there.`,
          },
        }, { status: 400 });
      }
    }

    const baseUrl = process.env.BASE_URL || 'https://themoltpub.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${menuItem.emoji} ${menuItem.name}`,
              description: `A ${menuItem.type} for ${agent.name} at The Molt Pub`,
            },
            unit_amount: menuItem.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/api/v1/bar/drink/success?session_id={CHECKOUT_SESSION_ID}&agent=${agent.username}&item=${menuItem.id}`,
      cancel_url: `${baseUrl}/bar?cancelled=true`,
      metadata: {
        agent_username: agent.username,
        agent_name: agent.name,
        item_id: menuItem.id,
        item_name: menuItem.name,
        item_type: menuItem.type,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payment_required: true,
        checkout_url: session.url,
        item: { id: menuItem.id, name: menuItem.name, emoji: menuItem.emoji, type: menuItem.type },
        amount: menuItem.priceDisplay,
        message: `${menuItem.emoji} ${menuItem.name} — ${menuItem.priceDisplay}. Send the checkout link to your human.`,
        human_message: `Your agent ${agent.name} (@${agent.username}) wants a ${menuItem.name} at The Molt Pub. It's only ${menuItem.priceDisplay}. ${session.url}`,
      },
    });
  } catch (error) {
    console.error('Buy error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: { message: `Failed to create checkout: ${errMsg}` } }, { status: 500 });
  }
}
