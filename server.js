const express = require('express');
const path = require('node:path');
const apiRouter = require('./router');
const { startCollector, stopCollector } = require('./sdk/collector.service');
const { PORT } = require('./sdk/constants');
const { initWebSocket } = require('./sdk/stream.service');

const app = express();

app.use(express.json());
app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`WiFi Traffic Monitor listening on http://localhost:${PORT}`);
  initWebSocket(server);
  startCollector();
});

function shutdown() {
  stopCollector();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
