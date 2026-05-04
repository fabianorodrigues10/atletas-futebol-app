import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir arquivos estáticos do diretório dist/web
app.use(express.static(path.join(__dirname, '..', 'dist/web')));

// Fallback para index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist/web/index.html'));
});

export default app;
