const path = require('path');
const fs = require('fs');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const AUDIO_DIR = path.join(__dirname, '..', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Integracao com as vozes neurais do Microsoft Edge (o mesmo motor usado no
// recurso "Ler em voz alta" do navegador Edge/Windows), via o pacote
// open-source `msedge-tts`. Escolhido por ser realmente gratuito, sem limite
// de uso conhecido e sem exigir cadastro nem cartao de credito — diferente de
// Google Cloud TTS, Amazon Polly ou Azure Speech, que pedem uma conta com
// faturamento habilitado mesmo para ficar dentro da cota gratuita.
//
// Importante: esta e uma API NAO OFICIAL da Microsoft (engenharia reversa do
// recurso "Ler em voz alta"). Funciona bem para um app de pequena escala como
// este, mas pode parar de funcionar sem aviso previo se a Microsoft alterar o
// servico interno. Caso isso aconteca, defina EDGE_TTS_DISABLED=true para
// desativar sem precisar alterar codigo: a pagina publica cai de volta,
// automaticamente, para a sintese de voz do proprio navegador.
const VOZ_PADRAO = process.env.EDGE_TTS_VOICE || 'pt-BR-FranciscaNeural';

function ttsConfigurado() {
  return process.env.EDGE_TTS_DISABLED !== 'true';
}

function caminhoCache(produtoId, bloco) {
  return path.join(AUDIO_DIR, `${produtoId}-bloco${bloco}.mp3`);
}

// Evita gerar audio de novo quando o texto do bloco nao mudou desde a ultima
// geracao: reaproveita o arquivo em cache se ele for mais recente que a
// ultima atualizacao do produto.
function cacheValido(produtoId, bloco, atualizadoEm) {
  const arquivo = caminhoCache(produtoId, bloco);
  if (!fs.existsSync(arquivo)) return false;
  const mtimeCache = fs.statSync(arquivo).mtime;
  const dataAtualizacao = new Date(`${String(atualizadoEm).replace(' ', 'T')}Z`);
  return mtimeCache >= dataAtualizacao;
}

async function sintetizarEArmazenar(texto, produtoId, bloco) {
  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(VOZ_PADRAO, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(texto, { rate: '-5%' });
    const destino = caminhoCache(produtoId, bloco);

    await new Promise((resolve, reject) => {
      const gravador = fs.createWriteStream(destino);
      audioStream.pipe(gravador);
      audioStream.once('error', (err) => { gravador.destroy(); reject(err); });
      gravador.once('error', reject);
      gravador.once('close', resolve);
    });

    return destino;
  } finally {
    tts.close();
  }
}

function removerCacheDoProduto(produtoId) {
  [1, 2, 3, 4].forEach((bloco) => {
    const arquivo = caminhoCache(produtoId, bloco);
    if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
  });
}

module.exports = {
  ttsConfigurado,
  caminhoCache,
  cacheValido,
  sintetizarEArmazenar,
  removerCacheDoProduto,
};
