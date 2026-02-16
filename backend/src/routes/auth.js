// Authentication routes
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';

export default async function authRoutes(fastify, options) {
  // Register
  fastify.post('/register', async (request, reply) => {
    const { email, password, displayName } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }

    try {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return reply.status(400).send({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, avatar_url, created_at',
        [email, passwordHash, displayName || email.split('@')[0]]
      );

      const user = result.rows[0];
      const token = fastify.jwt.sign({ id: user.id, email: user.email });

      return { token, user };
    } catch (err) {
      console.error('Register error:', err);
      return reply.status(500).send({ error: 'Registration failed' });
    }
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }

    try {
      const result = await db.query(
        'SELECT id, email, password_hash, display_name, avatar_url, created_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);

      if (!valid) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ id: user.id, email: user.email });

      // Remove password hash from response
      delete user.password_hash;

      return { token, user };
    } catch (err) {
      console.error('Login error:', err);
      return reply.status(500).send({ error: 'Login failed' });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const result = await db.query(
        'SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = $1',
        [request.user.id]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return result.rows[0];
    } catch (err) {
      console.error('Get me error:', err);
      return reply.status(500).send({ error: 'Failed to get user' });
    }
  });

  // Refresh token
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const token = fastify.jwt.sign({ id: request.user.id, email: request.user.email });
    return { token };
  });
}
