import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { escolherNegocio, type EscolhaDeNegocio } from "./escolha";
import { negociosLiberados, type PedidoDoNegocio } from "./elegibilidade";
import { lerTodasPaginas, lerTodasPaginasEmLotes } from "./paginacao";
import { acessosContratadosDoPerfil } from "../contratacao/acesso-contratado";
import { pedidoMantemDireito } from "../contratacao/direito-por-pedido";
import { consultarEstadoPagamento } from "../contratacao/consultar-estado-pagamento";
import { acessosPilotoQa, pilotoQaHabilitado } from "../piloto-qa/acesso";

export const COOKIE_NEGOCIO_ATIVO = "v2g_negocio_ativo";

export type NegocioAtivoDaSessao = EscolhaDeNegocio | {
  status: "sem_sessao" | "falha_consulta";
};

/**
 * Resolve a escolha feita pelo usuário contra as empresas que a sessão
 * realmente alcança. O cookie guarda preferência, nunca permissão.
 */
export async function negocioAtivoDaSessao(): Promise<NegocioAtivoDaSessao> {
  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !user) return { status: "sem_sessao" };

  const data = await lerTodasPaginas((inicio, fim) => supabase
    .from("businesses")
    .select("id, name, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(inicio, fim));

  if (!data) return { status: "falha_consulta" };
  const operador = user.app_metadata?.papel === "operador";
  let legadoEm: string | null = null;
  if (!operador) {
    const legado = await supabase.from("webapp_legacy_access")
      .select("granted_at").eq("profile_id", user.id).maybeSingle();
    if (legado.error) return { status: "falha_consulta" };
    legadoEm = legado.data?.granted_at ?? null;
  }

  // O perfil só enxerga seus negócios via RLS. A leitura administrativa
  // consulta apenas os IDs já pertencentes a ele: pedidos pendentes ainda
  // não vinculados ao perfil também precisam bloquear a linha correspondente.
  let pedidos: PedidoDoNegocio[] = [];
  const marco = legadoEm ? Date.parse(legadoEm) : NaN;
  const precisaPedidos = !operador && data.some((negocio) =>
    !Number.isFinite(marco) || Date.parse(negocio.created_at) > marco);
  if (precisaPedidos && data.length) {
    try {
      const admin = createAdminClient();
      const resultado = await lerTodasPaginasEmLotes<PedidoDoNegocio>(data.map((negocio) => negocio.id), (lote, inicio, fim) => admin.from("commercial_orders")
        .select("id, business_id, status, buyer_email, buyer_profile_id, payment_method, provider_charge_id")
        .in("business_id", lote)
        .order("id", { ascending: true })
        .range(inicio, fim));
      if (!resultado) return { status: "falha_consulta" };
      pedidos = [];
      for (const pedido of resultado) pedidos.push({...pedido,
        direitoFinanceiro: await pedidoMantemDireito(pedido,
          p => consultarEstadoPagamento(admin,p)),
      });
    } catch {
      return { status: "falha_consulta" };
    }
  }
  const grantsQa = user.email_confirmed_at && pilotoQaHabilitado()
    ? await acessosPilotoQa(createAdminClient(), user.id, data.map(negocio => negocio.id)) : [];
  let liberados = negociosLiberados({
    acessosContratados: await acessosContratadosDoPerfil(supabase, user),
    acessosPilotoQa: grantsQa,
    negocios: data,
    pedidos,
    perfilId: user.id,
    emailVerificado: user.email_confirmed_at ? user.email ?? null : null,
    legadoEm,
    operador,
  });
  const baseLiberados = liberados;
  // A estrutura preparada não muda a elegibilidade comercial em produção.
  // Filho só entra no trabalho QA se o pai continua no piloto e não há pedido próprio.
  if (pilotoQaHabilitado() && user.email_confirmed_at && user.email?.trim() && grantsQa.length) {
    const { lerVinculosDaSessao } = await import("../agencia/vinculos-da-sessao");
    const leitura = await lerVinculosDaSessao(supabase, user.id);
    if (leitura.estado === "indisponivel") return { status: "falha_consulta" };
    if (leitura.estado === "pronto") {
      const { ampliarCarteiraQa } = await import("../agencia/vinculos");
      const agora = Date.now();
      liberados = ampliarCarteiraQa({ negocios: data, liberados, vinculos: leitura.vinculos,
        paisPiloto: grantsQa.filter(g => g.profile_id === user.id && !g.revoked_at && Date.parse(g.expires_at) > agora).map(g => g.business_id),
        negociosComPedido: pedidos.flatMap(p => p.business_id ? [p.business_id] : []),
      });
    }
  }
  // Abrir o app continua entrando na única agência antes liberada. Seus filhos
  // novos não obrigam escolher conta por conta nem selecionam um anunciante ao acaso.
  const preferencia = (await cookies()).get(COOKIE_NEGOCIO_ATIVO)?.value
    ?? (baseLiberados.length === 1 && liberados.length > 1 ? baseLiberados[0]!.id : null);
  return escolherNegocio(liberados, preferencia);
}
