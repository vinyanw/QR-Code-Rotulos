(() => {
  const NUTRIENTES = [
    { chave: 'carboidratos_g', vd: 'vd_carboidratos', label: 'Carboidratos (g)' },
    { chave: 'proteinas_g', vd: 'vd_proteinas', label: 'Proteinas (g)' },
    { chave: 'gorduras_totais_g', vd: 'vd_gorduras_totais', label: 'Gorduras totais (g)' },
    { chave: 'gorduras_saturadas_g', vd: 'vd_gorduras_saturadas', label: 'Gorduras saturadas (g)' },
    { chave: 'gorduras_trans_g', vd: null, label: 'Gorduras trans (g)' },
    { chave: 'fibra_g', vd: 'vd_fibra', label: 'Fibra alimentar (g)' },
    { chave: 'sodio_mg', vd: 'vd_sodio', label: 'Sodio (mg)' },
  ];

  const tabela = document.getElementById('tabela-nutrientes');

  NUTRIENTES.forEach(({ chave, vd, label }) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100';

    const tdLabel = document.createElement('th');
    tdLabel.scope = 'row';
    tdLabel.className = 'py-2 pr-2 font-medium text-left';
    tdLabel.textContent = label;

    const tdQtd = document.createElement('td');
    tdQtd.className = 'py-2 pr-2';
    const inputQtd = document.createElement('input');
    inputQtd.type = 'text';
    inputQtd.id = chave;
    inputQtd.name = chave;
    inputQtd.setAttribute('aria-label', `Quantidade de ${label}`);
    inputQtd.className = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none';
    tdQtd.appendChild(inputQtd);

    const tdVd = document.createElement('td');
    tdVd.className = 'py-2';
    if (vd) {
      const inputVd = document.createElement('input');
      inputVd.type = 'text';
      inputVd.id = vd;
      inputVd.name = vd;
      inputVd.setAttribute('aria-label', `Percentual de valor diario de ${label}`);
      inputVd.placeholder = '%VD';
      inputVd.className = 'w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-600 focus:outline-none';
      tdVd.appendChild(inputVd);
    } else {
      tdVd.textContent = 'N/A';
      tdVd.className += ' text-slate-400';
    }

    tr.append(tdLabel, tdQtd, tdVd);
    tabela.appendChild(tr);
  });

  const form = document.getElementById('form-produto');
  const mensagemEl = document.getElementById('mensagem');
  const btnGerarTextos = document.getElementById('btn-gerar-textos');

  function coletarDados() {
    const dados = {};
    new FormData(form).forEach((valor, chave) => { dados[chave] = valor; });
    ['alerta_acucar', 'alerta_gordura_saturada', 'alerta_sodio'].forEach((chave) => {
      dados[chave] = document.getElementById(chave).checked;
    });
    return dados;
  }

  function mostrarMensagem(texto, tipo = 'sucesso') {
    mensagemEl.textContent = texto;
    mensagemEl.classList.remove('hidden', 'bg-red-100', 'text-red-800', 'bg-emerald-100', 'text-emerald-800');
    mensagemEl.classList.add(tipo === 'erro' ? 'bg-red-100' : 'bg-emerald-100', tipo === 'erro' ? 'text-red-800' : 'text-emerald-800');
    mensagemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  btnGerarTextos.addEventListener('click', async () => {
    btnGerarTextos.disabled = true;
    btnGerarTextos.textContent = 'Gerando...';
    try {
      const resposta = await fetch('/api/narrativas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coletarDados()),
      });
      const narrativas = await resposta.json();
      document.getElementById('texto_bloco1').value = narrativas.texto_bloco1;
      document.getElementById('texto_bloco2').value = narrativas.texto_bloco2;
      document.getElementById('texto_bloco3').value = narrativas.texto_bloco3;
      document.getElementById('texto_bloco4').value = narrativas.texto_bloco4;
      mostrarMensagem('Textos gerados. Revise e edite antes de salvar, se necessario.');
    } catch (err) {
      mostrarMensagem('Nao foi possivel gerar os textos automaticamente.', 'erro');
    } finally {
      btnGerarTextos.disabled = false;
      btnGerarTextos.textContent = 'Gerar textos automaticos';
    }
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const botaoSalvar = form.querySelector('button[type="submit"]');
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = 'Salvando...';

    try {
      const resposta = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coletarDados()),
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.erro || 'Erro ao salvar produto.');
      }

      const { produto, urlPublica } = await resposta.json();
      mostrarMensagem(`Produto "${produto.nome}" cadastrado com sucesso!`);
      await exibirResultado(produto.id, urlPublica);
      form.reset();
      carregarListaProdutos();
    } catch (err) {
      mostrarMensagem(err.message, 'erro');
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = 'Salvar produto';
    }
  });

  async function exibirResultado(id, urlPublica) {
    const secao = document.getElementById('secao-resultado');
    const link = document.getElementById('link-publico');
    const img = document.getElementById('img-qrcode');
    const download = document.getElementById('link-download');

    link.href = urlPublica;
    link.textContent = urlPublica;

    const qrUrl = `/api/produtos/${id}/qrcode?_=${Date.now()}`;
    img.src = qrUrl;
    download.href = qrUrl;
    download.download = `qrcode-${id}.png`;

    secao.classList.remove('hidden');
    secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function carregarListaProdutos() {
    const lista = document.getElementById('lista-produtos');
    try {
      const resposta = await fetch('/api/produtos');
      const produtos = await resposta.json();

      lista.innerHTML = '';
      if (produtos.length === 0) {
        lista.innerHTML = '<li class="py-3 text-slate-500">Nenhum produto cadastrado ainda.</li>';
        return;
      }

      produtos.forEach((produto) => {
        const li = document.createElement('li');
        li.className = 'py-3 flex flex-wrap items-center justify-between gap-2';

        const info = document.createElement('span');
        info.innerHTML = `<strong>${produto.nome}</strong> - ${produto.marca}`;

        const acoes = document.createElement('span');
        acoes.className = 'flex gap-3';

        const linkVer = document.createElement('a');
        linkVer.href = `/p/${produto.id}`;
        linkVer.target = '_blank';
        linkVer.rel = 'noopener';
        linkVer.className = 'text-emerald-700 underline';
        linkVer.textContent = 'Ver pagina publica';

        const linkQr = document.createElement('a');
        linkQr.href = `/api/produtos/${produto.id}/qrcode`;
        linkQr.download = `qrcode-${produto.id}.png`;
        linkQr.className = 'text-slate-700 underline';
        linkQr.textContent = 'Baixar QR Code';

        acoes.append(linkVer, linkQr);
        li.append(info, acoes);
        lista.appendChild(li);
      });
    } catch (err) {
      lista.innerHTML = '<li class="py-3 text-red-600">Erro ao carregar produtos.</li>';
    }
  }

  carregarListaProdutos();
})();
