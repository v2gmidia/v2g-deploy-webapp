"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { TETO_DO_NAVEGADOR_BYTES } from "@/lib/criativos/limites.mjs";
import { enviarVariacoesAction, type VariacaoVisual, type VariacoesState } from "./variacoes-actions";
import styles from "./Marca.module.css";

export function VariacoesDaMarca({ businessId, variacoes, aoEscolher }: {
  businessId: string;
  variacoes: VariacaoVisual[];
  aoEscolher: (arquivos: File[]) => Promise<void>;
}) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(async (anterior: VariacoesState, dados: FormData) => {
    const arquivos = dados.getAll("arquivos").filter((item): item is File => item instanceof File && item.size > 0);
    if (!arquivos.length || arquivos.length > 6 || arquivos.some((arquivo) => arquivo.size > 4 * 1024 * 1024))
      return { erro: "Escolha de 1 a 6 imagens PNG ou JPG de até 4 MB cada." };
    if (arquivos.reduce((total, arquivo) => total + arquivo.size, 0) > TETO_DO_NAVEGADOR_BYTES)
      return { erro: "Este envio passa de 9 MB. Envie as imagens em duas rodadas." };
    const resposta = await enviarVariacoesAction(anterior, dados);
    if (resposta.ok) {
      await aoEscolher(arquivos);
      router.refresh();
    }
    return resposta;
  }, {});
  return <section className={styles.logoBloco}>
    <h2>Outras versões da sua marca</h2>
    <p>Envie até 6 imagens adicionais de logos, aplicações e identidade visual. Elas ficam disponíveis para o gestor e ajudam a sugerir outras cores. O logo principal acima continua separado.</p>
    {variacoes.length > 0 && <div className={styles.variacoes}>
      {variacoes.map((item) => <figure key={item.id}>
        {item.url && <img src={item.url} alt={`Versão da marca: ${item.nome}`} />}
        <figcaption>{item.nome}</figcaption>
      </figure>)}
    </div>}
    <form action={enviar} className={styles.logoForm}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="file" name="arquivos" accept="image/png,image/jpeg" multiple aria-label="Escolher várias imagens da marca" />
      <button className="cta" type="submit" disabled={enviando || variacoes.length >= 6}>{enviando ? "Enviando…" : "Enviar imagens"}</button>
    </form>
    <p>É possível enviar mais de uma vez, até o limite de 6 imagens. Cada envio aceita até 9 MB no total.</p>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}
