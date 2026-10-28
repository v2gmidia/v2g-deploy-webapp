"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ImagemDeIdentidade } from "@/lib/identidade/armazenar";
import { prepararImagemDaMarca } from "@/lib/identidade/preparar-arquivo-cliente";
import { enviarImagemAction, type IdentidadeState } from "@/app/(protected)/conta/identidade-actions";
import styles from "./Marca.module.css";

export function LogoDaMarca({ businessId, logo, aoEscolher, aoMudarUpload }: {
  businessId: string;
  logo: ImagemDeIdentidade | null;
  aoEscolher: (arquivo: File) => Promise<void>;
  aoMudarUpload: (ativo: boolean) => void;
}) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [selecionado, setSelecionado] = useState("");
  const [resultado, enviar, enviando] = useActionState(async (anterior: IdentidadeState, dados: FormData) => {
    const arquivo = dados.get("arquivo");
    if (!(arquivo instanceof File)) return { erro: "Escolha uma imagem para o logo principal." };
    aoMudarUpload(true);
    try {
      const preparado = await prepararImagemDaMarca(arquivo, "logo");
      if (!preparado.ok) return { erro: preparado.erro };
      dados.set("arquivo", preparado.arquivo);
      const resposta = await enviarImagemAction(anterior, dados);
      if (resposta.ok) {
        await aoEscolher(preparado.arquivo);
        formulario.current?.reset();
        setSelecionado("");
        router.refresh();
      }
      return resposta;
    } finally {
      aoMudarUpload(false);
    }
  }, {});
  return <section className={styles.logoBloco}>
    <div>
      <h2>Logo principal</h2>
      <p>Envie a versão que deve aparecer nos seus anúncios. Se tiver um arquivo com fundo transparente, prefira essa versão. O logo ajuda a preservar sua marca; você confere as cores sugeridas antes de continuar. Aceitamos PNG, JPG, WebP e AVIF; HEIC depende do navegador.</p>
    </div>
    {logo && <div className={styles.logoAtual}>
      {logo.url ? <img src={logo.url} alt="Logo atual do negócio" />
        : <p className="form-warning">Logo salvo, mas a prévia está indisponível. Atualize antes de trocar.</p>}
      <span>Logo salvo: {logo.nomeDoArquivo}</span>
    </div>}
    <form ref={formulario} action={enviar} className={styles.logoForm} aria-busy={enviando}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="uso" value="logo" />
      <label className={styles.arquivoBotao} htmlFor="logo-principal">{logo ? "Escolher outro logo" : "Escolher logo"}</label>
      <input id="logo-principal" className={styles.arquivoInput} type="file" name="arquivo" accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif"
        aria-label="Escolher o logo da empresa" onChange={(evento) => setSelecionado(evento.target.files?.[0]?.name ?? "")} />
      <span className={styles.arquivoSelecionado} role="status">{selecionado || (logo ? "Logo atual salvo" : "Nenhum arquivo selecionado")}</span>
      <button className="cta" type="submit" disabled={enviando || !selecionado}>{enviando ? "Enviando logo…" : logo ? "Salvar novo logo" : "Enviar logo"}</button>
    </form>
    {enviando && <p className={styles.statusAcao} role="status" aria-live="polite">Preparando e enviando o logo…</p>}
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}
