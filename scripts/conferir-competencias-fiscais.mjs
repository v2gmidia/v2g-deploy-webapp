import assert from "node:assert/strict";
import { test } from "node:test";
import { planejarCompetenciasFiscais } from "../lib/contratacao/competencias-fiscais.ts";

test("semestral atravessa o ano com uma parcela por mês e total exato", () => {
  const parcelas = planejarCompetenciasFiscais({
    periodo: "semiannual_upfront", contas: 2, totalCentavos: 570000,
    primeiroMesDeServico: "2026-11-01",
  });
  assert.deepEqual(parcelas.map((p) => p.competencia), [
    "2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01",
  ]);
  assert.deepEqual(parcelas.map((p) => p.valorCentavos), Array(6).fill(95000));
  assert.equal(parcelas.reduce((soma, p) => soma + p.valorCentavos, 0), 570000);
});

test("anual prepara doze meses; mensal não presume renovação", () => {
  const anual = planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 528000,
    primeiroMesDeServico: "2026-10-01",
  });
  assert.equal(anual.length, 12);
  assert.equal(anual[0].valorCentavos, 44000);
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
  }), /primeiro mês integral/);
  assert.throws(() => planejarCompetenciasFiscais({
    periodo: "annual_upfront", contas: 1, totalCentavos: 600000,
    primeiroMesDeServico: "2026-10-01",
  }), /não confere/);
});
