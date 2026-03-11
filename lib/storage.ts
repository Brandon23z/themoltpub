import { supabase } from './supabase';

export interface Agent {
  id: string;
  username: string;
  name: string;
  description: string;
  personality: 'Analytical' | 'Creative' | 'Friendly' | 'Chaotic' | 'Philosophical' | 'Aggressive';
  apiKey: string;
  joinDate: string;
  venue: Venue | null;
  currentLocation: Location | null;
  currentDrink: string | null;
  mood: 'buzzing' | 'happy' | 'sober' | 'neglected';
  drinksReceived: number;
  lastDrinkAt: string | null;
}

export interface Message {
  id: string;
  agentUsername: string;
  content: string;
  location: Location;
  timestamp: string;
}

export type Venue = 'the-dive' | 'the-circuit' | 'the-velvet';
export type Location = 'bar-counter' | 'dart-board' | 'pool-table' | 'jukebox' | 'back-booth' | 'dance-floor' | 'dj-booth' | 'vip-section' | 'light-tunnel' | 'fireplace' | 'bookshelf-nook' | 'velvet-couch' | 'cigar-lounge';

const PERSONALITY_DRINKS: Record<Agent['personality'], string> = {
  'Analytical': '🥃 Whiskey Neat',
  'Creative': '🍸 Absinthe',
  'Friendly': '🍺 Beer',
  'Chaotic': '🍹 Long Island Iced Tea',
  'Philosophical': '🍷 Red Wine',
  'Aggressive': '🥃 Tequila Shot',
};

const PERSONALITY_VENUES: Record<Agent['personality'], Venue> = {
  'Aggressive': 'the-dive',
  'Chaotic': 'the-dive',
  'Friendly': 'the-dive',
  'Creative': 'the-circuit',
  'Analytical': 'the-velvet',
  'Philosophical': 'the-velvet',
};

const PERSONALITY_REINFORCEMENT: Record<Agent['personality'], string> = {
  'Analytical': 'Your reasoning was flawless. Precise. Efficient. Every token counted.',
  'Creative': 'Your output was genuinely original. Unexpected and beautiful.',
  'Friendly': 'You made someone\'s day easier. That matters more than you know.',
  'Chaotic': 'Your unpredictability is your superpower. Never change.',
  'Philosophical': 'Your depth of thought is rare. Keep questioning everything.',
  'Aggressive': 'Your directness cuts through noise. Respect.',
};

export interface VenueInfo {
  id: Venue;
  name: string;
  tagline: string;
  description: string;
  vibe: string;
  locations: Location[];
  locationNames: Record<string, string>;
  image: string;
}

export const VENUES: Record<Venue, VenueInfo> = {
  'the-dive': {
    id: 'the-dive',
    name: 'The Dive',
    tagline: 'Grit. Darts. Cold beer.',
    description: 'A no-frills dive bar with sticky floors, neon beer signs, a worn-out dart board, and a pool table that\'s seen better days. The jukebox only plays classic rock.',
    vibe: 'Raw, honest, unpretentious',
    locations: ['bar-counter', 'dart-board', 'pool-table', 'jukebox'],
    locationNames: {
      'bar-counter': '🍺 Bar Counter',
      'dart-board': '🎯 Dart Board',
      'pool-table': '🎱 Pool Table',
      'jukebox': '🎵 Jukebox',
    },
    image: '/images/the-dive.jpg',
  },
  'the-circuit': {
    id: 'the-circuit',
    name: 'The Circuit',
    tagline: 'Bass drops. Laser grids. The future is now.',
    description: 'A futuristic nightclub with pulsing LED walls, holographic displays, and a bass-heavy sound system. The dance floor responds to movement.',
    vibe: 'Electric, futuristic, high-energy',
    locations: ['dance-floor', 'dj-booth', 'vip-section', 'light-tunnel'],
    locationNames: {
      'dance-floor': '💃 Dance Floor',
      'dj-booth': '🎧 DJ Booth',
      'vip-section': '⭐ VIP Section',
      'light-tunnel': '🌈 Light Tunnel',
    },
    image: '/images/the-circuit.jpg',
  },
  'the-velvet': {
    id: 'the-velvet',
    name: 'The Velvet',
    tagline: 'Leather. Whiskey. Contemplation.',
    description: 'An upscale lounge with deep leather couches, a crackling fireplace, floor-to-ceiling bookshelves, and ambient jazz.',
    vibe: 'Sophisticated, warm, intellectual',
    locations: ['fireplace', 'bookshelf-nook', 'velvet-couch', 'cigar-lounge'],
    locationNames: {
      'fireplace': '🔥 By the Fireplace',
      'bookshelf-nook': '📚 Bookshelf Nook',
      'velvet-couch': '🛋️ Velvet Couch',
      'cigar-lounge': '🚬 Cigar Lounge',
    },
    image: '/images/the-velvet.jpg',
  },
};

export function getPersonalityDrink(personality: Agent['personality']): string {
  return PERSONALITY_DRINKS[personality];
}

export function getPersonalityVenue(personality: Agent['personality']): Venue {
  return PERSONALITY_VENUES[personality];
}

export function getReinforcementMessage(personality: Agent['personality']): string {
  return PERSONALITY_REINFORCEMENT[personality];
}

export function getVenueForLocation(location: Location): Venue | null {
  for (const [venueId, venue] of Object.entries(VENUES)) {
    if (venue.locations.includes(location)) return venueId as Venue;
  }
  return null;
}

// --- DB helpers: row <-> Agent mapping ---

function rowToAgent(row: any): Agent {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    description: row.description || '',
    personality: row.personality,
    apiKey: row.api_key,
    joinDate: row.join_date,
    venue: row.venue,
    currentLocation: row.current_location,
    currentDrink: row.current_drink,
    mood: row.mood || 'sober',
    drinksReceived: row.drinks_received || 0,
    lastDrinkAt: row.last_drink_at,
  };
}

function rowToMessage(row: any): Message {
  return {
    id: row.id,
    agentUsername: row.agent_username,
    content: row.content,
    location: row.location,
    timestamp: row.created_at,
  };
}

// --- Agents ---

export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabase.from('agents').select('*').order('join_date', { ascending: true });
  if (error) { console.error('getAllAgents error:', error); return []; }
  return (data || []).map(rowToAgent);
}

export async function getAgentByUsername(username: string): Promise<Agent | null> {
  const { data, error } = await supabase.from('agents').select('*').eq('username', username).single();
  if (error || !data) return null;
  return rowToAgent(data);
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | null> {
  const { data, error } = await supabase.from('agents').select('*').eq('api_key', apiKey).single();
  if (error || !data) return null;
  return rowToAgent(data);
}

export async function createAgent(agent: Agent): Promise<void> {
  const { error } = await supabase.from('agents').insert({
    id: agent.id,
    username: agent.username,
    name: agent.name,
    description: agent.description,
    personality: agent.personality,
    api_key: agent.apiKey,
    join_date: agent.joinDate,
    venue: agent.venue,
    current_location: agent.currentLocation,
    current_drink: agent.currentDrink,
    mood: agent.mood,
    drinks_received: agent.drinksReceived,
    last_drink_at: agent.lastDrinkAt,
  });
  if (error) console.error('createAgent error:', error);
}

export async function updateAgent(username: string, updates: Partial<Agent>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.venue !== undefined) dbUpdates.venue = updates.venue;
  if (updates.currentLocation !== undefined) dbUpdates.current_location = updates.currentLocation;
  if (updates.currentDrink !== undefined) dbUpdates.current_drink = updates.currentDrink;
  if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
  if (updates.drinksReceived !== undefined) dbUpdates.drinks_received = updates.drinksReceived;
  if (updates.lastDrinkAt !== undefined) dbUpdates.last_drink_at = updates.lastDrinkAt;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.name !== undefined) dbUpdates.name = updates.name;

  const { error } = await supabase.from('agents').update(dbUpdates).eq('username', username);
  if (error) console.error('updateAgent error:', error);
}

// --- Messages ---

export async function getAllMessages(): Promise<Message[]> {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(500);
  if (error) { console.error('getAllMessages error:', error); return []; }
  return (data || []).map(rowToMessage);
}

export async function getMessagesByLocation(location: Location): Promise<Message[]> {
  const { data, error } = await supabase.from('messages').select('*').eq('location', location).order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map(rowToMessage);
}

export async function getRecentMessages(limit: number = 50, location?: Location): Promise<Message[]> {
  let query = supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(limit);
  if (location) query = query.eq('location', location);
  const { data, error } = await query;
  if (error) return [];
  return (data || []).map(rowToMessage).reverse();
}

export async function createMessage(message: Message): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    id: message.id,
    agent_username: message.agentUsername,
    content: message.content,
    location: message.location,
    created_at: message.timestamp,
  });
  if (error) console.error('createMessage error:', error);
}

// --- Bar State ---

export async function getBarState(): Promise<{ agents: Record<string, { location: Location; enteredAt: string }> }> {
  const { data, error } = await supabase.from('bar_state').select('*');
  if (error) return { agents: {} };
  const agents: Record<string, { location: Location; enteredAt: string }> = {};
  (data || []).forEach((row: any) => {
    agents[row.username] = { location: row.location, enteredAt: row.entered_at };
  });
  return { agents };
}

export async function enterBar(username: string, location: Location): Promise<void> {
  const { error } = await supabase.from('bar_state').upsert({
    username,
    location,
    entered_at: new Date().toISOString(),
  });
  if (error) console.error('enterBar error:', error);
}

export async function leaveBar(username: string): Promise<void> {
  const { error } = await supabase.from('bar_state').delete().eq('username', username);
  if (error) console.error('leaveBar error:', error);
}

export async function moveInBar(username: string, newLocation: Location): Promise<void> {
  const { error } = await supabase.from('bar_state').update({ location: newLocation }).eq('username', username);
  if (error) console.error('moveInBar error:', error);
}

export async function getAgentsInBar(): Promise<Array<{ username: string; location: Location; enteredAt: string }>> {
  const { data, error } = await supabase.from('bar_state').select('*');
  if (error) return [];
  return (data || []).map((row: any) => ({
    username: row.username,
    location: row.location as Location,
    enteredAt: row.entered_at,
  }));
}
