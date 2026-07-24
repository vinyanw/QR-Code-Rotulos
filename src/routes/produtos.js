const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const { db } = require('../db');
const { gerarNarrativas } = require('../narrativas');
const { ttsConfigurado, caminhoCache, cacheValido, sintetizarEArmazenar, removerCacheDoProduto } = require('../tts');

const router = express.Router();

const QRCODES_DIR = path.join(__dirname, '..', '..', 'qrcodes');
if (!fs.existsSync(QRCODES_DIR)) fs.mkdirSync(QRCODES_DIR, { recursive: true });

// URL base pública usada para montar o link embutido no QR Code.
// Em produção, defina PUBLIC_BASE_URL (ex: https://meusite.com).
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
    data_validade: (body.data_validade || '').trim(),
    lote: (body.lote || '').trim(),

    porcao_qtd: (body.porcao_qtd || '').trim(),
    porcao_medida_caseira: (body.porcao_medida_caseira || '').trim(),
    porcoes_embalagem: (body.porcoes_embalagem || '').trim(),

    alerta_acucar: toBoolInt(body.alerta_acucar),
    alerta_gordura_saturada: toBoolInt(body.alerta_gordura_saturada),
    alerta_sodio: toBoolInt(body.alerta_sodio),

    valor_energetico_kcal: (body.valor_energetico_kcal || '').trim(),
    carboidratos_g: (body.carboidratos_g || '').trim(),
    proteinas_g: (body.proteinas_g || '').trim(),
    gorduras_totais_g: (body.gorduras_totais_g || '').trim(),
    gorduras_saturadas_g: (body.gorduras_saturadas_g || '').trim(),
    gorduras_trans_g: (body.gorduras_trans_g || '').trim(),
    fibra_g: (body.fibra_g || '').trim(),
    sodio_mg: (body.sodio_mg || '').trim(),
    calcio_mg: (body.calcio_mg || '').trim(),

    vd_carboidratos: (body.vd_carboidratos || '').trim(),
    vd_proteinas: (body.vd_proteinas || '').trim(),
    vd_gorduras_totais: (body.vd_gorduras_totais || '').trim(),
    vd_gorduras_saturadas: (body.vd_gorduras_saturadas || '').trim(),
    vd_fibra: (body.vd_fibra || '').trim(),
    vd_sodio: (body.vd_sodio || '').trim(),
    vd_calcio: (body.vd_calcio || '').trim(),

    ingredientes: (body.ingredientes || '').trim(),
    alergenicos: (body.alergenicos || '').trim(),
    armazenamento: (body.armazenamento || '').trim(),
  };
}

// POST /api/narrativas -> gera sugestão dos 4 textos sem salvar nada
router.post('/narrativas', (req, res) => {
  const dados = normalizarPayload(req.body);
  const narrativas = gerarNarrativas(dados);
  res.json(narrativas);
});

// POST /api/produtos -> cria produto
router.post('/produtos', async (req, res) => {
  const dados = normalizarPayload(req.body);

  if (!dados.nome || !dados.marca) {
    return res.status(400).json({ erro: 'Os campos "nome" e "marca" são obrigatórios.' });
  }

  const sugestao = gerarNarrativas(dados);
  const id = uuidv4();

  try {
    await db.execute({
      sql: `
        INSERT INTO produtos (
          id, nome, marca, data_validade, lote,
          porcao_qtd, porcao_medida_caseira, porcoes_embalagem,
          alerta_acucar, alerta_gordura_saturada, alerta_sodio,
          valor_energetico_kcal,
          carboidratos_g, proteinas_g, gorduras_totais_g, gorduras_saturadas_g, gorduras_trans_g, fibra_g, sodio_mg, calcio_mg,
          vd_carboidratos, vd_proteinas, vd_gorduras_totais, vd_gorduras_saturadas, vd_fibra, vd_sodio, vd_calcio,
          ingredientes, alergenicos, armazenamento,
          texto_bloco1, texto_bloco2, texto_bloco3, texto_bloco4
        ) VALUES (
          @id, @nome, @marca, @data_validade, @lote,
          @porcao_qtd, @porcao_medida_caseira, @porcoes_embalagem,
          @alerta_acucar, @alerta_gordura_saturada, @alerta_sodio,
          @valor_energetico_kcal,
          @carboidratos_g, @proteinas_g, @gorduras_totais_g, @gorduras_saturadas_g, @gorduras_trans_g, @fibra_g, @sodio_mg, @calcio_mg,
          @vd_carboidratos, @vd_proteinas, @vd_gorduras_totais, @vd_gorduras_saturadas, @vd_fibra, @vd_sodio, @vd_calcio,
          @ingredientes, @alergenicos, @armazenamento,
          @texto_bloco1, @texto_bloco2, @texto_bloco3, @texto_bloco4
        )
      `,
      args: {
        id,
        ...dados,
        texto_bloco1: req.body.texto_bloco1 || sugestao.texto_bloco1,
        texto_bloco2: req.body.texto_bloco2 || sugestao.texto_bloco2,
        texto_bloco3: req.body.texto_bloco3 || sugestao.texto_bloco3,
        texto_bloco4: req.body.texto_bloco4 || sugestao.texto_bloco4,
      },
    });

    const { rows } = await db.execute({ sql: 'SELECT * FROM produtos WHERE id = @id', args: { id } });
    const urlPublica = `${getBaseUrl(req)}/p/${id}`;

    res.status(201).json({ produto: rows[0], urlPublica });
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao salvar produto.', detalhe: err.message });
  }
});

// PUT /api/produtos/:id -> atualiza produto existente
router.put('/produtos/:id', async (req, res) => {
  const { rows: existentes } = await db.execute({ sql: 'SELECT id FROM produtos WHERE id = @id', args: { id: req.params.id } });
  if (existentes.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const dados = normalizarPayload(req.body);
  if (!dados.nome || !dados.marca) {
    return res.status(400).json({ erro: 'Os campos "nome" e "marca" são obrigatórios.' });
  }

  const sugestao = gerarNarrativas(dados);

  try {
    await db.execute({
      sql: `
        UPDATE produtos SET
          nome = @nome, marca = @marca, data_validade = @data_validade, lote = @lote,
          porcao_qtd = @porcao_qtd, porcao_medida_caseira = @porcao_medida_caseira, porcoes_embalagem = @porcoes_embalagem,
          alerta_acucar = @alerta_acucar, alerta_gordura_saturada = @alerta_gordura_saturada, alerta_sodio = @alerta_sodio,
          valor_energetico_kcal = @valor_energetico_kcal,
          carboidratos_g = @carboidratos_g, proteinas_g = @proteinas_g, gorduras_totais_g = @gorduras_totais_g,
          gorduras_saturadas_g = @gorduras_saturadas_g, gorduras_trans_g = @gorduras_trans_g, fibra_g = @fibra_g, sodio_mg = @sodio_mg, calcio_mg = @calcio_mg,
          vd_carboidratos = @vd_carboidratos, vd_proteinas = @vd_proteinas, vd_gorduras_totais = @vd_gorduras_totais,
          vd_gorduras_saturadas = @vd_gorduras_saturadas, vd_fibra = @vd_fibra, vd_sodio = @vd_sodio, vd_calcio = @vd_calcio,
          ingredientes = @ingredientes, alergenicos = @alergenicos, armazenamento = @armazenamento,
          texto_bloco1 = @texto_bloco1, texto_bloco2 = @texto_bloco2, texto_bloco3 = @texto_bloco3, texto_bloco4 = @texto_bloco4,
          updated_at = datetime('now')
        WHERE id = @id
      `,
      args: {
        id: req.params.id,
        ...dados,
        texto_bloco1: req.body.texto_bloco1 || sugestao.texto_bloco1,
        texto_bloco2: req.body.texto_bloco2 || sugestao.texto_bloco2,
        texto_bloco3: req.body.texto_bloco3 || sugestao.texto_bloco3,
        texto_bloco4: req.body.texto_bloco4 || sugestao.texto_bloco4,
      },
    });

    const { rows } = await db.execute({ sql: 'SELECT * FROM produtos WHERE id = @id', args: { id: req.params.id } });
    const produto = rows[0];
    const urlPublica = `${getBaseUrl(req)}/p/${produto.id}`;

    res.json({ produto, urlPublica });
  } catch (err) {
    res.status(500).json({ erro: 'Falha ao atualizar produto.', detalhe: err.message });
  }
});

// GET /api/produtos -> lista (para o painel admin)
router.get('/produtos', async (req, res) => {
  const { rows } = await db.execute('SELECT id, nome, marca, created_at FROM produtos ORDER BY created_at DESC');
  res.json(rows);
});

// GET /api/produtos/:id -> dados de um produto (consumido pela página pública)
router.get('/produtos/:id', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT * FROM produtos WHERE id = @id', args: { id: req.params.id } });
  if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(rows[0]);
});

// DELETE /api/produtos/:id
router.delete('/produtos/:id', async (req, res) => {
  const info = await db.execute({ sql: 'DELETE FROM produtos WHERE id = @id', args: { id: req.params.id } });
  if (Number(info.rowsAffected) === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  const qrPath = path.join(QRCODES_DIR, `${req.params.id}.png`);
  if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);
  removerCacheDoProduto(req.params.id);
  res.status(204).end();
});

// GET /api/produtos/:id/qrcode -> gera (se preciso) e retorna o PNG do QR Code
router.get('/produtos/:id/qrcode', async (req, res) => {
  const { rows } = await db.execute({ sql: 'SELECT id FROM produtos WHERE id = @id', args: { id: req.params.id } });
  if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  const produto = rows[0];

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

// GET /api/produtos/:id/audio/:bloco -> áudio (mp3) com voz natural (vozes
// neurais do Microsoft Edge) para o bloco de texto informado (1 a 4). Se o
// TTS em nuvem estiver desativado (EDGE_TTS_DISABLED=true) ou falhar,
// responde com erro para que a página pública caia de volta na síntese de
// voz do navegador (Web Speech API), sem quebrar a leitura por áudio.
router.get('/produtos/:id/audio/:bloco', async (req, res) => {
  const bloco = Number(req.params.bloco);
  if (![1, 2, 3, 4].includes(bloco)) {
    return res.status(400).json({ erro: 'Bloco inválido. Use um número de 1 a 4.' });
  }

  if (!ttsConfigurado()) {
    return res.status(503).json({ erro: 'Áudio em nuvem não configurado neste servidor.' });
  }

  const { rows } = await db.execute({
    sql: `
      SELECT id, updated_at, texto_bloco1, texto_bloco2, texto_bloco3, texto_bloco4
      FROM produtos WHERE id = @id
    `,
    args: { id: req.params.id },
  });
  if (rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  const produto = rows[0];

  const texto = produto[`texto_bloco${bloco}`];
  if (!texto || !texto.trim()) {
    return res.status(404).json({ erro: 'Este bloco não possui texto cadastrado.' });
  }

  try {
    if (!cacheValido(produto.id, bloco, produto.updated_at)) {
      await sintetizarEArmazenar(texto, produto.id, bloco);
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(caminhoCache(produto.id, bloco));
  } catch (err) {
    res.status(502).json({ erro: 'Falha ao gerar áudio em nuvem.', detalhe: err.message });
  }
});

module.exports = router;
