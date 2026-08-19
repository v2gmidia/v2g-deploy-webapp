"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPaginas } from "@/lib/meta/graph";
import { registrarErroMeta } from "@/lib/meta/erros";
import { gravarCamposDoCliente, type CampoParaGravar } from "@/lib/cadastro/procedencia";

export interface ContaActionState {
  erro?: string;
  ok?: string;
}

/**
 * A ESCRITA DOS DADOS DO NEGÓCIO SAIU DAQUI, e não foi para outro lugar
 * nesta pasta: foi para `/meu-negocio`.
 *
 * O que existia aqui gravava `niche`, `city`, `avg_ticket_min/max` e
 * `monthly_budget` — cinco campos do catálogo de extração — SEM registrar
 * procedência. O efeito: o cliente corrigia o ticket, a coluna mudava, e o
 * jsonb continuava afirmando que aquele número tinha vindo da entrevista. Um
 * campo que mente sobre a própria origem é pior que um campo desatualizado,
 * porque a trava da 0013 lê exatamente isso para decidir se uma proposta do
 * agente pode passar por cima.
 *
 * Não foi consertado com um remendo aqui porque duas telas escrevendo a mesma
 * coluna com regras diferentes é o estado que produz a divergência de novo na
 * primeira distração. Ver docs/revisao-perfil-cliente.md §2.
 */

/**
 * Trocar a página do Facebook sem refazer a conexão inteira.
 *
 * ANTES, o único caminho era reconectar: mandar o cliente de volta ao
 * Facebook, reautorizar cinco escopos e reescolher tudo — para mudar um
 * campo. Desproporcional, e arriscado: cada passagem pelo OAuth é uma
 * chance de ele recusar, fechar a janela ou cair num erro do Meta.
 *
 * O token não muda. Ele já autoriza todas as páginas que o cliente
 * administra — a escolha de qual usar sempre foi nossa, não do Facebook.
 *
 * POR QUE ESTA AÇÃO USA `service_role`: a migration 0003 revogou UPDATE
 * de `meta_connections` para `authenticated`, para o cliente nunca poder
 * escrever na linha que guarda a referência do token. A checagem de dono
 * é feita aqui, explicitamente, e é o que substitui a RLS.
 */
export async function trocarPaginaAction(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const pagina = String(formData.get("pagina") ?? "").trim();
  if (!pagina) return { erro: "Escolha uma página." };

  // O negócio é lido com o cliente NORMAL, sujeito à RLS. É esta linha
  // que garante que o usuário só alcança o negócio dele — não confie na
  // ordem das operações abaixo sem ela.
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) return { erro: "Não encontramos seu negócio." };

  const admin = createAdminClient();

  // A página precisa estar entre as que a conexão alcança. Sem esta
  // checagem, um POST forjado gravaria qualquer id de página do Facebook
  // — inclusive de outra empresa.
  const { data: token } = await admin.rpc("obter_token_meta", {
    p_business_id: business.id,
  });
  if (!token || typeof token !== "string") {
    return { erro: "A conexão com o Facebook precisa ser refeita antes de trocar a página." };
  }

  let permitidas: string[];
  try {
    permitidas = (await listarPaginas(token)).map((p) => p.id);
  } catch (erro) {
    registrarErroMeta("conta:trocar-pagina", erro);
    return { erro: "Não conseguimos falar com o Facebook agora. Tente de novo em instantes." };
  }

  if (!permitidas.includes(pagina)) {
    return { erro: "Essa página não está entre as que a sua conexão alcança." };
  }

  const { error } = await admin
    .from("meta_connections")
    .update({ meta_page_id: pagina })
    .eq("business_id", business.id);

  if (error) {
    console.error("[conta] falha ao trocar página ::", error.message);
    return { erro: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  // A coordenada guardada era a do endereço da página ANTERIOR. Mantê-la
  // faria o anúncio da página nova ser entregue em volta do endereço da
  // velha, silenciosamente. Limpar força uma nova resolução na próxima
  // publicação. Ver `lib/meta/geo.ts`.
  await admin
    .from("businesses")
    .update({ geo_lat: null, geo_lng: null, geo_label: null, geo_resolved_at: null })
    .eq("id", business.id);

  revalidatePath("/conta");
  return { ok: "Pronto. Seus próximos anúncios saem dessa página." };
}

export async function salvarPerfilAction(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const nome = String(formData.get("full_name") ?? "").trim();
  if (!nome) return { erro: "Seu nome não pode ficar em branco." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: nome,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("[conta] falha ao salvar perfil ::", error.message);
    return { erro: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }

  revalidatePath("/conta");
  return { ok: "Perfil salvo." };
}
