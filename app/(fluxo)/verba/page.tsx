import { createClient } from "@/lib/supabase/server";
import { dinheiro } from "@/lib/formato";
import { raioValido } from "@/lib/meta/geo";
import { cidadeParaTela, estadoDoAlcance } from "@/lib/verba/alcance";
import { FormVerba } from "./FormVerba";

/**
 * Verba e cartão.
 *
 * DUAS COBRANÇAS SEPARADAS, e essa é a coisa mais importante da tela. O
 * cliente pequeno assume que paga uma conta só. São duas:
 *
 *   1. a mensalidade da V2G — o serviço, cobrada por nós;
 *   2. a verba de anúncio — vai inteira para o Facebook, cobrada por eles.
 *
 * Quem não entende isso abre a fatura, vê dois lançamentos e acha que foi
 * cobrado em dobro. Descobrir isso no extrato é a pior forma de descobrir.
 *
 * O PAGAMENTO NÃO EXISTE AINDA. O botão fica visível e desabilitado, com
 * o motivo escrito. Um formulário de cartão que não cobra seria coletar
 * dado sensível sem destino — e um botão que abre um fluxo inexistente
 * seria a mentira que a migração do onboarding matou.
 */
export default async function VerbaPage() {
  const supabase = await createClient();

  const { data: negocio } = await supabase
    .from("businesses")
    .select("name, city, cep, radius_km, monthly_budget, geo_lat, geo_key, geo_label, geo_resolved_at")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Só para saber se ALGUÉM chegou a ter uma página para consultar. Sem
  // isso, "a página está sem endereço" é dedução sobre um dado que nunca
  // foi lido — ver `AlcanceReal`.
  const { data: conexao } = await supabase
    .from("meta_connections")
    .select("meta_page_id")
    .maybeSingle();

  const teto = negocio?.monthly_budget ? Number(negocio.monthly_budget) : null;
  const diario = teto !== null ? teto / 30 : null;

  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>Sua verba e o cartão</h1>
        <p>
          Quanto você quer investir por mês, e como isso é cobrado. Sem letra miúda: são duas
          contas diferentes, e elas vêm de lugares diferentes.
        </p>
      </div>

      <section className="hero-destaque">
        <span className="eyebrow">Seu limite no mês</span>
        {teto !== null ? (
          <>
            <p className="hero-num">{dinheiro(teto)}</p>
            <p className="hero-legenda">é o teto que você definiu</p>
            <p className="hero-sub">
              dá mais ou menos {dinheiro(diario ?? 0)} por dia de anúncio
            </p>
          </>
        ) : (
          <p className="hero-frase">Você ainda não definiu quanto quer investir.</p>
        )}
        <p className="hero-note">
          O Facebook pode gastar um pouco mais num dia em que estiver aparecendo gente boa, e
          menos nos dias seguintes para compensar. No fim do mês fecha no seu limite.
        </p>
      </section>

      <FormVerba atual={teto} />

      <AlcanceReal negocio={negocio ?? null} temPagina={Boolean(conexao?.meta_page_id)} />

      <section className="passos-card">
        <div className="section-title">
          <h2>São duas cobranças, não uma</h2>
        </div>

        <div className="duas-cobrancas">
          <div className="cobranca">
            <span className="eyebrow">Cobrança 1 — da V2G</span>
            <b className="title">A mensalidade do serviço</b>
            <p>
              É o que você paga pela IA cuidar dos seus anúncios: montar as peças, acompanhar
              todo dia, ajustar o que não está rendendo. Valor fixo, no mesmo dia todo mês, e
              quem cobra somos nós.
            </p>
          </div>

          <div className="cobranca">
            <span className="eyebrow">Cobrança 2 — do Facebook</span>
            <b className="title">A verba dos anúncios</b>
            <p>
              É o dinheiro que compra a exibição do anúncio. Ele vai <b>inteiro</b> para o
              Facebook — a V2G não fica com nada dessa parte. Quem cobra é o Facebook, no cartão
              que estiver na conta de anúncio, e o valor varia conforme o que foi gasto.
            </p>
          </div>
        </div>

        <div className="trust">
          <b className="title">Por que aparecem dois lançamentos na fatura</b>
          Porque são duas empresas cobrando coisas diferentes. Ver &quot;V2G&quot; e
          &quot;Facebook&quot; separados no extrato é o esperado — não é cobrança dobrada.
        </div>
      </section>

      <section className="peca-card">
        <div className="section-title">
          <h2>Seu cartão</h2>
        </div>
        <p className="hint">
          O cadastro do cartão ainda não está ligado aqui. Enquanto isso, a verba de anúncio é
          cobrada no cartão que já está na sua conta de anúncio do Facebook, e a mensalidade a
          gente combina direto com você.
        </p>
        <div className="acoes">
          <button className="cta" type="button" disabled>
            Cadastrar cartão
          </button>
        </div>
        <p className="empty-note">
          Desabilitado de propósito: preferimos um botão parado com o motivo escrito a um
          formulário que pede o número do seu cartão sem ter para onde mandar.
        </p>
      </section>

      <section className="trust">
        <b className="title">Quer mudar o valor, ou entender a cobrança?</b>
        Você muda o limite aqui em cima quando quiser, e ele também aparece em Conta. Para
        qualquer dúvida sobre cobrança, fala com a gente — é uma pessoa que responde.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Tenho%20uma%20d%C3%BAvida%20sobre%20a%20verba%20e%20a%20cobran%C3%A7a%20da%20V2G."
          target="_blank"
          rel="noopener"
        >
          Falar sobre cobrança &rarr;
        </a>
      </section>
    </main>
    </div>
  );
}


/**
 * ONDE O ANÚNCIO REALMENTE APARECE.
 *
 * A interface oferece 5, 15 e 30 km — mas o raio pequeno só existe quando
 * a gente tem a COORDENADA do negócio. Sem ela, a entrega cai para a
 * CIDADE INTEIRA, e a diferença é enorme: 5 km em volta da loja e "Rio de
 * Janeiro" inteiro não são a mesma verba comprando a mesma coisa. Deixar
 * isso implícito seria cobrar do cliente por uma área que ele não
 * escolheu, sem avisar.
 *
 * ------------------------------------------------------------------
 * TRÊS ESTADOS, NÃO DOIS. Esta é a correção do lote QA-3 (D5).
 *
 * Antes havia um `if (temCoordenada)` e um `else`, e o `else` afirmava:
 * "sua página do Facebook está sem endereço cadastrado". Medido em
 * 20/08/2026: `geo_resolved_at` está NULO nas quatro linhas de
 * `businesses` — a cascata de `garantirGeo()` só roda dentro de
 * `publicarCampanha()`, e nada foi publicado. Ou seja, ninguém nunca
 * perguntou nada à Página, e a tela acusava a Página mesmo assim. Pior:
 * a conta medida TEM página conectada e `pages_read_engagement`
 * concedido — o endereço pode muito bem estar lá.
 *
 * `geo_lat` nulo é "não sei", não "ele não tem". A regra é a mesma que
 * já custou caro aqui: três estados quando a verificação pode falhar.
 *
 * E o `else` também engolia o caso "resolvido para cidade": a tela nem
 * lia `geo_key`, então mesmo depois de a cascata acertar a cidade ela
 * continuaria dizendo que não sabe onde o negócio fica.
 *
 * A alternativa que a gente NÃO fez: esticar o 5 km para os 16 km que o
 * `geo_locations.cities` aceita como piso. Seria três vezes a área
 * pedida, em silêncio. Ver `lib/meta/geo.ts` e
 * `docs/publicar-campanha.md` §0.c.
 *
 * O CEP entrar na cascata é o conserto de verdade, e é OUTRO LOTE — ver
 * `docs/qa3-telas-isoladas.md` §1.2 e §7. Enquanto ele não existe, esta
 * tela ao menos para de mandar o cliente ao Facebook fazer o trabalho
 * que ele contratou a V2G para não fazer.
 * ------------------------------------------------------------------
 */
function AlcanceReal({
  negocio,
  temPagina,
}: {
  negocio: {
    city: string | null;
    cep: string | null;
    radius_km: number | null;
    geo_lat: unknown;
    geo_key: string | null;
    geo_label: string | null;
    geo_resolved_at: string | null;
  } | null;
  temPagina: boolean;
}) {
  if (!negocio) return null;

  const raio = raioValido(negocio.radius_km);
  const cidade = negocio.city ? cidadeParaTela(negocio.city) : null;
  const ondeEstamos = negocio.geo_label ?? cidade;
  const estado = estadoDoAlcance(negocio);

  // ---------- 1. Ponto: a coordenada existe, o raio é real ----------
  if (estado === "ponto") {
    return (
      <section className="trust">
        <b className="title">Onde seu anúncio aparece</b>
        Num raio de <b>{raio} km</b> em volta de{" "}
        {negocio.geo_label ?? "o endereço da sua página"}. É o que você escolheu, e é o que está
        valendo.
      </section>
    );
  }

  // ---------- 2. Cidade inteira: resolvido, e mais largo do que ele pediu ----------
  if (estado === "cidade") {
    return (
      <section
        className="fail-block"
        style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
      >
        <b className="title">Seu anúncio está indo mais longe do que você pediu</b>
        <p>
          Você escolheu <b>{raio} km</b> em volta do seu negócio, mas o que está valendo hoje é{" "}
          <b>{ondeEstamos ? `${ondeEstamos} inteira` : "a cidade inteira"}</b>. Para apertar a
          mira, a gente precisa do ponto exato do seu endereço — e é a gente que vai atrás disso,
          não você.
        </p>
        <p style={{ marginTop: 10 }}>
          Na prática, parte da sua verba está aparecendo para gente que provavelmente não vai até
          você. {negocio.cep ? "Seu CEP já está com a gente" : "Se você quiser, mande seu CEP"} —
          fala com a gente e a gente ajusta.
        </p>
        <p style={{ marginTop: 10 }}>
          <a
            className="wa"
            href="https://wa.me/5521936182176?text=Oi!%20Meu%20an%C3%BAncio%20est%C3%A1%20indo%20para%20a%20cidade%20inteira%20e%20eu%20queria%20que%20ele%20chegasse%20s%C3%B3%20perto%20de%20mim."
            target="_blank"
            rel="noopener"
          >
            Quero meu anúncio só aqui perto &rarr;
          </a>
        </p>
      </section>
    );
  }

  // ---------- 3. Ainda não sabemos, e não é culpa de ninguém ----------
  //
  // Este é o estado de TODAS as contas hoje. Ele não acusa, não manda
  // fazer nada, e não promete raio que a gente ainda não sabe se vai ter.
  // `temPagina` e `geo_resolved_at` entram só para não dizer "a gente vai
  // olhar sua página" a quem não conectou página nenhuma.
  const jaTentamos = negocio.geo_resolved_at !== null;

  // O ESPAÇO MORA DENTRO DO TERNÁRIO, não num `{" "}` antes dele. Com o
  // espaço do lado de fora, o ramo vazio (sem página e sem cidade)
  // renderizaria "primeiro anúncio . Você" — ponto separado da frase, que
  // é o mesmo tipo de defeito que o D11 deste lote consertou na caixa
  // amarela. Ver docs/qa3-telas-isoladas.md §5.
  const oQueTemos =
    temPagina && !jaTentamos
      ? " — a gente usa o endereço da sua página para acertar o ponto"
      : cidade
        ? ` — por enquanto o que a gente tem de você é ${cidade}${negocio.cep ? " e o seu CEP" : ""}`
        : "";

  return (
    <section className="trust">
      <b className="title">Onde seu anúncio vai aparecer</b>
      Você escolheu <b>{raio} km</b> em volta do seu negócio. A região exata é definida quando a
      gente monta o seu primeiro anúncio{oQueTemos}. Você não precisa fazer nada: se faltar alguma
      coisa para chegar perto de verdade, quem fala com você somos nós.
    </section>
  );
}
