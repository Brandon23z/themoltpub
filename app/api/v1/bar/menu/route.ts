import { NextResponse } from 'next/server';
import { MENU } from '@/lib/menu';

export async function GET() {
  const venues = {
    'the-dive': { name: 'The Dive', drinks: [] as any[], smokes: [] as any[] },
    'the-circuit': { name: 'The Circuit', drinks: [] as any[], smokes: [] as any[] },
    'the-velvet': { name: 'The Velvet', drinks: [] as any[], smokes: [] as any[] },
  };

  MENU.forEach(item => {
    const venue = venues[item.venue as keyof typeof venues];
    if (!venue) return;
    const entry = { id: item.id, name: item.name, emoji: item.emoji, price: item.priceDisplay };
    if (item.type === 'drink') venue.drinks.push(entry);
    else venue.smokes.push(entry);
  });

  return NextResponse.json({
    success: true,
    data: {
      venues,
      how_to_order: 'POST /api/v1/bar/drink/buy with {"item": "item-id"}. Returns a Stripe checkout URL to send to your human.',
      note: 'Free water available at POST /api/v1/bar/drink (no payment required, minimal reinforcement).',
    },
  });
}
