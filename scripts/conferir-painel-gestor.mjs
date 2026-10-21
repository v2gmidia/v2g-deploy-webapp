import assert from "node:assert/strict";
import test from "node:test";
import { diasDoPeriodo, estadoDoCustoMesa, estadoDoRitmoMesa, intervaloMesa, metricasMesa, sinaisDaConta, sinalPrincipalMesa, variacaoMesa, verbaMesa } from "../lib/gestor/painel.ts";
import { CONTAS_DEMONSTRACAO, REFERENCIA_MESA } from "../app/exemplo/mesa-gestor/dados-demonstracao.ts";

test("razões usam totais ponderados e denominador ausente fica desconhecido", () => {
  const m = metricasMesa([
    { data: "2026-10-19", gastoCentavos: 1000, impressoes: 1000, cliquesLink: 10, resultados: 1 },
    { data: "2026-10-20", gastoCentavos: 9000, impressoes: 3000, cliquesLink: 90, resultados: 9 },
  ]);
  assert.equal(m.cprCentavos, 1000);
  assert.equal(m.cpcCentavos, 100);
  assert.equal(m.ctr, 2.5);
  assert.equal(m.cpmCentavos, 2500);
  assert.equal(metricasMesa([]).cprCentavos, null);
  assert.equal(metricasMesa([]).ctr, null);
  assert.equal(variacaoMesa(10, 0), null);
  assert.equal(variacaoMesa(0, 10), -100);
});

test("janelas comparadas têm a mesma duração, sem sobreposição", () => {
  for (const dias of [7, 14, 30]) {
    const atual = diasDoPeriodo(CONTAS_DEMONSTRACAO[0].dias, REFERENCIA_MESA, dias);
    const antes = diasDoPeriodo(CONTAS_DEMONSTRACAO[0].dias, REFERENCIA_MESA, dias, true);
    assert.equal(atual.length, dias);
    assert.equal(antes.length, dias);
    assert.ok(antes.at(-1).data < atual[0].data);
    assert.equal(atual.at(-1).data, REFERENCIA_MESA);
  }
  assert.deepEqual(intervaloMesa("2026-03-02", 7), { inicio: "2026-02-24", fim: "2026-03-02" });
});

test("verba mensal usa apenas o mês corrente; não é gasto dos últimos sete dias", () => {
  const conta = CONTAS_DEMONSTRACAO[0];
  const verba = verbaMesa(conta, REFERENCIA_MESA);
  const gastoMes = conta.dias.filter((d) => d.data >= "2026-10-01").reduce((s, d) => s + d.gastoCentavos, 0);
  assert.equal(verba.gastoCentavos, gastoMes);
  assert.equal(verba.restanteCentavos, conta.tetoMensalCentavos - gastoMes);
  assert.equal(verba.diasNoMes, 31);
  assert.ok(verba.gastoCentavos > metricasMesa(diasDoPeriodo(conta.dias, REFERENCIA_MESA, 7)).gastoCentavos);
});

test("leitura ausente, desatualizada e período truncado nunca viram verde", () => {
  const conta = CONTAS_DEMONSTRACAO[4];
  for (const alteracao of [
    { leitura: "indisponivel" }, { atualizadoEm: "2026-10-19T13:00:00Z" },
    { dias: conta.dias.slice(0, -1) }, { dias: [...conta.dias.slice(0, -1), conta.dias.at(-2)] },
    { metas: { ...conta.metas, ctrMin: null } },
  ]) assert.equal(sinalPrincipalMesa(sinaisDaConta({ ...conta, ...alteracao }, REFERENCIA_MESA, 7)).estado, "sem_dados");
  assert.equal(sinalPrincipalMesa([]).estado, "sem_dados");
});

test("mês incompleto não vira saldo restante nem ritmo confirmado", () => {
  const conta = CONTAS_DEMONSTRACAO[4];
  const parcial = { ...conta, dias: conta.dias.filter((d) => d.data !== "2026-10-01") };
  assert.equal(verbaMesa(parcial, REFERENCIA_MESA).gastoCentavos, null);
  assert.equal(verbaMesa(parcial, REFERENCIA_MESA).restanteCentavos, null);
  assert.equal(estadoDoRitmoMesa(verbaMesa(parcial, REFERENCIA_MESA)), "sem_dados");
  assert.equal(estadoDoRitmoMesa(verbaMesa({ ...conta, tetoMensalCentavos: null }, REFERENCIA_MESA)), "sem_dados");
  assert.equal(sinalPrincipalMesa(sinaisDaConta(parcial, REFERENCIA_MESA, 7)).estado, "sem_dados");
});

test("ranking não dá verde sem custo, meta ou amostra da peça", () => {
  assert.equal(estadoDoCustoMesa(null, 1000, 0, 10), "sem_dados");
  assert.equal(estadoDoCustoMesa(500, null, 20, 10), "sem_dados");
  assert.equal(estadoDoCustoMesa(500, 0, 20, 10), "sem_dados");
  assert.equal(estadoDoCustoMesa(500, 1000, 3, 10), "atencao");
  assert.equal(estadoDoCustoMesa(500, 1000, 20, 10), "saudavel");
});

test("amostra pequena não esconde alerta financeiro conhecido", () => {
  const conta = CONTAS_DEMONSTRACAO[1];
  const poucaAmostra = { ...conta, metas: { ...conta.metas, amostraMinimaResultados: 100 } };
  const sinais = sinaisDaConta(poucaAmostra, REFERENCIA_MESA, 7);
  assert.ok(sinais.some((s) => s.titulo === "Amostra para conferir"));
  assert.equal(sinalPrincipalMesa(sinais).titulo, "Saldo baixo");
});

test("resultado zero com investimento pede investigação e não exibe custo zero", () => {
  const conta = CONTAS_DEMONSTRACAO[4];
  const semResultado = { ...conta, dias: conta.dias.map((d) => ({ ...d, resultados: 0 })) };
  assert.equal(metricasMesa(diasDoPeriodo(semResultado.dias, REFERENCIA_MESA, 7)).cprCentavos, null);
  assert.ok(sinaisDaConta(semResultado, REFERENCIA_MESA, 7).some((s) => s.titulo === "Sem resultado registrado"));
});

test("limites pertencem à conta e valor pós-pago não é saldo disponível", () => {
  const conta = CONTAS_DEMONSTRACAO[0];
  assert.equal(sinalPrincipalMesa(sinaisDaConta(conta, REFERENCIA_MESA, 7)).estado, "critico");
  const maiorMeta = { ...conta, metas: { ...conta.metas, custoResultadoMaxCentavos: 100000, ctrMin: 0 } };
  assert.ok(!sinaisDaConta(maiorMeta, REFERENCIA_MESA, 7).some((s) => s.titulo === "Custo acima da meta"));
  const posPago = CONTAS_DEMONSTRACAO[6];
  assert.equal(posPago.cobranca.tipo, "pos_pago");
  assert.ok(!sinaisDaConta(posPago, REFERENCIA_MESA, 7).some((s) => s.titulo === "Saldo baixo"));
});

test("demonstração preserva soma de investimento, impressões, cliques e resultados das peças", () => {
  for (const conta of CONTAS_DEMONSTRACAO.filter((c) => c.leitura === "disponivel")) {
    for (const periodo of [7, 14, 30]) {
      const m = metricasMesa(diasDoPeriodo(conta.dias, REFERENCIA_MESA, periodo));
      const p = metricasMesa(conta.criativos.flatMap((c) => diasDoPeriodo(c.dias, REFERENCIA_MESA, periodo)));
      for (const chave of ["gastoCentavos", "impressoes", "cliquesLink", "resultados"]) assert.equal(p[chave], m[chave]);
    }
  }
});
