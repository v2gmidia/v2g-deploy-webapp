import { Marca } from "@/components/ui/Marca";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout do grupo de FLUXO — exige sessão, mas sem sidebar e sem topbar.
 *
 * Existe porque os dois shells anteriores não serviam:
 * - `(public)` não exige sessão, e estas telas exigem;
 * - `(protected)` traz a sidebar, e sidebar é exatamente o que estas
 *   telas não podem ter. O HTML de `tela-02-expectativas-desktop.html`
 *   é explícito no comentário do `.solo`: "nada ao lado que dê fuga do
 *   texto". Uma navegação lateral ao lado de uma tarefa que pede foco
 *   contradiz a intenção do design.
 *
 * A regra de qual grupo usar: tela de FLUXO (uma tarefa por vez, sem
 * fuga) vem para cá; tela de APP (dashboard, campanhas, criativos,
 * alertas, conta) fica em `(protected)`.
 *
 * A verificação de sessão é a 2ª camada, igual à do `(protected)` — o
 * `proxy.ts` já barrou antes, e aqui barra de novo (ver
 * docs/arquitetura.md, Decisão 3).
 */
export default async function FluxoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="auth-shell">
      {/* AS TELAS DE FLUXO NÃO GANHAM A BARRA INFERIOR do celular, e isso
          é desenho, não esquecimento — o grupo existe para tarefa sem
          fuga. Ver docs/navegacao-mobile.md §10.

          O que mudou no lote QA-1: a saída daqui era ACIDENTAL. Estas
          telas escapavam do defeito de navegação do celular só porque a
          marca, por acaso, é link — enquanto as telas de app ficavam sem
          nenhum clicável. Agora está declarado: a saída de uma tela de
          fluxo é esta linha, a marca leva ao Início, e os dois alvos são
          alvos de celular de verdade (medidos, e ajustados no CSS do
          `.auth-top`). */}
      <header className="auth-top">
        <Marca href="/inicio" />
        {/* Única saída da tela, como no original: falar com gente. */}
        <a className="auth-help" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M6 1a5 5 0 0 0-4.3 7.6L1 11l2.5-.7A5 5 0 1 0 6 1z" />
          </svg>
          Falar com uma pessoa
        </a>
      </header>
      <main className="auth-wrap">{children}</main>
    </div>
  );
}
