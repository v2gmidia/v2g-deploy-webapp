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
  './RecepcaoDoCadastro.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
  './PerguntaDoDia': { PerguntaDoDia: () => null },
  './ConclusaoDaJornada': { ConclusaoDaJornada: () => null },
  './SeletorDePeriodo': { SeletorDePeriodo: () => React.createElement('button', null, 'Período') },
};
const { TelaDoInicio } = ambienteTs({ ports: portsTela }).load('app/(protected)/inicio/TelaDoInicio.tsx');
function html(over = {}) {
  return renderToStaticMarkup(React.createElement(TelaDoInicio, { estado: novo(), ultimaDecisao: null,
    diaDaPergunta: '2026-10-26', atrasados: [], faixa: null, recepcaoOnboarding: recepcao,
    acumuladoDoPeriodo: null, ...over }));
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

test('cadastro comprovado recebe conclusão, reunião sem promessa e links úteis sem 0/4', () => {
  const tela = html();
  assert.match(tela, /Cadastro concluído!/);
  assert.match(tela, /contas e as informações da marca estão salvas/);
  assert.match(tela, /A confirmação do horário ainda não aparece aqui/);
  for (const rota of ['/conta', '/criativos', '/anuncios', '/alertas', '/onboarding/concluido']) assert.ok(tela.includes(`href="${rota}"`));
  assert.doesNotMatch(tela, /0 de 4|Sua campanha está sendo preparada|Não foi possível carregar|Período|reunião está confirmada|WhatsApp|gestor atribuído/);
});

test('reserva confirmada mostra data de Brasília sem concluir a reunião ou atribuir gestor', () => {
  const tela = html({ recepcaoOnboarding: { reserva, falhaReuniao: false } });
  assert.match(tela, /Sua reunião está confirmada/);
  assert.match(tela, /30 de outubro de 2026, das 14:00 às 14:30 \(Brasília\)/);
  assert.match(tela, /Ver minha reunião/);
  assert.doesNotMatch(tela, /confirmação do horário ainda não|reunião concluída|gestor atribuído/);
});

test('erro da agenda preserva conquista comprovada sem afirmar reserva', () => {
  const tela = html({ recepcaoOnboarding: { reserva: null, falhaReuniao: true } });
  assert.match(tela, /Cadastro concluído!/);
  assert.match(tela, /Não conseguimos conferir seu horário agora/);
  assert.doesNotMatch(tela, /Sua reunião está confirmada/);
});

test('falha real com estado desconhecido fica visível abaixo da recepção e permite repetir período', () => {
  const estado = { ...novo(), veiculacao: 'nao_sabemos' };
  const tela = html({ estado, intervalo: { desde: '2026-01-01', ate: '2026-03-31' } });
  assert.match(tela, /Não foi possível carregar os resultados deste período/);
  assert.ok(tela.indexOf('Cadastro concluído!') < tela.indexOf('Não foi possível carregar'));
  assert.match(tela, /href="\/inicio\?desde=2026-01-01&amp;ate=2026-03-31"/);
  assert.doesNotMatch(tela, /R\$\s*0/);
});

test('histórico ou execução não é substituído por recepção; falha de medição permanece', () => {
  const estado = exemploDoInicio(new Date(), 'pausado');
  assert.equal(cabeRecepcaoDoCadastro(estado), false);
  const tela = html({ estado });
  assert.doesNotMatch(tela, /Cadastro concluído!/);
  assert.match(tela, /Não foi possível carregar os resultados deste período/);
  assert.equal(cabeRecepcaoDoCadastro({ ...novo(), diaSeguinte: { execucao: { idExecucao: 'execucao' }, acumulado: null } }), false);
});

test('não declara conclusão quando a leitura do onboarding não a comprovou', () => {
  const tela = html({ recepcaoOnboarding: null, pendenciaOnboarding: {
    titulo: 'Ainda falta conferir o visual da marca', corpo: 'Confira o visual.', href: '/onboarding/marca', rotulo: 'Conferir marca',
  } });
  assert.doesNotMatch(tela, /Cadastro concluído!/);
  assert.match(tela, /Ainda falta conferir o visual da marca/);
});

function pendencia({ id = 'negocio-A', concluido = true, erroAgenda = null, confirmada = null, user = { id: 'dono-A' } } = {}) {
  const chamadas = [];
  function query(admin) {
    const filtros = {};
    const q = { select: () => q, eq: (k, v) => { filtros[k] = v; return q; }, order: () => q, limit: () => q,
      maybeSingle: async () => {
        chamadas.push({ admin, ...filtros });
        return admin ? { data: confirmada, error: erroAgenda } : { data: filtros.id === id && filtros.profile_id === user?.id ? { onboarding: {} } : null, error: null };
      } };
    return q;
  }
  const env = ambienteTs({ ports: {
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query(false) }) },
    '@/lib/supabase/admin': { createAdminClient: () => ({ from: () => query(true) }) },
    '@/lib/agenda/google': { agendaGoogleLeituraConfigurada: () => true },
    './marca': { fluxoAguardaReuniao: () => true },
    './conclusao': { estadoDaConclusao: () => ({ concluido }), pendenciaDoOnboarding: () => null },
  } });
  return { ler: env.load('lib/onboarding/pendencia-do-negocio.ts').lerPendenciaDoNegocio, chamadas };
}

test('leitura separa cadastro comprovado de falha da agenda e de reserva confirmada', async () => {
  const falha = await pendencia({ erroAgenda: { message: 'ficticia' } }).ler('negocio-A');
  assert.equal(falha.cadastroConcluido, true); assert.equal(falha.falha, true); assert.equal(falha.reserva, null);
  const sucesso = await pendencia({ confirmada: reserva }).ler('negocio-A');
  assert.equal(sucesso.cadastroConcluido, true); assert.deepEqual(sucesso.reserva, reserva);
  const incompleto = pendencia({ concluido: false });
  assert.equal((await incompleto.ler('negocio-A')).cadastroConcluido, false);
  assert.equal(incompleto.chamadas.some(c => c.admin), false);
});

test('multiconta: outro negócio e falta de sessão não herdam conclusão nem reserva', async () => {
  const leitura = pendencia({ confirmada: reserva });
  const outro = await leitura.ler('negocio-B');
  assert.equal(outro.cadastroConcluido, undefined); assert.equal(outro.falha, true);
  assert.equal(leitura.chamadas.some(c => c.admin), false);
  const semSessao = pendencia({ user: null });
  assert.equal((await semSessao.ler('negocio-A')).cadastroConcluido, undefined);
  assert.equal(semSessao.chamadas.length, 0);
});

test('página consulta métricas só quando esperadas, com período e negócio da sessão', async () => {
  for (const desconhecido of [false, true]) {
    const chamadas = [];
    const estado = { ...novo(), veiculacao: desconhecido ? 'nao_sabemos' : 'nunca_foi_ao_ar' };
    const q = { select: () => q, eq: () => q, in: () => q, order: () => q, limit: () => q, maybeSingle: async () => ({ data: null, error: null }) };
    const env = ambienteTs({ env: { NODE_ENV: 'production' }, ports: {
      'next/navigation': { redirect: () => { throw Error('Redirecionamento inesperado'); } },
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'dono-A' } } }) }, from: () => q }) },
      '@/components/ui/FaixaReconectar': { FaixaReconectar: () => null },
      '@/lib/estado/cliente': { estadoDoCliente: async () => estado },
      '@/lib/onboarding/pendencia-do-negocio': { lerPendenciaDoNegocio: async id => { assert.equal(id, 'negocio-A'); return { pendencia: null, reserva: null, falha: false, cadastroConcluido: true }; } },
      '@/lib/backend/dia-seguinte': { consolidadoDoNegocio: async args => { chamadas.push(args); return { ok: false, categoria: 'servidor' }; } },
      '@/lib/dia-seguinte/dias-em-aberto': { diasAtrasados: async () => [] },
      './TelaDoInicio': { TelaDoInicio: () => null },
    } });
    const page = env.load('app/(protected)/inicio/page.tsx').default;
    const tela = await page({ searchParams: Promise.resolve({ desde: '2026-01-01', ate: '2026-03-31', businessId: 'invasor' }) });
    assert.equal(tela.props.recepcaoOnboarding.falhaReuniao, false);
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
