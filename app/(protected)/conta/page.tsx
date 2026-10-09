import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPaginas, type PaginaDoFacebook } from "@/lib/meta/graph";
import { registrarErroMeta } from "@/lib/meta/erros";
import { FormPerfil } from "./Formularios";
import { TrocarPagina } from "./TrocarPagina";
import { Identidade } from "./Identidade";
import { listarIdentidade } from "@/lib/identidade/armazenar";
import { SeletorDeTema } from "./SeletorDeTema";
import { signOutAction } from "../actions";
import { tituloDaAba } from "@/lib/titulos";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { ultimoDocumentoPorPedido } from "@/lib/contratacao/documentos";

export const metadata = tituloDaAba("/conta");

/**
 * Sua conta — porte de `tela-09-conta-desktop.html`.
 *
 * O QUE É REAL E O QUE É ESTADO VAZIO:
 *
 * Real (lê e grava no banco): o perfil da pessoa (`profiles`), a identidade
 * visual e a página do Facebook.
 *
 * Os DADOS DO NEGÓCIO saíram daqui e viraram uma linha que aponta para
 * `/meu-negocio`. Esta tela lê `businesses` só para saber que ele existe. O
 * motivo está em docs/revisao-perfil-cliente.md §2: o formulário que existia
 * aqui escrevia cinco campos do catálogo de extração sem registrar
 * procedência, e um campo que mente sobre a própria origem desarma a trava da
 * 0013.
 *
 * A seção comercial lê o pedido real do negócio selecionado. Aprovação
 * manual de comprovante não prova liquidação bancária nem recorrência.
 * Pausa e cancelamento não têm ação self-service implementada.
 *
 * A porta de saída continua visível e leva ao atendimento existente.
 * O aplicativo ainda não executa cancelamento nem pausa automaticamente.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  const ativo = await negocioAtivoDaSessao();
  const business = ativo.status === "selecionado"
    ? (await supabase.from("businesses").select("id, name")
      .eq("id", ativo.negocio.id).eq("profile_id", user.id).maybeSingle()).data
    : null;

  const consultaPedidos = business ? await supabase.from("commercial_orders")
    .select("id, status, origin, billing_period, unit_count, total_cents, payment_method")
    .eq("business_id", business.id).eq("buyer_profile_id", user.id)
    .order("created_at", { ascending: false }).limit(100) : null;
  const pedidos = consultaPedidos?.data ?? [];
  const pedidoIlegivel = !!consultaPedidos?.error;
  const aprovados = pedidos.filter((pedido) => pedido.status === "payment_approved");
  const consultaContratos = aprovados.length ? await supabase.from("contract_documents")
    .select("order_id, status, created_at").in("order_id", aprovados.map((pedido) => pedido.id))
    .order("created_at", { ascending: false }).limit(1000) : null;
  const contratoIlegivel = !!consultaContratos?.error || (consultaContratos?.data?.length ?? 0) === 1000;
  const ultimoContrato = contratoIlegivel ? new Map<string, string>()
    : ultimoDocumentoPorPedido(consultaContratos?.data ?? []);
  const assinados = new Set([...ultimoContrato].filter(([, status]) => status === "signed")
    .map(([orderId]) => orderId));

  // Logo e fotos do negócio. Uma consulta e uma assinatura de URLs em
  // lote — o bucket é privado, então nada é servido por URL pública.
  // ============================================================
  // ESTA CHAMADA TAMBÉM PRECISA DO ADMIN — e foi ela que continuou
  // derrubando a /conta depois do conserto de 02/09.
  //
  // `listarIdentidade` chama `createAdminClient()` lá dentro, e roda 25
  // linhas ANTES do `try` que envolvia a conexão com o Facebook. Proteger
  // só aquele bloco não adiantou nada: a página estourava antes de chegar
  // nele.
  //
  // A LIÇÃO, e ela vale mais que o conserto: a pergunta certa não era
  // "esta linha pode falhar?", era "o que MAIS nesta página precisa de
  // admin?". Consertei um ponto quando o problema era da página inteira.
  // O stack do erro dizia isso desde o começo — tinha um quadro de lib
  // entre a página e o `createAdminClient`, e nenhum bloco meu produzia
  // esse quadro.
  //
  // As duas seções degradam SEPARADAMENTE de propósito: a identidade
  // visual e a conexão com o Facebook não têm nada a ver uma com a outra,
  // e uma falha só deve apagar o que ela realmente alcança.
  // ============================================================
  let identidade: Awaited<ReturnType<typeof listarIdentidade>> = { logo: null, fotos: [] };
  let identidadeIlegivel = false;

  if (business?.id) {
    try {
      identidade = await listarIdentidade(business.id);
    } catch (erro) {
      identidadeIlegivel = true;
      console.error(
        "[conta] não consegui ler a identidade visual ::",
        (erro as Error).message,
      );
    }
  }

  // As páginas alcançadas pela conexão. Precisa do token, que só o
  // `service_role` lê do Vault — daí o cliente admin.
  let paginas: PaginaDoFacebook[] = [];
  let paginaAtual: string | null = null;

  // ============================================================
  // "FALHA AQUI NÃO DERRUBA A TELA" ERA PROMESSA, E NÃO CÓDIGO.
  //
  // O comentário sempre disse isso, e o `try` cobria só a chamada à Meta.
  // O `createAdminClient()` LANÇA quando falta `SUPABASE_SERVICE_ROLE_KEY`
  // — e ele estava fora do `try`. Em 02/09 a variável faltou num preview e
  // a `/conta` inteira virou 500: plano, identidade visual, tema, a porta
  // de saída. Nada disso tem a ver com o Facebook.
  //
  // O comentário estava certo e o código errado. Agora o `try` cobre a
  // criação do cliente também, e o que cai é só a seção da página.
  //
  // A distinção que fica: `null` é "não deu para saber", `[]` é "está
  // conectado e não há página". A tela precisa das duas, e um `[]` para os
  // dois casos diria ao cliente que ele não tem página quando o que houve
  // foi a gente não conseguir olhar.
  // ============================================================
  let conexaoIlegivel = false;

  if (business?.id) {
    try {
      const admin = createAdminClient();
      const { data: conexao } = await admin
        .from("meta_connections")
        .select("meta_page_id, status")
        .eq("business_id", business.id)
        .maybeSingle();

      paginaAtual = conexao?.meta_page_id ?? null;

      // ============================================================
      // ERA `=== "active"`, E `active` NÃO EXISTE.
      //
      // A CHECK da 0005 permite exatamente cinco valores: `disconnected`,
      // `connected`, `expiring`, `expired`, `revoked`. `active` não está
      // entre eles, então esta condição era SEMPRE falsa — o seletor de
      // página nunca carregava a lista, e a tela mostrava "nenhuma página
      // disponível" para quem tinha conexão boa.
      //
      // Achado em 04/09/2026 ao conferir se a desautorização automática
      // criaria o mesmo estado que o botão da `/conta`. A divergência
      // estava do outro lado: a tela lia um estado que o banco não
      // escreve.
      //
      // DÍVIDA REGISTRADA, e não consertada aqui: `/conectar/page.tsx:31`
      // compara `=== "connected"` para o mesmo assunto. São duas telas
      // decidindo sozinhas o que "a conexão serve" quer dizer, e nenhuma
      // considera `expiring` — que tem token válido. O conserto é extrair
      // o predicado, e ele não cabe num lote de conformidade com a Meta.
      // ============================================================
      if (conexao?.status === "connected") {
        try {
          const { data: token } = await admin.rpc("obter_token_meta", {
            p_business_id: business.id,
          });
          if (token && typeof token === "string") paginas = await listarPaginas(token);
        } catch (erro) {
          registrarErroMeta("conta:listar-paginas", erro);
        }
      }
    } catch (erro) {
      // Aqui só cai o que impede LER a conexão — falta de credencial de
      // servidor, sobretudo. Não é erro da Meta, então não vai para o
      // `registrarErroMeta`, que existe para diagnosticar aquele lado.
      conexaoIlegivel = true;
      console.error(
        "[conta] não consegui ler a conexão com o Facebook ::",
        (erro as Error).message,
      );
    }
  }

  return (
    <div className="conta-editorial">
      <div className="page-head">
        <h1>Sua conta</h1>
        <p>
          Seus dados, o negócio selecionado e o que já está registrado sobre a contratação.
        </p>
      </div>

      <div className="dash-grid conta-layout">
        <div className="dash-main conta-ficha">
          <section>
            <div className="section-title">
              <h2>Seu plano</h2>
              <span className="side-note">Por negócio</span>
            </div>
            <div className="card">
              {pedidoIlegivel ? <p className="hint">Não conseguimos consultar os pedidos agora. Tente novamente.</p>
                : pedidos.length ? <>
                  {pedidos.map((pedido) => <p className="hint" key={pedido.id}>
                    {pedido.status === "payment_approved" ? pedido.origin === "self_service"
                      ? "Pagamento confirmado pelo provedor. " : "Pedido aprovado pela equipe. "
                      : pedido.status === "proof_received" ? "Comprovante recebido; aprovação pendente. "
                        : pedido.status === "cancelled" ? "Pedido cancelado. "
                          : "Pedido aguardando pagamento ou análise. "}
                    {pedido.unit_count} {pedido.unit_count === 1 ? "conta de anúncio" : "contas de anúncio"} · {pedido.billing_period === "annual_upfront" ? "anual à vista" : pedido.billing_period === "semiannual_upfront" ? "semestral à vista" : "mensal"} · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.total_cents / 100)}.
                  </p>)}
                  {pedidos.length === 100 && <p className="foot-line">Mostrando os 100 pedidos mais recentes deste negócio.</p>}
                  <p className="foot-line">Estes registros não informam próxima cobrança, recibo nem liquidação bancária.</p>
                </> : <p className="hint">Não há pedido vinculado a este negócio nesta conta. Se contratou com outro e-mail, fale com a equipe para conferir.</p>}
            </div>
          </section>

          {business ? (
            <section>
              <div className="section-title">
                <h2>Dados do seu negócio</h2>
                <span className="side-note">É com isso que a IA pilota</span>
              </div>
              {/* UMA LINHA, e não um formulário. Os campos que moravam aqui
                  foram para `/meu-negocio`, onde cada um registra de onde
                  veio o valor. O que sobraria aqui — nome e raio — seria um
                  formulário de dois campos, que parece resto de algo maior.
                  Ver docs/revisao-perfil-cliente.md §2. */}
              <div className="card acct-list">
                <a className="acct-row" href="/meu-negocio">
                  <span className="ar-text">
                    <b>O que a gente entendeu do seu negócio</b>
                    <span>
                      Montado a partir da nossa conversa. Dá uma conferida — principalmente nos
                      números.
                    </span>
                  </span>
                  <Seta />
                </a>
              </div>
            </section>
          ) : (
            <section>
              <div className="section-title">
                <h2>Dados do seu negócio</h2>
              </div>
              <div className="card">
                <p className="hint">
                  Você ainda não contou sobre o seu negócio. São quatro perguntas rápidas, e é
                  delas que a IA parte para montar sua primeira campanha.
                </p>
                <a className="cta" href="/onboarding" style={{ width: "max-content" }}>
                  Começar agora
                </a>
              </div>
            </section>
          )}

          {/* Identidade visual. Fica DEPOIS do que o negócio é e ANTES de
              como ele aparece — a ordem da tela acompanha a ordem em que a
              pessoa pensa sobre o próprio negócio. */}
          {business && (
            <section>
              <div className="section-title">
                <h2>A cara do seu negócio</h2>
                <span className="side-note">Entra nos anúncios</span>
              </div>
              <div className="card">
                {identidadeIlegivel ? (
                  // DIZ QUE NÃO LEU. Um `Identidade` vazio afirmaria que
                  // ele não tem logo nem foto — e o cliente que subiu as
                  // dele veria o próprio trabalho ter sumido.
                  <p className="rc-tranquilo">
                    Não consegui carregar sua logo e suas fotos agora. Elas continuam
                    guardadas — nada foi perdido. Tente daqui a pouco; se continuar assim,
                    chama a gente.
                  </p>
                ) : (
                  <Identidade businessId={business.id} logo={identidade.logo} fotos={identidade.fotos} />
                )}
              </div>
            </section>
          )}

          {/* Trocar a página sem refazer o OAuth. Antes, o único caminho
              era reconectar tudo — desproporcional para mudar um campo, e
              cada passagem pelo Facebook é uma chance de o cliente
              recusar ou cair num erro. */}
          {conexaoIlegivel ? (
            <section>
              <div className="section-title">
                <h2>De qual página seus anúncios saem</h2>
              </div>
              {/* DIZ QUE NÃO LEU, em vez de sumir. Uma seção que
                  desaparece é indistinguível de "você não tem página", e
                  essa é uma afirmação sobre a conta dele que a gente não
                  tem como fazer agora. Sem detalhe técnico: o nome da
                  credencial que falta não o ajuda em nada. */}
              <div className="card">
                <p className="rc-tranquilo">
                  Não consegui verificar sua conexão com o Facebook agora. Sua conta e seus
                  anúncios não mudaram por causa disso. Tente daqui a pouco; se continuar
                  assim, chama a gente.
                </p>
              </div>
            </section>
          ) : (
            business && paginas.length > 0 && (
              <section>
                <div className="section-title">
                  <h2>De qual página seus anúncios saem</h2>
                </div>
                <TrocarPagina paginas={paginas} atual={paginaAtual} businessId={business.id} />
              </section>
            )
          )}

          <section>
            <div className="section-title">
              <h2>Aparência</h2>
            </div>
            <SeletorDeTema />
          </section>

          {/* As telas de destravar. Ficam aqui, e não escondidas atrás de
              um erro, porque o cliente que trava geralmente trava ANTES
              de publicar — e nesse momento ele não tem erro nenhum para
              clicar, só a sensação de que não está andando. */}
          <section>
            <div className="section-title">
              <h2>Verba, cobrança e requisitos</h2>
            </div>
            <div className="card acct-list">
              <a className="acct-row" href="/verba">
                <span className="ar-text">
                  <b>Sua verba e o cartão</b>
                  <span>Quanto você investe por mês, e por que são duas cobranças.</span>
                </span>
                <Seta />
              </a>
              <a className="acct-row" href="/whatsapp-business">
                <span className="ar-text">
                  <b>Seu WhatsApp precisa ser o Business</b>
                  <span>Sem ele o anúncio não tem para onde mandar quem clica.</span>
                </span>
                <Seta />
              </a>
              <a className="acct-row" href="/sem-instagram">
                <span className="ar-text">
                  <b>Deixar seu Instagram profissional</b>
                  <span>É uma chavinha dentro do aplicativo, de graça.</span>
                </span>
                <Seta />
              </a>
            </div>
          </section>

          <section>
            <div className="section-title">
              <h2>Seu perfil</h2>
            </div>
            <FormPerfil
              nome={profile?.full_name ?? ""}
              whatsapp={profile?.whatsapp ?? ""}
              email={user.email ?? ""}
            />
          </section>

          <section className="conta-atendimento">
            <div className="section-title">
              <h2>Fala com gente de verdade</h2>
            </div>
            <div className="conta-atendimento-texto">
              <p>
                Para dúvidas sobre cobrança, resultados ou saída, fale com a equipe pelo WhatsApp.
              </p>
              <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
                Chamar no WhatsApp &rarr;
              </a>
            </div>
          </section>

          <section>
            <div className="section-title">
              <h2>Contrato e atendimento</h2>
            </div>
            <div className="card acct-list">
              <p className="hint">
                {pedidoIlegivel ? "Não conseguimos consultar os pedidos para conferir a assinatura agora."
                  : !pedidos.length ? "Não há pedido vinculado para consultar um contrato."
                  : contratoIlegivel ? "Não conseguimos conferir a assinatura agora."
                    : !aprovados.length ? "Os pedidos deste negócio ainda não foram aprovados para assinatura."
                      : `${assinados.size} de ${aprovados.length} pedido(s) aprovado(s) entre os exibidos com assinatura registrada. Cada conta só pode ter campanha publicada quando o pedido correspondente estiver assinado.`}
              </p>
              <a className="acct-row" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
                <span className="ar-text">
                  <b>Falar sobre pausa ou cancelamento</b>
                  <span>A equipe atende pelo WhatsApp. O pedido não é executado automaticamente.</span>
                </span>
                <Seta />
              </a>
            </div>
            <p className="foot-line">
              A campanha só pode ser publicada depois das conferências e da assinatura concluída.
            </p>
          </section>

          {/* ESTA CONTA — a casa do "Sair".
              Ver docs/navegacao-mobile.md §7.

              Antes ele existia num lugar só: dentro do `.side-account` da
              sidebar. E `.side-account .who` já estava em `display: none`
              abaixo de 900px, o que deixava a conta SEM SAÍDA no tablet
              muito antes de existir barra inferior — medido em 899px, o
              botão dava 0 × 0. Com a sidebar virando barra de cinco itens
              no celular, ele precisava de casa própria de qualquer jeito.

              A action é a mesma do layout, não uma cópia: `signOutAction`
              mudou de lugar na tela, não de comportamento. */}
          <section>
            <div className="section-title">
              <h2>Esta conta</h2>
            </div>
            <div className="card sessao-atual">
              <div className="sessao-quem">
                <b>{business?.name?.trim() || user.email}</b>
                <span>{user.email}</span>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="cta ghost">
                  Sair desta conta
                </button>
              </form>
            </div>
            <p className="foot-line">
              Sair não cancela nada e não apaga nada — só fecha a sessão neste aparelho. Para
              voltar, é o mesmo e-mail e a mesma senha.
            </p>
          </section>
        </div>

        <aside className="dash-aside conta-notas">
          <section className="card">
            <b className="pc-title" style={{ display: "block", marginBottom: 6 }}>
              O que aparece aqui depois
            </b>
            <p className="hint" style={{ marginBottom: 0 }}>
              Quando houver campanha em veiculação e dados disponíveis, você poderá acompanhar
              investimento e contatos registrados. Uma conversa recebida não equivale a uma venda.
            </p>
          </section>

          <section className="card">
            <b className="pc-title" style={{ display: "block", marginBottom: 6 }}>
              Sobre a contratação
            </b>
            <p className="hint" style={{ marginBottom: 0 }}>
              A permanência mínima definida para novas contratações é de seis meses. O
              cancelamento pelo aplicativo ainda não está disponível; fale com a equipe pelo
              canal de atendimento se precisar tratar disso.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

const Seta = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 3l4 4-4 4" />
  </svg>
);
