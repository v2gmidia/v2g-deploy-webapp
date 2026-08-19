import { createClient } from "@/lib/supabase/server";
import { dinheiro } from "@/lib/formato";
import { raioValido } from "@/lib/meta/geo";
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
    .select("name, city, radius_km, monthly_budget, geo_lat, geo_label")
    .order("created_at", { ascending: true })
    .limit(1)
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

      <AlcanceReal negocio={negocio ?? null} />

      <section className="passos-card">
        <div className="section-title">
          <h2>São duas cobranças, não uma</h2>
        </div>

        <div className="duas-cobrancas">
          <div className="cobranca">
            <span className="eyebrow">Cobrança 1 — da V2G</span>
            <b>A mensalidade do serviço</b>
            <p>
              É o que você paga pela IA cuidar dos seus anúncios: montar as peças, acompanhar
              todo dia, ajustar o que não está rendendo. Valor fixo, no mesmo dia todo mês, e
              quem cobra somos nós.
            </p>
          </div>

          <div className="cobranca">
            <span className="eyebrow">Cobrança 2 — do Facebook</span>
            <b>A verba dos anúncios</b>
            <p>
              É o dinheiro que compra a exibição do anúncio. Ele vai <b>inteiro</b> para o
              Facebook — a V2G não fica com nada dessa parte. Quem cobra é o Facebook, no cartão
              que estiver na conta de anúncio, e o valor varia conforme o que foi gasto.
            </p>
          </div>
        </div>

        <div className="trust">
          <b>Por que aparecem dois lançamentos na fatura</b>
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
        <b>Quer mudar o valor, ou entender a cobrança?</b>
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
 * a gente tem a coordenada do negócio, e a coordenada vem do endereço
 * cadastrado na Página do Facebook. Sem endereço, a entrega cai para a
 * CIDADE INTEIRA.
 *
 * A diferença é enorme: 5 km em volta da loja e "Rio de Janeiro" inteiro
 * não são a mesma verba comprando a mesma coisa. Deixar isso implícito
 * seria cobrar do cliente por uma área que ele não escolheu, sem avisar.
 *
 * A alternativa que a gente NÃO fez: esticar o 5 km para os 16 km que o
 * `geo_locations.cities` aceita como piso. Seria três vezes a área
 * pedida, em silêncio. Ver `lib/meta/geo.ts` e
 * `docs/publicar-campanha.md` §0.c.
 */
function AlcanceReal({
  negocio,
}: {
  negocio: { city: string | null; radius_km: number | null; geo_lat: unknown; geo_label: string | null } | null;
}) {
  if (!negocio) return null;

  const temCoordenada = negocio.geo_lat !== null && negocio.geo_lat !== undefined;
  const raio = raioValido(negocio.radius_km);

  if (temCoordenada) {
    return (
      <section className="trust">
        <b>Onde seu anúncio aparece</b>
        Num raio de <b>{raio} km</b> em volta de {negocio.geo_label ?? "o endereço da sua página"}.
        É o que você escolheu, e é o que está valendo.
      </section>
    );
  }

  return (
    <section
      className="fail-block"
      style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
    >
      <b>Seu anúncio está indo mais longe do que você pediu</b>
      <p>
        Você escolheu <b>{raio} km</b> em volta do seu negócio, mas a gente não conseguiu
        descobrir onde ele fica — sua página do Facebook está sem endereço cadastrado. Sem
        endereço, o anúncio é exibido para{" "}
        <b>{negocio.city ? `${negocio.city} inteira` : "a cidade inteira"}</b>.
      </p>
      <p style={{ marginTop: 10 }}>
        Na prática, sua verba está sendo dividida com gente que provavelmente não vai até você. O
        conserto leva dois minutos: no Facebook, abra a página do seu negócio, vá em{" "}
        <b>Editar informações → Endereço</b> e preencha a rua e o número. Na próxima publicação a
        gente já usa.
      </p>
      <p style={{ marginTop: 10 }}>
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Preciso%20colocar%20o%20endere%C3%A7o%20na%20minha%20p%C3%A1gina%20do%20Facebook%20para%20o%20an%C3%BAncio%20chegar%20s%C3%B3%20perto%20de%20mim."
          target="_blank"
          rel="noopener"
        >
          Prefere que a gente faça junto? Chama aqui &rarr;
        </a>
      </p>
    </section>
  );
}
