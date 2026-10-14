"use client";

import { useId, useState } from "react";
import { buscarAtividades } from "@/lib/onboarding/atividades";
import styles from "./SeletorDeAtividade.module.css";

export function SeletorDeAtividade({ ocupado, minimo, valorInicial = "", aoResponder }: {
  ocupado: boolean;
  minimo: number;
  valorInicial?: string;
  aoResponder: (atividade: string) => void;
}) {
  const [busca, setBusca] = useState(valorInicial);
  const [outro, setOutro] = useState(false);
  const [descricao, setDescricao] = useState(valorInicial);
  const id = useId();
  const resultados = buscarAtividades(busca);

  if (outro) return <div className={styles.seletor}>
    <label className={styles.rotulo} htmlFor={id}>Descreva o tipo do seu negócio</label>
    <input id={id} autoFocus type="text" autoComplete="off" value={descricao}
      onChange={(evento) => setDescricao(evento.target.value)} disabled={ocupado}
      placeholder="Ex.: conserto de celulares" onKeyDown={(evento) => {
        if (evento.key === "Enter") { evento.preventDefault(); if (descricao.trim().length >= minimo) aoResponder(descricao.trim()); }
      }} />
    {descricao.trim().length > 0 && descricao.trim().length < minimo &&
      <p className={styles.aviso}>Escreva pelo menos {minimo} caracteres.</p>}
    <div className={styles.acoes}>
      <button className={styles.primario} type="button" disabled={ocupado || descricao.trim().length < minimo}
        onClick={() => aoResponder(descricao.trim())}>Salvar e continuar</button>
      <button className={styles.voltar} type="button" disabled={ocupado} onClick={() => setOutro(false)}>Voltar às sugestões</button>
    </div>
  </div>;

  return <div className={styles.seletor}>
    <label className={styles.rotulo} htmlFor={id}>Busque o tipo do seu negócio</label>
    <input id={id} type="search" autoComplete="off" value={busca}
      onChange={(evento) => setBusca(evento.target.value)} disabled={ocupado}
      placeholder="Ex.: dentista, médico, restaurante" onKeyDown={(evento) => {
        if (evento.key !== "Enter") return;
        evento.preventDefault();
        if (resultados.length === 1) aoResponder(resultados[0]!);
        else if (resultados.length === 0 && busca.trim()) { setDescricao(busca.trim()); setOutro(true); }
      }} />
    <p className={styles.ajuda}>Escolha uma sugestão ou use Outros para escrever a atividade com suas palavras.</p>
    <div className={styles.opcoes} aria-live="polite">
      {resultados.map((atividade) => <button key={atividade} type="button" disabled={ocupado}
        onClick={() => aoResponder(atividade)}>{atividade}</button>)}
      {resultados.length === 0 && <p className={styles.vazio}>Nenhuma sugestão encontrada. Descreva em Outros.</p>}
      <button className={styles.outros} type="button" disabled={ocupado} onClick={() => {
        setDescricao(busca); setOutro(true);
      }}>Outros — escrever minha atividade</button>
    </div>
  </div>;
}
