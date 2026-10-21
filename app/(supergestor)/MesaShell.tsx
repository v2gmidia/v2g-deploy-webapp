import type { ReactNode } from "react";
import { Marca } from "@/components/ui/Marca";
import { PreferenciaDeTema } from "@/components/ui/PreferenciaDeTema";
import styles from "./Mesa.module.css";

export function MesaShell({ children, nome, acaoSair, previa = false }: {
  children: ReactNode;
  nome: string;
  acaoSair?: () => Promise<void>;
  previa?: boolean;
}) {
  const inicio = previa ? "/exemplo/mesa-gestor" : "/supergestor";
  return <div className={`app-shell v2g-editorial ${styles.shell}`}>
    <aside className={styles.lateral} aria-label="Navegação da mesa do gestor">
      <div className={styles.marca}><Marca href={inicio} editorial /></div>
      <div className={styles.identidade}>
        <strong>Mesa do gestor</strong>
        <span>{previa ? "Prévia local" : "Operação interna"}</span>
      </div>
      <nav className={styles.navegacao} aria-label="Mesa do gestor">
        <a href={inicio} aria-current="page">Carteira de negócios</a>
      </nav>
      <div className={styles.rodape}>
        <span>{nome}</span>
        {!previa && <a href="/inicio">Ir para o aplicativo</a>}
        {acaoSair && <form action={acaoSair}><button type="submit">Sair</button></form>}
      </div>
    </aside>
    <div className={styles.corpo}>
      <header className={styles.topo}>
        <div>
          <strong>Mesa do gestor</strong>
          <span>Contas, resultados e decisões em um só lugar</span>
        </div>
        <PreferenciaDeTema />
      </header>
      <main id="conteudo" className={styles.conteudo}>{children}</main>
    </div>
  </div>;
}
