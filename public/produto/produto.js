(() => {
  const elCarregando = document.getElementById('carregando');
  const elErro = document.getElementById('erro');
  const elConteudo = document.getElementById('conteudo');

  function obterIdDaUrl() {
    // Suporta /p/:id
    const partes = window.location.pathname.split('/').filter(Boolean);
    const idx = partes.indexOf('p');
    if (idx !== -1 && partes[idx + 1]) return partes[idx + 1];
    // Fallback: ?id=
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async function buscarProduto(id) {
    const resposta = await fetch(`/api/produtos/${id}`);
    if (!resposta.ok) throw new Error('Produto nao encontrado');
    return resposta.json();
  }

  function montarLupas(produto) {
    const container = document.getElementById('lista-lupas');
    const secao = document.getElementById('secao-lupas');
    const lupas = [];
    if (produto.alerta_acucar) lupas.push('Alto em Acucar Adicionado');
    if (produto.alerta_gordura_saturada) lupas.push('Alto em Gordura Saturada');
    if (produto.alerta_sodio) lupas.push('Alto em Sodio');

    if (lupas.length === 0) {
      container.innerHTML = '';
      const semAlerta = document.createElement('span');
      semAlerta.className = 'bg-emerald-100 text-emerald-800 font-semibold px-4 py-2 rounded-full border border-emerald-300';
      semAlerta.textContent = 'Sem alertas de excesso';
      container.appendChild(semAlerta);
      secao.classList.remove('hidden');
      return;
    }

    container.innerHTML = '';
    lupas.forEach((texto) => {
      const selo = document.createElement('span');
      selo.className = 'bg-black text-white font-bold px-4 py-2 rounded-full border-2 border-black';
      selo.setAttribute('role', 'img');
      selo.setAttribute('aria-label', `Selo de alerta: ${texto}`);
      selo.textContent = texto.toUpperCase();
      container.appendChild(selo);
    });
    secao.classList.remove('hidden');
  }

  function criarLinhaDetalhe(rotulo, valor, vd) {
    if (!valor) return '';
    return `<li>${rotulo}: <strong>${valor}</strong>${vd ? ` (${vd}% do valor diario)` : ''}</li>`;
  }

  function formatarData(dataIso) {
    const partes = String(dataIso).split('-');
    if (partes.length !== 3) return dataIso;
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  function montarBlocos(produto) {
    const blocos = [
      {
        titulo: 'Bloco 1 de 4: Resumo e alertas',
        texto: produto.texto_bloco1,
        detalhesHtml: produto.data_validade
          ? `<ul class="list-disc pl-6 space-y-1"><li>Validade: <strong>${formatarData(produto.data_validade)}</strong></li></ul>`
          : '',
      },
      {
        titulo: 'Bloco 2 de 4: Porcao e rendimento',
        texto: produto.texto_bloco2,
        detalhesHtml: `<ul class="list-disc pl-6 space-y-1">
          ${produto.porcao_qtd ? `<li>Tamanho da porcao: <strong>${produto.porcao_qtd}</strong></li>` : ''}
          ${produto.porcao_medida_caseira ? `<li>Medida caseira: <strong>${produto.porcao_medida_caseira}</strong></li>` : ''}
          ${produto.porcoes_embalagem ? `<li>Porcoes por embalagem: <strong>${produto.porcoes_embalagem}</strong></li>` : ''}
        </ul>`,
      },
      {
        titulo: 'Bloco 3 de 4: Tabela nutricional',
        texto: produto.texto_bloco3,
        detalhesHtml: `<ul class="list-disc pl-6 space-y-1">
          ${produto.valor_energetico_kcal ? `<li>Valor energetico: <strong>${produto.valor_energetico_kcal} kcal</strong>${produto.valor_energetico_kj ? ` / ${produto.valor_energetico_kj} kJ` : ''}</li>` : ''}
          ${criarLinhaDetalhe('Carboidratos', produto.carboidratos_g && `${produto.carboidratos_g} g`, produto.vd_carboidratos)}
          ${criarLinhaDetalhe('Proteinas', produto.proteinas_g && `${produto.proteinas_g} g`, produto.vd_proteinas)}
          ${criarLinhaDetalhe('Gorduras totais', produto.gorduras_totais_g && `${produto.gorduras_totais_g} g`, produto.vd_gorduras_totais)}
          ${criarLinhaDetalhe('Gorduras saturadas', produto.gorduras_saturadas_g && `${produto.gorduras_saturadas_g} g`, produto.vd_gorduras_saturadas)}
          ${produto.gorduras_trans_g ? `<li>Gorduras trans: <strong>${produto.gorduras_trans_g} g</strong></li>` : ''}
          ${criarLinhaDetalhe('Fibra alimentar', produto.fibra_g && `${produto.fibra_g} g`, produto.vd_fibra)}
          ${criarLinhaDetalhe('Sodio', produto.sodio_mg && `${produto.sodio_mg} mg`, produto.vd_sodio)}
        </ul>`,
      },
      {
        titulo: 'Bloco 4 de 4: Ingredientes e alergenicos',
        texto: produto.texto_bloco4,
        detalhesHtml: `
          ${produto.ingredientes ? `<p class="mb-2"><strong>Ingredientes:</strong> ${produto.ingredientes}</p>` : ''}
          ${produto.alergenicos ? `<p><strong>Alergenicos:</strong> ${produto.alergenicos}</p>` : ''}
        `,
      },
    ];
    return blocos;
  }

  function montarNavegacaoBlocos(blocos, aoSelecionar) {
    const lista = document.getElementById('lista-blocos-nav');
    lista.innerHTML = '';
    blocos.forEach((bloco, indice) => {
      const li = document.createElement('li');
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.textContent = `Bloco ${indice + 1}`;
      botao.setAttribute('aria-label', bloco.titulo);
      botao.dataset.indice = String(indice);
      botao.className = 'nav-bloco border border-slate-300 rounded-full px-4 py-2 font-semibold focus:ring-4 focus:ring-emerald-300';
      botao.addEventListener('click', () => aoSelecionar(indice));
      li.appendChild(botao);
      lista.appendChild(li);
    });
  }

  function atualizarEstadoNavegacao(indiceAtual) {
    document.querySelectorAll('.nav-bloco').forEach((botao) => {
      const ativo = Number(botao.dataset.indice) === indiceAtual;
      botao.setAttribute('aria-current', ativo ? 'true' : 'false');
      botao.classList.toggle('bg-emerald-700', ativo);
      botao.classList.toggle('text-white', ativo);
      botao.classList.toggle('border-emerald-700', ativo);
    });
  }

  function iniciar(produto) {
    document.title = `${produto.nome} - Informacoes acessiveis do produto`;
    document.getElementById('titulo-produto').textContent = produto.nome;
    document.getElementById('subtitulo-marca').textContent = `Marca: ${produto.marca}`;
    montarLupas(produto);

    const blocos = montarBlocos(produto);
    let indiceAtual = 0;

    const elIndicador = document.getElementById('indicador-bloco');
    const elTituloBloco = document.getElementById('titulo-bloco-atual');
    const elTextoBloco = document.getElementById('texto-bloco-atual');
    const elDetalhesBloco = document.getElementById('detalhes-bloco-atual');
    const elBlocoConteudo = document.getElementById('bloco-conteudo');
    const btnTocarPausar = document.getElementById('btn-tocar-pausar');
    const btnRepetir = document.getElementById('btn-repetir');
    const elAvisoAudio = document.getElementById('aviso-audio');
    const audioEl = document.getElementById('audio-bloco');

    const sintese = window.speechSynthesis;
    let estaFalando = false;
    let estaPausado = false;
    let estaCarregando = false;
    // 'cloud'  -> tocando audio com voz natural gerada em nuvem (Google TTS)
    // 'browser'-> tocando com a sintese de voz do proprio navegador (fallback)
    let modoAtivo = null;

    function mostrarAvisoAudio(texto) {
      elAvisoAudio.textContent = texto;
      elAvisoAudio.classList.remove('hidden');
    }

    function esconderAvisoAudio() {
      elAvisoAudio.classList.add('hidden');
    }

    function pararFala() {
      if (sintese) sintese.cancel();
      if (!audioEl.paused || audioEl.currentTime > 0) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
      modoAtivo = null;
      estaFalando = false;
      estaPausado = false;
      estaCarregando = false;
      atualizarBotaoTocarPausar();
    }

    function atualizarBotaoTocarPausar() {
      if (estaCarregando) {
        btnTocarPausar.innerHTML = 'Carregando audio...';
        btnTocarPausar.setAttribute('aria-label', 'Carregando audio deste bloco');
      } else if (estaFalando && !estaPausado) {
        btnTocarPausar.innerHTML = '&#10073;&#10073; Pausar';
        btnTocarPausar.setAttribute('aria-label', 'Pausar audio deste bloco');
      } else {
        btnTocarPausar.innerHTML = '&#9654; Ouvir';
        btnTocarPausar.setAttribute('aria-label', 'Tocar audio deste bloco');
      }
    }

    // Toca o audio com voz natural gerado em nuvem (Google Cloud TTS) para o
    // bloco atual. Retorna false se o audio em nuvem nao estiver disponivel
    // (nao configurado no servidor, sem internet, etc.), para permitir cair
    // no fallback do navegador sem incomodar o usuario com um erro visivel.
    async function tocarAudioNuvem() {
      try {
        const resposta = await fetch(`/api/produtos/${produto.id}/audio/${indiceAtual + 1}`);
        if (!resposta.ok) return false;
        const blob = await resposta.blob();
        const url = URL.createObjectURL(blob);
        audioEl.src = url;
        modoAtivo = 'cloud';
        await audioEl.play();
        return true;
      } catch (err) {
        return false;
      }
    }

    audioEl.addEventListener('play', () => {
      if (modoAtivo !== 'cloud') return;
      estaCarregando = false;
      estaFalando = true;
      estaPausado = false;
      atualizarBotaoTocarPausar();
    });
    audioEl.addEventListener('pause', () => {
      if (modoAtivo !== 'cloud') return;
      if (!audioEl.ended) estaPausado = true;
      atualizarBotaoTocarPausar();
    });
    audioEl.addEventListener('ended', () => {
      if (modoAtivo !== 'cloud') return;
      estaFalando = false;
      estaPausado = false;
      atualizarBotaoTocarPausar();
    });

    // Em varios navegadores (sobretudo Chrome/Android) a lista de vozes carrega
    // de forma assincrona: chamar speak() antes disso pode nao emitir som algum,
    // sem gerar erro. Aguardamos "voiceschanged" (com um limite de tempo) antes
    // de falar pela primeira vez.
    function vozesProntas() {
      if (sintese.getVoices().length > 0) return Promise.resolve();
      return new Promise((resolve) => {
        const finalizar = () => resolve();
        sintese.addEventListener('voiceschanged', finalizar, { once: true });
        setTimeout(finalizar, 1000);
      });
    }

    async function falarComVozDoNavegador() {
      if (!sintese) {
        mostrarAvisoAudio('Este navegador nao oferece leitura em voz alta (nem em nuvem, nem local). Isso e comum ao abrir o link direto pelo aplicativo da camera ou por redes sociais. Tente abrir o link no navegador padrao do celular (Chrome ou Safari). O texto completo de cada bloco continua disponivel abaixo para leitura.');
        estaCarregando = false;
        atualizarBotaoTocarPausar();
        return;
      }
      await vozesProntas();
      sintese.cancel();
      modoAtivo = 'browser';
      const bloco = blocos[indiceAtual];
      const utterance = new SpeechSynthesisUtterance(bloco.texto || 'Sem informações cadastradas para este bloco.');
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      const vozPt = sintese.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('pt'));
      if (vozPt) utterance.voice = vozPt;
      else if (sintese.getVoices().length === 0) {
        mostrarAvisoAudio('Nenhuma voz de sintese foi encontrada neste dispositivo/navegador. Ative um mecanismo de sintese de voz nas configuracoes do celular ou abra este link em outro navegador para ouvir o audio.');
      }
      utterance.onstart = () => {
        estaCarregando = false;
        estaFalando = true;
        estaPausado = false;
        atualizarBotaoTocarPausar();
      };
      utterance.onend = () => {
        estaFalando = false;
        estaPausado = false;
        atualizarBotaoTocarPausar();
      };
      utterance.onerror = () => {
        estaCarregando = false;
        estaFalando = false;
        estaPausado = false;
        atualizarBotaoTocarPausar();
        mostrarAvisoAudio('Nao foi possivel reproduzir o audio neste navegador. Tente abrir o link no navegador padrao do celular (Chrome ou Safari).');
      };
      sintese.speak(utterance);
    }

    async function falarBlocoAtual() {
      esconderAvisoAudio();
      pararFala();
      estaCarregando = true;
      atualizarBotaoTocarPausar();
      const tocouEmNuvem = await tocarAudioNuvem();
      if (!tocouEmNuvem) {
        await falarComVozDoNavegador();
      }
    }

    function renderizarBloco(moverFoco) {
      const bloco = blocos[indiceAtual];
      elIndicador.textContent = bloco.titulo;
      elTituloBloco.textContent = bloco.titulo;
      elTextoBloco.textContent = bloco.texto || 'Sem informações cadastradas para este bloco.';
      elDetalhesBloco.innerHTML = bloco.detalhesHtml || '';
      atualizarEstadoNavegacao(indiceAtual);
      pararFala();
      if (moverFoco) elBlocoConteudo.focus();
    }

    function irParaBloco(novoIndice, moverFoco = true) {
      indiceAtual = Math.max(0, Math.min(blocos.length - 1, novoIndice));
      renderizarBloco(moverFoco);
    }

    montarNavegacaoBlocos(blocos, (indice) => irParaBloco(indice));

    document.getElementById('btn-anterior').addEventListener('click', () => irParaBloco(indiceAtual - 1));
    document.getElementById('btn-proximo').addEventListener('click', () => irParaBloco(indiceAtual + 1));
    document.getElementById('btn-repetir').addEventListener('click', () => falarBlocoAtual());

    btnTocarPausar.addEventListener('click', () => {
      if (estaCarregando) return;
      if (estaFalando && !estaPausado) {
        if (modoAtivo === 'cloud') audioEl.pause();
        else if (sintese) sintese.pause();
        estaPausado = true;
        atualizarBotaoTocarPausar();
      } else if (estaPausado) {
        if (modoAtivo === 'cloud') audioEl.play();
        else if (sintese) sintese.resume();
        estaPausado = false;
        atualizarBotaoTocarPausar();
      } else {
        falarBlocoAtual();
      }
    });

    document.addEventListener('keydown', (evento) => {
      const alvoEhCampoDeTexto = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      if (alvoEhCampoDeTexto) return;

      if (evento.key === 'ArrowRight') { evento.preventDefault(); irParaBloco(indiceAtual + 1); }
      else if (evento.key === 'ArrowLeft') { evento.preventDefault(); irParaBloco(indiceAtual - 1); }
      else if (evento.code === 'Space') { evento.preventDefault(); btnTocarPausar.click(); }
      else if (evento.key.toLowerCase() === 'r') { evento.preventDefault(); falarBlocoAtual(); }
    });

    renderizarBloco(false);
  }

  async function main() {
    const id = obterIdDaUrl();
    if (!id) {
      elCarregando.classList.add('hidden');
      elErro.classList.remove('hidden');
      return;
    }
    try {
      const produto = await buscarProduto(id);
      elCarregando.classList.add('hidden');
      elConteudo.classList.remove('hidden');
      iniciar(produto);
    } catch (err) {
      elCarregando.classList.add('hidden');
      elErro.classList.remove('hidden');
    }
  }

  main();
})();
