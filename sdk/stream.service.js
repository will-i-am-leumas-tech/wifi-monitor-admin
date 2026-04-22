const { WebSocketServer } = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/api/stream' });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ event: 'connected', data: { ok: true } }));

    ws.on('error', console.error);
    
    // Optionally handle messages from client here if needed
    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message);
        console.log('WS message received:', payload);
      } catch (err) {
        // Ignore non-json
      }
    });
  });

  console.log('WebSocket stream initialized');
}

function broadcast(event, data) {
  if (!wss) return;
  
  const payload = JSON.stringify({ event, data });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  });
}

// Keep the old function for backward compatibility or easy migration
function attachStream(req, res) {
  res.status(400).send('Please use WebSocket for streaming updates at /api/stream');
}

module.exports = {
  initWebSocket,
  attachStream,
  broadcast
};
