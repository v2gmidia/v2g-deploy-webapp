// Testa código real com dependências externas substituídas. Nenhuma rede ou escrita.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { resumirPendencias } from '../lib/alertas/pendencias.ts';
import { intervaloDoInicio } from '../lib/inicio/periodo.ts';

function carregar(arquivo, mocks) {
  const exports = {};
  const codigo = ts.transpileModule(readFileSync(arquivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(codigo, { exports, require: (id) => {
    if (!(id in mocks)) throw Error(`Dependência não autorizada: ${id}`);
    return mocks[id];
  } });
  return exports;
}

const base = { decisoesExibidas: 0, decisoesTotal: 0, ajustesExibidos: 0, ajustesTotal: 0 };
test('pendência de cadastro entra no total; falha de leitura não vira tudo em dia', () => {
  assert.equal(resumirPendencias({ ...base, jornadaTotal: 1 }).total, 1);
  assert.equal(resumirPendencias({ ...base, jornadaTotal: null }).leituraCompleta, false);
  assert.equal(resumirPendencias({ ...base, jornadaTotal: null }).total, null);
  assert.equal(resumirPendencias({ ...base, jornadaTotal: 0 }).total, 0);
});

function leitura({ user = { id: 'perfil-autenticado' }, data = { onboarding: {} }, error = null, reserva = null, erroReserva = null, concluido = false, fluxo = true } = {}) {
  const chamadas = [];
  function query(table, admin) {
    const q = {
      select(cols) { chamadas.push(['select', table, cols]); return q; },
      eq(k, v) { chamadas.push(['eq', k, v]); return q; },
      order() { return q; }, limit() { return q; },
      async maybeSingle() { chamadas.push(['leu', table]); return admin ? { data: reserva, error: erroReserva } : { data, error }; },
    };
    return q;
  }
  const pendencia = { titulo: 'Conferir marca', corpo: 'Revisar', href: '/onboarding/marca', rotulo: 'Conferir' };
  const modulo = carregar('lib/onboarding/pendencia-do-negocio.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: t => query(t, false) }) },
    '@/lib/supabase/admin': { createAdminClient: () => { chamadas.push(['admin']); return { from: t => query(t, true) }; } },
    '@/lib/agenda/google': { agendaGoogleConfigurada: () => true, agendaGoogleLeituraConfigurada: () => true },
    './marca': { fluxoAguardaReuniao: () => fluxo },
    './conclusao': { estadoDaConclusao: () => ({ concluido }), pendenciaDoOnboarding: (_, confirmada) => confirmada ? null : pendencia },
  });
  return { ler: modulo.lerPendenciaDoNegocio, chamadas };
}

test('leitura compartilhada filtra negócio E dono antes de qualquer acesso administrativo', async () => {
  const { ler, chamadas } = leitura({ concluido: true, reserva: { starts_at: 'inicio', ends_at: 'fim' } });
  const resposta = await ler('negocio-autorizado');
  assert.equal(resposta.pendencia, null);
  assert.equal(resposta.falha, false);
  assert.ok(chamadas.some(c => c[0] === 'eq' && c[1] === 'profile_id' && c[2] === 'perfil-autenticado'));
  assert.ok(chamadas.some(c => c[0] === 'eq' && c[1] === 'id' && c[2] === 'negocio-autorizado'));
  assert.ok(chamadas.findIndex(c => c[0] === 'leu' && c[1] === 'businesses') < chamadas.findIndex(c => c[0] === 'admin'));
});

test('sem sessão, erro ou negócio inacessível não lê reserva e não afirma conclusão', async () => {
  for (const caso of [{ user: null }, { data: null }, { error: { message: 'erro' } }]) {
    const { ler, chamadas } = leitura(caso);
    assert.equal((await ler('outro-negocio')).falha, true);
    assert.ok(!chamadas.some(c => c[0] === 'admin'));
  }
});

test('reserva sem prova continua pendente; falha da reserva é desconhecida', async () => {
  assert.ok((await leitura({ concluido: true }).ler('b')).pendencia);
  assert.equal((await leitura({ concluido: true, erroReserva: {} }).ler('b')).falha, true);
  assert.equal((await leitura({ fluxo: false }).ler('b')).pendencia, null);
});

function resultados(ok = true) {
  const chamadas = [];
  const backend = {
    consolidadoDoNegocio: async args => {
      chamadas.push(['negocio', { ...args }]);
      return ok ? { ok: true, dados: { desde: args.desde, ate: args.ate, porExecucao: [{ idExecucao: 'permitida' }], moedas: ['BRL'] } } : { ok: false };
    },
    fichaDaExecucao: async args => { chamadas.push(['ficha', { ...args }]); return { ok: true, dados: { status: 'gerado' } }; },
    consolidadoDaExecucao: async args => { chamadas.push(['execucao', { ...args }]); return { ok: true, dados: { temDadoDaPlataforma: true } }; },
  };
  return { chamadas, ler: carregar('lib/resultado/do-negocio.ts', {
    'server-only': {}, '@/lib/backend': backend,
    './ler.ts': { respostaDoDono: () => ({}), resultadoParaTela: () => ({}) },
  }).resultadoDoNegocio };
}

test('mesmo intervalo vai ao negócio e às execuções, sempre depois da autorização', async () => {
  const { ler, chamadas } = resultados();
  const intervalo = intervaloDoInicio({ desde: '2025-01-01', ate: '2025-03-31', idExecucao: 'invasora' }, '2026-10-19');
  const resposta = await ler({ businessId: 'negocio', profileId: 'perfil', intervalo: { ...intervalo, businessId: 'outro', profileId: 'outro', idExecucao: 'invasora' } });
  assert.equal(chamadas[0][0], 'negocio');
  assert.equal(chamadas[0][1].businessId, 'negocio');
  assert.equal(chamadas[0][1].profileId, 'perfil');
  for (const [tipo, args] of chamadas) {
    if (tipo === 'negocio' || tipo === 'execucao') {
      assert.equal(args.desde, '2025-01-01'); assert.equal(args.ate, '2025-03-31');
    }
    if (tipo !== 'negocio') assert.equal(args.idExecucao, 'permitida');
  }
  assert.equal(resposta.periodo.desde, '2025-01-01');
});

test('negócio não autorizado bloqueia toda consulta de execução', async () => {
  const { ler, chamadas } = resultados(false);
  assert.equal((await ler({ businessId: 'b', profileId: 'p' })).estado, 'indisponivel');
  assert.equal(chamadas.length, 1);
});

test('regressões de apresentação: conclusão, envio indisponível e datas', () => {
  const inicio = readFileSync('app/(protected)/inicio/TelaDoInicio.tsx', 'utf8');
  assert.match(inicio, /jornadaConcluida && !temProximoAcionavel && !falhaPendencia/);
  assert.ok(inicio.indexOf('<ConclusaoDaJornada') > inicio.indexOf('<section className="sinais-bloco">', inicio.indexOf('const donoRespondeu')));
  const criativos = readFileSync('app/(protected)/criativos/TelaDeCriativos.tsx', 'utf8');
  assert.match(criativos, /envioDisponivel\s*\? <a[^>]+href="#subir-criativo"/);
  assert.ok(criativos.includes('Envio indisponível'));
  const anuncios = readFileSync('app/(protected)/anuncios/page.tsx', 'utf8');
  assert.ok(anuncios.includes('rotuloDoIntervalo(resultado.periodo)'));
  for (const tela of ['inicio', 'alertas']) assert.ok(readFileSync(`app/(protected)/${tela}/page.tsx`, 'utf8').includes('lerPendenciaDoNegocio'));
});
