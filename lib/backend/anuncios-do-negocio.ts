import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { obterAnunciosComSessao } from "./cliente";
import { lerInventarioMeta, periodoMetaValido, uuidMeta,
  type ContaMetaParaConsulta, type ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";

type Motivo = Extract<ResultadoInventarioMeta, { ok: false }>["motivo"];
const MENSAGENS: Record<Motivo, string> = {
  acesso: "Entre novamente para consultar os anúncios do seu negócio.",
  sem_conta: "Não há uma conta de anúncios ativa vinculada a este negócio. Isso não confirma ausência de anúncios na Meta.",
  escolher_conta: "Escolha qual conta deste negócio você quer consultar.",
  indisponivel: "Não conseguimos consultar os anúncios agora. Tente novamente mais tarde.",
  escopo: "Não foi possível confirmar o acesso ou os vínculos desta conta. Fale com a equipe V2G.",
  periodo: "Escolha um período de até 31 dias para consultar os anúncios da Meta.",
  resposta: "Os dados recebidos não puderam ser conferidos. Nenhum número desta consulta foi exibido.",
  fonte: "O acesso de leitura da V2G à Meta precisa de conferência. Fale com a equipe V2G.",
};

/** Negócio vem da seleção autorizada da sessão. A URL só pode escolher conta já vinculada. */
export async function anunciosDoNegocioSelecionado(args: {
  desde: string; ate: string; contaId?: string;
}): Promise<ResultadoInventarioMeta> {
  return consultarAnuncios(args, null);
}

/** Mesma fonte do cliente, depois de papel verificado e atribuição exata ao negócio. */
export async function anunciosDoGestorAtribuido(args: {
  businessId: string; desde: string; ate: string; contaId?: string;
}): Promise<ResultadoInventarioMeta> {
  if (!uuidMeta(args.businessId)) return { ok: false, motivo: "escopo", mensagem: MENSAGENS.escopo, contas: [], contaSelecionada: null };
  return consultarAnuncios(args, args.businessId);
}

async function consultarAnuncios(args: { desde: string; ate: string; contaId?: string }, negocioDoGestor: string | null): Promise<ResultadoInventarioMeta> {
  let contas: ContaMetaParaConsulta[] = [];
  let contaSelecionada: string | null = null;
  const falhar = (motivo: Motivo): ResultadoInventarioMeta => ({ ok: false, motivo,
    mensagem: MENSAGENS[motivo], contas, contaSelecionada });
  if (!periodoMetaValido(args)) return falhar("periodo");
  if (args.contaId !== undefined && !/^act_[0-9]{1,40}$/.test(args.contaId)) return falhar("escopo");
  if (negocioDoGestor !== null && (!uuidMeta(negocioDoGestor)
    || process.env.V2G_MANAGER_WORK_ENABLED !== "true" || process.env.V2G_MANAGER_METRICS_READ_ENABLED !== "true"))
    return falhar("escopo");
  try {
    const cliente = await createClient();
    const sessao = await cliente.auth.getSession();
    const token = sessao.data.session?.access_token;
    if (sessao.error || !token) return falhar("acesso");
    // getSession sozinho não autoriza: o JWT usado no GET é validado pelo Auth.
    const usuario = await cliente.auth.getUser(token);
    if (usuario.error || !usuario.data.user) return falhar("acesso");
    let businessId: string;
    let leitor = cliente;
    if (negocioDoGestor !== null) {
      if (usuario.data.user.app_metadata?.papel !== "operador") return falhar("escopo");
      const admin = createAdminClient();
      const atribuicao = await admin.from("manager_accounts").select("business_id, operator_profile_id")
        .eq("business_id", negocioDoGestor).eq("operator_profile_id", usuario.data.user.id).maybeSingle();
      if (atribuicao.error) return falhar("indisponivel");
      if (atribuicao.data?.business_id !== negocioDoGestor || atribuicao.data?.operator_profile_id !== usuario.data.user.id)
        return falhar("escopo");
      // A consulta administrativa do negócio e das contas só ocorre após a atribuição exata.
      const negocio = await admin.from("businesses").select("id, profile_id").eq("id", negocioDoGestor).maybeSingle();
      if (negocio.error) return falhar("indisponivel");
      if (negocio.data?.id !== negocioDoGestor || !uuidMeta(negocio.data?.profile_id)) return falhar("escopo");
      businessId = negocioDoGestor;
      leitor = admin;
    } else {
      const ativo = await negocioAtivoDaSessao();
      if (ativo.status !== "selecionado" || !uuidMeta(ativo.negocio.id))
        return falhar(ativo.status === "falha_consulta" ? "indisponivel" : "escopo");
      businessId = ativo.negocio.id;
      const negocio = await cliente.from("businesses").select("id, profile_id")
        .eq("id", businessId).eq("profile_id", usuario.data.user.id).maybeSingle();
      if (negocio.error) return falhar("indisponivel");
      if (negocio.data?.id !== businessId || negocio.data?.profile_id !== usuario.data.user.id) return falhar("escopo");
    }
    const respostaContas = await leitor.from("ad_accounts").select("business_id, external_id, is_active, status")
      .eq("business_id", businessId).eq("is_active", true).eq("status", "ok").order("external_id").limit(101);
    if (respostaContas.error || !Array.isArray(respostaContas.data)) return falhar("indisponivel");
    if (respostaContas.data.length > 100 || respostaContas.data.some(c => c.business_id !== businessId
      || c.is_active !== true || c.status !== "ok" || typeof c.external_id !== "string" || !/^act_[0-9]{1,40}$/.test(c.external_id)))
      return falhar("escopo");
    contas = respostaContas.data.map(c => ({ id: c.external_id }));
    if (new Set(contas.map(c => c.id)).size !== contas.length) return falhar("escopo");
    if (!contas.length) return falhar("sem_conta");
    if (args.contaId && !contas.some(c => c.id === args.contaId)) return falhar("escopo");
    if (!args.contaId && contas.length > 1) return falhar("escolher_conta");
    contaSelecionada = args.contaId ?? contas[0]!.id;
    const resposta = await obterAnunciosComSessao({ businessId, tokenDaSessao: token,
      desde: args.desde, ate: args.ate, contaId: contaSelecionada });
    if (!resposta.ok) return falhar(resposta.http === 401 ? "acesso" : resposta.http === 424 ? "fonte"
      : resposta.http === 404 || resposta.http === 409 || resposta.http === 403 ? "escopo"
      : resposta.http === 422 ? "periodo" : "indisponivel");
    const dados = lerInventarioMeta(resposta.dados, { businessId, contaId: contaSelecionada, periodo: args });
    return dados ? { ok: true, dados, contas, contaSelecionada } : falhar("resposta");
  } catch { return falhar("indisponivel"); }
}
