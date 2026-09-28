"use client";

import { useActionState } from "react";
import { ativarAction, pausarAction, type EstadoDaAtivacao } from "./actions";

/**
 * OS DOIS BOTÕES QUE GASTAM DINHEIRO — e o que eles respondem.
 *
 * ============================================================
 * POR QUE ESTE É O ÚNICO PEDAÇO DE CLIENTE DA ROTA.
 *
 * O resto de `/ativar-campanha` é servidor, e continua sendo. O que
 * obriga o `"use client"` aqui é uma coisa só: `useActionState`, que é o
 * que dá o estado de pendência e o retorno da ação sem recarregar.
 *
 * É o mesmo padrão de `verba/FormVerba.tsx:11`, `conta/Identidade.tsx:60`
 * e de outras seis telas — não é invenção desta rota.
 *
 * O QUE ELE NÃO FAZ: decidir. `podeAtivar` chega pronto de
 * `conferirAntesDeAtivar()`, e a ação reconfere tudo de novo do lado de
 * lá antes de falar com o backend. O que esta tela sabe é informação,
 * nunca autorização.
 * ============================================================
 */

const VAZIO: EstadoDaAtivacao = {};

interface Props {
  idExecucao: string;
  /** já formatado — a tela não faz conta com dinheiro */
  diarioFormatado: string;
  /** vazio de bloqueios, decidido no servidor */
  podeAtivar: boolean;
}

/**
 * O bloco de resposta, acima dos botões.
 *
 * ============================================================
 * TRÊS ESTADOS, E O DO MEIO É O QUE EXISTE POR NECESSIDADE.
 *
 *   .form-notice   deu certo, e não há ressalva
 *   .form-warning  deu certo COM ressalva, ou parou no meio
 *   .form-error    não deu
 *
 * Sem o do meio, "campanha ligada" e "campanha ligada mas nenhum anúncio
 * foi tocado, então ela não entrega" sairiam os dois verdes. O verde é
 * uma afirmação forte numa tela que acabou de gastar dinheiro de
 * terceiro, e ele tem que custar caro.
 * ============================================================
 *
 * `role="alert"` nos três: quem usa leitor de tela clicou num botão e
 * precisa ouvir a resposta sem ir procurar.
 */
function Resposta({ estado }: { estado: EstadoDaAtivacao }) {
  const temAviso = (estado.avisos?.length ?? 0) > 0;
  const temNivel = (estado.niveis?.length ?? 0) > 0;

  if (!estado.ok && !estado.erro) return null;

  const classe = estado.erro ? "form-error" : temAviso || temNivel ? "form-warning" : "form-notice";

  return (
    <div className={classe} role="alert">
      <p>{estado.erro ?? estado.ok}</p>

      {temAviso && (
        <ul>
          {estado.avisos!.map((aviso, i) => (
            <li key={`aviso-${i}`}>{aviso}</li>
          ))}
        </ul>
      )}

      {temNivel && (
        <ul>
          {estado.niveis!.map((nivel, i) => (
            // O texto do `erro` é a frase CRUA da Meta, e vai inteira —
            // ver a exceção declarada em `lib/backend/erros.ts`. Numa
            // tela de operador, a frase da Meta vale mais que qualquer
            // tradução nossa.
            <li key={`${nivel.nivel}-${i}`}>
              <b>{nivel.nivel}</b> <code>{nivel.veredito}</code>
              {nivel.id && <> · {nivel.id}</>}
              {nivel.erro && <> — {nivel.erro}</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AcoesDaCampanha({ idExecucao, diarioFormatado, podeAtivar }: Props) {
  // Dois estados separados, e não um para a seção inteira: é a mesma
  // correção que `conta/Identidade.tsx:53-59` registra. Com um estado só,
  // a resposta de pausar apareceria colada no botão de ativar.
  const [ativacao, acaoAtivar, ativando] = useActionState(ativarAction, VAZIO);
  const [pausa, acaoPausar, pausando] = useActionState(pausarAction, VAZIO);

  return (
    <>
      {/* ACIMA dos botões de propósito: a resposta de uma ação que gasta
          dinheiro não pode nascer abaixo da dobra. */}
      <Resposta estado={ativacao} />
      <Resposta estado={pausa} />

      <section className="rev-acoes">
        {podeAtivar && (
          <form action={acaoAtivar}>
            <input type="hidden" name="idExecucao" value={idExecucao} />
            <button type="submit" className="cta" disabled={ativando || pausando}>
              {ativando ? "Ativando…" : `Ativar campanha — ${diarioFormatado}/dia`}
            </button>
          </form>
        )}

        {/* ============================================================
            PAUSAR PEDE MOTIVO, E O CAMPO É DA TELA, NÃO DO BACKEND.
            O backend recusa motivo vazio com 422 (`rotas.py:3521-3526`).
            Deixar o operador descobrir isso batendo numa recusa seria
            fazer a tela esconder uma regra que ela conhece. Pedir aqui
            não é confirmação: o freio continua sendo um clique, com uma
            linha escrita que diz de quem partiu o pedido.

            E o botão de pausar aparece SEMPRE — inclusive com bloqueio, e
            inclusive quando a nossa leitura diz que já está parada. O
            freio nunca depende de o resto estar em ordem.
            ============================================================ */}
        <form action={acaoPausar} className="rev-corrigir">
          <input type="hidden" name="idExecucao" value={idExecucao} />
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
            disabled={pausando}
          />
          <button type="submit" className="cta ghost" disabled={ativando || pausando}>
            {pausando ? "Pausando…" : "Pausar campanha"}
          </button>
        </form>
      </section>
    </>
  );
}
