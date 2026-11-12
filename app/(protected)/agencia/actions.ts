"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarAgenciaDaSessao } from "@/lib/agencia/da-sessao";
import { hrefDoCliente, retornoDaCarteira, UUID_AGENCIA } from "@/lib/agencia/contexto";
import { COOKIE_NEGOCIO_ATIVO, negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { pilotoQaHabilitado } from "@/lib/piloto-qa/acesso";

export type AbrirClienteState = { erro?: string };

/** POST explícito troca a preferência; uma URL GET nunca muda o negócio de escrita. */
export async function abrirClienteAction(_anterior: AbrirClienteState, dados: FormData): Promise<AbrirClienteState> {
  const erro = { erro: "Não foi possível abrir este anunciante. Volte à carteira e tente novamente." };
  if (!pilotoQaHabilitado() || [...dados.keys()].some(k => dados.getAll(k).length !== 1)) return erro;
  const id = dados.get("cliente"), pai = dados.get("agencia"), area = dados.get("area");
  if (typeof id !== "string" || !UUID_AGENCIA.test(id) || typeof pai !== "string" || !UUID_AGENCIA.test(pai)
    || area !== "/inicio" && area !== "/criativos") return erro;
  const peca = dados.get("peca");
  if (peca !== null && (area !== "/criativos" || typeof peca !== "string"
    || !/^(peca|revisao)-/.test(peca) || !UUID_AGENCIA.test(peca.replace(/^(peca|revisao)-/, ""))))
    return { erro: "A peça solicitada não pôde ser conferida. Abra a biblioteca do cliente e escolha a peça novamente." };
  const agencia = await carregarAgenciaDaSessao();
  if (agencia.status !== "agencia" || agencia.agencyBusinessId !== pai
    || !agencia.clientes.some(c => c.businessId === id)) return erro;
  const ativo = await negocioAtivoDaSessao();
  if (!("negocios" in ativo) || !ativo.negocios.some(n => n.id === id)) return erro;
  const supabase = await createClient();
  const auth = await supabase.auth.getUser();
  if (auth.error || !auth.data.user) return { erro: "Sua sessão expirou. Entre novamente." };
  const negocio = await supabase.from("businesses").select("id, profile_id")
    .eq("id", id).eq("profile_id", auth.data.user.id).maybeSingle();
  if (negocio.error || negocio.data?.id !== id || negocio.data?.profile_id !== auth.data.user.id) return erro;
  const busca = Object.fromEntries([...dados.entries()].filter((p): p is [string, string] => typeof p[1] === "string"));
  const retorno = retornoDaCarteira(busca, true);
  let destino = hrefDoCliente(area, id, retorno);
  if (typeof peca === "string") destino += `&peca=${encodeURIComponent(peca)}`;
  if (dados.get("ancora") === "agencia-enviar" && area === "/criativos") destino += "#agencia-enviar";
  (await cookies()).set(COOKIE_NEGOCIO_ATIVO, id, { httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 180 });
  revalidatePath("/", "layout");
  redirect(destino);
}
