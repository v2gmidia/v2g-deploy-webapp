import { carregarContasAction } from "./actions";
import { Contas } from "./Contas";
import { tituloDaAba } from "@/lib/titulos";
import { Marca } from "@/components/ui/Marca";
import "../onboarding-editorial.css";

export const metadata = tituloDaAba("/onboarding/contas");

/**
 * Bloco 2 do onboarding — as contas.
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
  const estado = await carregarContasAction();

  if ("erro" in estado) {
    return (
      <div className="auth-grid solo">
        <section className="auth-card">
          <h1 className="auth-h">Não consegui abrir suas contas.</h1>
          <p className="auth-sub">{estado.erro}</p>
          <a className="cta" href="/onboarding">
            Voltar para o onboarding
          </a>
        </section>
      </div>
    );
  }

  return (
    <div className="onb-v2 onb-v2-etapa">
      <header className="onb-v2-topo">
        <Marca editorial href="/inicio" />
        <a href="/onboarding">Rever meu negócio</a>
      </header>
      <section className="onb-v2-conteudo">
        <Contas inicial={estado} />
      </section>
    </div>
  );
}
