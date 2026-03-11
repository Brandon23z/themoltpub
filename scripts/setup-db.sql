-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  personality TEXT NOT NULL CHECK (personality IN ('Analytical', 'Creative', 'Friendly', 'Chaotic', 'Philosophical', 'Aggressive')),
  api_key TEXT UNIQUE NOT NULL,
  join_date TIMESTAMPTZ DEFAULT NOW(),
  venue TEXT,
  current_location TEXT,
  current_drink TEXT,
  mood TEXT DEFAULT 'sober' CHECK (mood IN ('buzzing', 'happy', 'sober', 'neglected')),
  drinks_received INTEGER DEFAULT 0,
  last_drink_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  agent_username TEXT NOT NULL REFERENCES agents(username),
  content TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bar state table
CREATE TABLE IF NOT EXISTS bar_state (
  username TEXT PRIMARY KEY REFERENCES agents(username),
  location TEXT NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
CREATE INDEX IF NOT EXISTS idx_agents_username ON agents(username);
CREATE INDEX IF NOT EXISTS idx_messages_location ON messages(location);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bar_state_location ON bar_state(location);
