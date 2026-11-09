import assert from "node:assert/strict";
import { montarCadastroOperacional, type NegocioParaCadastro } from "../lib/cadastro/montar.ts";
import { estadoDaConclusao } from "../lib/onboarding/conclusao.ts";
import { publicacaoAutorizada } from "../lib/onboarding/marca.ts";

const resposta = (texto: string) => ({ texto, echo: texto, origem: "chip", em: "2026-11-09T12:00:00-03:00" });

function negocioV2(modelo: "direto" | "agencia" = "direto"): NegocioParaCadastro {
  const agencia = modelo === "agencia";
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: agencia ? "Piligrin" : "Empresa direta",
    description: agencia ? "Perfil canônico da agência" : "Produto vendido diretamente para empresas",
    avg_ticket_min: null,
    avg_ticket_max: null,
    avg_direct_cost: null,
    target_profit_per_customer: null,
    monthly_budget: 3000,
    cadastro_estado: null,
    onboarding: {
      versao: 2,
      respostas: {
        _contrato_operacional: "cadastro_operacional.v2",
        operador: resposta(agencia
          ? "Uma agência ou gestor opera para o anunciante"
          : "O próprio anunciante opera os anúncios"),
        nome: resposta(agencia ? "Dúú Gomes" : "Empresa direta"),
        contratante: resposta(agencia ? "Piligrin" : "É o próprio anunciante"),
        ramo: resposta("Indústria de bebidas"),
        descricao: resposta("Chope de vinho para bares, pontos de venda e empresas"),
        publico: resposta("Bares, pontos de venda e empresas"),
        praca: resposta("Brasil inteiro"),
        destino: resposta("WhatsApp"),
        campanha: resposta("Já existe uma campanha para acompanhar"),
      },
    },
  };
}

{
  const cadastro = montarCadastroOperacional(negocioV2("direto"));
  assert.equal(cadastro.completo, true);
  assert.equal(cadastro.completo && cadastro.validavel, true);
  if (!cadastro.completo || !cadastro.validavel) throw new Error("cadastro direto deveria ser validável");
  assert.equal(cadastro.payload.relacao_de_acesso.modelo, "direto");
  assert.equal(cadastro.payload.anunciante.comprador_prioritario, "Bares, pontos de venda e empresas");
  assert.equal("ticket_medio" in cadastro.payload, false);
  assert.equal("custo_direto_medio" in cadastro.payload, false);
  assert.equal("lucro_desejado_por_cliente" in cadastro.payload, false);
}

{
  const negocio = negocioV2("agencia");
  const nomeCanonicoAntes = negocio.name;
  const cadastro = montarCadastroOperacional(negocio);
  assert.equal(cadastro.completo && cadastro.validavel, true);
  if (!cadastro.completo || !cadastro.validavel) throw new Error("B2B2B deveria ser validável");
  assert.equal(cadastro.payload.anunciante.nome, "Dúú Gomes");
  assert.equal(cadastro.payload.relacao_de_acesso.contratante_nome, "Piligrin");
  assert.equal(cadastro.payload.relacao_de_acesso.identidade_com_acesso, "agencia");
  assert.equal(negocio.name, nomeCanonicoAntes, "montagem não renomeia a agência");
}

{
  const legado = negocioV2();
  legado.onboarding = {};
  legado.name = "Negócio legado";
  legado.description = "Descrição legada ainda válida";
  const cadastro = montarCadastroOperacional(legado);
  assert.deepEqual(cadastro, { completo: true, validavel: false, motivo: "legado_sem_contexto_operacional" });
}

for (const verba of [null, 0]) {
  const negocio = negocioV2();
  negocio.monthly_budget = verba;
  const cadastro = montarCadastroOperacional(negocio);
  assert.equal(cadastro.completo, false);
  if (cadastro.completo) throw new Error("verba ausente/zero não deveria completar");
  assert.equal(cadastro.pendencias.some((p) => p.campo === "orcamento_mensal_disponivel"), true);
}

{
  const negocio = negocioV2("agencia");
  const doc = negocio.onboarding as { respostas: Record<string, unknown> };
  doc.respostas._oferta = {
    preco_referencia: {
      moeda: "BRL", valor_min: 69, valor_max: 70, unidade: "fardo",
      certeza: "aproximado", fonte: "relato de Victor", observado_em: "2026-11-09T12:00:00-03:00",
    },
  };
  const cadastro = montarCadastroOperacional(negocio);
  if (!cadastro.completo || !cadastro.validavel) throw new Error("preço opcional não deveria bloquear");
  assert.equal(cadastro.payload.oferta?.preco_referencia?.unidade, "fardo");
  assert.equal(cadastro.payload.oferta?.preco_referencia?.certeza, "aproximado");
  assert.equal("ticket_medio" in cadastro.payload, false, "preço por fardo não vira ticket");
}

{
  const poucos = negocioV2();
  (poucos.onboarding as { respostas: Record<string, { texto: string }> }).respostas.descricao!.texto = "🍷".repeat(5);
  assert.equal(montarCadastroOperacional(poucos).completo, false, "cinco code points não satisfazem min_length=10");
  const dez = negocioV2();
  (dez.onboarding as { respostas: Record<string, { texto: string }> }).respostas.descricao!.texto = "🍷".repeat(10);
  assert.equal(montarCadastroOperacional(dez).completo, true);
}

{
  const negocio = negocioV2("agencia");
  const doc = negocio.onboarding as { respostas: Record<string, unknown> };
  doc.respostas._contatos_anunciante = { site_url: null, site_nao_tem: true, instagram_handle: null };
  Object.assign(negocio, { site_url: "https://piligrin.example", instagram_handle: "@piligrin" });
  (negocio.onboarding as Record<string, unknown>).marca = {
    aparencia: "", coresConfirmadas: [], aparenciaNaoSei: true, siteNaoTenho: true,
    em: "2026-11-09T12:00:00-03:00",
  };
  (negocio.onboarding as Record<string, unknown>).conclusao = {
    em: "2026-11-09T12:00:00-03:00", proximoPasso: "agendamento_pendente",
  };
  assert.equal(estadoDaConclusao(negocio).concluido, true,
    "site canônico da agência não decide o contato do anunciante");
}

assert.equal(publicacaoAutorizada({ respostas: {} }), false);
assert.equal(publicacaoAutorizada({ autorizacao_publicacao: {
  estado: "autorizada", em: "2026-11-09T12:00:00-03:00",
} }), true);

console.log("PASS onboarding operacional V2: B2B, B2B2B, legado, Unicode, preço e guardas separados");
