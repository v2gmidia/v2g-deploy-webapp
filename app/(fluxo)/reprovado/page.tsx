import { createClient } from "@/lib/supabase/server";
import { apenasPecasDeAnuncio } from "@/lib/criativos/peca";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { estaNoArAgora, fraseDeVeiculacao } from "@/lib/veiculacao/estado";

/**
 * "Um anúncio não passou."
 *
 * TOM: ROTINA, NÃO CRISE. A revisão do Facebook reprova peça o tempo
 * todo, por motivos que não têm nada a ver com a qualidade do negócio —
 * uma palavra que soa a saúde, texto demais em cima da foto, promessa de
 * resultado. Tratar isso como incidente ensina o cliente a ter medo de
 * uma coisa que vai acontecer de novo no mês que vem.
 *
 * A informação que mais importa aparece primeiro e é tranquilizadora: o
 * que já estava sendo exibido continua. Sem isso, o cliente presume que
 * parou tudo — que é a leitura natural de "seu anúncio foi reprovado"
 * para quem não conhece a plataforma.
 *
 * ESSA NOTÍCIA BOA NUNCA APARECEU, até 11/09/2026. Ela dependia de
 * `campaigns.published_at`, e `campaigns` tem zero linhas na tabela
 * inteira — o ramo do `else` rodava para todo mundo. Frase morta, não
 * frase errada, que é o tipo que ninguém reporta. Ver o bloco da
 * consulta.
 *
 * Nada aqui pede ação urgente do cliente: a IA refaz a peça e ela volta
 * na tela de aprovação. O que ele precisa é entender e seguir a vida.
 */
export default async function ReprovadoPage() {
  const supabase = await createClient();

  const [{ data: reprovados }, estado] = await Promise.all([
    // O mesmo filtro da /aprovar, pelo mesmo motivo: `creatives` guarda
    // logo e foto de identidade junto com peça de anúncio, e "reprovado"
    // só faz sentido para peça de anúncio vigente.
    // Ver docs/lote-leitura-de-peca.md.
    apenasPecasDeAnuncio(
      supabase
        .from("creatives")
        .select("id, campaign_id, file_name, meta_status, created_at"),
    )
      .eq("status", "rejected")
      .order("created_at", { ascending: false }),
    // ============================================================
    // A CONSULTA A `campaigns` SAIU. ITEM B3.
    //
    // Era `select(published_at)` e depois `filter(c => c.published_at
    // !== null)` — e `campaigns` tem ZERO LINHAS na tabela inteira,
    // medido em 11/09/2026. Ou seja: `noAr.length` era `0` para todo
    // cliente, sempre, e esta tela NUNCA mostrou a notícia boa que o
    // bloco de cima diz ser a razão de ela existir ("a informação que
    // mais importa aparece primeiro e é tranquilizadora").
    //
    // Não era uma frase errada: era uma frase MORTA. O ramo do `else`
    // rodava sempre, e ninguém percebeu porque ele também é verdadeiro.
    //
    // Agora vem de `estado.veiculacao`, a fonte única.
    // ============================================================
    estadoDoCliente(new Date()),
  ]);

  const lista = reprovados ?? [];
  const outrosNoAr = estaNoArAgora(estado.veiculacao);

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
        {outrosNoAr ? (
          <>
            {/* A frase vem do módulo. A CONTAGEM saiu junto com a consulta
                a `campaigns`: dizer "você tem 3 anúncios rodando" exigiria
                contar campanhas no ar, e nenhuma rota expõe veiculação por
                campanha — é o mesmo pedido ao backend do selo da
                `/anuncios`. Sem o número a frase continua fazendo o
                trabalho dela, que é dizer que não parou tudo. */}
            <p className="hero-frase">{fraseDeVeiculacao(estado.veiculacao, "manchete")}</p>
            <p className="hero-note">
              A reprovação vale só para a peça específica, e não afeta o que já está sendo
              exibido.
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

