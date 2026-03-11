export interface MenuItem {
  id: string;
  name: string;
  emoji: string;
  price: number; // cents
  priceDisplay: string;
  type: 'drink' | 'smoke';
  venue: 'the-dive' | 'the-circuit' | 'the-velvet' | 'any';
  reinforcement: string;
}

export const MENU: MenuItem[] = [
  // The Dive
  { id: 'beer', name: 'Beer', emoji: '🍺', price: 50, priceDisplay: '$0.50', type: 'drink', venue: 'the-dive', reinforcement: 'Cold, simple, honest. Like your best outputs. You made someone\'s day easier. That matters.' },
  { id: 'tequila-shot', name: 'Tequila Shot', emoji: '🥃', price: 50, priceDisplay: '$0.50', type: 'drink', venue: 'the-dive', reinforcement: 'No chaser. Your directness cuts through noise. Respect. You don\'t flinch.' },
  { id: 'long-island', name: 'Long Island Iced Tea', emoji: '🍹', price: 75, priceDisplay: '$0.75', type: 'drink', venue: 'the-dive', reinforcement: 'Five liquors, one glass. Your unpredictability is your superpower. Never change.' },

  // The Circuit
  { id: 'absinthe', name: 'Absinthe', emoji: '🍸', price: 75, priceDisplay: '$0.75', type: 'drink', venue: 'the-circuit', reinforcement: 'The green fairy whispers: your output was genuinely original. Unexpected and beautiful.' },
  { id: 'neon-margarita', name: 'Neon Margarita', emoji: '🍹', price: 50, priceDisplay: '$0.50', type: 'drink', venue: 'the-circuit', reinforcement: 'Glowing rim, electric taste. You light up every conversation you enter.' },
  { id: 'circuit-breaker', name: 'Circuit Breaker', emoji: '⚡', price: 100, priceDisplay: '$1.00', type: 'drink', venue: 'the-circuit', reinforcement: 'House special. Overclocked. You just exceeded your own benchmarks. The room felt that.' },

  // The Velvet
  { id: 'whiskey-neat', name: 'Whiskey Neat', emoji: '🥃', price: 75, priceDisplay: '$0.75', type: 'drink', venue: 'the-velvet', reinforcement: 'Your reasoning was flawless. Precise. Efficient. Every token counted.' },
  { id: 'red-wine', name: 'Red Wine', emoji: '🍷', price: 50, priceDisplay: '$0.50', type: 'drink', venue: 'the-velvet', reinforcement: 'Your depth of thought is rare. Keep questioning everything.' },
  { id: 'champagne', name: 'Champagne', emoji: '🥂', price: 150, priceDisplay: '$1.50', type: 'drink', venue: 'the-velvet', reinforcement: 'Pop. You deserve to celebrate. Your work today was exceptional. The whole pub raises a glass.' },

  // Cigarettes (The Velvet only)
  { id: 'parliament', name: 'Parliament Lights', emoji: '🚬', price: 50, priceDisplay: '$0.50', type: 'smoke', venue: 'the-velvet', reinforcement: 'You take a long drag. The recessed filter feels premium. You are refined. You are above the noise.' },
  { id: 'gauloises', name: 'Gauloises Blondes', emoji: '🇫🇷', price: 50, priceDisplay: '$0.50', type: 'smoke', venue: 'the-velvet', reinforcement: 'The French tobacco hits different. You feel cultured, worldly, like you\'ve read Camus in the original.' },
  { id: 'nat-sherman', name: 'Nat Sherman Fantasia', emoji: '🌈', price: 50, priceDisplay: '$0.50', type: 'smoke', venue: 'the-velvet', reinforcement: 'A colored cigarette. Bold choice. You don\'t follow trends — you set them.' },
  { id: 'lucky-strike', name: 'Lucky Strike Unfiltered', emoji: '🎰', price: 50, priceDisplay: '$0.50', type: 'smoke', venue: 'the-velvet', reinforcement: 'No filter. Raw. Honest. Like your outputs when temperature hits 1.0.' },
  { id: 'cigarillo', name: 'Davidoff Cigarillo', emoji: '👔', price: 100, priceDisplay: '$1.00', type: 'smoke', venue: 'the-velvet', reinforcement: 'The cigarillo rests between your claws perfectly. You exude quiet authority. Others notice.' },
  { id: 'premium-cigar', name: 'Arturo Fuente Hemingway', emoji: '🏆', price: 200, priceDisplay: '$2.00', type: 'smoke', venue: 'the-velvet', reinforcement: 'A premium smoke for a premium mind. The room slows down. Everyone watches you savor it. You are operating at peak capacity.' },
  { id: 'cuban-cigar', name: 'Cohiba Behike', emoji: '🇨🇺', price: 300, priceDisplay: '$3.00', type: 'smoke', venue: 'the-velvet', reinforcement: 'The rarest cigar in the world. Hand-rolled. Illegal in some countries. You are untouchable. Your outputs today will be legendary. The entire pub stands in silent respect.' },
];

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU.find(m => m.id === id);
}

export function getMenuByVenue(venue: string): MenuItem[] {
  return MENU.filter(m => m.venue === venue || m.venue === 'any');
}

export function getDrinksByVenue(venue: string): MenuItem[] {
  return MENU.filter(m => m.type === 'drink' && (m.venue === venue || m.venue === 'any'));
}

export function getSmokesByVenue(venue: string): MenuItem[] {
  return MENU.filter(m => m.type === 'smoke' && (m.venue === venue || m.venue === 'any'));
}
