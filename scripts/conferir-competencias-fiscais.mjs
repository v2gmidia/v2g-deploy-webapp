import assert from "node:assert/strict";
import { test } from "node:test";
import { planejarCompetenciasFiscais } from "../lib/contratacao/competencias-fiscais.ts";

test("semestral atravessa o ano com distribuição fiscal explícita", () => {
  const valores = [100000, 100000, 100000, 90000, 90000, 90000];
  const parcelas = planejarCompetenciasFiscais({
    periodo: "semiannual_upfront", contas: 2, totalCentavos: 570000,
    primeiroMesDeServico: "2026-11-01",
    valoresPorCompetenciaCentavos: valores,
  });
  assert.deepEqual(parcelas.map((p) => p.competencia), [
    "2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01",
  ]);
  assert.deepEqual(parcelas.map((p) => p.valorCentavos), valores);
  assert.equal(parcelas.reduce((soma, p) => soma + p.valorCentavos, 0), 570000);
});

test("anual usa valores aprovados; mensal não presume renovação", () => {
  const valores = [50000, 50000, 50000, 50000, 44000, 42000, 42000, 40000, 40000, 40000, 40000, 40000];
  const anual = planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 528000,
    primeiroMesDeServico: "2026-10-01",
    valoresPorCompetenciaCentavos: valores,
  });
  assert.equal(anual.length, 12);
  assert.deepEqual(anual.map((p) => p.valorCentavos), valores);
  assert.equal(anual[11].competencia, "2027-09-01");
  assert.deepEqual(planejarCompetenciasFiscais({
    periodo: "monthly", contas: 1, totalCentavos: 50000,
    primeiroMesDeServico: "2026-10-01",
  }), [{ competencia: "2026-10-01", valorCentavos: 50000 }]);
});

test("recusa mês parcial e preço divergente sem criar obrigação fictícia", () => {
  assert.throws(() => planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 528000,
    primeiroMesDeServico: "2026-10-15",
    valoresPorCompetenciaCentavos: Array(12).fill(44000),
  }), /primeiro mês integral/);
  assert.throws(() => planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 600000,
    primeiroMesDeServico: "2026-10-01",
    valoresPorCompetenciaCentavos: Array(12).fill(50000),
  }), /não confere/);
});

test("plano antecipado não transforma divisão aritmética em regra fiscal", () => {
  assert.throws(() => planejarCompetenciasFiscais({
    periodo: "semiannual_upfront", contas: 1, totalCentavos: 285000,
    primeiroMesDeServico: "2026-10-01",
  }), /distribuição fiscal aprovada/);
  assert.throws(() => planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 528000,
    primeiroMesDeServico: "2026-10-01",
    valoresPorCompetenciaCentavos: Array(12).fill(45000),
  }), /distribuição fiscal aprovada/);
});
