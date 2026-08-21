"use client";

import { useState } from "react";
import { dinheiro } from "@/lib/formato";
import type { ChaveDeConta } from "@/lib/cadastro/montar";
import { reabrirContaAction, salvarContaAction, type EstadoDasContas } from "./actions";
import { POSTURA, SOBRA, TICKET_FAIXA } from "./regras";

/**
 * As três contas, uma por vez.
 *
 * NÃO É CHAT, e a diferença é o ponto: aqui a pessoa olha um número sobre
 * o próprio negócio e diz se bate. Num balão de chat a resposta dela vira
 * "É isso", que não registra nada.
 */
export function Contas({ inicial }: { inicial: EstadoDasContas }) {
  const [estado, setEstado] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ajustando, setAjustando] = useState<ChaveDeConta | null>(null);
  const [rascunho, setRascunho] = useState("");

  const { contas, leituras } = estado;

  // ============================================================
  // A CONTA FECHADA É A QUE TEM VALOR — ou a que ele disse que não sabe.
  //
  // Isto lia SÓ o jsonb (`contas[c]?.confirmado || contas[c]?.naoSei`), e
  // errava nos dois sentidos:
  //
  //  - jsonb com `naoSei` e coluna preenchida por outro caminho: a tela
  //    mostrava "Você não soube" sobre um número que o próprio cliente
  //    havia confirmado na `/meu-negocio` três horas depois. Medido em
  //    conta real, 19/08.
  //  - coluna preenchida e jsonb sem a chave (valor veio da extração e foi
  //    confirmado na `/meu-negocio`): a tela PERGUNTAVA DE NOVO um número
  //    já conferido, e responder reescrevia a coluna por cima de um
  //    `confirmado`.
  //
  // `lerConta` resolve os dois com a mesma regra: a coluna manda.
  // "Não sei" continua FECHANDO a conta — ele respondeu, e a resposta foi
  // que não sabe. Tratar como pendente devolveria a mesma pergunta e ele
  // chutaria um número na segunda vez só para a tela parar de pedir.
  // ============================================================
  //
  // `reaberta` NÃO fecha: é ele voltando para responder, e a pergunta tem
  // que reaparecer na fila. Ver `reabrirContaAction` e
  // docs/lote-agora-eu-sei.md.
  const fechada = (c: ChaveDeConta) =>
    leituras[c].estado === "respondida" || leituras[c].estado === "nao_sei";
  const atual: ChaveDeConta | null = !fechada("ticket")
    ? "ticket"
    : !fechada("custo")
      ? "custo"
      : !fechada("lucro")
        ? "lucro"
        : null;

  // Uma conta calculada e ainda não confirmada é o estado de confirmação.
  const aConfirmar =
    atual && contas[atual]?.calculado !== null && contas[atual]?.confirmado === false && !contas[atual]?.naoSei
      ? contas[atual]!
      : null;

  async function enviar(entrada: Parameters<typeof salvarContaAction>[0]) {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    const r = await salvarContaAction(entrada);
    setEnviando(false);
    if (!r.ok || !r.estado) {
      setErro(r.erro ?? "Não conseguimos salvar.");
      return;
    }
    setEstado(r.estado);
    setAjustando(null);
    setRascunho("");
  }

  async function reabrir(conta: ChaveDeConta) {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    const r = await reabrirContaAction({ conta });
    setEnviando(false);
    if (!r.ok || !r.estado) {
      setErro(r.erro ?? "Não conseguimos abrir a pergunta.");
      return;
    }
    setEstado(r.estado);
  }

  const pergunta: Record<ChaveDeConta, string> = {
    ticket: "Na média, quanto sai uma venda sua?",
    custo:
      "De cada R$ 100 que entra numa venda, quanto sobra depois de pagar o que você gastou pra entregar?",
    lucro: estado.margem
      ? `Dessa sobra de ${dinheiro(estado.margem)}, quanto você quer que fique no seu bolso?`
      : "Quanto você quer que fique no seu bolso a cada venda?",
  };

  const contador: Record<ChaveDeConta, string> = {
    ticket: "Conta 1 de 3",
    custo: "Conta 2 de 3",
    lucro: "Conta 3 de 3 · última",
  };

  return (
    <>
      <p className="mission-tag">Sua primeira missão · passo 1 de 3</p>
      <h1 className="auth-h">Suas contas</h1>
      <p className="auth-sub">
        Três contas rápidas. Não precisa ser exato — precisa ser mais ou menos certo. E se
        você não souber, tudo bem: a gente marca e resolve numa conversa.
      </p>

      {erro && <p className="form-error">{erro}</p>}

      {/* ---- o que já fechou ---- */}
      {(["ticket", "custo", "lucro"] as ChaveDeConta[])
        .filter((c) => fechada(c))
        .map((c) => {
          const leitura = leituras[c];
          const quando = estado.confirmadoEm[c];
          return (
            <p className="conta-feita" key={c}>
              <span className="eyebrow">{contador[c]}</span>
              {/* O VALOR VEM DA COLUNA, não do `calculado` do jsonb: o jsonb
                  guarda o que a conta produziu na hora, e a coluna guarda o
                  que vale hoje. Quando o cliente corrigiu o número depois,
                  pela `/meu-negocio`, os dois são diferentes — e o certo é o
                  que a IA está usando. */}
              <b>
                {leitura.estado === "respondida"
                  ? dinheiro(leitura.valor)
                  : "Você não soube — a gente resolve na conversa."}
              </b>
              {leitura.estado === "respondida" && quando && (
                <span className="conta-origem">
                  ✓ você conferiu isso em {new Date(quando).toLocaleDateString("pt-BR")}
                </span>
              )}

              {/* ============================================================
                  A PORTA DE VOLTA. Sem ela, "não sei" era terminal: nenhuma
                  das quatro superfícies do produto reoferecia a pergunta, e
                  como `montarCadastro` exige os seis campos, o cliente nunca
                  disparava o pipeline — sem erro e sem pendência acionável.
                  Medido em docs/buraco-numeros-dificeis.md.

                  ISTO NÃO É A TELA COBRANDO. A razão de "não sei" fechar a
                  conta era não devolver a mesma pergunta a quem já disse que
                  não sabe — ele chutaria um número na segunda vez só para a
                  tela parar de pedir. Um caminho que ELE clica é o contrário
                  disso: é ele voltando. A diferença é quem começou.

                  Por isso o rótulo é "Agora eu sei" e não "Responder de
                  novo": um diz que ele mudou, o outro diz que a gente
                  insiste.
                  ============================================================ */}
              {leitura.estado === "nao_sei" && (
                <button
                  className="text-fallback"
                  type="button"
                  disabled={enviando}
                  onClick={() => reabrir(c)}
                >
                  Agora eu sei
                </button>
              )}
            </p>
          );
        })}

      {atual && (
        <section className="hero-card">
          <span className="eyebrow">{contador[atual]}</span>

          {/* ---------- confirmação: o número que ele precisa ver ---------- */}
          {aConfirmar ? (
            <>
              <p className="hero-phrase">
                {atual === "custo"
                  ? `Então cada venda de ${dinheiro(estado.ticket ?? 0)} te custa uns ${dinheiro(aConfirmar.calculado ?? 0)} pra entregar, e sobram ${dinheiro((estado.ticket ?? 0) - (aConfirmar.calculado ?? 0))}.`
                  : `Então ficam ${dinheiro(aConfirmar.calculado ?? 0)} com você a cada venda, e a IA pode gastar até ${dinheiro((estado.margem ?? 0) - (aConfirmar.calculado ?? 0))} pra trazer esse cliente.`}
              </p>

              {ajustando === atual ? (
                <div className="fallback-field">
                  <label className="sr-only" htmlFor="ajuste">
                    O valor certo
                  </label>
                  <input
                    id="ajuste"
                    autoFocus
                    inputMode="decimal"
                    placeholder="O valor certo, em reais"
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        enviar({ conta: atual, escolha: rascunho, confirmando: true });
                      }
                    }}
                  />
                  <button
                    className="mini-send"
                    type="button"
                    disabled={enviando}
                    onClick={() => enviar({ conta: atual, escolha: rascunho, confirmando: true })}
                  >
                    {enviando ? "…" : "Salvar"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="cta"
                    type="button"
                    disabled={enviando}
                    onClick={() =>
                      enviar({
                        conta: atual,
                        escolha: String(aConfirmar.calculado ?? 0),
                        confirmando: true,
                      })
                    }
                  >
                    É mais ou menos isso
                  </button>
                  <button
                    className="text-fallback"
                    type="button"
                    onClick={() => {
                      setAjustando(atual);
                      setRascunho("");
                    }}
                  >
                    não, deixa eu ajustar
                  </button>
                </>
              )}
            </>
          ) : (
            /* ---------- a pergunta ---------- */
            <>
              {/* A tela diz que sabe que ele voltou. Fazer a pergunta como
                  se fosse a primeira vez apagaria da conversa um fato que o
                  banco guarda — e ele lembra que respondeu "não sei". */}
              {leituras[atual].estado === "reaberta" && (
                <p className="conta-hint">
                  Da última vez você não soube, e tudo bem. Aqui está ela de novo.
                </p>
              )}

              <p className="conta-pergunta">{pergunta[atual]}</p>

              {atual === "custo" && (
                <p className="conta-hint">
                  Conte material, produto, comissão. Não conte aluguel nem salário fixo.
                </p>
              )}

              {atual === "ticket" && (
                <>
                  <div className="fallback-field">
                    <label className="sr-only" htmlFor="ticket">
                      Quanto sai uma venda
                    </label>
                    <input
                      id="ticket"
                      autoFocus
                      inputMode="decimal"
                      placeholder="Ex: 80"
                      value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          enviar({ conta: "ticket", escolha: rascunho });
                        }
                      }}
                    />
                    <button
                      className="mini-send"
                      type="button"
                      disabled={enviando}
                      onClick={() => enviar({ conta: "ticket", escolha: rascunho })}
                    >
                      {enviando ? "…" : "Enviar"}
                    </button>
                  </div>
                  <p className="conta-hint">ou escolha uma faixa:</p>
                  <div className="chips-row">
                    {Object.keys(TICKET_FAIXA).map((f) => (
                      <button
                        key={f}
                        className="chip-opt"
                        type="button"
                        disabled={enviando}
                        onClick={() => enviar({ conta: "ticket", escolha: f })}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {atual === "custo" && (
                <div className="chips-row">
                  {SOBRA.map((o) => (
                    <button
                      key={o.id}
                      className="chip-opt"
                      type="button"
                      disabled={enviando}
                      onClick={() => enviar({ conta: "custo", escolha: o.id })}
                    >
                      {o.rotulo}
                      {estado.ticket !== null && (
                        <span className="chip-valor">
                          {" "}
                          ({dinheiro((estado.ticket * o.sobraPct) / 100)})
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    className="chip-opt"
                    type="button"
                    disabled={enviando}
                    onClick={() => enviar({ conta: "custo", escolha: "", naoSei: true })}
                  >
                    Não sei
                  </button>
                </div>
              )}

              {atual === "lucro" && (
                <div className="chips-row">
                  {POSTURA.map((o) => (
                    <button
                      key={o.id}
                      className="chip-opt"
                      type="button"
                      disabled={enviando}
                      onClick={() => enviar({ conta: "lucro", escolha: o.id })}
                    >
                      {o.rotulo}
                      {estado.margem !== null && (
                        <span className="chip-valor">
                          {" "}
                          (fica {dinheiro(estado.margem * o.fracaoQueFica)})
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    className="chip-opt"
                    type="button"
                    disabled={enviando}
                    onClick={() => enviar({ conta: "lucro", escolha: "", naoSei: true })}
                  >
                    Não sei
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {!atual && (
        <>
          {/* O QUE FALTA vem de `resumirPendencias`, o mesmo módulo que o
              `/inicio` usa — e o mesmo `montarCadastro` por baixo. As duas
              telas têm que dizer a MESMA coisa sobre o mesmo campo; se cada
              uma escrevesse a própria frase, divergiriam na primeira
              edição, e a pessoa leria "a gente te liga" numa e "termine seu
              cadastro" na outra. */}
          {!estado.resumo.vazio && (
            <section className="pendencia-bloco">
              <b>{estado.resumo.titulo}</b>
              <p>{estado.resumo.corpo}</p>
              {estado.resumo.acao && (
                <a className="cta" href={estado.resumo.acao.href}>
                  {estado.resumo.acao.rotulo}
                </a>
              )}
            </section>
          )}

          {/* O passo 2 (visual da marca) ainda não existe. Botão visível e
              desabilitado, com o motivo escrito — não um link para 404. */}
          <p className="form-notice">
            Suas contas estão guardadas. O passo 2 (o visual da sua marca) ainda não está
            disponível — assim que estiver, é daqui que ele continua.
          </p>
          <button className="cta" type="button" disabled>
            Continuar para o visual da marca
          </button>
        </>
      )}
    </>
  );
}
