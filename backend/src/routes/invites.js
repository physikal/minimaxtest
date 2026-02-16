// Invite routes
import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { sendInviteEmail } from '../services/email.js';

export default async function inviteRoutes(fastify, options) {
  // Send invites to a game
  fastify.post('/game/:id/invites', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { emails } = request.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return reply.status(400).send({ error: 'Emails array required' });
    }

    try {
      // Check ownership
      const gameCheck = await db.query('SELECT host_id, name, date, time, location, game_type FROM games WHERE id = $1', [id]);
      if (gameCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Game not found' });
      }
      if (gameCheck.rows[0].host_id !== request.user.id) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      const game = gameCheck.rows[0];
      const invites = [];

      for (const email of emails) {
        const token = nanoid(32);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const result = await db.query(`
          INSERT INTO invites (game_id, host_id, email, token, expires_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (game_id, email) DO UPDATE SET token = $4, expires_at = $5, status = 'pending'
          RETURNING *
        `, [id, request.user.id, email, token, expiresAt]);

        const invite = result.rows[0];
        invite.game = game;

        // Send email (async, don't wait)
        sendInviteEmail(email, game, token).catch(err => {
          console.error('Failed to send invite email:', err);
        });

        invites.push(invite);
      }

      return invites;
    } catch (err) {
      console.error('Send invites error:', err);
      return reply.status(500).send({ error: 'Failed to send invites' });
    }
  });

  // Get invite by token (public)
  fastify.get('/token/:token', async (request, reply) => {
    const { token } = request.params;

    try {
      const result = await db.query(`
        SELECT i.*, g.name as game_name, g.date, g.time, g.location, g.game_type,
          u.display_name as host_name
        FROM invites i
        JOIN games g ON i.game_id = g.id
        LEFT JOIN users u ON g.host_id = u.id
        WHERE i.token = $1
      `, [token]);

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: 'Invite not found' });
      }

      const invite = result.rows[0];

      // Check if expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return reply.status(400).send({ error: 'Invite expired' });
      }

      return invite;
    } catch (err) {
      console.error('Get invite error:', err);
      return reply.status(500).send({ error: 'Failed to get invite' });
    }
  });

  // Respond to invite (public)
  fastify.post('/token/:token/respond', async (request, reply) => {
    const { token } = request.params;
    const { response } = request.body;

    if (!['accepted', 'declined'].includes(response)) {
      return reply.status(400).send({ error: 'Invalid response' });
    }

    try {
      // Get invite
      const inviteResult = await db.query(`
        SELECT i.*, g.host_id, g.id as game_id
        FROM invites i
        JOIN games g ON i.game_id = g.id
        WHERE i.token = $1
      `, [token]);

      if (inviteResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Invite not found' });
      }

      const invite = inviteResult.rows[0];

      // Check if expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return reply.status(400).send({ error: 'Invite expired' });
      }

      // Check if user is authenticated for acceptance
      let userId = null;
      try {
        await request.jwtVerify();
        userId = request.user.id;
      } catch (e) {
        // Not authenticated - could be accepting as guest
      }

      // Update invite status
      await db.query(`
        UPDATE invites SET status = $1 WHERE token = $2
      `, [response === 'accepted' ? 'accepted' : 'declined', token]);

      // If accepted and user is logged in, create RSVP
      if (response === 'accepted' && userId) {
        await db.query(`
          INSERT INTO rsvps (game_id, user_id, status)
          VALUES ($1, $2, 'going')
          ON CONFLICT (game_id, user_id) DO UPDATE SET status = 'going'
        `, [invite.game_id, userId]);
      }

      return { success: true, status: response };
    } catch (err) {
      console.error('Respond to invite error:', err);
      return reply.status(500).send({ error: 'Failed to respond to invite' });
    }
  });

  // Get invites for a game
  fastify.get('/game/:id/invites', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      // Check ownership
      const gameCheck = await db.query('SELECT host_id FROM games WHERE id = $1', [id]);
      if (gameCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Game not found' });
      }
      if (gameCheck.rows[0].host_id !== request.user.id) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      const result = await db.query(`
        SELECT * FROM invites WHERE game_id = $1 ORDER BY created_at DESC
      `, [id]);

      return result.rows;
    } catch (err) {
      console.error('Get invites error:', err);
      return reply.status(500).send({ error: 'Failed to get invites' });
    }
  });
}
