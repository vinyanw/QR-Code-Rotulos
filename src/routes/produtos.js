const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const db = require('../db');
const { gerarNarrativas } = require('../narrativas');

const router = express.Router();

const QRCODES_DIR = path.join(__dirname, '..', '..', 'qrcodes');
if (!fs.existsSync(QRCODES_DIR)) fs.mkdirSync(QRCODES_DIR, { recursive: true });

// URL base publica usada para montar o link embutido no QR Code.
// Em producao, defina PUBLIC_BASE_URL (ex: https://meusite.com).
function getBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function toBoolInt(v) {
  return v === true || v === 'true' || v === 'on' || v === '1' || v === 1 ? 1 : 0;
}

function normalizarPayload(body) {
  return {
    nome: (body.nome || '').trim(),
    marca: (body.marca || '').trim(),

    porcao_qtd: (body.porcao_qtd || '').trim(),
    porcao_medida_caseira: (body.porcao_medida_caseira || '').trim(),
    porcoes_embalagem: (body.porcoes_embalagem || '').trim(),

    alerta_acucar: toBoolInt(body.alerta_acucar),
    alerta_gordura_saturada: toBoolInt(body.alerta_gordura_saturada),
    alerta_sodio: toBoolInt(body.alerta_sodio),

    valor_energetico_kcal: (body.valor_energetico_kcal || '').trim(),
    valor_energetico_kj: (body.valor_energetico_kj || '').trim(),
    carboidratos_g: (body.carboidratos_g || '').trim(),
    proteinas_g: (body.proteinas_g || '').trim(),
    gorduras_totais_g: (body.gorduras_totais_g || '').trim(),
    gorduras_saturadas_g: (body.gorduras_saturadas_g || '').trim(),
    gorduras_trans_g: (body.gorduras_trans_g || '').trim(),
    fibra_g: (body.fibra_g || '').trim(),
    sodio_mg: (body.sodio_mg || '').trim(),

    vd_carboidratos: (body.vd_carboidratos || '').trim(),
    vd_proteinas: (body.vd_proteinas || '').trim(),
    vd_gorduras_totais: (body.vd_gorduras_totais || '').trim(),
    vd_gorduras_saturadas: (body.vd_gorduras_saturadas || '').trim(),
    vd_fibra: (body.vd_fibra || '').trim(),
    vd_sodio: (body.vd_sodio || '').trim(),

    ingredientes: (body.ingredientes || '').trim(),
    alergenicos: (body.alergenicos || '').trim(),
  };
}

// POST /api/narrativas -> gera sugestao dos 4 textos sem salvar nada
router.post('/narrativas', (req, res) => {
  const dados = normalizarPayload(req.body);
  const narrativas = gerarNarrativas(dados);
  res.json(narrativas);
});

// POST /api/produtos -> cria produto
router.post('/produtos', (req, res) => {
  const dados = normalizarPayload(req.body);

  if (!dados.nome || !dados.marca) {
    return res.status(400).json({ erro: 'Os campos "nome" e "marca" sao obrigatorios.' });
  }

  const sugestao = gerarNarrativas(dados);
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO produtos (
      id, nome, marca,
      porcao_qtd, porcao_medida_caseira, porcoes_embalagem,
      alerta_acucar, alerta_gordura_saturada, alerta_sodio,
      valor_energetico_kcal, valor_energetico_kj,
      carboidratos_g, proteinas_g, gorduras_totais_g, gorduras_saturadas_g, gorduras_trans_g, fibra_g, sodio_mg,
      vd_carboidratos, vd_proteinas, vd_gorduras_totais, vd_gorduras_saturadas, vd_fibra, vd_sodio,
      ingredientes, alergenicos,
      texto_bloco1, texto_bloco2, texto_bloco3, texto_bloco4
    ) VALUES (
      @id, @nome, @marca,
      @porcao_qtd, @porcao_medida_caseira, @porcoes_embalagem,
      @alerta_acucar, @alerta_gordura_saturada, @alerta_sodio,
      @valor_energetico_kcal, @valor_energetico_kj,
      @carboidratos_g, @proteinas_g, @gorduras_totais_g, @gorduras_saturadas_g, @gorduras_trans_g, @fibra_g, @sodio_mg,
      @vd_carboidratos, @vd_proteinas, @vd_gorduras_totais, @vd_gorduras_saturadas, @vd_fibra, @vd_sodio,
      @ingredientes, @alergenicos,
      @texto_bloco1, @texto_bloco2, @texto_bloco3, @texto_bloco4
    )
  `);

  stmt.run({
    id,
    ...dados,
    texto_bloco1: req.body.texto_bloco1 || sugestao.texto_bloco1,
    texto_bloco2: req.body.texto_bloco2 || sugestao.texto_bloco2,
    texto_bloco3: req.body.texto_bloco3 || sugestao.texto_bloco3,
    texto_bloco4: req.body.texto_bloco4 || sugestao.texto_bloco4,
  });

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  const urlPublica = `${getBaseUrl(req)}/p/${id}`;

  res.status(201).json({ produto, urlPublica });
});

// GET /api/produtos -> lista (para o painel admin)
router.get('/produtos', (req, res) => {
  const produtos = db.prepare('SELECT id, nome, marca, created_at FROM produtos ORDER BY created_at DESC').all();
  res.json(produtos);
});

// GET /api/produtos/:id -> dados de um produto (consumido pela pagina publica)
router.get('/produtos/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto nao encontrado.' });
  res.json(produto);
});

// DELETE /api/produtos/:id
router.delete('/produtos/:id', (req, res) => {
  const info = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Produto nao encontrado.' });
  const qrPath = path.join(QRCODES_DIR, `${req.params.id}.png`);
  if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
  res.status(204).end();
});

// GET /api/produtos/:id/qrcode -> gera (se preciso) e retorna o PNG do QR Code
router.get('/produtos/:id/qrcode', async (req, res) => {
  const produto = db.prepare('SELECT id FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto nao encontrado.' });

  const urlPublica = `${getBaseUrl(req)}/p/${produto.id}`;
  const arquivo = path.join(QRCODES_DIR, `${produto.id}.png`);

  try {
    await QRCode.toFile(arquivo, urlPublica, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
    });
    res.setHeader('Content-Disposition', `inline; filename="qrcode-${produto.id}.png"`);
    res.sendFile(arquivo);
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao gerar QR Code.', detalhe: err.message });
  }
});

module.exports = router;
