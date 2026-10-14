"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GuiaVisual } from "./guia-actions";
import { enviarGuiaVisualAction, type GuiaState } from "./guia-actions";
import styles from "./Marca.module.css";

const LIMITE_ENVIO = 4 * 1024 * 1024;

export function GuiaDaMarca({ businessId, guia, aoEscolher }: { businessId: string; guia: GuiaVisual | null; aoEscolher: (arquivo: File) => Promise<void> }) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(async (anterior: GuiaState, dados: FormData) => {
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size > LIMITE_ENVIO)
      return { erro: "Escolha um PDF de identidade visual de até 4 MB." };
    const resposta = await enviarGuiaVisualAction(anterior, dados);
    if (resposta.ok) await aoEscolher(arquivo);
    return resposta;
  }, {});
  useEffect(() => { if (resultado.ok) router.refresh(); }, [resultado.ok, router]);
  return <section className={styles.guiaBloco}>
    <h2>Tem um manual da marca?</h2>
    <p>Envie o PDF de identidade visual de até 4 MB. Vamos ler as primeiras páginas para sugerir cores; o gestor também poderá consultar o arquivo inteiro.</p>
    {guia && <p>Guia salvo: {guia.url ? <a href={guia.url} target="_blank" rel="noopener noreferrer">{guia.nome}</a> : guia.nome}</p>}
    <form action={enviar} className={styles.logoForm}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="file" name="arquivo" accept="application/pdf,.pdf" aria-label="Escolher PDF da identidade visual" />
      <button className="cta" type="submit" disabled={enviando}>{enviando ? "Enviando…" : guia ? "Trocar PDF" : "Enviar PDF"}</button>
    </form>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}
