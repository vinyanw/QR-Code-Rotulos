/**
 * Gera os 4 textos narrativos (linguagem simples) a partir dos dados brutos
 * do formulario. O resultado e apenas uma SUGESTAO: o usuario do painel pode
 * editar livremente antes de salvar o produto.
 */

function numeroOuTraco(v) {
  if (v === undefined || v === null || v === '') return null;
  return v;
}

function gerarBloco1({ nome, marca, alerta_acucar, alerta_gordura_saturada, alerta_sodio }) {
  const alertas = [];
  if (alerta_acucar) alertas.push('alto teor de acucar adicionado');
  if (alerta_gordura_saturada) alertas.push('alto teor de gordura saturada');
  if (alerta_sodio) alertas.push('alto teor de sodio');

  const cabecalho = `Voce esta ouvindo as informacoes do produto ${nome || 'sem nome informado'}, da marca ${marca || 'nao informada'}.`;

  if (alertas.length === 0) {
    return `${cabecalho} Este produto nao apresenta selos de alerta da Anvisa. Isso significa que ele nao tem quantidades altas de acucar adicionado, gordura saturada ou sodio, segundo a rotulagem frontal.`;
  }

  const listaAlertas = alertas.length === 1
    ? alertas[0]
    : alertas.slice(0, -1).join(', ') + ' e ' + alertas[alertas.length - 1];

  return `${cabecalho} Atencao: este produto possui selo de alerta da Anvisa por conter ${listaAlertas}. Recomenda-se atencao ao consumo frequente.`;
}

function gerarBloco2({ porcao_qtd, porcao_medida_caseira, porcoes_embalagem }) {
  const partes = [];
  if (porcao_qtd) {
    partes.push(`Cada porcao deste produto e de ${porcao_qtd}${porcao_medida_caseira ? `, o que equivale a ${porcao_medida_caseira}` : ''}.`);
  }
  if (porcoes_embalagem) {
    partes.push(`A embalagem inteira rende ${porcoes_embalagem} porcoes.`);
  }
  if (partes.length === 0) {
    return 'Informacoes de porcao nao foram cadastradas para este produto.';
  }
  return partes.join(' ');
}

function gerarBloco3(dados) {
  const {
    valor_energetico_kcal, valor_energetico_kj,
    carboidratos_g, vd_carboidratos,
    proteinas_g, vd_proteinas,
    gorduras_totais_g, vd_gorduras_totais,
    gorduras_saturadas_g, vd_gorduras_saturadas,
    gorduras_trans_g,
    fibra_g, vd_fibra,
    sodio_mg, vd_sodio,
  } = dados;

  const frases = [];

  if (numeroOuTraco(valor_energetico_kcal)) {
    frases.push(`Cada porcao fornece ${valor_energetico_kcal} quilocalorias${valor_energetico_kj ? ` (${valor_energetico_kj} quilojoules)` : ''}.`);
  }
  if (numeroOuTraco(carboidratos_g)) {
    frases.push(`Carboidratos: ${carboidratos_g} gramas${vd_carboidratos ? `, equivalente a ${vd_carboidratos} por cento do valor diario` : ''}.`);
  }
  if (numeroOuTraco(proteinas_g)) {
    frases.push(`Proteinas: ${proteinas_g} gramas${vd_proteinas ? `, equivalente a ${vd_proteinas} por cento do valor diario` : ''}.`);
  }
  if (numeroOuTraco(gorduras_totais_g)) {
    frases.push(`Gorduras totais: ${gorduras_totais_g} gramas${vd_gorduras_totais ? `, equivalente a ${vd_gorduras_totais} por cento do valor diario` : ''}.`);
  }
  if (numeroOuTraco(gorduras_saturadas_g)) {
    frases.push(`Gorduras saturadas: ${gorduras_saturadas_g} gramas${vd_gorduras_saturadas ? `, equivalente a ${vd_gorduras_saturadas} por cento do valor diario` : ''}.`);
  }
  if (numeroOuTraco(gorduras_trans_g)) {
    frases.push(`Gorduras trans: ${gorduras_trans_g} gramas.`);
  }
  if (numeroOuTraco(fibra_g)) {
    frases.push(`Fibras: ${fibra_g} gramas${vd_fibra ? `, equivalente a ${vd_fibra} por cento do valor diario` : ''}.`);
  }
  if (numeroOuTraco(sodio_mg)) {
    frases.push(`Sodio: ${sodio_mg} miligramas${vd_sodio ? `, equivalente a ${vd_sodio} por cento do valor diario` : ''}.`);
  }

  if (frases.length === 0) {
    return 'A tabela nutricional deste produto nao foi cadastrada.';
  }

  return `A seguir, os valores nutricionais por porcao. ${frases.join(' ')} Lembrando que o valor diario e calculado com base em uma dieta de dois mil calorias.`;
}

function gerarBloco4({ ingredientes, alergenicos }) {
  const partes = [];
  if (ingredientes && ingredientes.trim()) {
    partes.push(`Os ingredientes deste produto, listados em ordem decrescente de quantidade, sao: ${ingredientes.trim()}.`);
  } else {
    partes.push('A lista de ingredientes deste produto nao foi cadastrada.');
  }
  if (alergenicos && alergenicos.trim()) {
    partes.push(`Alerta de alergenicos: este produto contem ou pode conter ${alergenicos.trim()}.`);
  } else {
    partes.push('Nenhum alergenico foi informado para este produto.');
  }
  return partes.join(' ');
}

function gerarNarrativas(dados) {
  return {
    texto_bloco1: gerarBloco1(dados),
    texto_bloco2: gerarBloco2(dados),
    texto_bloco3: gerarBloco3(dados),
    texto_bloco4: gerarBloco4(dados),
  };
}

module.exports = { gerarNarrativas };
