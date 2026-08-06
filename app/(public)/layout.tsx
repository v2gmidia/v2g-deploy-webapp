import { Marca } from "@/components/ui/Marca";
/**
 * Layout do grupo de rotas público — visual `.auth-shell` (sem sidebar,
 * um caminho só). Ver docs/arquitetura.md, Decisão 1.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-top">
        <Marca href="/entrar" />
      </header>
      <main className="auth-wrap">{children}</main>
    </div>
  );
}
