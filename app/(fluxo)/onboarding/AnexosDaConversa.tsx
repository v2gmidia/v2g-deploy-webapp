"use client";

import { useEffect, useRef, useState } from "react";
import { TETO_DO_NAVEGADOR_BYTES } from "@/lib/criativos/limites.mjs";
import { prepararImagemDaMarca } from "@/lib/identidade/preparar-arquivo-cliente";
import { enviarVariacoesAction } from "./marca/variacoes-actions";
import styles from "./ChatConversa.module.css";

/** Guarda imagens no acervo privado que também aparece na etapa visual. */
export function AnexosDaConversa({ businessId, ocupado, aoOcupar }: {
  businessId: string;
  ocupado: boolean;
  aoOcupar: (ocupado: boolean) => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { aoOcupar(enviando); }, [enviando, aoOcupar]);
  useEffect(() => () => { aoOcupar(false); }, [aoOcupar]);

  async function anexar(arquivos: File[]) {
    if (!arquivos.length || enviando || ocupado) return;
    if (arquivos.length > 12) {
      setErro("Escolha até 12 imagens neste envio. Você pode anexar mais depois.");
      return;
    }
    setEnviando(true);
    setErro(null);
    setRecado(null);
    try {
      const preparados: File[] = [];
      for (const arquivo of arquivos) {
        const resultado = await prepararImagemDaMarca(arquivo, "variacao");
        if (!resultado.ok) { setErro(resultado.erro); return; }
        preparados.push(resultado.arquivo);
      }
      if (preparados.reduce((total, arquivo) => total + arquivo.size, 0) > TETO_DO_NAVEGADOR_BYTES) {
        setErro("Estas imagens passam de 9 MB juntas. Envie em duas rodadas.");
        return;
      }
      const dados = new FormData();
      dados.set("businessId", businessId);
      preparados.forEach((arquivo) => dados.append("arquivos", arquivo));
      const resultado = await enviarVariacoesAction({}, dados);
      if (resultado.erro) setErro(resultado.erro);
      else setRecado(`${preparados.length} imagem(ns) guardada(s). Você poderá conferi-las na etapa visual.`);
    } catch {
      setErro("Não sabemos se as imagens foram salvas. Confira na etapa visual antes de tentar novamente.");
    } finally {
      setEnviando(false);
      if (campo.current) campo.current.value = "";
    }
  }

  return <div className={styles.anexos}>
    <input ref={campo} type="file" accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif"
      multiple aria-hidden="true" tabIndex={-1} disabled={ocupado || enviando}
      onChange={(evento) => void anexar(Array.from(evento.currentTarget.files ?? []))} />
    <button type="button" disabled={ocupado || enviando} title="Anexar imagens da marca" aria-label="Anexar imagens da marca"
      onClick={() => campo.current?.click()}>{enviando ? "…" : "+"}</button>
    {enviando && <span role="status">Guardando imagens…</span>}
    {recado && <span role="status">{recado}</span>}
    {erro && <span role="alert" className={styles.anexoErro}>{erro}</span>}
  </div>;
}
