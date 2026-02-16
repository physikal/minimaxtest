// Database connection and schema
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pokerpulse'
});

export const db = {
  query: (text, params) => pool.query(text, params),
  pool
};

export async function initDb() {
  // Create tables
  await db.query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      host_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      location VARCHAR(500) NOT NULL,
      max_players INT NOT NULL CHECK (max_players >= 2 AND max_players <= 20),
      buy_in VARCHAR(50),
      game_type VARCHAR(50) NOT NULL,
      notes TEXT,
      is_public BOOLEAN DEFAULT true,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- RSVPs table
    CREATE TABLE IF NOT EXISTS rsvps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(game_id, user_id)
    );

    -- Invites table
    CREATE TABLE IF NOT EXISTS invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      host_id UUID REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    );

    -- Waitlist table
    CREATE TABLE IF NOT EXISTS waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      game_id UUID REFERENCES games(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      position INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(game_id, user_id)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
    CREATE INDEX IF NOT EXISTS idx_games_host ON games(host_id);
    CREATE INDEX IF NOT EXISTS idx_rsvps_user ON rsvps(user_id);
    CREATE INDEX IF NOT EXISTS idx_rsvps_game ON rsvps(game_id);
    CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
  `);

  console.log('Database tables created/verified');
}
