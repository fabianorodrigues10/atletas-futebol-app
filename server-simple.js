const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta dist/web
app.use(express.static(path.join(__dirname, 'dist/web')));

// Rota padrão
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/web/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
