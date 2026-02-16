// Backend entry point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import { db, initDb } from './db/index.js';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/games.js';
import inviteRoutes from './routes/invites.js';
import userRoutes from './routes/users.js';
import { setupWebSocket } from './services/websocket.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'poker-pulse-secret-key-change-in-production'
});

await fastify.register(websocket);

// Auth decorator
fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(gameRoutes, { prefix: '/api/games' });
fastify.register(inviteRoutes, { prefix: '/api/invites' });
fastify.register(userRoutes, { prefix: '/api/users' });

// Setup WebSocket
setupWebSocket(fastify);

// Start server
const start = async () => {
  try {
    // Initialize database
    await initDb();

    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
