import { createServer } from 'node:http';

const PORT = process.env.PORT ?? 4000;

const server = createServer((_req, res) => {
  if (_req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[worker] Health endpoint listening on port ${PORT}`);
  console.log(`[worker] Ready to process jobs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[worker] SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});
