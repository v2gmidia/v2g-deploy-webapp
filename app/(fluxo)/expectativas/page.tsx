import { Combinados } from "./Combinados";

/**
 * Alinhamento de expectativas — porte de
 * `tela-02-expectativas-desktop.html` do repositório de referência.
 *
 * Tela de conteúdo puro: não lê nem escreve nada no banco. Serve de
 * padrão mínimo de migração — o que muda de uma tela estática para uma
 * rota do app é a troca do JS imperativo por estado de componente. O
 * conteúdo do card é idêntico ao original.
 *
 * Vive no grupo `(fluxo)`: exige sessão, mas sem sidebar. O `.solo` do
 * protótipo era proposital ("nada ao lado que dê fuga do texto") e
 * agora é respeitado de verdade.
 */
export default function ExpectativasPage() {
  return (
    <div className="auth-grid solo">
      <Combinados />
    </div>
  );
}
