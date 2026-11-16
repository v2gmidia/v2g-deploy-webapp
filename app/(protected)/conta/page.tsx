import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPaginas, type PaginaDoFacebook } from "@/lib/meta/graph";
import { registrarErroMeta } from "@/lib/meta/erros";
import { TelaDeConta } from "./TelaDeConta";
import { PendenciasDoNegocio } from "@/components/ui/PendenciasDoNegocio";
import { FormPerfil } from "./Formularios";
import { TrocarPagina } from "./TrocarPagina";
import { Identidade } from "./Identidade";
import { listarIdentidade } from "@/lib/identidade/armazenar";
import { SeletorDeTema } from "./SeletorDeTema";
import { signOutAction } from "../actions";
import { tituloDaAba } from "@/lib/titulos";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { ultimoDocumentoPorPedido } from "@/lib/contratacao/documentos";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";

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

  const { data: profile, error: erroPerfil } = await supabase
    .from("profiles")
    .select("full_name, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  const ativo = await negocioAtivoDaSessao();
  const business = ativo.status === "selecionado"
    ? (await supabase.from("businesses").select("id, name, dados_ficticios")
      .eq("id", ativo.negocio.id).eq("profile_id", user.id).maybeSingle()).data
    : null;
  const contasAtivas = business ? await supabase.from("ad_accounts")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id).eq("is_active", true) : null;
  const variasContasAtivas = !contasAtivas?.error && (contasAtivas?.count ?? 0) > 1;

  const consultaPedidos = business ? await supabase.from("commercial_orders")
    .select("id, cnpj, status, origin, billing_period, unit_count, total_cents, payment_method")
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
  let statusConexao: string | null = null;
  let paginasIlegiveis = false;

  if (business?.id) {
    try {
      const admin = createAdminClient();
      const { data: conexao, error: erroConexao } = await admin
        .from("meta_connections")
        .select("meta_page_id, status")
        .eq("business_id", business.id)
        .maybeSingle();

      if (erroConexao) throw new Error("Falha ao consultar conexão");
      statusConexao = conexao?.status ?? "disconnected";
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
      if (conexao?.status === "connected" || conexao?.status === "expiring") {
        try {
          const { data: token } = await admin.rpc("obter_token_meta", {
            p_business_id: business.id,
          });
          if (token && typeof token === "string") paginas = await listarPaginas(token);
          else paginasIlegiveis = true;
        } catch (erro) {
          paginasIlegiveis = true;
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

  const precisaReconectar = business && !conexaoIlegivel && statusConexao !== "connected";
  const estadoConexao = conexaoIlegivel ? "Não foi possível conferir" : !business ? "Escolha um negócio"
    : statusConexao === "connected" ? "Conectado" : statusConexao === "expiring" ? "Renovar conexão" : "Conectar";
  return <TelaDeConta secoes={[
    { id: "perfil", titulo: "Seu perfil", resumo: profile?.full_name?.trim() || "Seu perfil", detalhe: user.email ?? "", acao: "Editar perfil",
      avatar: (profile?.full_name?.trim() || user.email || "V").charAt(0).toUpperCase(),
      conteudo: erroPerfil ? <p className="form-warning">Não conseguimos carregar seu perfil. Atualize a página antes de editar.</p>
        : <FormPerfil nome={profile?.full_name ?? ""} whatsapp={profile?.whatsapp ?? ""} email={user.email ?? ""} /> },
    { id: "negocio", titulo: "Seu negócio", resumo: business?.name || "Escolha seu negócio", detalhe: "Cadastro e identidade visual", acao: "Ver dados",
      conteudo: business ? <>
        <PendenciasDoNegocio businessId={business.id} />
        <p><a href="/meu-negocio">Conferir os dados do negócio →</a></p>
        <h3>Logo e fotos</h3>
        {identidadeIlegivel ? <p className="form-warning">Não conseguimos carregar suas imagens. Tente novamente.</p>
          : <Identidade businessId={business.id} logo={identidade.logo} fotos={identidade.fotos} />}
      </> : <p><a href="/escolher-negocio">Escolher ou cadastrar negócio →</a></p> },
    { id: "conexoes", titulo: "Conexões", resumo: "Facebook e Instagram", detalhe: "Conta de anúncios e perfis vinculados", acao: estadoConexao,
      aberta: Boolean(precisaReconectar || conexaoIlegivel), conteudo: <>
        {conexaoIlegivel ? <p className="form-warning">Não conseguimos verificar sua conexão. Atualize a página ou fale com a equipe.</p>
          : precisaReconectar ? <p className="form-warning">{statusConexao === "expiring" ? "Sua autorização precisa ser renovada." : "Conecte a conta de anúncios deste negócio."} <a href="/conectar">{statusConexao === "expiring" ? "Renovar conexão" : "Conectar conta"}</a></p> : null}
        {paginasIlegiveis && <p className="form-warning">Não conseguimos carregar as páginas disponíveis. Tente novamente.</p>}
        {business && paginas.length > 0 ? <TrocarPagina paginas={paginas} atual={paginaAtual} businessId={business.id}
          variasContasAtivas={variasContasAtivas} contasIlegiveis={Boolean(contasAtivas?.error)} />
          : business && !paginasIlegiveis && !conexaoIlegivel && statusConexao === "connected" ? <p>Nenhuma página foi retornada. <a href="/conectar">Conferir conexão</a></p> : null}
        {!business && <p><a href="/escolher-negocio">Escolher negócio</a></p>}
        <details><summary>Ajuda com seus perfis</summary><p><a href="/whatsapp-business">Configurar WhatsApp Business</a></p><p><a href="/sem-instagram">Configurar Instagram profissional</a></p></details>
      </> },
    { id: "plano", titulo: "Plano e contrato", resumo: "Gestão de anúncios", detalhe: "Contratação, pagamentos e documentos", acao: "Ver detalhes", conteudo: <>
              {pedidoIlegivel ? <p className="hint">Não conseguimos consultar os pedidos agora. Tente novamente.</p>
                : pedidos.length ? <>
                  {pedidos.map((pedido) => <p className="hint" key={pedido.id}>
                    {business?.dados_ficticios ? "Pedido de teste: aprovação simulada, sem pagamento. "
                      : pedido.status === "payment_approved" ? pedido.origin === "self_service"
                      ? "Pagamento confirmado pelo provedor. " : "Pedido aprovado pela equipe. "
                      : pedido.status === "proof_received" ? "Comprovante recebido; aprovação pendente. "
                        : pedido.status === "cancelled" ? "Pedido cancelado. "
                          : "Pedido aguardando pagamento ou análise. "}
                    {identificarDocumentoContratante(pedido.cnpj)} · {pedido.unit_count} {pedido.unit_count === 1 ? "conta de anúncio" : "contas de anúncio"} · {pedido.billing_period === "annual_upfront" ? "anual à vista" : pedido.billing_period === "semiannual_upfront" ? "semestral à vista" : "mensal"} · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.total_cents / 100)}.
                  </p>)}
                  {pedidos.length === 100 && <p className="foot-line">Mostrando os 100 pedidos mais recentes deste negócio.</p>}
                  <p className="foot-line">Estes registros não informam próxima cobrança, recibo nem liquidação bancária.</p>
                </> : <p className="hint">Não há pedido vinculado a este negócio nesta conta. Se contratou com outro e-mail, fale com a equipe para conferir.</p>}
        <h3 id="contrato">Contrato</h3>
              <p className="hint">
                {pedidoIlegivel ? "Não conseguimos consultar os pedidos para conferir a assinatura agora."
                  : !pedidos.length ? "Não há pedido vinculado para consultar um contrato."
                  : contratoIlegivel ? "Não conseguimos conferir a assinatura agora."
                    : !aprovados.length ? "Os pedidos deste negócio ainda não foram aprovados para assinatura."
                      : `${assinados.size} de ${aprovados.length} pedido(s) aprovado(s) entre os exibidos com assinatura registrada. Cada conta só pode ter campanha publicada quando o pedido correspondente estiver assinado.`}
              </p>
        <p><a href="/verba">Conferir verba e cartão →</a></p>
        <p><a href="https://wa.me/5521936182176" target="_blank" rel="noopener">Falar sobre meu plano, pausa ou cancelamento →</a></p>
        <p className="hint">Pausa e cancelamento são tratados com a equipe. A solicitação não é executada automaticamente.</p>
      </> },
    { id: "preferencias", titulo: "Preferências", resumo: "Aparência", detalhe: "Claro, escuro ou do aparelho", acao: "Escolher tema", conteudo: <SeletorDeTema /> },
    { id: "acesso", titulo: "Acesso", resumo: "E-mail e senha", detalhe: user.email ?? "", acao: "Gerenciar", conteudo: <>
      <p>A recuperação da senha acontece pelo e-mail de acesso.</p><a className="cta ghost" href="/recuperar">Recuperar senha</a>
      <p className="hint">Para trocar o e-mail, <a href="https://wa.me/5521936182176" target="_blank" rel="noopener">fale com a equipe</a>.</p>
    </> },
  ]} saida={<form action={signOutAction}><button type="submit" className="cta ghost">Sair da conta</button></form>} />;
}
