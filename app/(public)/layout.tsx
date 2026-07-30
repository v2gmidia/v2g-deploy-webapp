/**
 * Layout do grupo de rotas público — visual `.auth-shell` (sem sidebar,
 * um caminho só). Ver docs/arquitetura.md, Decisão 1.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-top">
        <a className="wordmark" href="/entrar">
          <span className="glyph">V2G</span>
          <span className="wm">
            V2G
            <small>Tráfego no piloto</small>
          </span>
        </a>
      </header>
      <main className="auth-wrap">{children}</main>
    </div>
  );
}
