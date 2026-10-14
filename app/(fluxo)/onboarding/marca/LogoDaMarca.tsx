"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { ImagemDeIdentidade } from "@/lib/identidade/armazenar";
import { enviarImagemAction, type IdentidadeState } from "@/app/(protected)/conta/identidade-actions";
import styles from "./Marca.module.css";

const LIMITE_ENVIO = 4 * 1024 * 1024;

export function LogoDaMarca({ businessId, logo, aoEscolher }: {
  businessId: string;
  logo: ImagemDeIdentidade | null;
  aoEscolher: (arquivo: File) => Promise<void>;
}) {
  const router = useRouter();
  const [resultado, enviar, enviando] = useActionState(async (anterior: IdentidadeState, dados: FormData) => {
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size > LIMITE_ENVIO)
      return { erro: "Escolha um logo PNG de até 4 MB." };
    const resposta = await enviarImagemAction(anterior, dados);
    if (resposta.ok) {
      await aoEscolher(arquivo);
      router.refresh();
    }
    return resposta;
  }, {});
  return <section className={styles.logoBloco}>
    <div>
      <h2>Mostre a sua marca</h2>
      <p>Envie seu logo em PNG de até 4 MB, com pelo menos 512 pixels de largura e altura. Confira as cores sugeridas antes de continuar.</p>
    </div>
    {logo?.url && <div className={styles.logoAtual}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.url} alt="Logo atual do negócio" />
      <span>Logo salvo: {logo.nomeDoArquivo}</span>
    </div>}
    <form action={enviar} className={styles.logoForm}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="uso" value="logo" />
      <input type="file" name="arquivo" accept="image/png" aria-label="Escolher o logo da empresa" />
      <button className="cta" type="submit" disabled={enviando}>{enviando ? "Enviando…" : logo ? "Trocar logo" : "Enviar logo"}</button>
    </form>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}
