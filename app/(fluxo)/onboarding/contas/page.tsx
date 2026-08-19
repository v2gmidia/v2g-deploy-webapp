import { carregarContasAction } from "./actions";
import { Contas } from "./Contas";
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

  // Os dois últimos blocos da trilha do passo 1 são destes três: o bloco 1
  // acende até 4 (`perguntas.ts`), e cada conta fechada acende daqui.
  const fechadas = (["ticket", "custo", "lucro"] as const).filter(
    (c) => estado.contas[c]?.confirmado || estado.contas[c]?.naoSei,
  ).length;
  const blocos = 4 + Math.min(2, Math.round((fechadas * 2) / 3));

  return (
    <div className="auth-grid">
      <section className="auth-card">
        <Contas inicial={estado} />
      </section>

      <aside className="auth-aside">
        <Trilha
          passo={1}
          blocos={blocos}
          minutos={Math.max(2, 7 - fechadas * 2)}
          pecas={fechadas === 3 ? 1 : 0}
        />
      </aside>
    </div>
  );
}
