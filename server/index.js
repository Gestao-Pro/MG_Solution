import 'dotenv/config';
import http from 'http';
import app from './app.js';

const PORT = process.env.PORT || 4001;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;