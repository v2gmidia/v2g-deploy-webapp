import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { conferirAntesDeAtivar } from "@/lib/campanha/ativacao";
import { tituloDaAba } from "@/lib/titulos";
import { ativarAction, pausarAction } from "../actions";

export const metadata = tituloDaAba("/ativar-campanha/[execucao]");

/**
 * UMA CAMPANHA — a tela onde o dinheiro começa a sair.
 *
 * ============================================================
 * A CONFIRMAÇÃO É A TELA. Não existe modal.
 *
 * Tudo que a pessoa precisa saber antes de apertar está visível ao mesmo
 * tempo que o botão: de quem é a campanha, quanto passa a gastar por dia,
 * e o que o pré-voo disse AGORA. Um modal esconderia isso atrás de um
 * clique e transformaria "confirmar" em reflexo.
 *
 * `conferirAntesDeAtivar()` é relida a cada desenho — e de novo dentro da
 * ação, a centímetros da chamada ao backend. O que esta tela mostra é
 * informação, nunca autorização.
 * ============================================================
 *
 * ============================================================
 * O BOTÃO DE ATIVAR SÓ APARECE SEM BLOQUEIO.
 *
 * Com bloqueio ele não fica cinza: ele não existe, e os motivos ocupam o
 * lugar dele. Botão apagado convida a procurar como acender; a lista de
 * motivos diz o que resolver.
 *
 * O de PAUSAR aparece SEMPRE que existe campanha, inclusive com bloqueio
 * — e inclusive quando a nossa leitura diz que já está parada. O freio
 * nunca depende de o resto estar em ordem, e nunca depende de a nossa
 * leitura estar certa: a última palavra sobre o que está rodando é da
 * Meta, não nossa.
 * ============================================================
 */

interface Props {
  params: Promise<{ execucao: string }>;
}

const DINHEIRO = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function CampanhaPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  const { execucao: idExecucao } = await params;

  const conferencia = await conferirAntesDeAtivar(idExecucao);

  if (!conferencia.ok) {
    return (
      <div className="canvas">
        <div className="page-head">
          <h1>Campanha</h1>
          <p className="form-error">{conferencia.texto}</p>
        </div>
        <Link className="cta ghost" href="/ativar-campanha">
          Voltar para a fila
        </Link>
      </div>
    );
  }

  const podeAtivar = conferencia.bloqueios.length === 0;

  return (
    <div className="canvas">
      <div className="page-head">
        <h1>{conferencia.nomeDoCliente}</h1>
        <p>
          campanha <code>{conferencia.idCampanha}</code> · execução{" "}
          <code>{conferencia.statusDoPipeline}</code>
        </p>
      </div>

      {/* ---------- o que a pessoa precisa saber ANTES ---------- */}
      <section className="pendencia-bloco">
        <b>Se você ativar, começa a sair dinheiro</b>
        <p>
          <b>{DINHEIRO.format(conferencia.diarioCentavos / 100)} por dia</b>, da conta de anúncio
          de <b>{conferencia.nomeDoCliente}</b>. Sai do teto de{" "}
          {DINHEIRO.format(conferencia.mensalReais)} por mês que o cliente definiu, dividido por
          30.
        </p>
        {/* ============================================================
            O NÚMERO ACIMA É O NOSSO, E NÃO É O QUE VAI GASTAR.
            A rota de ativar só muda status: o `daily_budget` que gasta é o
            que já está no conjunto, gravado quando ele foi criado. Dizer
            isso aqui é mais barato que alguém descobrir pelo extrato.
            ============================================================ */}
        <p>
          Esse é o valor que o cliente contratou. Quem gasta é o orçamento diário que já está
          gravado no conjunto lá na Meta — ligar não reescreve esse número. Se precisar conferir,
          é no Gerenciador, antes de apertar.
        </p>
        <p>
          Página: {conferencia.preVoo.pagina?.nome ?? "não consegui ler o nome agora"} · Conta:{" "}
          {conferencia.idContaAnuncio ?? "não registrada na execução"}
        </p>
      </section>

      {/* ---------- a estrutura, os três níveis ---------- */}
      <section className="lista-espera">
        <article className="espera-row">
          <div className="espera-quem">
            <b>O que vai ser ligado</b>
            <span>
              {conferencia.quantosAnuncios === 0
                ? "campanha e conjunto — nenhum anúncio registrado na execução"
                : `campanha, conjunto e ${conferencia.quantosAnuncios} anúncio(s)`}
            </span>
          </div>
          <div className="espera-estado">
            <span>
              campanha <code>{conferencia.idCampanha}</code>
            </span>
            <span>conjunto {conferencia.idConjunto ? <code>{conferencia.idConjunto}</code> : "—"}</span>
          </div>
        </article>

        <article className="espera-row">
          <div className="espera-quem">
            <b>O que a plataforma respondeu na última leitura</b>
            {/* Observação do coletor (`coleta.py::_registrar_status`), crua.
                Esta tela não traduz e não conclui: status velho e status de
                agora são a mesma string, e só a hora ao lado distingue. */}
            <span>
              Não é o nosso pedido — é o que o backend leu na Meta, e pode estar velho.
            </span>
          </div>
          <div className="espera-estado">
            <span>
              {conferencia.statusNaPlataforma ? (
                <code>{conferencia.statusNaPlataforma}</code>
              ) : (
                "— ninguém leu ainda"
              )}
            </span>
            {conferencia.statusLidoEm && (
              <span className="espera-data">
                lido em {new Date(conferencia.statusLidoEm).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
        </article>
      </section>

      {/* ---------- o que impede ---------- */}
      {!podeAtivar && (
        <section className="pendencia-bloco">
          <b>Não dá para ativar agora</b>
          <ul>
            {conferencia.bloqueios.map((b, i) => (
              <li key={`${b.motivo}-${i}`}>{b.texto}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- as ações ---------- */}
      <section className="rev-acoes">
        {podeAtivar && (
          <form action={ativarAction}>
            <input type="hidden" name="idExecucao" value={conferencia.idExecucao} />
            <button type="submit" className="cta">
              Ativar campanha — {DINHEIRO.format(conferencia.diarioCentavos / 100)}/dia
            </button>
          </form>
        )}

        {/* ============================================================
            PAUSAR PEDE MOTIVO, E O CAMPO É DA TELA, NÃO DO BACKEND.
            O backend recusa motivo vazio com 422 (`rotas.py:3521-3526`).
            Deixar o operador descobrir isso batendo num erro seria fazer a
            tela esconder uma regra que ela conhece. Pedir aqui não é
            confirmação: o freio continua sendo um clique, com uma linha
            escrita que diz de quem partiu o pedido.
            ============================================================ */}
        <form action={pausarAction} className="rev-corrigir">
          <input type="hidden" name="idExecucao" value={conferencia.idExecucao} />
          {/* O rótulo existe para quem usa leitor de tela; na tela ele
              seria uma linha a mais entre o operador e o freio. Mesmo
              padrão do `.sr-only` que o resto do app já usa. */}
          <label className="sr-only" htmlFor="motivo-da-pausa">
            Por que está pausando?
          </label>
          <input
            id="motivo-da-pausa"
            name="motivo"
            type="text"
            required
            maxLength={280}
            placeholder="Por que está pausando? ex.: cliente pediu"
          />
          <button type="submit" className="cta ghost">
            Pausar campanha
          </button>
        </form>

        <Link className="cta ghost" href="/ativar-campanha">
          Voltar para a fila
        </Link>
      </section>

      {/* ---------- o rastro, escrito pelo backend ---------- */}
      <section className="lista-espera">
        <h2>O que já aconteceu aqui</h2>
        {conferencia.rastro.length === 0 ? (
          <p>Nenhuma ativação ou pausa registrada nesta execução.</p>
        ) : (
          conferencia.rastro.map((r, i) => (
            <article className="espera-row" key={`${r.em}-${i}`}>
              <div className="espera-quem">
                <b>
                  {r.etapa} — {r.decisao}
                </b>
                <span>{r.motivo}</span>
              </div>
              <div className="espera-estado">
                <span>{r.por}</span>
                {r.em && (
                  <span className="espera-data">{new Date(r.em).toLocaleString("pt-BR")}</span>
                )}
                {r.decisao === "recusado" && <span className="form-error">não completou</span>}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
