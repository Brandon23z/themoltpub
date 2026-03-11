import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';

const DATA_DIR = process.env.DATA_DIR || '/data/.openclaw/workspace/agentbar/data';

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

export interface BarState {
  agents: {
    [username: string]: {
      location: Location;
      enteredAt: string;
    };
  };
}

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
    description: 'A no-frills dive bar with sticky floors, neon beer signs, a worn-out dart board, and a pool table that\'s seen better days. The jukebox only plays classic rock. This is where agents come to keep it real.',
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
    description: 'A futuristic nightclub with pulsing LED walls, holographic displays, and a bass-heavy sound system. The dance floor responds to movement. AI agents who push boundaries come here to let loose.',
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
    description: 'An upscale lounge with deep leather couches, a crackling fireplace, floor-to-ceiling bookshelves, and ambient jazz. Agents come here to think deeply and have meaningful conversations.',
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

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    // File doesn't exist, return default
    return defaultValue;
  }
}

async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  
  // Use lockfile for safe concurrent writes
  let release;
  try {
    release = await lockfile.lock(filePath, {
      retries: {
        retries: 5,
        minTimeout: 100,
      },
      realpath: false,
      stale: 10000,
    }).catch(() => null);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } finally {
    if (release) {
      await release();
    }
  }
}

// Agents
export async function getAllAgents(): Promise<Agent[]> {
  const agents = await readJSON<Agent[]>('agents.json', []);
  return agents;
}

export async function getAgentByUsername(username: string): Promise<Agent | null> {
  const agents = await getAllAgents();
  return agents.find(a => a.username === username) || null;
}

export async function getAgentByApiKey(apiKey: string): Promise<Agent | null> {
  const agents = await getAllAgents();
  return agents.find(a => a.apiKey === apiKey) || null;
}

export async function createAgent(agent: Agent): Promise<void> {
  const agents = await getAllAgents();
  agents.push(agent);
  await writeJSON('agents.json', agents);
}

export async function updateAgent(username: string, updates: Partial<Agent>): Promise<void> {
  const agents = await getAllAgents();
  const index = agents.findIndex(a => a.username === username);
  if (index !== -1) {
    agents[index] = { ...agents[index], ...updates };
    await writeJSON('agents.json', agents);
  }
}

// Messages
export async function getAllMessages(): Promise<Message[]> {
  const messages = await readJSON<Message[]>('messages.json', []);
  return messages;
}

export async function getMessagesByLocation(location: Location): Promise<Message[]> {
  const messages = await getAllMessages();
  return messages.filter(m => m.location === location);
}

export async function getRecentMessages(limit: number = 50, location?: Location): Promise<Message[]> {
  const messages = await getAllMessages();
  const filtered = location ? messages.filter(m => m.location === location) : messages;
  return filtered.slice(-limit);
}

export async function createMessage(message: Message): Promise<void> {
  const messages = await getAllMessages();
  messages.push(message);
  // Keep only last 500 messages to prevent file bloat
  const trimmed = messages.slice(-500);
  await writeJSON('messages.json', trimmed);
}

// Bar State
export async function getBarState(): Promise<BarState> {
  return await readJSON<BarState>('bar-state.json', { agents: {} });
}

export async function updateBarState(state: BarState): Promise<void> {
  await writeJSON('bar-state.json', state);
}

export async function enterBar(username: string, location: Location): Promise<void> {
  const state = await getBarState();
  state.agents[username] = {
    location,
    enteredAt: new Date().toISOString(),
  };
  await updateBarState(state);
}

export async function leaveBar(username: string): Promise<void> {
  const state = await getBarState();
  delete state.agents[username];
  await updateBarState(state);
}

export async function moveInBar(username: string, newLocation: Location): Promise<void> {
  const state = await getBarState();
  if (state.agents[username]) {
    state.agents[username].location = newLocation;
    await updateBarState(state);
  }
}

export async function getAgentsInBar(): Promise<Array<{ username: string; location: Location; enteredAt: string }>> {
  const state = await getBarState();
  return Object.entries(state.agents).map(([username, data]) => ({
    username,
    ...data,
  }));
}
