import { createClient } from "@/lib/supabase/server";
import { apenasPecasDeAnuncio } from "@/lib/criativos/peca";
import { tituloDaAba } from "@/lib/titulos";
import { preVooDoNegocio, type PreVoo } from "@/lib/campanha/pre-voo";
import type { PreRequisitos, Resultado } from "@/lib/backend";

export const metadata = tituloDaAba("/aprovar");

/**
 * Aprovar a oferta e o anúncio.
 *
 * ============================================================
 * UMA TELA COM DOIS ESTADOS, NÃO DUAS TELAS. Por quê:
 *
 * Os dois contextos de entrada são "aprovar a primeira peça" e "aprovar a
 * peça que substitui uma reprovada". Parecem diferentes, mas:
 *
 *  1. O OBJETO é o mesmo — uma oferta e um criativo.
 *  2. A AÇÃO é a mesma — aprovar ou pedir mudança.
 *  3. A CONSEQUÊNCIA é a mesma — a peça entra na fila de publicação.
 *
 * O que muda é UM parágrafo no topo e um bloco de contexto: o que foi
 * reprovado e por quê. Isso é conteúdo adicional, não tarefa diferente.
 *
 * Duas telas duplicariam o mecanismo de aprovação inteiro — a parte que
 * tem risco, porque é ela que libera dinheiro a ser gasto — para variar
 * um texto. Toda correção futura na aprovação teria que ser feita em dois
 * lugares, e o segundo é exatamente o que alguém esquece: o caminho do
 * substituto, que é o menos percorrido e o menos testado.
 *
 * O estado é derivado dos DADOS (existe criativo reprovado nesta
 * campanha?), não de um parâmetro na URL. Parâmetro é forjável e, pior,
 * some quando o cliente recarrega a página — ele veria a tela errada por
 * ter apertado F5.
 * ============================================================
 */
export default async function AprovarPage() {
  const supabase = await createClient();

  // O PRÉ-VOO NÃO DEPENDE DA PEÇA, e é por isso que ele é lido aqui, antes
  // do `if (!pendente)`: ele responde "de onde este anúncio sai", que vale
  // igual quando não há nada para aprovar. Os DOIS estados o recebem.
  const preVoo = await preVooDoNegocio();

  // `apenasPecasDeAnuncio` é o que separa a peça que a IA montou da logo
  // que o cliente subiu na /conta — as duas moram em `creatives` e as duas
  // nascem `draft`. Sem ele, esta tela apresentava a logo do cliente como
  // o anúncio dele, enquanto a cadeia do /inicio dizia que não havia nada
  // para aprovar. Ver docs/lote-leitura-de-peca.md.
  const { data: pendente } = await apenasPecasDeAnuncio(
    supabase
      .from("creatives")
      .select("id, campaign_id, file_name, copy, status, meta_status, created_at"),
  )
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pendente) return <NadaParaAprovar preVoo={preVoo} />;

  // O estado "substituto" vem dos dados: existe uma peça reprovada na
  // mesma campanha? Então esta é a que veio no lugar dela.
  const { data: reprovado } = pendente.campaign_id
    ? await apenasPecasDeAnuncio(
        supabase.from("creatives").select("id, file_name, meta_status"),
      )
        .eq("campaign_id", pendente.campaign_id)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const ehSubstituto = Boolean(reprovado);
  const copy = (pendente.copy ?? {}) as Record<string, unknown>;
  const titulo = typeof copy.titulo === "string" ? copy.titulo : "";
  const corpo = typeof copy.corpo === "string" ? copy.corpo : "";
  const oferta = typeof copy.oferta === "string" ? copy.oferta : "";

  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>{ehSubstituto ? "Olha a nova versão" : "Isso aqui pode ir ao ar?"}</h1>
        <p>
          {ehSubstituto
            ? "O anúncio anterior não passou na revisão do Facebook. A IA refez a peça mudando o que causou o problema — o resto continua igual."
            : "A IA montou sua primeira peça a partir do que você contou. Nada vai ao ar sem você dizer que sim."}
        </p>
      </div>

      {/* O bloco do reprovado é o ÚNICO acréscimo do segundo estado.
          Aparece antes da peça nova porque a pergunta do cliente, nesse
          momento, é "o que estava errado?" — não "como ficou?". */}
      {ehSubstituto && reprovado && (
        <section className="trust" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)" }}>
          <b className="title">O que não passou antes</b>
          {reprovado.meta_status
            ? `O Facebook recusou a versão anterior. Motivo informado: ${reprovado.meta_status}.`
            : "O Facebook recusou a versão anterior sem detalhar o motivo — acontece."}{" "}
          Isso é comum e não é problema com o seu negócio: as regras deles pegam coisas como
          promessa de resultado, foto com muito texto em cima ou palavra que soa a saúde.
        </section>
      )}

      <section className="peca-card">
        <div className="section-title">
          <h2>{ehSubstituto ? "A nova peça" : "Sua peça"}</h2>
        </div>

        {oferta && (
          <div className="peca-bloco">
            <span className="eyebrow">A oferta</span>
            <p className="peca-oferta">{oferta}</p>
          </div>
        )}

        <div className="peca-bloco">
          <span className="eyebrow">O que vai aparecer escrito</span>
          {titulo ? <p className="peca-titulo">{titulo}</p> : null}
          {corpo ? (
            <p className="peca-corpo">{corpo}</p>
          ) : (
            <p className="hint">O texto ainda não ficou pronto.</p>
          )}
        </div>

        <div className="peca-bloco">
          <span className="eyebrow">A foto</span>
          <p className="hint">
            {pendente.file_name
              ? pendente.file_name
              : "Nenhuma foto foi anexada ainda — a peça sobe só quando tiver uma."}
          </p>
        </div>
      </section>

      <DeOndeSai preVoo={preVoo} />

      <section className="trust">
        <b className="title">A aprovação ainda não está ligada</b>
        Falta a parte que guarda a sua resposta e coloca a peça na fila. Enquanto isso, se quiser
        aprovar ou pedir mudança, é mais rápido pelo WhatsApp — e a gente registra por você.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Quero%20falar%20sobre%20a%20pe%C3%A7a%20que%20apareceu%20para%20eu%20aprovar."
          target="_blank"
          rel="noopener"
        >
          Falar sobre esta peça &rarr;
        </a>
      </section>

      <div className="acoes">
        <button className="cta" type="button" disabled>
          Pode ir ao ar
        </button>
        <button className="cta ghost" type="button" disabled>
          Quero mudar alguma coisa
        </button>
      </div>
    </main>
    </div>
  );
}


function NadaParaAprovar({ preVoo }: { preVoo: PreVoo }) {
  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>Nada esperando você agora</h1>
        <p>
          Quando a IA montar uma peça nova — ou refizer uma que não passou —, ela aparece aqui e a
          gente te avisa.
        </p>
      </div>

      <DeOndeSai preVoo={preVoo} />

      <section className="trust">
        <b className="title">Enquanto isso</b>
        Dá para ver como estão seus anúncios ou conferir o que já foi decidido por você.
        <br />
        <a className="cta" href="/anuncios" style={{ marginTop: 12, width: "max-content" }}>
          Ver meus anúncios
        </a>
      </section>
    </main>
    </div>
  );
}

/**
 * DE ONDE ESTE ANÚNCIO SAI — o pré-voo, em linguagem de cliente.
 *
 * ============================================================
 * APARECE NOS DOIS ESTADOS DESTA TELA, INCLUSIVE NO "NADA PARA APROVAR".
 *
 * Medido em 15/09/2026: a única peça de campanha viva no banco é do
 * negócio FICTÍCIO, e sob RLS nenhum login a alcança — ou seja, todo
 * cliente real cai no estado vazio. Um bloco que só existisse no estado
 * com peça seria um bloco que ninguém vê.
 * ============================================================
 *
 * NÃO MOSTRA id de conta nem de Página. Número de conta de anúncio é
 * jargão de gestor de tráfego, e a regra do produto é não ter jargão na
 * interface. Quando o nome não dá para ler, a tela DIZ isso — não mostra o
 * id como consolo.
 *
 * Nenhuma classe nova, nenhuma cor e nenhum tamanho novo: reusa `.trust`,
 * `.title` e `.card-note`, que esta tela e a `/conta` já usam.
 */
function DeOndeSai({ preVoo }: { preVoo: PreVoo }) {
  // Sem negócio não há o que dizer sobre Página ou conta, e um bloco
  // vazio com título é pior que bloco nenhum: ele promete informação.
  if (!preVoo.temNegocio) return null;

  const { pagina, conta, preRequisitos, conexaoIlegivel } = preVoo;

  return (
    <section className="trust">
      <b className="title">De onde este anúncio sai</b>

      <span style={{ display: "block", marginTop: 4 }}>
        {conexaoIlegivel
          ? "Não conseguimos conferir sua conexão com o Facebook agora. Sua conta e seus anúncios não mudaram por causa disso."
          : pagina === null
            ? "Nenhuma página escolhida ainda — é dela que o anúncio sai, e é o WhatsApp dela que recebe as conversas."
            : pagina.nome
              ? `Página conectada: ${pagina.nome}`
              : "Página conectada: não conseguimos ler o nome dela agora."}
      </span>

      {conta !== null && <Conta conta={conta} />}

      {preRequisitos !== null && <Requisitos resultado={preRequisitos} />}

      {!conexaoIlegivel && pagina === null && (
        <a className="cta" href="/conectar" style={{ marginTop: 12, width: "max-content" }}>
          Escolher minha página
        </a>
      )}
    </section>
  );
}

/**
 * A conta de anúncio — e a ausência de escolha dita na cara.
 *
 * Enquanto não existe campanha, não existe conta escolhida: a única marca
 * no schema é `campaigns.ad_account_id`. Dizer "Conta de anúncio: X"
 * escolhendo a mais recentemente gravada seria afirmar uma decisão que
 * ninguém tomou. Decisão do Victor, 15/09/2026 — ver `docs/decisoes.md` e
 * o bloco de `lib/campanha/pre-voo.ts`.
 */
function Conta({ conta }: { conta: NonNullable<PreVoo["conta"]> }) {
  if (conta.marcada) {
    return (
      <span style={{ display: "block", marginTop: 4 }}>
        Conta de anúncio: {conta.conta.nome}
      </span>
    );
  }

  if (conta.contas.length === 0) {
    return (
      <span style={{ display: "block", marginTop: 4 }}>
        Nenhuma conta de anúncio escolhida ainda.
      </span>
    );
  }

  return (
    <span style={{ display: "block", marginTop: 4 }}>
      {conta.contas.length === 1 ? "Conta de anúncio ligada: " : "Contas de anúncio ligadas: "}
      {conta.contas.map((c) => c.nome).join(", ")}. A conta é escolhida na criação da campanha.
    </span>
  );
}

/**
 * Os requisitos de subida, como a rota os devolve.
 *
 * ============================================================
 * DOIS TIPOS DE "FALHOU", E ELES NÃO SE MISTURAM.
 *
 *  1. A CHAMADA falhou (rede, token nosso, backend fora). A mensagem já
 *     vem em português de `lib/backend/erros.ts`, e a resposta crua da
 *     FastAPI nunca chega à tela.
 *  2. A chamada deu 200 e a RESPOSTA diz que falta coisa. Aí o que a tela
 *     mostra é o bloqueio que a rota devolveu, palavra por palavra.
 * ============================================================
 *
 * `naoVerificados` entra junto de `bloqueios` porque o backend conta os
 * dois igual — "seguir para a subida sem saber se um requisito esta
 * cumprido e a mesma aposta que seguir sabendo que nao esta". O rótulo
 * separa os dois na tela, mas nenhum deles vira "está tudo certo".
 *
 * O TEXTO DOS BLOQUEIOS É DO BACKEND, e às vezes tem id de conta e frase
 * em inglês da Meta dentro. Está assim de propósito: a instrução foi
 * mostrar o bloqueio que a rota devolve. Traduzir para linguagem de
 * cliente é decisão de produto, não conserto — e teria que ser feita sem
 * apagar o motivo real.
 */
function Requisitos({ resultado }: { resultado: Resultado<PreRequisitos> }) {
  if (!resultado.ok) {
    return <span style={{ display: "block", marginTop: 4 }}>{resultado.mensagem}</span>;
  }

  const { ok: liberado, bloqueios, naoVerificados, avisos } = resultado.dados;

  if (liberado && bloqueios.length === 0 && naoVerificados.length === 0) {
    return (
      <>
        <span style={{ display: "block", marginTop: 4 }}>
          Os requisitos para subir o anúncio estão cumpridos.
        </span>
        {avisos.map((aviso) => (
          <p className="card-note" key={aviso}>
            {aviso}
          </p>
        ))}
      </>
    );
  }

  return (
    <>
      {bloqueios.length > 0 && (
        <>
          <span style={{ display: "block", marginTop: 4 }}>
            O que impede este anúncio de subir:
          </span>
          {bloqueios.map((bloqueio) => (
            <p className="card-note" key={bloqueio}>
              {bloqueio}
            </p>
          ))}
        </>
      )}

      {naoVerificados.length > 0 && (
        <>
          <span style={{ display: "block", marginTop: 4 }}>
            O que não deu para conferir — e conta como impedimento até dar:
          </span>
          {naoVerificados.map((item) => (
            <p className="card-note" key={item}>
              {item}
            </p>
          ))}
        </>
      )}
    </>
  );
}
