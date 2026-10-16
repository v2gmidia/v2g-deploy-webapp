"use client";

import { useEffect, useId, useRef, useState } from "react";
import { buscarAtividades } from "@/lib/onboarding/atividades";
import styles from "./SeletorDeAtividade.module.css";

export function SeletorDeAtividade({ ocupado, minimo, valorInicial = "", falaRecebida, aoResponder }: {
  ocupado: boolean;
  minimo: number;
  valorInicial?: string;
  falaRecebida?: { texto: string; sequencia: number } | null;
  aoResponder: (atividade: string) => void;
}) {
  const [busca, setBusca] = useState(valorInicial);
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const [outro, setOutro] = useState(false);
  const recipiente = useRef<HTMLDivElement>(null);
  const listaRolavel = useRef<HTMLDivElement>(null);
  const id = useId();
  const listaId = `${id}-opcoes`;
  const resultados = buscarAtividades(busca);

  useEffect(() => {
    if (!falaRecebida) return;
    setBusca(falaRecebida.texto);
    setOutro(true);
    setAberto(false);
  }, [falaRecebida]);

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (evento: PointerEvent) => {
      if (!recipiente.current?.contains(evento.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fecharFora);
    return () => document.removeEventListener("pointerdown", fecharFora);
  }, [aberto]);
  useEffect(() => {
    const lista = listaRolavel.current;
    const ativo = document.getElementById(`${listaId}-${indiceAtivo}`);
    if (!aberto || !lista || !ativo || !lista.contains(ativo)) return;
    const topo = ativo.offsetTop - lista.offsetTop;
    if (topo < lista.scrollTop) lista.scrollTop = topo;
    else if (topo + ativo.offsetHeight > lista.scrollTop + lista.clientHeight)
      lista.scrollTop = topo + ativo.offsetHeight - lista.clientHeight;
  }, [aberto, indiceAtivo, listaId]);

  function escolherOutro() {
    setAberto(false);
    setOutro(true);
  }

  return <div className={styles.seletor}>
    <label className={styles.rotulo} htmlFor={id}>{outro ? "Escreva seu tipo de negócio" : "Busque o tipo do seu negócio"}</label>
    <div className={styles.combobox} ref={recipiente}>
      <input id={id} type="search" role={outro ? undefined : "combobox"} aria-autocomplete={outro ? undefined : "list"} aria-expanded={outro ? undefined : aberto}
        aria-controls={aberto ? listaId : undefined}
        aria-activedescendant={aberto ? `${listaId}-${Math.min(indiceAtivo, resultados.length)}` : undefined}
        autoComplete="off" value={busca}
        onFocus={() => { if (!outro) setAberto(true); }}
        onChange={(evento) => { setBusca(evento.target.value); setIndiceAtivo(0); if (!outro) setAberto(true); }} disabled={ocupado}
        placeholder={outro ? "Ex.: cabeleireiro" : "Ex.: dentista, médico, restaurante"} onKeyDown={(evento) => {
          if (outro && evento.key === "Enter") { evento.preventDefault(); if (busca.trim().length >= minimo) aoResponder(busca.trim()); return; }
          if (evento.key === "Escape") { setAberto(false); return; }
          if (evento.key === "Tab") { setAberto(false); return; }
          if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault(); setAberto(true);
            setIndiceAtivo((anterior) => evento.key === "ArrowDown"
              ? Math.min(anterior + 1, resultados.length) : Math.max(anterior - 1, 0));
            return;
          }
          if (evento.key !== "Enter") return;
          evento.preventDefault();
          if (!aberto) { setAberto(true); return; }
          if (indiceAtivo < resultados.length) aoResponder(resultados[indiceAtivo]!);
          else escolherOutro();
        }} />
      {aberto && !outro && <div id={listaId} className={styles.opcoes} role="listbox" aria-label="Tipos de negócio sugeridos">
        <div className={styles.resultados} ref={listaRolavel}>
        {resultados.map((atividade, indice) => <button id={`${listaId}-${indice}`} key={atividade} type="button"
          role="option" aria-selected={indiceAtivo === indice} className={indiceAtivo === indice ? styles.opcaoAtiva : undefined}
          disabled={ocupado} onMouseDown={(evento) => evento.preventDefault()} onClick={() => aoResponder(atividade)}>{atividade}</button>)}
        {resultados.length === 0 && <p className={styles.vazio}>Nenhuma sugestão encontrada.</p>}
        </div>
        <button id={`${listaId}-${resultados.length}`} className={`${styles.outros} ${indiceAtivo === resultados.length ? styles.opcaoAtiva : ""}`}
          type="button" role="option" aria-selected={indiceAtivo === resultados.length} disabled={ocupado}
          onMouseDown={(evento) => evento.preventDefault()} onClick={escolherOutro}>Outros — escrever minha atividade</button>
      </div>}
    </div>
    {outro ? <div className={styles.acoes}>
      <button className={styles.primario} type="button" disabled={ocupado || busca.trim().length < minimo} onClick={() => aoResponder(busca.trim())}>Enviar resposta</button>
      <button className={styles.voltar} type="button" disabled={ocupado} onClick={() => { setOutro(false); setAberto(true); }}>Ver sugestões</button>
      {busca.trim().length > 0 && busca.trim().length < minimo && <p className={styles.aviso}>Descreva um pouco mais seu negócio.</p>}
    </div> : <p className={styles.ajuda}>Escolha uma sugestão. Se não encontrar, use Outros e descreva com suas palavras.</p>}
  </div>;
}
