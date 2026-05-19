import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());

// Servir arquivos estáticos do diretório dist/web
app.use(express.static(path.join(__dirname, 'dist/web'), {
  maxAge: '1d',
  etag: false
}));

// Fallback para index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/web/index.html'), (err) => {
    if (err) {
      console.error('Error serving file:', err);
      res.status(404).send('Not Found');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
