import type { ReactNode } from "react";
import styles from "./conta-clean.module.css";

export type SecaoDeConta = {
  id: string; titulo: string; resumo: string; detalhe: string;
  acao: string; avatar?: string; aberta?: boolean; conteudo: ReactNode;
};

/** A mesma composição na conta autenticada e na bancada local. */
export function TelaDeConta({ secoes, saida, previa = false }: {
  secoes: SecaoDeConta[]; saida: ReactNode; previa?: boolean;
}) {
  return <div className={styles.pagina}>
    <header className={styles.cabecalho}>
      <div className="page-head"><h1>Conta</h1><p>Seu perfil, seu negócio e suas preferências.</p></div>
      {previa && <span className={styles.previa}>Prévia local · dados de exemplo</span>}
    </header>
    <div className={styles.ficha}>{secoes.map(secao => <section key={secao.id}
      id={secao.id} className={styles.secao} aria-labelledby={`conta-${secao.id}`}>
      <h2 id={`conta-${secao.id}`}>{secao.titulo}</h2>
      <details className={styles.expansivel} open={secao.aberta || undefined}>
        <summary>{secao.avatar && <span className={styles.avatar} aria-hidden="true">{secao.avatar}</span>}
          <span className={styles.resumo}><strong>{secao.resumo}</strong><small>{secao.detalhe}</small></span>
          <span className={styles.acao}>{secao.acao}<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m7 4 6 6-6 6" /></svg></span>
        </summary>
        <div className={styles.conteudo}>{secao.conteudo}</div>
      </details>
    </section>)}</div>
    <footer className={styles.rodape}>{saida}<span>Sair não cancela seu plano.</span></footer>
  </div>;
}
