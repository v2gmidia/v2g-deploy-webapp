import { carregarEstadoAction } from "./actions";
import { Chat } from "./Chat";
import { estadoDoCliente } from "@/lib/estado/cliente";
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
      <div className="auth-grid solo">
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

  // A TRILHA LÊ A MESMA FONTE QUE O RESTO DO APP. Antes ela lia
  // `blocosDoPasso1`/`minutosRestantes`, duas tabelas fixas indexadas pela
  // última pergunta respondida do bloco 1 — que não enxergavam as contas
  // nem a `/verba`. Ver docs/estado-do-cliente.md §0.3.
  const { blocosDaTrilha: blocos } = await estadoDoCliente(new Date());

  return (
    <div className="auth-grid">
      <section className="auth-card">
        <Chat inicial={respostas} />
      </section>

      <aside className="auth-aside">
        <Trilha passo={1} blocos={blocos} pecas={blocos >= 6 ? 1 : 0} />
      </aside>
    </div>
  );
}
