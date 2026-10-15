"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TETO_DO_NAVEGADOR_BYTES } from "@/lib/criativos/limites.mjs";
import { prepararImagemDaMarca } from "@/lib/identidade/preparar-arquivo-cliente";
import { arquivarVariacaoAction, enviarVariacoesAction, type VariacaoVisual, type VariacoesState } from "./variacoes-actions";
import styles from "./Marca.module.css";

export function VariacoesDaMarca({ businessId, variacoes, aoEscolher, aoMudarUpload }: {
  businessId: string;
  variacoes: VariacaoVisual[];
  aoEscolher: (arquivos: File[]) => Promise<void>;
  aoMudarUpload: (ativo: boolean) => void;
}) {
  const router = useRouter();
  const restantes = Math.max(0, 6 - variacoes.length);
  const [resultado, enviar, enviando] = useActionState(async (anterior: VariacoesState, dados: FormData) => {
    const arquivos = dados.getAll("arquivos").filter((item): item is File => item instanceof File && item.size > 0);
    if (restantes === 0) return { erro: "Você já enviou 6 imagens. Remova uma para mandar outra." };
    if (!arquivos.length || arquivos.length > restantes)
      return { erro: `Escolha até ${restantes} ${restantes === 1 ? "imagem" : "imagens"}.` };
    aoMudarUpload(true);
    try {
      const preparados: File[] = [];
      for (const arquivo of arquivos) {
        const resultado = await prepararImagemDaMarca(arquivo, "variacao");
        if (!resultado.ok) return { erro: resultado.erro };
        preparados.push(resultado.arquivo);
      }
      if (preparados.reduce((total, arquivo) => total + arquivo.size, 0) > TETO_DO_NAVEGADOR_BYTES)
        return { erro: "Este envio passa de 9 MB. Envie as imagens em duas rodadas." };
      dados.delete("arquivos");
      preparados.forEach((arquivo) => dados.append("arquivos", arquivo));
      const resposta = await enviarVariacoesAction(anterior, dados);
      if (resposta.ok) {
        await aoEscolher(preparados);
        router.refresh();
      }
      return resposta;
    } finally {
      aoMudarUpload(false);
    }
  }, {});
  return <section className={styles.logoBloco}>
    <h2>Outras imagens da sua marca</h2>
    <p>Escolha várias imagens de uma vez: logos, aplicações, materiais e referências visuais. PNG e JPG funcionam; WebP e AVIF são convertidos no navegador quando ele conseguir abrir. HEIC depende do navegador. Imagens de até 15 MB podem ser reduzidas para o envio; restam {restantes} de 6 vagas.</p>
    {variacoes.length > 0 && <div className={styles.variacoes}>
      {variacoes.map((item) => <figure key={item.id}>
        {item.url ? <img src={item.url} alt={`Versão da marca: ${item.nome}`} />
          : <p className="form-warning">Prévia indisponível. A imagem continua registrada.</p>}
        <figcaption>{item.nome}</figcaption>
        <RemoverVariacao businessId={businessId} id={item.id} />
      </figure>)}
    </div>}
    <form action={enviar} className={styles.logoForm}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="file" name="arquivos" accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif" multiple aria-label="Escolher várias imagens da marca" />
      <button className="cta" type="submit" disabled={enviando || restantes === 0}>{enviando ? "Enviando…" : "Enviar imagens"}</button>
    </form>
    <p>{restantes === 0 ? "Limite atingido. Remova uma imagem para enviar outra." : "Você pode enviar em mais de uma rodada. Cada rodada aceita até 9 MB no total."}</p>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
    {resultado.ok && <p className="form-notice" role="status">{resultado.ok}</p>}
  </section>;
}

function RemoverVariacao({ businessId, id }: { businessId: string; id: string }) {
  const router = useRouter();
  const [resultado, remover, removendo] = useActionState(arquivarVariacaoAction, {} as VariacoesState);
  useEffect(() => { if (resultado.ok) router.refresh(); }, [resultado.ok, router]);
  return <form action={remover} onSubmit={(evento) => {
    if (!window.confirm("Remover esta imagem da sua marca?")) evento.preventDefault();
  }}>
    <input type="hidden" name="businessId" value={businessId} />
    <input type="hidden" name="id" value={id} />
    <button type="submit" className={styles.removerCor} disabled={removendo}>{removendo ? "Removendo…" : "Remover imagem"}</button>
    {resultado.erro && <p className="form-error" role="alert">{resultado.erro}</p>}
  </form>;
}
