import app from './app.js';

const tryListen = (port, maxTries = 5) => {
  const server = app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && maxTries > 0) {
      const next = port + 1;
      console.warn(`Port ${port} in use, trying ${next}...`);
      tryListen(next, maxTries - 1);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
};

const PORT = Number(process.env.PORT) || 4001;
tryListen(PORT);