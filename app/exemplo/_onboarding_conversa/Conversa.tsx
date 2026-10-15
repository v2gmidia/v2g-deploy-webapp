"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Conversa.module.css";

const perguntas = [
  "Qual é o tipo do seu negócio?",
  "Quais produtos ou serviços sua empresa oferece?",
  "Quem costuma comprar de você?",
  "O que essa pessoa busca quando procura sua empresa?",
] as const;

type Mensagem = { autor: "v2g" | "cliente"; texto: string };

function iconeMicrofone() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4m-4 0h8" /></svg>;
}

function iconeEnviar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6" /></svg>;
}

export function Conversa() {
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([{ autor: "v2g", texto: perguntas[0] }]);
  const [aviso, setAviso] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [mensagens]);

  function enviar() {
    const resposta = texto.trim();
    if (!resposta || indice >= perguntas.length) return;
    const proximo = indice + 1;
    const retorno = proximo < perguntas.length
      ? `Anotei sua resposta. ${perguntas[proximo]}`
      : "Pronto. Nesta prévia, a conversa termina aqui. No fluxo real, você poderá conferir as respostas antes de continuar para as contas.";
    setMensagens((atuais) => [...atuais, { autor: "cliente", texto: resposta }, { autor: "v2g", texto: retorno }]);
    setIndice(proximo);
    setTexto("");
    setAviso(null);
    campo.current?.focus();
  }

  function reiniciar() {
    setIndice(0);
    setTexto("");
    setMensagens([{ autor: "v2g", texto: perguntas[0] }]);
    setAviso(null);
    campo.current?.focus();
  }

  return <main className={styles.pagina}>
    <div className={styles.aplicativo}>
      <header className={styles.cabecalho}>
        <div className={styles.marca}><img src="/marca-editorial.svg" alt="" /><span><strong>V2G</strong><small>MÍDIA</small></span></div>
        <div><strong>Prévia da conversa</strong><span>Dados fictícios · sem salvar ou enviar</span></div>
        <button type="button" onClick={reiniciar}>Recomeçar</button>
      </header>
      <div className={styles.andamento}>
        <span>Sobre seu negócio</span><span>{Math.min(indice + 1, perguntas.length)} de {perguntas.length}</span>
      </div>
      <div className={styles.trilho} aria-hidden="true"><span style={{ width: `${(indice / perguntas.length) * 100}%` }} /></div>
      <section className={styles.mensagens} aria-label="Conversa de demonstração" aria-live="polite">
        <div className={styles.introducao}>
          <h1>Vamos conhecer seu negócio.</h1>
          <p>Responda uma pergunta por vez. Você mantém o controle das respostas e poderá corrigir tudo antes de avançar.</p>
        </div>
        {mensagens.map((mensagem, posicao) => <div key={posicao} className={`${styles.linha} ${mensagem.autor === "cliente" ? styles.cliente : ""}`}>
          <span className={styles.autor}>{mensagem.autor === "v2g" ? "V2G" : "Você"}</span>
          <p>{mensagem.texto}</p>
        </div>)}
        <div ref={fim} />
      </section>
      <form className={styles.formulario} onSubmit={(evento) => { evento.preventDefault(); enviar(); }}>
        {aviso && <p className={styles.aviso} role="status">{aviso}</p>}
        <div className={styles.compositor}>
          <label className={styles.rotulo} htmlFor="resposta-conversa">Sua resposta</label>
          <textarea id="resposta-conversa" ref={campo} value={texto} rows={2} maxLength={800}
            disabled={indice >= perguntas.length} placeholder={indice >= perguntas.length ? "Prévia concluída" : "Escreva sua resposta aqui"}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={(evento) => { if (evento.key === "Enter" && !evento.shiftKey) { evento.preventDefault(); enviar(); } }} />
          <div className={styles.acoes}>
            <div className={styles.ferramentas}>
              <button type="button" onClick={() => setAviso("Arquivos entram na etapa de marca. Esta prévia não faz upload.")}>+ <span>Anexar</span></button>
              <button type="button" aria-label="Responder falando" onClick={() => setAviso("O botão de voz é só visual nesta prévia. A transcrição real depende da configuração no QA.")}>{iconeMicrofone()}</button>
            </div>
            <button className={styles.enviar} type="submit" disabled={!texto.trim() || indice >= perguntas.length} aria-label="Enviar resposta">{iconeEnviar()}</button>
          </div>
        </div>
        <p className={styles.nota}>Prévia de interface: respostas automáticas ilustrativas, sem modelo de IA, áudio ou gravação no banco.</p>
      </form>
    </div>
  </main>;
}
