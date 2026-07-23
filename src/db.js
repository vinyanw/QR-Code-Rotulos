const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Usa o Turso (libSQL) para persistir os dados de verdade em producao: no
// plano gratuito do Render, o sistema de arquivos local e apagado sempre que
// o servico "dorme" e acorda de novo (ou a cada novo deploy), entao gravar
// num arquivo SQLite local no proprio servidor nao sobrevive -- era essa a
// causa dos produtos cadastrados sumirem.
//
// Configure as variaveis de ambiente TURSO_DATABASE_URL e TURSO_AUTH_TOKEN
// (crie um banco gratuito, sem cartao de credito, em https://turso.tech) para
// persistir de verdade. Sem essas variaveis definidas, cai para um arquivo
// SQLite local -- otimo para rodar o projeto na sua maquina durante o
// desenvolvimento, mas NAO deve ser usado assim em producao no Render.
const url = process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'produtos.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient(authToken ? { url, authToken } : { url });

const pronto = db.execute(`
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    marca TEXT NOT NULL,
    data_validade TEXT,

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

// CREATE TABLE IF NOT EXISTS nao adiciona colunas a bancos ja criados antes
// dela existir, entao migramos manualmente quem ja tinha a tabela sem a
// coluna nova (ignora o erro se a coluna ja existir).
const prontoComMigracoes = pronto.then(() =>
  db.execute('ALTER TABLE produtos ADD COLUMN data_validade TEXT').catch(() => {})
);

module.exports = { db, pronto: prontoComMigracoes };
