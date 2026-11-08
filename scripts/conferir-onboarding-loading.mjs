import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  ATRASO_INDICADOR_MS,
  LIMIAR_OPERACAO_DEMORADA_MS,
  estadoVisualDaOperacao,
} from "../app/(fluxo)/onboarding/tempo-da-operacao.ts";

const ler = (arquivo) => readFile(new URL(arquivo, import.meta.url), "utf8");

test("operação rápida bloqueia duplicação sem piscar indicador", () => {
  assert.equal(estadoVisualDaOperacao(true, 0), "oculto");
  assert.equal(
    estadoVisualDaOperacao(true, ATRASO_INDICADOR_MS - 1),
    "oculto",
  );
  assert.equal(estadoVisualDaOperacao(false, LIMIAR_OPERACAO_DEMORADA_MS), "oculto");
});

test("operação média e demorada têm estados diferentes", () => {
  assert.equal(estadoVisualDaOperacao(true, ATRASO_INDICADOR_MS), "visivel");
  assert.equal(
    estadoVisualDaOperacao(true, LIMIAR_OPERACAO_DEMORADA_MS - 1),
    "visivel",
  );
  assert.equal(
    estadoVisualDaOperacao(true, LIMIAR_OPERACAO_DEMORADA_MS),
    "demorado",
  );
});

test("resposta preserva trava anterior ao render e recuperação incerta", async () => {
  const chat = await ler("../app/(fluxo)/onboarding/Chat.tsx");
  assert.match(chat, /envioTravado\.current = true/);
  assert.match(chat, /Não sabemos se a resposta foi salva/);
  assert.match(chat, /window\.location\.reload\(\)/);
});

test("contas, marca e agenda recusam clique duplo", async () => {
  const [contas, marca, agenda] = await Promise.all([
    ler("../app/(fluxo)/onboarding/contas/Contas.tsx"),
    ler("../app/(fluxo)/onboarding/marca/Marca.tsx"),
    ler("../app/(fluxo)/onboarding/concluido/AgendaPropria.tsx"),
  ]);
  assert.match(contas, /if \(enviando \|\| aviso\) return/);
  assert.match(marca, /if \(enviando \|\| aviso \|\| uploadsAtivos > 0 \|\| analisesAtivas > 0\) return/);
  assert.match(agenda, /if \(!horario \|\| ocupado\) return/);
  assert.match(agenda, /if \(ocupado\) return/);
});

test("falhas oferecem retry efetivo sem declarar confirmação", async () => {
  const [voz, agenda] = await Promise.all([
    ler("../app/(fluxo)/onboarding/RespostaPorVoz.tsx"),
    ler("../app/(fluxo)/onboarding/concluido/AgendaPropria.tsx"),
  ]);
  assert.match(voz, /Tentar o microfone novamente/);
  assert.match(voz, /onClick=\{\(\) => void iniciar\(\)\}/);
  assert.match(agenda, /Atualizar agenda/);
  assert.match(agenda, /Ainda não há confirmação do Google/);
});

test("entrada, celular e movimento reduzido continuam cobertos", async () => {
  const [loading, conversa, agendaCss] = await Promise.all([
    ler("../app/(fluxo)/onboarding/loading.tsx"),
    ler("../app/(fluxo)/onboarding/ChatConversa.module.css"),
    ler("../app/(fluxo)/onboarding/concluido/AgendaPropria.module.css"),
  ]);
  assert.match(loading, /Carregando seu onboarding/);
  assert.match(conversa, /@media\(max-width:640px\)/);
  assert.match(conversa, /@media\(prefers-reduced-motion:reduce\)\{\.envioIndicador\{animation:none\}\}/);
  assert.match(agendaCss, /@media\(max-width:620px\)/);
});
