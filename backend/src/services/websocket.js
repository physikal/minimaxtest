// WebSocket service
export function setupWebSocket(fastify) {
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
      console.log('WebSocket client connected');

      socket.on('message', (message) => {
        try {
          const data = JSON.parse(message);

          // Handle authentication
          if (data.type === 'auth') {
            try {
              const decoded = fastify.jwt.verify(data.token);
              socket.userId = decoded.id;
              socket.send(JSON.stringify({ type: 'authenticated' }));
            } catch (e) {
              socket.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
            }
          }
        } catch (err) {
          console.error('WebSocket message error:', err);
        }
      });

      socket.on('close', () => {
        console.log('WebSocket client disconnected');
      });

      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    });
  });
}

export function broadcastGameEvent(fastify, type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });

  fastify.websocketServer?.clients?.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}
