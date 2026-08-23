import { carregarEstadoAction } from "./actions";
import { Chat } from "./Chat";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { listarNichos } from "@/lib/backend";
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
  // ============================================================
  // DISPARA ANTES DE ESPERAR QUALQUER COISA, e é a decisão sobre o
  // carregamento — tomada depois de medir, não por gosto.
  //
  // Medido em 22/08/2026: o `GET /nichos` responde em 17 ms de mediana,
  // 60 ms a frio. Esta página já esperava por duas outras coisas antes de
  // renderizar; em paralelo com elas, a lista custa perto de nada.
  //
  // Por isso NÃO existe aqui um estado de "carregando a lista", nem os
  // cinco chips de reserva aparecendo primeiro para serem trocados por dez
  // meio segundo depois. Trocar chip na cara de quem está lendo é pior que
  // as duas alternativas que essa manobra tentaria evitar.
  //
  // E a espera tem TETO, para isto não depender da medição continuar
  // verdadeira: `listarNichos` desiste em 2,5 s e devolve falha, o que faz
  // a reserva entrar. A tela nunca fica presa esperando o backend.
  // ============================================================
  const promessaNichos = listarNichos();

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

  // `null` quando o backend não respondeu — e é o `null` que acende a
  // reserva no `Chat`. O token fica deste lado: o componente de cliente
  // recebe a lista pronta por props e filtra local.
  const nichos = await promessaNichos;

  return (
    <div className="auth-grid">
      <section className="auth-card">
        <Chat inicial={respostas} nichos={nichos.ok ? nichos.dados : null} />
      </section>

      <aside className="auth-aside">
        <Trilha passo={1} blocos={blocos} pecas={blocos >= 6 ? 1 : 0} />
      </aside>
    </div>
  );
}
