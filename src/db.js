const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'produtos.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    marca TEXT NOT NULL,

    porcao_qtd TEXT,
    porcao_medida_caseira TEXT,
    porcoes_embalagem TEXT,

    alerta_acucar INTEGER DEFAULT 0,
    alerta_gordura_saturada INTEGER DEFAULT 0,
    alerta_sodio INTEGER DEFAULT 0,

    valor_energetico_kcal TEXT,
    valor_energetico_kj TEXT,
    carboidratos_g TEXT,
    proteinas_g TEXT,
    gorduras_totais_g TEXT,
    gorduras_saturadas_g TEXT,
    gorduras_trans_g TEXT,
    fibra_g TEXT,
    sodio_mg TEXT,

    vd_carboidratos TEXT,
    vd_proteinas TEXT,
    vd_gorduras_totais TEXT,
    vd_gorduras_saturadas TEXT,
    vd_fibra TEXT,
    vd_sodio TEXT,

    ingredientes TEXT,
    alergenicos TEXT,

    texto_bloco1 TEXT,
    texto_bloco2 TEXT,
    texto_bloco3 TEXT,
    texto_bloco4 TEXT,

    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
