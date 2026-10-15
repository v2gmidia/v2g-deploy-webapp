"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TETO_DO_NAVEGADOR_BYTES, TETO_DO_NAVEGADOR_MB } from "@/lib/criativos/limites.mjs";
import type { GuiaVisual } from "./guia-actions";
import { enviarGuiaVisualAction, type GuiaState } from "./guia-actions";
import styles from "./Marca.module.css";

export function GuiaDaMarca({ businessId, guia, aoEscolher, aoMudarUpload }: { businessId: string; guia: GuiaVisual | null; aoEscolher: (arquivo: File) => Promise<void>; aoMudarUpload: (ativo: boolean) => void }) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(async (anterior: GuiaState, dados: FormData) => {
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || !arquivo.size || arquivo.size > TETO_DO_NAVEGADOR_BYTES)
      return { erro: `Escolha um PDF de identidade visual de até ${TETO_DO_NAVEGADOR_MB} MB.` };
    aoMudarUpload(true);
    try {
      const resposta = await enviarGuiaVisualAction(anterior, dados);
      if (resposta.ok) await aoEscolher(arquivo);
      return resposta;
    } finally {
      aoMudarUpload(false);
    }
  }, {});
  useEffect(() => { if (resultado.ok) router.refresh(); }, [resultado.ok, router]);
  return <section className={styles.guiaBloco}>
    <h2>Tem um manual da marca?</h2>
    <p>Se tiver, envie seu manual em PDF de até {TETO_DO_NAVEGADOR_MB} MB. Vamos ler as primeiras páginas para sugerir cores; o gestor também poderá consultar o arquivo inteiro.</p>
    {guia && <p>Guia salvo: {guia.url ? <a href={guia.url} target="_blank" rel="noopener noreferrer">{guia.nome}</a>
      : <>{guia.nome} · link indisponível agora. Atualize antes de trocar.</>}</p>}
    <form action={enviar} className={styles.logoForm}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="file" name="arquivo" accept="application/pdf,.pdf" aria-label="Escolher PDF da identidade visual" />
      <button className="cta" type="submit" disabled={enviando}>{enviando ? "Enviando…" : guia ? "Trocar PDF" : "Enviar PDF"}</button>
    </form>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}
