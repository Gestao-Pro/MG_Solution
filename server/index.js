import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega primeiro a .env da raiz e depois a .env do servidor (prioridade para server/.env)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Importa o app somente após carregar as variáveis de ambiente
const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 4001;
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;