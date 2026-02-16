// Games routes
import { db } from '../db/index.js';

export default async function gameRoutes(fastify, options) {
  // List games
  fastify.get('/', async (request, reply) => {
    const { date, type, host_id, public: isPublic } = request.query;

    let query = `
      SELECT g.*, u.display_name as host_name, u.avatar_url as host_avatar,
        (SELECT COUNT(*) FROM rsvps WHERE game_id = g.id AND status = 'going') as going_count
      FROM games g
      LEFT JOIN users u ON g.host_id = u.id
      WHERE g.status = 'active'
    `;
    const params = [];
    let paramIndex = 1;

    if (date) {
      query += ` AND g.date = $${paramIndex++}`;
      params.push(date);
    }
    if (type) {
      query += ` AND g.game_type = $${paramIndex++}`;
      params.push(type);
    }
    if (host_id) {
      query += ` AND g.host_id = $${paramIndex++}`;
      params.push(host_id);
    }
    if (isPublic !== undefined) {
      query += ` AND g.is_public = $${paramIndex++}`;
      params.push(isPublic === 'true');
    }

    query += ' ORDER BY g.date ASC, g.time ASC';

    try {
      const result = await db.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('List games error:', err);
      return reply.status(500).send({ error: 'Failed to list games' });
    }
  });

  // Get user's games (hosting)
  fastify.get('/my', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const result = await db.query(`
        SELECT g.*, u.display_name as host_name,
          (SELECT COUNT(*) FROM rsvps WHERE game_id = g.id AND status = 'going') as going_count
        FROM games g
        LEFT JOIN users u ON g.host_id = u.id
        WHERE g.host_id = $1
        ORDER BY g.date ASC, g.time ASC
      `, [request.user.id]);
      return result.rows;
    } catch (err) {
      console.error('My games error:', err);
      return reply.status(500).send({ error: 'Failed to get games' });
    }
  });

  // Get single game
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const gameResult = await db.query(`
        SELECT g.*, u.display_name as host_name, u.avatar_url as host_avatar,
          (SELECT COUNT(*) FROM rsvps WHERE game_id = g.id AND status = 'going') as going_count
        FROM games g
        LEFT JOIN users u ON g.host_id = u.id
        WHERE g.id = $1
      `, [id]);

      if (gameResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Game not found' });
      }

      const game = gameResult.rows[0];

      // Get RSVPs
      const rsvpResult = await db.query(`
        SELECT r.*, u.display_name, u.avatar_url
        FROM rsvps r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.game_id = $1
      `, [id]);

      game.rsvps = rsvpResult.rows;

      return game;
    } catch (err) {
      console.error('Get game error:', err);
      return reply.status(500).send({ error: 'Failed to get game' });
    }
  });

  // Create game
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { name, date, time, location, maxPlayers, buyIn, gameType, notes, isPublic } = request.body;

    if (!name || !date || !time || !location || !maxPlayers || !gameType) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    try {
      const result = await db.query(`
        INSERT INTO games (host_id, name, date, time, location, max_players, buy_in, game_type, notes, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [request.user.id, name, date, time, location, maxPlayers, buyIn, gameType, notes, isPublic !== false]);

      const game = result.rows[0];

      // Auto-RSVP host as going
      await db.query(`
        INSERT INTO rsvps (game_id, user_id, status)
        VALUES ($1, $2, 'going')
        ON CONFLICT (game_id, user_id) DO UPDATE SET status = 'going'
      `, [game.id, request.user.id]);

      // Emit WebSocket event
      fastify.websocketServer?.clients?.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'game:created', game }));
        }
      });

      return game;
    } catch (err) {
      console.error('Create game error:', err);
      return reply.status(500).send({ error: 'Failed to create game' });
    }
  });

  // Update game
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, date, time, location, maxPlayers, buyIn, gameType, notes, isPublic, status } = request.body;

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
        UPDATE games SET
          name = COALESCE($1, name),
          date = COALESCE($2, date),
          time = COALESCE($3, time),
          location = COALESCE($4, location),
          max_players = COALESCE($5, max_players),
          buy_in = COALESCE($6, buy_in),
          game_type = COALESCE($7, game_type),
          notes = COALESCE($8, notes),
          is_public = COALESCE($9, is_public),
          status = COALESCE($10, status),
          updated_at = NOW()
        WHERE id = $11
        RETURNING *
      `, [name, date, time, location, maxPlayers, buyIn, gameType, notes, isPublic, status, id]);

      const game = result.rows[0];

      // Emit WebSocket event
      fastify.websocketServer?.clients?.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'game:updated', game }));
        }
      });

      return game;
    } catch (err) {
      console.error('Update game error:', err);
      return reply.status(500).send({ error: 'Failed to update game' });
    }
  });

  // Delete/cancel game
  fastify.delete('/:id', {
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

      await db.query('UPDATE games SET status = \'cancelled\', updated_at = NOW() WHERE id = $1', [id]);

      // Emit WebSocket event
      fastify.websocketServer?.clients?.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'game:cancelled', gameId: id }));
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Delete game error:', err);
      return reply.status(500).send({ error: 'Failed to delete game' });
    }
  });

  // Get RSVPs for a game
  fastify.get('/:id/rsvps', async (request, reply) => {
    const { id } = request.params;

    try {
      const result = await db.query(`
        SELECT r.*, u.display_name, u.avatar_url
        FROM rsvps r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.game_id = $1
      `, [id]);
      return result.rows;
    } catch (err) {
      console.error('Get RSVPs error:', err);
      return reply.status(500).send({ error: 'Failed to get RSVPs' });
    }
  });

  // Submit RSVP
  fastify.post('/:id/rsvp', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, message } = request.body;

    if (!['going', 'pending', 'cant-go'].includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' });
    }

    try {
      // Check if game exists and has space
      const gameCheck = await db.query('SELECT max_players, (SELECT COUNT(*) FROM rsvps WHERE game_id = $1 AND status = \'going\') as going_count FROM games WHERE id = $1', [id]);

      if (gameCheck.rows.length === 0) {
        return reply.status(404).send({ error: 'Game not found' });
      }

      const game = gameCheck.rows[0];

      // Check if game is full (only for 'going' status)
      if (status === 'going' && game.going_count >= game.max_players) {
        return reply.status(400).send({ error: 'Game is full' });
      }

      const result = await db.query(`
        INSERT INTO rsvps (game_id, user_id, status, message)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (game_id, user_id) DO UPDATE SET status = $3, message = $4, updated_at = NOW()
        RETURNING *
      `, [id, request.user.id, status, message]);

      const rsvp = result.rows[0];

      // Get user info
      const userResult = await db.query('SELECT display_name, avatar_url FROM users WHERE id = $1', [request.user.id]);
      rsvp.display_name = userResult.rows[0]?.display_name;
      rsvp.avatar_url = userResult.rows[0]?.avatar_url;

      // Emit WebSocket event
      fastify.websocketServer?.clients?.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'rsvp:updated', rsvp, gameId: id }));
        }
      });

      return rsvp;
    } catch (err) {
      console.error('Submit RSVP error:', err);
      return reply.status(500).send({ error: 'Failed to submit RSVP' });
    }
  });

  // Get current user's RSVP for a game
  fastify.get('/:id/rsvp/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;

    try {
      const result = await db.query(`
        SELECT r.*, u.display_name, u.avatar_url
        FROM rsvps r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.game_id = $1 AND r.user_id = $2
      `, [id, request.user.id]);

      return result.rows[0] || null;
    } catch (err) {
      console.error('Get my RSVP error:', err);
      return reply.status(500).send({ error: 'Failed to get RSVP' });
    }
  });
}
