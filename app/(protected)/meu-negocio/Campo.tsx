"use client";

import { useActionState, useEffect, useState } from "react";
import { dinheiro } from "@/lib/formato";
import { SeletorDeNicho } from "@/components/ui/SeletorDeNicho";
import {
  lerNichoGravado,
  rotuloDoNichoGravado,
  LISTA_NAO_CARREGOU,
  NICHO_FORA_DA_LISTA,
  NICHO_GUARDADO_SEM_LISTA,
  type NichoGravado,
} from "@/lib/nichos/gravado";
import type { Nicho } from "@/lib/nichos/tipos";
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
export function Campo({
  campo,
  nichos,
}: {
  campo: CampoNaTela;
  /** a lista viva, só usada pelo campo que tem `seletorDeNicho` */
  nichos: Nicho[] | null;
}) {
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

  // O que está na coluna `niche` traduzido pela lista viva. `null` nos
  // outros 25 campos — só o do ramo passa por aqui.
  const gravado: NichoGravado | null = campo.seletorDeNicho
    ? lerNichoGravado(nichos, campo.valor)
    : null;

  // ============================================================
  // NICHO QUE A LISTA NÃO RECONHECE NÃO GANHA "TÁ CERTO".
  //
  // Decisão do Victor, 23/08. Confirmar carimbaria procedência
  // `confirmado` — o nível mais alto da escala — num valor que o pipeline
  // não consegue usar para escolher o documento do nicho. O cliente
  // ficaria com a sensação de ter resolvido, e o dado continuaria mudo.
  //
  // E NÃO É ERRO. As duas linhas reais de hoje têm "Clínica /
  // Consultório", respondido de boa-fé num onboarding que oferecia
  // aquilo; a fictícia tem "padaria", que é a verdade sobre o negócio. É
  // PENDÊNCIA VISÍVEL: a linha explica, o botão abre a lista, e nada mais
  // na tela trava — os outros campos continuam editáveis e o cadastro
  // continua andando (`docs/handoff-seletor-de-nicho.md` §5).
  //
  // Com o catálogo FORA isto é falso de propósito: sem lista não dá para
  // afirmar que o valor está fora dela, e acusar seria culpar o cliente
  // pelo nosso defeito. Ver `lerNichoGravado`.
  // ============================================================
  const nichoForaDaLista = gravado?.tipo === "nao-reconhecido";

  // ============================================================
  // CATÁLOGO FORA, COM VALOR GRAVADO: A LINHA NÃO MOSTRA O VALOR NEM
  // OFERECE BOTÃO.
  //
  // Achado no navegador em 23/08, não no código: sem a lista viva não há
  // como traduzir `clinica-odontologica` em "Dentista", e a tela estava
  // mostrando o identificador cru para o dono do consultório.
  //
  // Sem botão pelo mesmo motivo: o único editor possível sem lista é o
  // texto livre, e ele trocaria um identificador válido pela frase da
  // pessoa — a nossa queda rebaixando o dado dela. Os outros 25 campos
  // continuam editáveis; um endpoint de catálogo fora não trava a tela.
  //
  // Campo VAZIO não entra aqui: ali não há valor para proteger nem para
  // traduzir, e a resposta certa é a mesma do onboarding degradado —
  // texto livre, com a linha dizendo que a lista não carregou.
  // ============================================================
  const nichoSemLista = gravado?.tipo === "sem-lista";

  return (
    <div className={`rc-campo ${campo.origem === "confirmado" ? "conferido" : ""}`}>
      <div className="rc-rotulo">
        <b>{campo.rotulo}</b>
        {campo.ajuda && <span className="rc-ajuda">{campo.ajuda}</span>}
      </div>

      {editando ? (
        campo.seletorDeNicho ? (
          nichos ? (
            <EditorDeNicho
              campo={campo}
              nichos={nichos}
              escolhido={gravado?.tipo === "reconhecido" ? gravado.nicho.nicho : null}
              acao={acaoSalvar}
              salvando={salvando}
              aoDesistir={() => setEditando(false)}
            />
          ) : (
            // CATÁLOGO FORA: o campo aberto, e a tela diz por quê. Não
            // existe lista de reserva — os chips fixos que havia até
            // 22/08 não eram nichos, e gravar um deles seria palpite com
            // cara de escolha do cliente (`docs/decisoes.md`, 22/08).
            <>
              <p className="nicho-sem-lista" role="status" aria-live="polite">
                {LISTA_NAO_CARREGOU}
              </p>
              <Editor
                campo={campo}
                acao={acaoSalvar}
                salvando={salvando}
                aoDesistir={() => setEditando(false)}
              />
            </>
          )
        ) : campo.opcoes ? (
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
            ) : nichoSemLista ? (
              <span className="rc-sem">{NICHO_GUARDADO_SEM_LISTA}</span>
            ) : (
              <Valor campo={campo} gravado={gravado} />
            )}
          </div>

          <Origem campo={campo} />

          {/* A PENDÊNCIA, e ela fica ENTRE a origem e o botão: primeiro o
              que está lá, depois de onde veio, depois por que ainda tem
              coisa a fazer, e só então o que fazer. Em `--fs-corpo`, como
              o recado do seletor, e não em vermelho de erro — não achar o
              próprio ramo numa lista de dez não é erro do cliente. */}
          {nichoForaDaLista && <p className="rc-nicho-fora">{NICHO_FORA_DA_LISTA}</p>}

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
            ) : nichoSemLista ? null : nichoForaDaLista ? (
              // Um botão só. O "tá certo" sumiu de propósito — ver o
              // bloco de `nichoForaDaLista` lá em cima.
              <button
                type="button"
                className="btn-linha forte"
                onClick={() => setEditando(true)}
              >
                escolher na lista
              </button>
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
function Valor({
  campo,
  gravado,
}: {
  campo: CampoNaTela;
  gravado: NichoGravado | null;
}) {
  // ============================================================
  // O RAMO: A COLUNA GUARDA `clinica-odontologica`, A TELA MOSTRA
  // "Dentista".
  //
  // Esta linha é a metade obrigatória da inversão de 23/08. Sem ela, o
  // dono do consultório abre a `/meu-negocio` e lê o identificador cru —
  // jargão puro, na tela que existe para ele conferir o que a gente
  // entendeu do negócio dele. O `buraco-meu-negocio-nicho-livre.md`
  // avisou exatamente isto: "se um dia a decisão de armazenamento
  // inverter para o identificador, esta linha passa a mostrar
  // `clinica-odontologica` para o dono do consultório — e aí ela é o
  // conserto obrigatório, não opcional."
  //
  // O que a lista não reconhece sai cru mesmo, e é o certo: é a frase que
  // a própria pessoa escreveu.
  // ============================================================
  if (gravado) return <>{rotuloDoNichoGravado(gravado)}</>;

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

/**
 * O ramo, com a MESMA lista e a MESMA validação do onboarding.
 *
 * ============================================================
 * O COMPONENTE JÁ EXISTIA COMPARTILHADO — ele nasceu em
 * `components/ui/` em 22/08 justamente para esta tela.
 *
 * Trocar o `input` de texto por ele é metade do conserto. A outra metade
 * é do servidor: sem `conferirEscolhaDeNicho` na Server Action, isto
 * seria cosmético — a porta dos fundos continuaria aberta para quem
 * montasse o POST à mão. Ver `actions.ts`.
 * ============================================================
 *
 * `aoEscolher` manda o RÓTULO, não o identificador, e é de propósito: é o
 * mesmo contrato do `Chat.tsx`, e é o servidor que traduz contra a lista
 * viva. Se a tela mandasse o identificador, o servidor teria que confiar
 * nele — e "confiar no que o cliente mandou" é exatamente o buraco que a
 * conferência fecha.
 */
function EditorDeNicho({
  campo,
  nichos,
  escolhido,
  acao,
  salvando,
  aoDesistir,
}: {
  campo: CampoNaTela;
  nichos: Nicho[];
  escolhido: string | null;
  acao: (formData: FormData) => void;
  salvando: boolean;
  aoDesistir: () => void;
}) {
  // Sem `<form>`: o seletor responde por callback, não por submit. O
  // `FormData` é montado à mão e entregue à mesma Server Action que os
  // outros campos usam — um caminho de escrita só, como manda o
  // `DESPACHO`.
  function enviar(valor: string, origem: "chip" | "texto") {
    const dados = new FormData();
    dados.set("chave", campo.chave);
    dados.set("valor", valor);
    dados.set("origem", origem);
    acao(dados);
  }

  return (
    <div className="rc-editor">
      <SeletorDeNicho
        nichos={nichos}
        escolhido={escolhido}
        ocupado={salvando}
        aoEscolher={(n) => enviar(n.rotulo, "chip")}
        aoEscreverLivre={(t) => enviar(t, "texto")}
        rotuloDoCampo={campo.rotulo}
      />
      <div className="rc-acoes">
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
