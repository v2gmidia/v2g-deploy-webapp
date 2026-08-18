import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  carregarProposta,
  montarPrevia,
  type ItemDaProposta,
  type LinhaDaPrevia,
  type PropostaCompleta,
  type Previa,
} from "@/lib/agentes/revisao";
import { aplicarAction, decidirAction, reabrirAction } from "./actions";

/**
 * Revisão da proposta — TELA DE OPERADOR.
 *
 * Linguagem técnica é aceitável: quem lê sabe o que é procedência e nome
 * de coluna. É o oposto da regra do resto do app.
 *
 * A TELA TEM UMA FUNÇÃO SÓ: obrigar a olhar cada campo uma vez. Por isso
 * não existe "aprovar todos" — na trigésima entrevista ele seria pedido, e
 * é exatamente aí que ele deixaria de valer alguma coisa.
 *
 * ACESSO: `app_metadata.papel === "operador"`, barrado no `proxy.ts`, de
 * novo aqui, e DE NOVO em cada Server Action (elas são POST de verdade e o
 * proxy não as cobre).
 */

export const metadata = { title: "Revisar perfil — V2G" };
export const dynamic = "force-dynamic";

export default async function RevisarPerfilPage({
  params,
  searchParams,
}: {
  params: Promise<{ proposta: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  // 2ª camada (docs/arquitetura.md, Decisão 3). `notFound()` e não
  // redirect: para quem não é operador esta rota não existe.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  const { proposta: propostaId } = await params;
  const { erro } = await searchParams;

  const proposta = await carregarProposta(propostaId);
  if (!proposta) notFound();

  const previa = proposta.pendentes === 0 ? await montarPrevia(propostaId) : null;

  return (
    <>
      <div className="page-head">
        <h1>Revisar perfil</h1>
        <p>
          {proposta.negocio}
          {proposta.dadosFicticios && <span className="pill warn"> dados fictícios</span>}
          {" — proposta de "}
          <code>{proposta.modelo}</code> com o prompt <code>{proposta.promptVersao}</code>.
          Cada decisão é gravada no clique; dá para fechar a aba e voltar depois.
        </p>
      </div>

      {erro && (
        <section className="rev-erro" role="alert">
          <strong>Não deu.</strong> {erro}
        </section>
      )}

      <Cabecalho proposta={proposta} />

      <section>
        <div className="section-title">
          <h2>Campos extraídos</h2>
          <span className="grp-count">{proposta.itens.length}</span>
        </div>
        <div className="rev-lista">
          {proposta.itens.map((item) => (
            <Item
              key={item.id}
              item={item}
              propostaId={proposta.id}
              travado={proposta.estado !== "aberta"}
            />
          ))}
        </div>
      </section>

      <Descartados proposta={proposta} />

      {previa && proposta.estado === "aberta" && (
        <Aplicar previa={previa} propostaId={proposta.id} />
      )}
    </>
  );
}

/** Onde a revisão está. O contador é o que diz se dá para aplicar. */
function Cabecalho({ proposta }: { proposta: PropostaCompleta }) {
  const decididos = proposta.itens.length - proposta.pendentes;

  if (proposta.estado === "aplicada") {
    return (
      <section className="hero-destaque">
        <span className="eyebrow">Aplicada</span>
        <p className="hero-frase">
          Esta proposta já <span className="destaque">virou perfil</span>.
        </p>
        <p className="hero-note">
          Aplicada por {proposta.aplicadaPor} em{" "}
          {proposta.aplicadaEm ? new Date(proposta.aplicadaEm).toLocaleString("pt-BR") : "—"}. As
          decisões abaixo ficam como registro e não podem mais mudar — se pudessem, a linha
          divergiria do perfil que ela mesma produziu.
        </p>
      </section>
    );
  }

  return (
    <section className="hero-destaque">
      <span className="eyebrow">Revisão</span>
      <p className="hero-num">
        {decididos} <span className="rev-de">de {proposta.itens.length}</span>
      </p>
      <p className="hero-legenda">
        {proposta.pendentes === 0
          ? "tudo decidido — dá para aplicar"
          : proposta.pendentes === 1
            ? "1 campo ainda esperando decisão"
            : `${proposta.pendentes} campos ainda esperando decisão`}
      </p>
      <p className="hero-note">
        Entrevista de{" "}
        {proposta.realizadaEm
          ? new Date(proposta.realizadaEm).toLocaleDateString("pt-BR")
          : "data não registrada"}
        . {proposta.tokensEntrada} tokens de entrada, {proposta.tokensSaida} de saída.
      </p>
    </section>
  );
}

function Item({
  item,
  propostaId,
  travado,
}: {
  item: ItemDaProposta;
  propostaId: string;
  travado: boolean;
}) {
  const decidido = item.decisao !== "pendente";

  return (
    <article className={`rev-item ${decidido ? "decidido" : ""}`}>
      <div className="rev-head">
        <span className="rev-rotulo">
          {item.rotulo}
          <code className="rev-coluna">
            {item.tabela}.{item.campo}
          </code>
        </span>
        <span className="rev-selos">
          {item.dinheiro && <span className="pill info">dinheiro</span>}
          <span className={`pill ${item.confianca === "explicito" ? "ok" : "off"}`}>
            {item.confianca}
          </span>
          <SeloDecisao decisao={item.decisao} />
        </span>
      </div>

      {/* O trecho fica AO LADO, não atrás de um clique. Revisão que exige
          expandir para conferir a fonte vira revisão onde ninguém expande
          — e a tela passa a produzir aprovação em vez de revisão. */}
      <div className="rev-corpo">
        <div className="rev-valor">
          {item.divergenciaAnotacao ? (
            <Divergencia item={item} propostaId={propostaId} travado={travado} />
          ) : (
            <>
              <span className="rev-etiqueta">valor proposto</span>
              <p className="rev-texto">{formatar(item.valorProposto)}</p>
            </>
          )}

          {item.decisao === "corrigido" && (
            <p className="rev-corrigido">
              <span className="rev-etiqueta">corrigido para</span> {formatar(item.valorFinal)}
            </p>
          )}
        </div>

        <div className="rev-trecho">
          <span className="rev-etiqueta">na transcrição</span>
          <blockquote>{item.trecho}</blockquote>
        </div>
      </div>

      {travado ? null : decidido ? (
        <form action={reabrirAction} className="rev-acoes">
          <input type="hidden" name="propostaId" value={propostaId} />
          <input type="hidden" name="itemId" value={item.id} />
          <span className="rev-quem">
            {item.decisao} por {item.decididoPor}
          </span>
          <button type="submit" className="btn-linha">
            reabrir
          </button>
        </form>
      ) : (
        <Acoes item={item} propostaId={propostaId} />
      )}
    </article>
  );
}

/**
 * A divergência: os dois valores lado a lado, NENHUM pré-selecionado.
 *
 * O padrão de leitura é a anotação vencer — quem anotou ouviu com o
 * ouvido, o transcritor ouviu o áudio. Mas pré-selecionar é como o
 * operador clica em aceitar sem ler, então a escolha fica explícita: dois
 * botões, nenhum marcado, e o texto diz qual costuma estar certo.
 */
function Divergencia({
  item,
  propostaId,
  travado,
}: {
  item: ItemDaProposta;
  propostaId: string;
  travado: boolean;
}) {
  return (
    <div className="rev-diverge">
      <span className="pill crit">os dois não batem</span>

      <div className="rev-duas">
        <div className="rev-opcao">
          <span className="rev-etiqueta">o agente ouviu na transcrição</span>
          <p className="rev-texto">{formatar(item.valorProposto)}</p>
          {!travado && (
            <form action={decidirAction}>
              <input type="hidden" name="propostaId" value={propostaId} />
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="decisao" value="aceito" />
              <button type="submit" className="btn-linha">
                usar este
              </button>
            </form>
          )}
        </div>

        <div className="rev-opcao">
          <span className="rev-etiqueta">anotado à mão na conversa</span>
          <p className="rev-texto">{formatar(item.valorAnotado)}</p>
          {!travado && (
            <form action={decidirAction}>
              <input type="hidden" name="propostaId" value={propostaId} />
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="decisao" value="corrigido" />
              <input type="hidden" name="chave" value={`${item.tabela}.${item.campo}`} />
              <input type="hidden" name="valorDireto" value={String(item.valorAnotado ?? "")} />
              <button type="submit" className="btn-linha">
                usar este
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="rev-dica">
        Na dúvida, a anotação. A transcrição automática troca &ldquo;duzentos&rdquo; por
        &ldquo;dois mil&rdquo; e a frase continua fazendo sentido.
      </p>
    </div>
  );
}

function Acoes({ item, propostaId }: { item: ItemDaProposta; propostaId: string }) {
  const chave = `${item.tabela}.${item.campo}`;
  return (
    <div className="rev-acoes">
      {!item.divergenciaAnotacao && (
        <form action={decidirAction}>
          <input type="hidden" name="propostaId" value={propostaId} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="decisao" value="aceito" />
          <button type="submit" className="btn-linha forte">
            aceitar
          </button>
        </form>
      )}

      <form action={decidirAction} className="rev-corrigir">
        <input type="hidden" name="propostaId" value={propostaId} />
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="decisao" value="corrigido" />
        <input type="hidden" name="chave" value={chave} />
        {item.tipo === "lista" ? (
          <textarea
            name="valorFinal"
            rows={2}
            placeholder="um por linha"
            aria-label={`Corrigir ${item.rotulo}`}
          />
        ) : (
          <input
            type="text"
            name="valorFinal"
            placeholder={item.tipo === "booleano" ? "sim ou não" : "corrigir à mão"}
            aria-label={`Corrigir ${item.rotulo}`}
          />
        )}
        <button type="submit" className="btn-linha">
          corrigir
        </button>
      </form>

      <form action={decidirAction}>
        <input type="hidden" name="propostaId" value={propostaId} />
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="decisao" value="descartado" />
        <button type="submit" className="btn-linha fraco">
          descartar
        </button>
      </form>
    </div>
  );
}

function SeloDecisao({ decisao }: { decisao: ItemDaProposta["decisao"] }) {
  const classe =
    decisao === "aceito"
      ? "ok"
      : decisao === "corrigido"
        ? "info"
        : decisao === "descartado"
          ? "off"
          : "warn";
  return <span className={`pill ${classe}`}>{decisao}</span>;
}

/**
 * Os descartados pela verificação.
 *
 * Não têm ação, têm VISIBILIDADE. Item que some sem deixar rastro é como
 * um falso positivo do verificador passa despercebido — foi exatamente o
 * que aconteceu com "entre doze e quarenta reais", lido como 52 pelo
 * parser: dois campos corretos sumiram e ninguém teria como saber.
 */
function Descartados({ proposta }: { proposta: PropostaCompleta }) {
  if (proposta.descartados.length === 0) return null;
  return (
    <section>
      <div className="section-title">
        <h2>Descartados na verificação</h2>
        <span className="grp-count">{proposta.descartados.length}</span>
      </div>
      <p className="rev-explica">
        Estes o agente propôs e o código recusou antes de virarem item. Não há o que decidir —
        estão aqui para alguém perceber quando a verificação errar.
      </p>
      <ul className="diag-lista critica">
        {proposta.descartados.map((d, i) => (
          <li key={`${d.chave}-${i}`}>
            <code>{d.chave}</code> — {d.motivo}
            <br />
            <span className="rev-etiqueta">valor</span> {formatar(d.valor)}
            {d.trecho && (
              <>
                <br />
                <span className="rev-etiqueta">trecho</span> &ldquo;{d.trecho}&rdquo;
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A prévia: o que vai mudar, antes de mudar. */
function Aplicar({ previa, propostaId }: { previa: Previa; propostaId: string }) {
  const mudam = previa.linhas.filter((l) => !l.semMudanca);
  const iguais = previa.linhas.length - mudam.length;

  return (
    <section className="rev-aplicar">
      <div className="section-title">
        <h2>O que vai mudar no perfil</h2>
        <span className="grp-count">{mudam.length}</span>
      </div>

      {previa.linhas.length === 0 ? (
        <p className="rev-explica">
          Nenhum campo foi aceito ou corrigido — aplicar só vai fechar a proposta, sem escrever
          nada no perfil.
        </p>
      ) : (
        <div className="rev-previa">
          {previa.linhas.map((l) => (
            <LinhaPrevia key={`${l.tabela}.${l.campo}`} l={l} />
          ))}
        </div>
      )}

      {iguais > 0 && (
        <p className="rev-explica">
          {iguais === 1 ? "1 campo já tem" : `${iguais} campos já têm`} esse mesmo valor. Vão ser
          gravados de novo mesmo assim: o que muda é a procedência, e é ela que o resto do sistema
          lê para saber se pode confiar no número.
        </p>
      )}

      {previa.bloqueios > 0 ? (
        <p className="rev-bloqueio" role="alert">
          {previa.bloqueios === 1
            ? "1 campo já foi confirmado pelo cliente e está marcado como aceito."
            : `${previa.bloqueios} campos já foram confirmados pelo cliente e estão marcados como aceito.`}{" "}
          Aplicar vai ser recusado. Aceitar é o clique que se dá sem ler, e ele não pode passar por
          cima da palavra do dono do negócio — corrija à mão, assumindo a troca, ou descarte.
        </p>
      ) : (
        <form action={aplicarAction} className="rev-aplicar-form">
          <input type="hidden" name="propostaId" value={propostaId} />
          <button type="submit" className="btn-linha forte">
            aplicar ao perfil
          </button>
          <span className="rev-quem">
            Grava tudo numa transação só e fecha a proposta. Depois disso as decisões não mudam
            mais.
          </span>
        </form>
      )}
    </section>
  );
}

function LinhaPrevia({ l }: { l: LinhaDaPrevia }) {
  return (
    <div className={`rev-plinha ${l.conflitoBloqueante ? "bloqueia" : ""}`}>
      <div className="rev-phead">
        <span className="rev-rotulo">
          {l.rotulo}
          <code className="rev-coluna">
            {l.tabela}.{l.campo}
          </code>
        </span>
        <span className="rev-selos">
          <span className={`pill ${l.origem === "manual" ? "info" : "off"}`}>{l.origem}</span>
          {l.semMudanca && <span className="pill off">sem mudança</span>}
          {l.sobrescreveConfirmado && <span className="pill warn">por cima do confirmado</span>}
          {l.conflitoBloqueante && <span className="pill crit">bloqueia</span>}
        </span>
      </div>
      <div className="rev-pvalores">
        <div>
          <span className="rev-etiqueta">hoje ({l.procedenciaAtual})</span>
          <p className="rev-texto">{l.valorAtual === null ? "— vazio —" : formatar(l.valorAtual)}</p>
        </div>
        <div>
          <span className="rev-etiqueta">vai virar</span>
          <p className="rev-texto">{formatar(l.valorNovo)}</p>
        </div>
      </div>
    </div>
  );
}

/** Valor cru → texto legível, sem inventar formatação de moeda. */
function formatar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return v.join(" · ");
  if (typeof v === "boolean") return v ? "sim" : "não";
  return String(v);
}
