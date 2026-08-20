import { createClient } from "@/lib/supabase/server";

/**
 * "Um anúncio não passou."
 *
 * TOM: ROTINA, NÃO CRISE. A revisão do Facebook reprova peça o tempo
 * todo, por motivos que não têm nada a ver com a qualidade do negócio —
 * uma palavra que soa a saúde, texto demais em cima da foto, promessa de
 * resultado. Tratar isso como incidente ensina o cliente a ter medo de
 * uma coisa que vai acontecer de novo no mês que vem.
 *
 * A informação que mais importa aparece primeiro e é tranquilizadora: os
 * OUTROS anúncios continuam no ar. Sem isso, o cliente presume que parou
 * tudo — que é a leitura natural de "seu anúncio foi reprovado" para
 * quem não conhece a plataforma.
 *
 * Nada aqui pede ação urgente do cliente: a IA refaz a peça e ela volta
 * na tela de aprovação. O que ele precisa é entender e seguir a vida.
 */
export default async function ReprovadoPage() {
  const supabase = await createClient();

  const [{ data: reprovados }, { data: campanhas }] = await Promise.all([
    supabase
      .from("creatives")
      .select("id, campaign_id, file_name, meta_status, created_at")
      .eq("status", "rejected")
      .order("created_at", { ascending: false }),
    supabase.from("campaigns").select("id, name, published_at, status"),
  ]);

  const lista = reprovados ?? [];
  const noAr = (campanhas ?? []).filter((c) => c.published_at !== null);

  if (lista.length === 0) {
    return (
      <div className="auth-grid solo">
      <main className="auth-card">
        <div className="page-head">
          <h1>Nenhum anúncio reprovado</h1>
          <p>Está tudo passando na revisão do Facebook. Se algum parar, a gente te avisa aqui.</p>
        </div>
        <a className="cta" href="/anuncios" style={{ width: "max-content" }}>
          Ver meus anúncios
        </a>
      </main>
      </div>
    );
  }

  const quantos = lista.length;

  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>
          {quantos === 1 ? "Um anúncio não passou na revisão" : `${quantos} anúncios não passaram na revisão`}
        </h1>
        <p>
          Acontece com frequência e quase nunca é sobre o seu negócio. O Facebook revisa cada peça
          por um sistema automático, e ele é rigoroso com detalhes de texto e de imagem.
        </p>
      </div>

      {/* Primeiro a notícia boa, porque é a dúvida imediata de quem lê o
          título acima: "parou tudo?". */}
      <section className="hero-destaque">
        <span className="eyebrow">O que continua</span>
        {noAr.length > 0 ? (
          <>
            <p className="hero-frase">
              Seus outros anúncios <span className="destaque">seguem no ar</span>, normalmente.
            </p>
            <p className="hero-note">
              {noAr.length === 1
                ? "Você tem 1 anúncio rodando, e ele não foi afetado."
                : `Você tem ${noAr.length} anúncios rodando, e nenhum deles foi afetado.`}{" "}
              A reprovação vale só para a peça específica.
            </p>
          </>
        ) : (
          <>
            <p className="hero-frase">
              Nada foi <span className="destaque">cobrado</span> por essa peça.
            </p>
            <p className="hero-note">
              Anúncio reprovado não chega a ser exibido, e o que não é exibido não gasta verba.
            </p>
          </>
        )}
      </section>

      <section className="peca-card">
        <div className="section-title">
          <h2>{quantos === 1 ? "A peça" : "As peças"}</h2>
        </div>
        <div className="card">
          {lista.map((c) => (
            <div className="log-row" key={c.id}>
              <b>{c.file_name ?? "Peça sem nome"}</b>
              {c.meta_status ? ` — ${c.meta_status}` : " — o Facebook não detalhou o motivo"}
            </div>
          ))}
        </div>
      </section>

      <section className="trust">
        <b className="title">O que acontece agora, sem você fazer nada</b>
        A IA refaz a peça mudando o que costuma causar recusa — normalmente uma palavra do texto
        ou a quantidade de texto sobre a foto. Quando a nova versão ficar pronta, ela aparece para
        você aprovar, e você vai ver o que mudou.
        <br />
        <a className="cta" href="/aprovar" style={{ marginTop: 12, width: "max-content" }}>
          Ver o que está esperando aprovação
        </a>
      </section>

      <section className="trust">
        <b className="title">Os motivos mais comuns, para você reconhecer</b>
        Prometer resultado (&quot;emagreça 10kg&quot;), falar de saúde ou dinheiro de forma
        direta, texto ocupando boa parte da imagem, ou foto com marca de outra empresa. Nada disso
        é acusação — são regras da plataforma, iguais para todo mundo.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Um%20an%C3%BAncio%20meu%20foi%20reprovado%20e%20queria%20entender%20o%20motivo."
          target="_blank"
          rel="noopener"
        >
          Quero entender melhor &rarr;
        </a>
      </section>
    </main>
    </div>
  );
}

