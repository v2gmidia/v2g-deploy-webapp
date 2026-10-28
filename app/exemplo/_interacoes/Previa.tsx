"use client";

import { useState } from "react";
import styles from "./Previa.module.css";

const telas = [
  { nome: "Navegação", url: "/exemplo/inicio", instrucao: "Use os cinco itens da barra inferior para trocar de tela. No computador, a navegação continua na lateral." },
  { nome: "E-mail e senha", url: "/exemplo/acesso", instrucao: "Toque nos campos e digite para ver os rótulos subirem. O olho mostra ou oculta a senha. Esta prévia não envia acessos nem cadastros." },
  { nome: "Envio de imagem", url: "/exemplo/criativos#subir-criativo", instrucao: "Selecione uma imagem JPG ou PNG ou arraste um arquivo do computador. Experimente conferir o criativo: nesta prévia nada é enviado, analisado ou publicado." },
];

export function PreviaInteracoes() {
  const [tela, setTela] = useState(0);
  const [celular, setCelular] = useState(true);
  return <main className={styles.pagina}>
    <header className={styles.cabecalho}><div><h1>Uma V2G mais agradável de usar.</h1><p>Primeiro bloco · prévia local com os componentes do aplicativo.</p></div><a href="/exemplo/inicio">Abrir app em tela cheia</a></header>
    <div className={styles.controles}>
      <div role="group" aria-label="O que experimentar">{telas.map((item, indice) => <button key={item.nome} type="button" aria-pressed={tela === indice} onClick={() => setTela(indice)}>{item.nome}</button>)}</div>
      <div role="group" aria-label="Tamanho da prévia"><button type="button" aria-pressed={celular} onClick={() => setCelular(true)}>Celular</button><button type="button" aria-pressed={!celular} onClick={() => setCelular(false)}>Computador</button></div>
    </div>
    <p className={styles.instrucao} role="status">{telas[tela]!.instrucao}</p>
    <div className={styles.palco}>
      <iframe title={`Prévia de ${telas[tela]!.nome}`} src={telas[tela]!.url} className={celular ? styles.celular : styles.computador} />
    </div>
  </main>;
}
