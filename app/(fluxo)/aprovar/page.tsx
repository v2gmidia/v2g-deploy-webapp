import { createClient } from "@/lib/supabase/server";

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

  const { data: pendente } = await supabase
    .from("creatives")
    .select("id, campaign_id, file_name, copy, status, meta_status, created_at")
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pendente) return <NadaParaAprovar />;

  // O estado "substituto" vem dos dados: existe uma peça reprovada na
  // mesma campanha? Então esta é a que veio no lugar dela.
  const { data: reprovado } = pendente.campaign_id
    ? await supabase
        .from("creatives")
        .select("id, file_name, meta_status")
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
          <b>O que não passou antes</b>
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

      <section className="trust">
        <b>A aprovação ainda não está ligada</b>
        Falta a parte que guarda a sua resposta e coloca a peça na fila. Enquanto isso, se quiser
        aprovar ou pedir mudança, é mais rápido pelo WhatsApp — e a gente registra por você.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521980351531?text=Oi!%20Quero%20falar%20sobre%20a%20pe%C3%A7a%20que%20apareceu%20para%20eu%20aprovar."
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


function NadaParaAprovar() {
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
      <section className="trust">
        <b>Enquanto isso</b>
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

