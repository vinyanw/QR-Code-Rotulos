const path = require('path');
const express = require('express');

const produtosRouter = require('./src/routes/produtos');
const db = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Painel administrativo
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Recursos compartilhados (css/imagens)
app.use('/shared', express.static(path.join(__dirname, 'public', 'shared')));

// API
app.use('/api', produtosRouter);

// Pagina publica do produto: /p/:id
// Serve sempre o mesmo HTML; o JS do cliente le o id da URL e busca os dados via /api/produtos/:id
app.get('/p/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'produto', 'index.html'));
});
app.use('/p', express.static(path.join(__dirname, 'public', 'produto')));

// Raiz redireciona para o painel admin
app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.use((req, res) => {
  res.status(404).send('Pagina nao encontrada.');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel admin:   http://localhost:${PORT}/admin`);
  console.log(`Banco de dados: ${path.join(__dirname, 'data', 'produtos.db')}`);
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
