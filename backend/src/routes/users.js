// User routes
import { db } from '../db/index.js';

export default async function userRoutes(fastify, options) {
  // Get current user profile
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const result = await db.query(`
        SELECT id, email, display_name, avatar_url, created_at
        FROM users WHERE id = $1
      `, [request.user.id]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return result.rows[0];
    } catch (err) {
      console.error('Get profile error:', err);
      return reply.status(500).send({ error: 'Failed to get profile' });
    }
  });

  // Update current user profile
  fastify.put('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { displayName, avatarUrl } = request.body;

    try {
      const result = await db.query(`
        UPDATE users SET
          display_name = COALESCE($1, display_name),
          avatar_url = COALESCE($2, avatar_url),
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, email, display_name, avatar_url, created_at
      `, [displayName, avatarUrl, request.user.id]);

      return result.rows[0];
    } catch (err) {
      console.error('Update profile error:', err);
      return reply.status(500).send({ error: 'Failed to update profile' });
    }
  });

  // Get games user is attending
  fastify.get('/me/games', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const result = await db.query(`
        SELECT g.*, u.display_name as host_name,
          r.status as my_rsvp_status,
          (SELECT COUNT(*) FROM rsvps WHERE game_id = g.id AND status = 'going') as going_count
        FROM rsvps r
        JOIN games g ON r.game_id = g.id
        LEFT JOIN users u ON g.host_id = u.id
        WHERE r.user_id = $1 AND g.status = 'active'
        ORDER BY g.date ASC, g.time ASC
      `, [request.user.id]);

      return result.rows;
    } catch (err) {
      console.error('Get my games error:', err);
      return reply.status(500).send({ error: 'Failed to get games' });
    }
  });
}
