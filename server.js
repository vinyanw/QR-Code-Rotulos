const path = require('path');
const express = require('express');

const produtosRouter = require('./src/routes/produtos');
const { pronto } = require('./src/db');

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
// Serve primeiro os arquivos estaticos (ex.: /p/produto.js), senao a rota
// coringa abaixo intercepta esses pedidos como se fossem um :id de produto.
app.use('/p', express.static(path.join(__dirname, 'public', 'produto')));

// Serve sempre o mesmo HTML; o JS do cliente le o id da URL e busca os dados via /api/produtos/:id
app.get('/p/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'produto', 'index.html'));
});

// Raiz redireciona para o painel admin
app.get('/', (req, res) => {
  res.redirect('/admin');
});

app.use((req, res) => {
  res.status(404).send('Pagina nao encontrada.');
});

pronto
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
      console.log(`Painel admin:   http://localhost:${PORT}/admin`);
      console.log(`Banco de dados: ${process.env.TURSO_DATABASE_URL || path.join(__dirname, 'data', 'produtos.db')}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar o banco de dados:', err);
    process.exit(1);
  });

process.on('SIGINT', () => {
  process.exit(0);
});
