"use client";

import { useState } from "react";
import { dinheiro } from "@/lib/formato";
import type { ChaveDeConta } from "@/lib/cadastro/montar";
import { reabrirContaAction, salvarContaAction, type EstadoDasContas } from "./actions";
import { numeroDoTexto, SOBRA, TICKET_FAIXA } from "./regras";

function faixaDoTicket(minimo: number | null, maximo: number | null): string {
  if (minimo === null) return "Valor informado em faixa";
  if (maximo === null) return `Acima de ${dinheiro(minimo, "BRL")}`;
  if (minimo === 0) return `Até ${dinheiro(maximo, "BRL")}`;
  return `${dinheiro(minimo, "BRL")} a ${dinheiro(maximo, "BRL")}`;
}

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
  const [aviso, setAviso] = useState<string | null>(null);
  const [operacao, setOperacao] = useState<"salvar" | "reabrir" | null>(null);
  const [ajustando, setAjustando] = useState<ChaveDeConta | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [confirmandoNaoSei, setConfirmandoNaoSei] = useState<ChaveDeConta | null>(null);
  const enviando = operacao !== null;

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
    atual && !(atual === "custo" && estado.ticketEmFaixa)
      && contas[atual]?.calculado !== null && contas[atual]?.confirmado === false && !contas[atual]?.naoSei
      ? contas[atual]!
      : null;

  async function enviar(entrada: Omit<Parameters<typeof salvarContaAction>[0], "businessId">) {
    if (enviando || aviso) return;
    setOperacao("salvar");
    setErro(null);
    setAviso(null);
    try {
      const r = await salvarContaAction({ ...entrada, businessId: estado.businessId });
      if (!r.ok && r.recarregar) {
        setAviso("Não conseguimos confirmar a gravação. Parte da resposta pode ter sido salva. Recarregue para conferir antes de enviar de novo.");
        return;
      }
      if (!r.ok) {
        setErro(r.erro ?? "Não conseguimos salvar.");
        return;
      }
      if (!r.estado) {
        setAviso("Sua resposta foi salva, mas a tela não conseguiu carregar o estado atualizado. Recarregue para continuar.");
        return;
      }
      setEstado(r.estado);
      setAjustando(null);
      setRascunho("");
      setConfirmandoNaoSei(null);
    } catch {
      setAviso("Não conseguimos confirmar se a resposta foi salva. Recarregue para conferir antes de enviar de novo.");
    } finally {
      setOperacao(null);
    }
  }

  async function reabrir(conta: ChaveDeConta) {
    if (enviando || aviso) return;
    setOperacao("reabrir");
    setErro(null);
    setAviso(null);
    try {
      const r = await reabrirContaAction({ conta, businessId: estado.businessId });
      if (!r.ok && r.recarregar) {
        setAviso("Não conseguimos confirmar se a pergunta foi reaberta. Recarregue para conferir antes de tentar novamente.");
        return;
      }
      if (!r.ok) {
        setErro(r.erro ?? "Não conseguimos abrir a pergunta.");
        return;
      }
      if (!r.estado) {
        setAviso("A pergunta foi reaberta, mas a tela não conseguiu carregar o estado atualizado. Recarregue para continuar.");
        return;
      }
      setEstado(r.estado);
    } catch {
      setAviso("Não conseguimos confirmar se a pergunta foi reaberta. Recarregue para conferir antes de tentar novamente.");
    } finally {
      setOperacao(null);
    }
  }

  const pergunta: Record<ChaveDeConta, string> = {
    ticket: "Qual é o ticket médio das suas vendas?",
    custo: "Quanto custa, em média, entregar uma venda?",
    lucro: estado.margem
      ? `Depois de pagar o custo da venda, qual valor mínimo precisa ficar com o seu negócio?`
      : "Qual valor mínimo precisa ficar com o seu negócio em cada venda?",
  };

  const contador: Record<ChaveDeConta, string> = {
    ticket: "Conta 1 de 3",
    custo: "Conta 2 de 3",
    lucro: "Conta 3 de 3 · última",
  };
  const indisponivel = enviando || !!aviso;
  const previa = numeroDoTexto(rascunho);

  return (
    <>
      <p className="mission-tag">Sua primeira missão · passo 1 de 3</p>
      <h1 className="auth-h">Suas contas</h1>
      <p className="auth-sub">
        Primeiro, o valor médio de uma venda. Depois, o custo para entregar e quanto você precisa manter.
        Pode estimar ou deixar uma dúvida para conferir com o gestor.
      </p>

      {aviso && <p className="form-warning" role="status">{aviso} <button type="button" onClick={() => window.location.reload()}>Recarregar</button></p>}
      {enviando && (
        <p className="conta-salvando" role="status" aria-live="polite">
          {operacao === "reabrir" ? "Reabrindo a pergunta…" : "Salvando sua resposta…"}
        </p>
      )}

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
                  ? c === "ticket" && estado.ticketEmFaixa
                    ? faixaDoTicket(estado.ticketMinimo, estado.ticketMaximo)
                    : dinheiro(leitura.valor, "BRL")
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
                  disabled={indisponivel}
                  onClick={() => reabrir(c)}
                >
                  Agora eu sei
                </button>
              )}
            </p>
          );
        })}

      {atual && (
        <section className="hero-card" aria-busy={enviando}>
          <span className="eyebrow">{contador[atual]}</span>
          {erro && <p className="form-error" role="alert">{erro}</p>}

          {/* ---------- confirmação: o número que ele precisa ver ---------- */}
          {aConfirmar ? (
            <>
              <p className="hero-phrase">
                {atual === "custo"
                  ? `Então cada venda de ${dinheiro(estado.ticket ?? 0, "BRL")} te custa uns ${dinheiro(aConfirmar.calculado ?? 0, "BRL")} pra entregar, e sobram ${dinheiro((estado.ticket ?? 0) - (aConfirmar.calculado ?? 0), "BRL")}.`
                  : `Você quer manter cerca de ${dinheiro(aConfirmar.calculado ?? 0, "BRL")} por venda. É isso?`}
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
                    aria-label="Valor em reais"
                    placeholder="Ex.: 50,00"
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        enviar({ conta: atual, escolha: rascunho });
                      }
                    }}
                  />
                  {previa !== null && <span className="conta-previa">{dinheiro(previa, "BRL")}</span>}
                  <button
                    className="mini-send"
                    type="button"
                    disabled={indisponivel}
                    onClick={() => enviar({ conta: atual, escolha: rascunho })}
                  >
                    {enviando ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="cta"
                    type="button"
                    disabled={indisponivel}
                    onClick={() =>
                      enviar({
                        conta: atual,
                        escolha: String(aConfirmar.calculado ?? 0),
                        confirmando: true,
                      })
                    }
                  >
                    {enviando ? "Salvando…" : "É mais ou menos isso"}
                  </button>
                  <button
                    className="text-fallback"
                    type="button"
                    disabled={indisponivel}
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

              {atual === "ticket" && (
                <p className="conta-hint">
                  É o valor que cada cliente costuma pagar numa compra. Se você vende itens diferentes, pense numa venda comum.
                </p>
              )}

              {atual === "custo" && (
                <details className="conta-ajuda">
                  <summary>O que entra nesse custo?</summary>
                  <p id="ajuda-custo">
                    Mercadoria ou insumos, impostos e taxas da venda, entrega, comissões e trabalho diretamente ligado a ela.
                    Não inclua todo o aluguel ou a folha se não conseguir atribuí-los a uma venda.
                  </p>
                </details>
              )}

              {atual === "lucro" && estado.margem !== null && (
                <p className="conta-hint">
                  Hoje sobram cerca de {dinheiro(estado.margem, "BRL")} antes dos anúncios. Informe quanto dessa sobra não pode ser usado para conquistar o cliente.
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
                      placeholder="Ex.: 80,00"
                      value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          enviar({ conta: "ticket", escolha: rascunho });
                        }
                      }}
                    />
                    {previa !== null && <span className="conta-previa">{dinheiro(previa, "BRL")}</span>}
                    <button
                      className="mini-send"
                      type="button"
                      disabled={indisponivel}
                      onClick={() => enviar({ conta: "ticket", escolha: rascunho })}
                    >
                      {enviando ? "Salvando…" : "Conferir"}
                    </button>
                  </div>
                  <p className="conta-hint">Digite um valor em reais. Por exemplo, 50 aparece como R$ 50,00.</p>
                  <p className="conta-hint">ou escolha uma faixa:</p>
                  <div className="chips-row">
                    {Object.keys(TICKET_FAIXA).map((f) => (
                      <button
                        key={f}
                        className="chip-opt"
                        type="button"
                        disabled={indisponivel}
                        onClick={() => enviar({ conta: "ticket", escolha: f })}
                      >
                        {f}
                      </button>
                    ))}
                    <button className="chip-opt" type="button" disabled={indisponivel}
                      onClick={() => setConfirmandoNaoSei("ticket")}>
                      Não sei
                    </button>
                  </div>
                </>
              )}

              {atual === "custo" && (
                <>
                {estado.ticketEmFaixa && <p className="conta-hint">Você informou uma faixa para o valor da venda. Não vamos transformar o meio dessa faixa em um custo por venda. Deixe esta conta para conferir na conversa com o gestor.</p>}
                {estado.ticket !== null && !estado.ticketEmFaixa && <div className="conta-direto">
                  <label htmlFor="custo-direto">Se souber o custo de uma venda, digite em reais</label>
                  <div className="fallback-field">
                    <input id="custo-direto" inputMode="decimal" placeholder="Ex.: 50,00" value={rascunho}
                      aria-describedby="ajuda-custo"
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar({ conta: "custo", escolha: rascunho }); } }} />
                    {previa !== null && <span className="conta-previa">{dinheiro(previa, "BRL")}</span>}
                    <button className="mini-send" type="button" disabled={indisponivel} onClick={() => enviar({ conta: "custo", escolha: rascunho })}>{enviando ? "Salvando…" : "Conferir"}</button>
                  </div>
                </div>}
                {!estado.ticketEmFaixa && <p className="conta-hint">Ou escolha uma estimativa para conferir antes de salvar:</p>}
                <div className="chips-row">
                  {estado.ticket === null && <p className="conta-hint">Sem o valor médio da venda, esta conta fica para a conversa com o gestor.</p>}
                  {estado.ticket !== null && !estado.ticketEmFaixa && SOBRA.map((o) => (
                    <button
                      key={o.id}
                      className="chip-opt"
                      type="button"
                      disabled={indisponivel}
                      onClick={() => enviar({ conta: "custo", escolha: o.id })}
                    >
                      {o.rotulo}
                      {estado.ticket !== null && (
                        <span className="chip-valor">
                          {" "}
                          ({dinheiro((estado.ticket * o.sobraPct) / 100, "BRL")})
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    className="chip-opt"
                    type="button"
                    disabled={indisponivel}
                    onClick={() => setConfirmandoNaoSei("custo")}
                  >
                    Não sei
                  </button>
                </div></>
              )}

              {atual === "lucro" && (
                <>
                {estado.margem !== null && <div className="conta-direto">
                  <label htmlFor="lucro-direto">Se souber quanto precisa manter por venda, digite em reais</label>
                  <div className="fallback-field">
                    <input id="lucro-direto" inputMode="decimal" placeholder="Ex.: 50,00" value={rascunho}
                      onChange={(e) => setRascunho(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar({ conta: "lucro", escolha: rascunho }); } }} />
                    {previa !== null && <span className="conta-previa">{dinheiro(previa, "BRL")}</span>}
                    <button className="mini-send" type="button" disabled={indisponivel} onClick={() => enviar({ conta: "lucro", escolha: rascunho })}>{enviando ? "Salvando…" : "Conferir"}</button>
                  </div>
                </div>}
                <p className="conta-hint">Se não souber, marque “Não sei”. O gestor resolve essa conta com você sem inventar um valor.</p>
                <div className="chips-row">
                  {estado.margem === null && <p className="conta-hint">Sem a sobra por venda, esta conta fica para a conversa com o gestor.</p>}
                  <button
                    className="chip-opt"
                    type="button"
                    disabled={indisponivel}
                    onClick={() => setConfirmandoNaoSei("lucro")}
                  >
                    Não sei
                  </button>
                </div></>
              )}
              {confirmandoNaoSei === atual && (
                <div className="pendencia-bloco" role="group" aria-label="Confirmar que não sabe responder">
                  <p>Tudo bem deixar essa conta para a conversa com o gestor. Quer marcar esta resposta como “Não sei”?</p>
                  <div className="chips-row">
                    <button className="chip-opt" type="button" disabled={indisponivel}
                      onClick={() => setConfirmandoNaoSei(null)}>Voltar e responder</button>
                    <button className="chip-opt" type="button" disabled={indisponivel}
                      onClick={() => enviar({ conta: atual, escolha: "", naoSei: true })}>{enviando ? "Salvando…" : "Confirmar: não sei"}</button>
                  </div>
                  <p className="conta-hint">O gestor verá essa pendência. Você poderá voltar e informar o valor quando souber.</p>
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
              {estado.resumo.acao && estado.resumo.acao.href !== "/verba" && (
                <a className="cta" href={estado.resumo.acao.href}>
                  {estado.resumo.acao.rotulo}
                </a>
              )}
            </section>
          )}

          <a className="cta" href="/onboarding/marca">
            Continuar para o visual da marca
          </a>
        </>
      )}
    </>
  );
}
