import { carregarContasAction } from "./actions";
import { Contas } from "./Contas";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { Trilha } from "../Trilha";

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

  // A MESMA FONTE DA OUTRA TRILHA. Isto aqui era uma TERCEIRA contagem —
  // `4 + Math.round(fechadas * 2 / 3)` blocos e `Math.max(2, 7 - fechadas * 2)`
  // minutos — lendo o jsonb por conta própria, com regra diferente da do
  // `/onboarding` e diferente da do `montarCadastro`. Três telas, três
  // aritméticas, um assunto só.
  const { blocosDaTrilha: blocos } = await estadoDoCliente(new Date());

  return (
    <div className="auth-grid">
      <section className="auth-card">
        <Contas inicial={estado} />
      </section>

      <aside className="auth-aside">
        <Trilha passo={1} blocos={blocos} pecas={blocos >= 6 ? 1 : 0} />
      </aside>
    </div>
  );
}
