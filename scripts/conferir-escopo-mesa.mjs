import assert from "node:assert/strict";
import test from "node:test";
import { escopoDaMesa, negocioNaMesa } from "../lib/gestor/escopo-da-mesa.ts";

function base(papel, userId = "gestor-a") {
  return {
    userId, papel, negociosCompletos: true, atribuicoesCompletas: true, membrosCompletos: true,
    negocios: [
      { id: "cliente-direto", agenciaId: null },
      { id: "cliente-a1", agenciaId: "agencia-a" },
      { id: "cliente-a2", agenciaId: "agencia-a" },
      { id: "cliente-b1", agenciaId: "agencia-b" },
    ],
    atribuicoes: [
      { userId: "gestor-a", businessId: "cliente-a1", agenciaId: "agencia-a", ativa: true },
      { userId: "gestor-a", businessId: "cliente-a2", agenciaId: "agencia-a", ativa: false },
      { userId: "gestor-a", businessId: "cliente-b1", agenciaId: "agencia-b", ativa: true },
      { userId: "gestor-v2g", businessId: "cliente-direto", agenciaId: null, ativa: true },
      { userId: "gestor-v2g", businessId: "cliente-b1", agenciaId: null, ativa: true },
    ],
    membros: [
      { userId: "gestor-a", agenciaId: "agencia-a", ativo: true },
      { userId: "gestor-a", agenciaId: "agencia-b", ativo: false },
    ],
  };
}

test("cliente não acessa a mesa mesmo se houver atribuição indevida", () => {
  assert.deepEqual(escopoDaMesa(base("cliente")), { ok: false, motivo: "papel_negado" });
});

test("gestor de agência só vê negócio atribuído da agência ativa", () => {
  const escopo = escopoDaMesa(base("gestor_agencia"));
  assert.deepEqual(escopo, { ok: true, businessIds: ["cliente-a1"] });
  assert.equal(negocioNaMesa(escopo, "cliente-b1"), false);
  assert.equal(negocioNaMesa(escopo, "cliente-a2"), false);
});

test("atribuído sem vínculo com agência continua sem acesso", () => {
  const dados = base("gestor_agencia");
  dados.membros = [];
  assert.deepEqual(escopoDaMesa(dados), { ok: true, businessIds: [] });
});

test("ID de agência divergente na atribuição não dá acesso", () => {
  const dados = base("gestor_agencia");
  dados.atribuicoes[0].agenciaId = "agencia-b";
  assert.deepEqual(escopoDaMesa(dados), { ok: true, businessIds: [] });
});

test("gestor V2G só vê sua carteira atribuída, inclusive cliente de agência", () => {
  assert.deepEqual(escopoDaMesa(base("gestor_v2g", "gestor-v2g")),
    { ok: true, businessIds: ["cliente-direto", "cliente-b1"] });
});

test("administrador V2G tem carteira global somente com papel explícito", () => {
  assert.deepEqual(escopoDaMesa(base("admin_v2g")).businessIds,
    ["cliente-direto", "cliente-a1", "cliente-a2", "cliente-b1"]);
  assert.deepEqual(escopoDaMesa(base(null)), { ok: false, motivo: "papel_negado" });
});

test("sem identidade e consultas truncadas o acesso falha fechado", () => {
  assert.deepEqual(escopoDaMesa(base("gestor_agencia", null)), { ok: false, motivo: "sem_identidade" });
  const dados = base("gestor_agencia");
  dados.atribuicoesCompletas = false;
  assert.deepEqual(escopoDaMesa(dados), { ok: false, motivo: "consulta_incompleta" });
  dados.atribuicoesCompletas = true;
  dados.membrosCompletos = false;
  assert.deepEqual(escopoDaMesa(dados), { ok: false, motivo: "consulta_incompleta" });
  dados.membrosCompletos = true;
  dados.negociosCompletos = false;
  assert.deepEqual(escopoDaMesa(dados), { ok: false, motivo: "consulta_incompleta" });
});
