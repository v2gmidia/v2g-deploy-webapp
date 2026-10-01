import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * A ROTA "/" NÃO MOSTRA NADA — só decide para onde mandar.
 *
 * ============================================================
 * A VITRINE PÚBLICA DA V2G É SÓ v2gmidia.com.br — 01/10/2026.
 *
 * Até aqui "/" era uma landing page inteira, portada do protótipo em
 * 06/08/2026, e ela convivia com a LP oficial (repositório V2G-LP). Eram
 * duas vitrines no ar, as duas indexáveis, dizendo coisas diferentes: esta
 * tinha preço de plano, número de resultado ilustrativo e um rodapé com
 * razão social e CNPJ de placeholder.
 *
 * O app é ferramenta de quem já é cliente. Quem chega sem conta vai para
 * /entrar, e /entrar aponta para o site.
 * ============================================================
 *
 * Quem já entrou continua indo para o painel — o mesmo comportamento que a
 * página antiga tinha. A decisão mora aqui, e não no `proxy.ts`, para não
 * mexer na lista de rotas protegidas: "/" continua pública, ela só não tem
 * conteúdo próprio.
 */
export default async function Raiz() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/inicio" : "/entrar");
}
