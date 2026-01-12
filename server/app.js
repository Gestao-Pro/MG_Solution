import express from 'express';

const app = express();

// Health check endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server is up!' });
});

// All other requests will be 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

export default app;