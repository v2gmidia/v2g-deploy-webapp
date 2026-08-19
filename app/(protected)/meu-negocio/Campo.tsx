"use client";

import { useActionState, useEffect, useState } from "react";
import { dinheiro } from "@/lib/formato";
import type { CampoNaTela } from "@/lib/perfil/revisao-cliente";
import {
  confirmarCampoAction,
  salvarCampoAction,
  type EstadoDaRevisao,
} from "./actions";

const VAZIO: EstadoDaRevisao = {};

/**
 * Uma linha do perfil, com os atos que o cliente pode fazer nela.
 *
 * A MARCAÇÃO DO QUE FALTA CONFERIR É A PRESENÇA DO BOTÃO, e não um selo.
 * Campo não conferido mostra "tá certo / não é isso"; conferido mostra a
 * data e um "mudar" discreto. Não existe pílula de pendente, não existe
 * amarelo, e não existe contagem em lugar nenhum da tela — contador de
 * pendência converte revisão em tarefa, e tarefa com número visível é o que
 * se adia. Ver §6 do desenho antes de acrescentar um.
 */
export function Campo({ campo }: { campo: CampoNaTela }) {
  const [editando, setEditando] = useState(false);
  const [confirmado, acaoConfirmar, confirmando] = useActionState(
    confirmarCampoAction,
    VAZIO,
  );
  const [salvo, acaoSalvar, salvando] = useActionState(salvarCampoAction, VAZIO);

  // Fecha o editor quando a gravação deu certo. Sem isto o campo continuaria
  // aberto por cima do valor novo, e o cliente não veria que salvou.
  useEffect(() => {
    if (salvo.ok) setEditando(false);
  }, [salvo.ok]);

  const erro = confirmado.erro ?? salvo.erro;
  const ok = confirmado.ok ?? (editando ? undefined : salvo.ok);
  const ocupado = confirmando || salvando;

  return (
    <div className={`rc-campo ${campo.origem === "confirmado" ? "conferido" : ""}`}>
      <div className="rc-rotulo">
        <b>{campo.rotulo}</b>
        {campo.ajuda && <span className="rc-ajuda">{campo.ajuda}</span>}
      </div>

      {editando ? (
        campo.opcoes ? (
          <EditorDeOpcoes
            campo={campo}
            acao={acaoSalvar}
            salvando={salvando}
            aoDesistir={() => setEditando(false)}
          />
        ) : (
          <Editor
            campo={campo}
            acao={acaoSalvar}
            salvando={salvando}
            aoDesistir={() => setEditando(false)}
          />
        )
      ) : (
        <>
          <div className="rc-valor">
            {campo.vazio ? (
              <span className="rc-sem">a gente ainda não sabe</span>
            ) : (
              <Valor campo={campo} />
            )}
          </div>

          <Origem campo={campo} />

          <div className="rc-acoes">
            {campo.vazio ? (
              campo.podePreencher && (
                <button
                  type="button"
                  className="btn-linha"
                  onClick={() => setEditando(true)}
                >
                  contar agora
                </button>
              )
            ) : campo.origem === "confirmado" ? (
              <button
                type="button"
                className="btn-linha fraco"
                onClick={() => setEditando(true)}
              >
                mudar
              </button>
            ) : (
              <>
                <form action={acaoConfirmar}>
                  <input type="hidden" name="chave" value={campo.chave} />
                  <button type="submit" className="btn-linha forte" disabled={ocupado}>
                    tá certo
                  </button>
                </form>
                <button
                  type="button"
                  className="btn-linha"
                  onClick={() => setEditando(true)}
                >
                  não é isso
                </button>
              </>
            )}
          </div>
        </>
      )}

      {erro && (
        <p className="rc-erro" role="alert">
          {erro}
        </p>
      )}
      {ok && <p className="rc-ok">{ok}</p>}
    </div>
  );
}

/** O valor de hoje, formatado para leitura — nunca o valor cru da coluna. */
function Valor({ campo }: { campo: CampoNaTela }) {
  if (campo.parCom) {
    const par = campo.valor as { de: unknown; ate: unknown };
    const de = Number(par.de);
    const ate = Number(par.ate);
    if (!Number.isFinite(de)) return <>{Number.isFinite(ate) ? dinheiro(ate) : "—"}</>;
    if (!Number.isFinite(ate) || de === ate) return <>{dinheiro(de)}</>;
    return (
      <>
        de {dinheiro(de)} a {dinheiro(ate)}
      </>
    );
  }

  if (campo.opcoes) {
    const atual = String(campo.valor);
    return <>{campo.opcoes.find((o) => o.valor === atual)?.rotulo ?? atual}</>;
  }

  if (Array.isArray(campo.valor)) {
    return (
      <ul className="rc-lista">
        {campo.valor.map((item, i) => (
          <li key={i}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (campo.dinheiro && typeof campo.valor === "number") return <>{dinheiro(campo.valor)}</>;
  if (typeof campo.valor === "boolean") return <>{campo.valor ? "sim" : "não"}</>;
  return <>{String(campo.valor)}</>;
}

/**
 * De onde veio o valor. TRÊS ESTADOS, e o terceiro é o silêncio.
 *
 * Campo sem procedência não ganha frase nenhuma. Escrever "você respondeu no
 * cadastro" seria inferência apresentada como fato — o valor pode ter vindo
 * de outro lugar, e a coluna não sabe. Não saber é uma resposta, e a tela a
 * dá calando.
 */
function Origem({ campo }: { campo: CampoNaTela }) {
  if (campo.vazio) return null;

  if (campo.origem === "confirmado") {
    const quando = campo.confirmadoEm
      ? new Date(campo.confirmadoEm).toLocaleDateString("pt-BR")
      : null;
    const verbo = campo.ato === "confirmou" ? "conferiu" : "escreveu";
    return (
      <p className="rc-origem conferido">
        ✓ você {verbo} isso{quando ? ` em ${quando}` : ""}
      </p>
    );
  }

  if (campo.origem === "extraido") {
    return <p className="rc-origem">veio da conversa que você teve com a gente</p>;
  }

  if (campo.origem === "manual") {
    return <p className="rc-origem">a gente anotou isso durante a conversa</p>;
  }

  return null;
}

/**
 * Escolha fechada, ABERTA SÓ NA EDIÇÃO.
 *
 * A primeira versão desenhava as opções sempre, com o argumento de que dois
 * passos para uma escolha binária é um passo a mais. Estava errado, e o
 * defeito só apareceu na tela: um campo confirmado ficava com as quatro
 * opções expandidas enquanto todos os vizinhos confirmados mostravam só o
 * valor e "mudar". A linha do raio não parecia conferida — parecia uma
 * pergunta ainda em aberto, no meio de uma lista de coisas resolvidas.
 *
 * O passo a mais que eu queria economizar custava a leitura do bloco
 * inteiro. Agora escolha fechada segue o mesmo ciclo do resto — valor,
 * origem, e as opções só depois de "não é isso" ou "mudar".
 *
 * Cada opção é um `<form>` próprio porque `<form>` não aninha: o editor de
 * texto é um form só com dois botões, e este é N forms de um botão.
 */
function EditorDeOpcoes({
  campo,
  acao,
  salvando,
  aoDesistir,
}: {
  campo: CampoNaTela;
  acao: (formData: FormData) => void;
  salvando: boolean;
  aoDesistir: () => void;
}) {
  const atual = campo.vazio ? null : String(campo.valor);
  return (
    <div className="rc-editor">
      <div className="rc-acoes">
        {campo.opcoes?.map((o) => (
          <form action={acao} key={o.valor}>
            <input type="hidden" name="chave" value={campo.chave} />
            <input type="hidden" name="valor" value={o.valor} />
            <button
              type="submit"
              className={`btn-linha ${o.valor === atual ? "forte" : ""}`}
              disabled={salvando}
            >
              {o.rotulo}
            </button>
          </form>
        ))}
        <button type="button" className="btn-linha fraco" onClick={aoDesistir}>
          deixa como estava
        </button>
      </div>
    </div>
  );
}

/** O campo aberto. Um por tipo, e o do ticket é dois. */
function Editor({
  campo,
  acao,
  salvando,
  aoDesistir,
}: {
  campo: CampoNaTela;
  acao: (formData: FormData) => void;
  salvando: boolean;
  aoDesistir: () => void;
}) {
  const par = campo.parCom ? (campo.valor as { de: unknown; ate: unknown }) : null;
  const valorTexto = campo.vazio
    ? ""
    : Array.isArray(campo.valor)
      ? campo.valor.join("\n")
      : String(campo.valor ?? "");

  return (
    <form action={acao} className="rc-editor">
      <input type="hidden" name="chave" value={campo.chave} />

      {par ? (
        <div className="rc-faixa">
          <label>
            de
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              defaultValue={par.de === null ? "" : String(par.de)}
              aria-label={`${campo.rotulo} — de`}
            />
          </label>
          <label>
            até
            <input
              name="valorAte"
              type="text"
              inputMode="decimal"
              defaultValue={par.ate === null ? "" : String(par.ate)}
              aria-label={`${campo.rotulo} — até`}
            />
          </label>
        </div>
      ) : campo.tipo === "lista" ? (
        <textarea
          name="valor"
          rows={3}
          defaultValue={valorTexto}
          placeholder="uma coisa por linha"
          aria-label={campo.rotulo}
        />
      ) : campo.tipo === "texto" && campo.bloco === "narrativa" ? (
        <textarea name="valor" rows={3} defaultValue={valorTexto} aria-label={campo.rotulo} />
      ) : (
        <input
          name="valor"
          type="text"
          inputMode={campo.tipo === "numero" ? "decimal" : undefined}
          defaultValue={valorTexto}
          aria-label={campo.rotulo}
        />
      )}

      <div className="rc-acoes">
        <button type="submit" className="btn-linha forte" disabled={salvando}>
          {salvando ? "salvando…" : "salvar"}
        </button>
        <button type="button" className="btn-linha fraco" onClick={aoDesistir}>
          deixa como estava
        </button>
      </div>

      {/* Apagar é o quarto ato, e vai por OUTRA função de banco — ver o
          DESPACHO em actions.ts. O botão só aparece onde a 0017 aceita: se
          aparecesse no resto, o cliente clicaria e tomaria erro. */}
      {campo.podeEsvaziar && (
        <p className="rc-apagar">
          Ou{" "}
          {/* `name="acao"`, e NÃO `name="valor"`: o input de valor já ocupa
              esse nome no mesmo form, e `FormData.get` devolve o primeiro —
              um botão `valor=""` aqui seria clicado e não apagaria nada. */}
          <button
            type="submit"
            className="btn-texto"
            name="acao"
            value="esvaziar"
            disabled={salvando}
          >
            deixe em branco
          </button>{" "}
          — a gente para de usar isso no anúncio.
        </p>
      )}
    </form>
  );
}
