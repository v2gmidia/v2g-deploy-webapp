import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { lerReferenciaDePreco } from "@/lib/onboarding/referencia-preco";
import { ReferenciaDePreco } from "./ReferenciaDePreco";
import { tituloDaAba } from "@/lib/titulos";
import { Marca } from "@/components/ui/Marca";
import "../onboarding-editorial.css";
import "./referencia-preco.css";

export const metadata = { ...tituloDaAba("/onboarding/contas"), title: "Referência de preço · V2G" };

/**
 * Referência opcional de preço. Links antigos não reabrem perguntas econômicas.
 *
 * ROTA PRÓPRIA, e não o fim do `/onboarding`: o "não sei" se resolve por
 * telefone, noutro dia, e o retorno precisa de URL. Ver
 * `docs/onboarding-expandido.md` D4.
 *
 * Já está protegida: o `proxy.ts` guarda o prefixo `/onboarding`.
 *
 * Server Component — o estado inicial vem do banco na primeira
 * renderização, sem piscar tela vazia.
 */
export default async function ContasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ativo = await negocioAtivoDaSessao();
  const negocioId = ativo.status === "selecionado" && user ? ativo.negocio.id : null;
  const leitura = negocioId && user ? await supabase.from("businesses").select("id, onboarding")
    .eq("id", negocioId).eq("profile_id", user.id).maybeSingle() : null;

  if (!leitura || leitura.error || !leitura.data || !negocioId) {
    return (
      <div className="auth-grid solo">
        <section className="auth-card">
          <h1 className="auth-h">Não consegui abrir a referência de preço.</h1>
          <p className="auth-sub">Confira o negócio selecionado e tente novamente.</p>
          <a className="cta" href="/escolher-negocio">
            Conferir negócio selecionado
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="onb-v2 onb-v2-etapa">
      <header className="onb-v2-topo">
        <Marca editorial href="/inicio" />
        <a href="/onboarding">Rever as informações</a>
      </header>
      <section className="onb-v2-conteudo">
        <h1 className="auth-h">Quer incluir uma referência de preço?</h1>
        <p className="auth-sub">É opcional. Um preço por produto, fardo ou serviço ajuda a equipe a entender a oferta. Você pode continuar sem informar.</p>
        <ReferenciaDePreco businessId={negocioId} atual={lerReferenciaDePreco(leitura.data.onboarding)} />
      </section>
    </div>
  );
}
