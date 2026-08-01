import { Combinados } from "./Combinados";

/**
 * Alinhamento de expectativas — porte de
 * `tela-02-expectativas-desktop.html` do repositório de referência.
 *
 * Tela de conteúdo puro: não lê nem escreve nada no banco. Serve de
 * padrão mínimo de migração — o que muda de uma tela estática para uma
 * rota do app é só o shell (aqui é o `.app-shell` do grupo protegido,
 * já que a rota exige sessão) e a troca do JS imperativo por estado de
 * componente. O conteúdo do card é idêntico ao original.
 *
 * `.solo` no protótipo era proposital: nada ao lado que dê fuga do
 * texto. Mantido via `.flow-grid.solo`.
 */
export default function ExpectativasPage() {
  return (
    <div className="flow-grid solo">
      <Combinados />
    </div>
  );
}
