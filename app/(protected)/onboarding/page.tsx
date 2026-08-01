import { carregarEstadoAction } from "./actions";
import { Chat } from "./Chat";
import { blocosDoPasso1, minutosRestantes } from "./perguntas";
import { Trilha } from "./Trilha";

/**
 * Onboarding — porte de `tela-03-onboarding-desktop.html`.
 *
 * ESCOPO: só o passo 1 (o chat sobre o negócio). Os passos 2 e 3 do
 * protótipo dependem de upload de arquivo, conexão OAuth com o Meta e
 * geração de criativo — tudo fora do escopo desta leva. A trilha lateral
 * mostra 2 e 3 travados, que é exatamente o que o original mostra
 * enquanto se está no passo 1.
 *
 * A DÍVIDA QUE MORREU AQUI: no protótipo as respostas ficavam num
 * `var answers = {}` do navegador enquanto o card lateral prometia
 * "fecha a página sem medo — suas respostas ficam guardadas". Era falso:
 * um F5 apagava tudo. Agora cada resposta grava no banco no momento em
 * que é dada, e esta página lê o que já foi respondido para retomar de
 * onde parou.
 *
 * Server Component: o estado inicial vem do banco na primeira
 * renderização, sem piscar a tela vazia antes de carregar.
 */
export default async function OnboardingPage() {
  const estado = await carregarEstadoAction();

  if ("erro" in estado) {
    return (
      <div className="flow-grid solo">
        <section className="auth-card">
          <h1 className="auth-h">Não consegui abrir seu onboarding.</h1>
          <p className="auth-sub">{estado.erro}</p>
          <a className="cta" href="/inicio">
            Voltar para o início
          </a>
        </section>
      </div>
    );
  }

  const { respostas } = estado;
  const blocos = blocosDoPasso1(respostas);

  return (
    <div className="flow-grid">
      <section className="auth-card">
        <Chat inicial={respostas} />
      </section>

      <aside className="flow-aside">
        <Trilha
          passo={1}
          blocos={blocos}
          minutos={minutosRestantes(respostas)}
          pecas={blocos >= 6 ? 1 : 0}
        />
      </aside>
    </div>
  );
}
