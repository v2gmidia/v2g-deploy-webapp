import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const isolado = ambienteTs();
const { exemploDoInicio } = isolado.load('lib/exemplo.ts');
const { resultadosSaoEsperados, cabeRecepcaoDoCadastro } = isolado.load('lib/inicio/expectativa-de-resultados.ts');
const novo = () => ({ ...exemploDoInicio(new Date('2026-10-27T15:00:00Z'), 'chegada'), negocioId: 'negocio-A', diaSeguinte: { execucao: null, acumulado: null } });
const recepcao = { reserva: null, falhaReuniao: false };
const reserva = { starts_at: '2026-10-30T17:00:00Z', ends_at: '2026-10-30T17:30:00Z' };
const portsTela = {
  './PerguntaDoDia': { PerguntaDoDia: () => null },
  './ConclusaoDaJornada': { ConclusaoDaJornada: () => null },
  './SeletorDePeriodo': { SeletorDePeriodo: () => React.createElement('button', null, 'Período') },
  './AtualizarInicio': { AtualizarInicio: () => React.createElement('button', null, 'Tentar novamente') },
};

function recepcaoNoCliente() {
  let estado, inicializado = false, efeito;
  const itens = new Map();
  const localStorage = {
    getItem(chave) { return itens.has(chave) ? itens.get(chave) : null; },
    setItem(chave, valor) { itens.set(chave, valor); },
  };
  const reactCliente = {
    ...React,
    useState(inicial) {
      if (!inicializado) { estado = inicial; inicializado = true; }
      return [estado, proximo => { estado = typeof proximo === 'function' ? proximo(estado) : proximo; }];
    },
    useEffect(callback) { efeito = callback; },
  };
  const modulo = ambienteTs({
    globals: { window: { localStorage } },
    ports: {
      react: reactCliente,
      './RecepcaoDoCadastro.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
    },
  }).load('app/(protected)/inicio/RecepcaoDoCadastro.tsx');
  return {
    Componente: modulo.RecepcaoDoCadastro,
    executarEfeito() { if (efeito) efeito(); },
    localStorage,
  };
}

function html(over = {}) {
  const cliente = recepcaoNoCliente();
  const { TelaDoInicio } = ambienteTs({ ports: {
    ...portsTela,
    './RecepcaoDoCadastro': { RecepcaoDoCadastro: cliente.Componente },
  } }).load('app/(protected)/inicio/TelaDoInicio.tsx');
  const props = { estado: novo(), ultimaDecisao: null, diaDaPergunta: '2026-10-26', atrasados: [],
    faixa: null, recepcaoOnboarding: recepcao, acumuladoDoPeriodo: null, ...over };
  const inicial = renderToStaticMarkup(React.createElement(TelaDoInicio, props));
  cliente.executarEfeito();
  const visivel = renderToStaticMarkup(React.createElement(TelaDoInicio, props));
  return { inicial, visivel, localStorage: cliente.localStorage };
}

test('sem operação comprovada não espera resultados; desconhecido e sinais históricos mantêm consulta', () => {
  assert.equal(resultadosSaoEsperados(novo()), false);
  for (const patch of [
    { veiculacao: 'nao_sabemos' }, { veiculacao: 'ja_foi_ao_ar' }, { veiculacao: 'no_ar' },
    { temNumero: true }, { campanhasNoAr: [{ id: 'campanha' }] },
    { diaSeguinte: { execucao: { idExecucao: 'execucao' }, acumulado: null } },
  ]) assert.equal(resultadosSaoEsperados({ ...novo(), ...patch }), true);
  const historico = exemploDoInicio(new Date(), 'pausado').diaSeguinte.acumulado;
  const estado = novo(); estado.diaSeguinte.acumulado = { ...historico, temDadoDaPlataforma: false, investiuCentavos: null, voltouCentavos: null, dias: [], porExecucao: [{ idExecucao: 'historica' }] };
  assert.equal(resultadosSaoEsperados(estado), true);
  assert.equal(cabeRecepcaoDoCadastro(estado), false);
});

test('cadastro comprovado recebe conclusão sem confundir recepção com jornada da campanha', () => {
  const ciclo = html();
  const tela = ciclo.visivel;
  assert.doesNotMatch(ciclo.inicial, /Cadastro concluído!/);
  assert.equal(ciclo.localStorage.getItem('v2g:inicio:cadastro-concluido:v1:negocio-A'), 'visto');
  assert.match(tela, /Cadastro concluído!/);
  assert.match(tela, /contas e as informações da marca estão salvas/);
  assert.match(tela, /A confirmação do horário ainda não aparece aqui/);
  for (const rota of ['/conta', '/criativos', '/anuncios', '/alertas', '/onboarding/concluido']) assert.ok(tela.includes(`href="${rota}"`));
  assert.ok(tela.indexOf('Cadastro concluído!') < tela.indexOf('0 de 4 etapas concluídas'));
  assert.match(tela, /<strong>Cadastro<\/strong><span>Concluído<\/span>/);
  assert.match(tela, /<strong>Reunião<\/strong><span>Próximo passo<\/span>/);
  assert.doesNotMatch(tela, /Não foi possível carregar|Período|reunião está confirmada|WhatsApp|gestor atribuído/);
});

test('reserva confirmada mostra data de Brasília sem concluir a reunião ou atribuir gestor', () => {
  const tela = html({ recepcaoOnboarding: { reserva, falhaReuniao: false } }).visivel;
  assert.match(tela, /Sua reunião está confirmada/);
  assert.match(tela, /30 de outubro de 2026, das 14:00 às 14:30 \(Brasília\)/);
  assert.match(tela, /Ver minha reunião/);
  assert.doesNotMatch(tela, /confirmação do horário ainda não|reunião concluída|gestor atribuído/);
});

test('erro da agenda preserva conquista comprovada sem afirmar reserva', () => {
  const tela = html({ recepcaoOnboarding: { reserva: null, falhaReuniao: true } }).visivel;
  assert.match(tela, /Cadastro concluído!/);
  assert.match(tela, /Não conseguimos conferir seu horário agora/);
  assert.doesNotMatch(tela, /Sua reunião está confirmada/);
});

test('falha real com estado desconhecido fica visível abaixo da recepção e permite repetir período', () => {
  const estado = { ...novo(), veiculacao: 'nao_sabemos' };
  const tela = html({ estado, intervalo: { desde: '2026-01-01', ate: '2026-03-31' } }).visivel;
  assert.match(tela, /Não foi possível carregar os resultados deste período/);
  const indiceRecepcao = tela.indexOf('Cadastro concluído!');
  assert.notEqual(indiceRecepcao, -1);
  assert.ok(indiceRecepcao < tela.indexOf('Não foi possível carregar'));
  assert.match(tela, /<button>Tentar novamente<\/button>/);
  assert.doesNotMatch(tela, /R\$\s*0/);
});

test('retry atualiza a rota corrente sem trocar ou reconstruir o período', () => {
  let atualizacoes = 0;
  const { AtualizarInicio } = ambienteTs({ ports: {
    react: { ...React, useTransition: () => [false, callback => callback()] },
    'next/navigation': { useRouter: () => ({ refresh: () => { atualizacoes += 1; }, push: () => { throw Error('não deve navegar'); } }) },
    '@/components/ui/EsperaLocal': { EsperaLocal: () => null },
  } }).load('app/(protected)/inicio/AtualizarInicio.tsx');
  const elemento = AtualizarInicio();
  const botao = elemento.props.children[0];
  assert.equal(botao.type, 'button');
  assert.equal(botao.props.children, 'Tentar novamente');
  assert.equal(botao.props.disabled, false);
  botao.props.onClick();
  assert.equal(atualizacoes, 1);
});

test('histórico ou execução não é substituído por recepção; falha de medição permanece', () => {
  const estado = exemploDoInicio(new Date(), 'pausado');
  assert.equal(cabeRecepcaoDoCadastro(estado), false);
  const tela = html({ estado }).visivel;
  assert.doesNotMatch(tela, /Cadastro concluído!/);
  assert.match(tela, /Não foi possível carregar os resultados deste período/);
  assert.equal(cabeRecepcaoDoCadastro({ ...novo(), diaSeguinte: { execucao: { idExecucao: 'execucao' }, acumulado: null } }), false);
});

test('não declara conclusão quando a leitura do onboarding não a comprovou', () => {
  const tela = html({ recepcaoOnboarding: null, pendenciaOnboarding: {
    titulo: 'Ainda falta conferir o visual da marca', corpo: 'Confira o visual.', href: '/onboarding/marca', rotulo: 'Conferir marca',
  } }).visivel;
  assert.doesNotMatch(tela, /Cadastro concluído!/);
  assert.match(tela, /Ainda falta conferir o visual da marca/);
});

function pendencia({ id = 'negocio-A', concluido = true, erroAgenda = null, confirmada = null, user = { id: 'dono-A' } } = {}) {
  const chamadas = [];
  function query() {
    const filtros = {};
    const q = { select: () => q, eq: (k, v) => { filtros[k] = v; return q; }, order: () => q, limit: () => q,
      maybeSingle: async () => {
        chamadas.push(filtros);
        return { data: filtros.id === id && filtros.profile_id === user?.id ? { onboarding: {} } : null, error: null };
      } };
    return q;
  }
  const env = ambienteTs({ ports: {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query() }) },
    './marca': { fluxoAguardaReuniao: () => true },
    './conclusao': { estadoDaConclusao: () => ({ concluido }), pendenciaDoOnboarding: (_jornada, reuniao) => reuniao ? null : { titulo: 'Reunião pendente' } },
  } });
  const modulo = env.load('lib/onboarding/pendencia-do-negocio.ts');
  return { ler: modulo.lerPendenciaDoNegocio, aplicar: modulo.aplicarAgendaConferida, chamadas };
}

test('leitura do onboarding não transforma linha local ou clique em reserva', async () => {
  const leitura = pendencia({ confirmada: reserva, erroAgenda: { message: 'ignorada' } });
  const base = await leitura.ler('negocio-A');
  assert.equal(base.cadastroConcluido, true); assert.equal(base.falha, false); assert.equal(base.reserva, null);
  assert.equal(base.pendencia.titulo, 'Reunião pendente');
  const incompleto = pendencia({ concluido: false });
  assert.equal((await incompleto.ler('negocio-A')).cadastroConcluido, false);
  assert.equal(incompleto.chamadas.length, 1);
});

test('negócios A e B recebem somente o resultado conciliado da própria agenda', async () => {
  const modulo = pendencia();
  const baseA = await modulo.ler('negocio-A');
  const confirmadoA = modulo.aplicar(baseA, { status: 'confirmada', inicio: reserva.starts_at, fim: reserva.ends_at });
  assert.equal(confirmadoA.reserva.starts_at, reserva.starts_at);
  assert.equal(confirmadoA.reserva.ends_at, reserva.ends_at);
  assert.equal(confirmadoA.pendencia, null);
  const baseB = { ...baseA, pendencia: { titulo: 'Reunião pendente' }, reserva: null };
  const pendenteB = modulo.aplicar(baseB, { status: 'pendente' });
  assert.equal(pendenteB.reserva, null); assert.equal(pendenteB.pendencia.titulo, 'Reunião pendente');
  assert.equal(confirmadoA.reserva.starts_at, reserva.starts_at);
});

test('sem confirmação ou com falha do Google a reunião continua pendente', async () => {
  const modulo = pendencia();
  const base = await modulo.ler('negocio-A');
  for (const status of ['legado', 'livre', 'pendente']) {
    const leitura = modulo.aplicar(base, { status });
    assert.equal(leitura.reserva, null); assert.equal(leitura.falha, false); assert.ok(leitura.pendencia);
  }
  const falha = modulo.aplicar(base, { status: 'erro' });
  assert.equal(falha.reserva, null); assert.equal(falha.falha, true); assert.ok(falha.pendencia);
});

test('multiconta: outro negócio e falta de sessão não herdam conclusão nem reserva', async () => {
  const leitura = pendencia();
  const outro = await leitura.ler('negocio-B');
  assert.equal(outro.cadastroConcluido, undefined); assert.equal(outro.falha, true);
  assert.equal(leitura.chamadas.length, 1);
  const semSessao = pendencia({ user: null });
  assert.equal((await semSessao.ler('negocio-A')).cadastroConcluido, undefined);
  assert.equal(semSessao.chamadas.length, 0);
});

test('página consulta métricas só quando esperadas, com período e negócio da sessão', async () => {
  for (const desconhecido of [false, true]) {
    const chamadas = [];
    const agendas = [];
    const estado = { ...novo(), veiculacao: desconhecido ? 'nao_sabemos' : 'nunca_foi_ao_ar' };
    const q = { select: () => q, eq: () => q, in: () => q, order: () => q, limit: () => q, maybeSingle: async () => ({ data: null, error: null }) };
    const env = ambienteTs({ env: { NODE_ENV: 'production' }, ports: {
      'next/navigation': { redirect: () => { throw Error('Redirecionamento inesperado'); } },
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'dono-A' } } }) }, from: () => q }) },
      '@/components/ui/FaixaReconectar': { FaixaReconectar: () => null },
      '@/lib/estado/cliente': { estadoDoCliente: async () => estado },
      '@/lib/onboarding/pendencia-do-negocio': {
        lerPendenciaDoNegocio: async id => { assert.equal(id, 'negocio-A'); return { pendencia: null, reserva: null, falha: false, cadastroConcluido: true }; },
        aplicarAgendaConferida: (leitura) => leitura,
      },
      '@/app/(fluxo)/onboarding/concluido/agenda-actions': { carregarAgendaAction: async id => { agendas.push(id); return { status: 'legado' }; } },
      '@/lib/backend/dia-seguinte': { consolidadoDoNegocio: async args => { chamadas.push(args); return { ok: false, categoria: 'servidor' }; } },
      '@/lib/dia-seguinte/dias-em-aberto': { diasAtrasados: async () => [] },
      './TelaDoInicio': { TelaDoInicio: () => null },
    } });
    const page = env.load('app/(protected)/inicio/page.tsx').default;
    const tela = await page({ searchParams: Promise.resolve({ desde: '2026-01-01', ate: '2026-03-31', businessId: 'invasor' }) });
    assert.equal(tela.props.recepcaoOnboarding.falhaReuniao, false);
    assert.deepEqual(agendas, ['negocio-A']);
    assert.equal(tela.props.acumuladoDoPeriodo, desconhecido ? null : undefined);
    assert.equal(chamadas.length, desconhecido ? 2 : 0);
    for (const c of chamadas) { assert.equal(c.businessId, 'negocio-A'); assert.equal(c.profileId, 'dono-A'); }
    if (desconhecido) assert.ok(chamadas.some(c => c.desde === '2026-01-01' && c.ate === '2026-03-31'));
  }
});

test('bancada só importa fixtures em desenvolvimento e não altera bloqueios de navegação', () => {
  const pagina = readFileSync('app/exemplo/recepcao-inicio/page.tsx', 'utf8');
  assert.match(pagina, /process.env.NODE_ENV !== "production" \? await import/);
  assert.match(pagina, /if \(!modulo\) notFound\(\)/);
});
