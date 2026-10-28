import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ambienteTs } from "./test-utils/ts-isolado.mjs";

const voz = ambienteTs().load("lib/onboarding/voz.ts");
const fonte = (caminho) => readFileSync(caminho, "utf8");

test("configuracao distingue voz disponivel, ausente e desativada", () => {
  assert.equal(voz.estadoDaVoz(true, false), "disponivel");
  assert.equal(voz.estadoDaVoz(false, false), "nao_configurada");
  assert.equal(voz.estadoDaVoz(true, true), "desativada");
  assert.match(voz.recadoDaVozIndisponivel("nao_configurada"), /Digite sua resposta/);
  assert.match(voz.recadoDaVozIndisponivel("desativada"), /temporariamente desativada/);
});

test("permissao negada e ausencia de aparelho mantem o teclado como saida", () => {
  assert.match(voz.recadoDeFalhaDoMicrofone({ name: "NotAllowedError" }), /Autorize no navegador ou digite/);
  assert.match(voz.recadoDeFalhaDoMicrofone({ name: "NotFoundError" }), /Não encontrei um microfone/);
});

test("falhas de sessao e transcricao orientam recuperacao sem resposta crua", () => {
  assert.match(voz.recadoDeFalhaDaTranscricao(401), /Entre novamente/);
  assert.match(voz.recadoDeFalhaDaTranscricao(403), /Escolha um negócio/);
  assert.match(voz.recadoDeFalhaDaTranscricao(429), /Aguarde um minuto ou digite/);
  assert.match(voz.recadoDeFalhaDaTranscricao(502), /Tente novamente ou digite/);
});

test("fala ficticia entra no texto editavel sem salvar automaticamente", () => {
  assert.equal(
    voz.juntarTextoEFala("A cliente precisa", " divulgar o serviço "),
    "A cliente precisa divulgar o serviço",
  );
  const chat = fonte("app/(fluxo)/onboarding/Chat.tsx");
  assert.match(chat, /value=\{enviando \? "" : texto\}/);
  assert.match(chat, /onChange=\{\(e\) => setTexto\(e\.target\.value\)\}/);
  assert.match(chat, /aoTranscrever=\{receberVoz\}/);
  assert.match(chat, /onSubmit=\{\(e\) => \{ e\.preventDefault\(\); void enviar\(atual, texto, "texto"\); \}\}/);
});

test("a tela explica a indisponibilidade em perguntas abertas, atividade e area", () => {
  const chat = fonte("app/(fluxo)/onboarding/Chat.tsx");
  assert.match(chat, /<strong>Responder por voz:<\/strong>/);
  assert.match(chat, /seletorDeAtividade && !enviando && !incerto && vozIndisponivel/);
  assert.match(chat, /atual\.pedeCidade && !mostrarTexto && !enviando && !incerto && vozIndisponivel/);
  assert.match(chat, /vozIndisponivel && <VozIndisponivel estado=\{vozIndisponivel\} compacta/);
});

test("nenhuma sessao externa nasce antes da permissao do microfone", () => {
  const componente = fonte("app/(fluxo)/onboarding/RespostaPorVoz.tsx");
  const inicio = componente.slice(componente.indexOf("async function iniciar()"));
  assert.ok(inicio.indexOf("await navigator.mediaDevices.getUserMedia") < inicio.indexOf("await obterToken()"));
  assert.doesNotMatch(componente, /void obterToken\(\)\.catch/);
});
