import http from 'http';

const server = http.createServer((req, res) => {
  if (req.url === '/status' && req.method === 'GET') {
    // Simulate some processing time
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
        })
      );
    }, Math.random() * 50); // Random delay 0-50ms to simulate real-world variance
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Status endpoint: http://localhost:${PORT}/status`);
});
