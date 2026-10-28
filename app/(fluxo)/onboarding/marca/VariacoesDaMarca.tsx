"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const formulario = useRef<HTMLFormElement>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const restantes = Math.max(0, 24 - variacoes.length);
  const [resultado, enviar, enviando] = useActionState(async (anterior: VariacoesState, dados: FormData) => {
    const arquivos = dados.getAll("arquivos").filter((item): item is File => item instanceof File && item.size > 0);
    if (restantes === 0) return { erro: "Você já enviou 24 imagens. Remova uma para mandar outra." };
    if (!arquivos.length || arquivos.length > Math.min(restantes, 12))
      return { erro: `Escolha até ${Math.min(restantes, 12)} imagens neste envio.` };
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
        formulario.current?.reset();
        setSelecionados([]);
        router.refresh();
      }
      return resposta;
    } finally {
      aoMudarUpload(false);
    }
  }, {});
  return <section className={styles.logoBloco}>
    <h2>Outras versões do logo</h2>
    <p>Envie somente outras versões do logo em que as cores da marca aparecem bem, como uma versão para fundo claro e outra para fundo escuro. Fotos de fachada, ambiente ou produto precisam ser classificadas separadamente e poderão ser adicionadas depois na Conta. Aceitamos PNG, JPG, WebP e AVIF; HEIC depende do navegador. Você pode guardar até 24 versões; restam {restantes} vagas.</p>
    {variacoes.length > 0 && <div className={styles.variacoes}>
      {variacoes.map((item) => <figure key={item.id}>
        {item.url ? <img src={item.url} alt={`Versão da marca: ${item.nome}`} />
          : <p className="form-warning">Prévia indisponível. A imagem continua registrada.</p>}
        <figcaption>{item.nome}</figcaption>
        <RemoverVariacao businessId={businessId} id={item.id} />
      </figure>)}
    </div>}
    <form ref={formulario} action={enviar} className={styles.anexoForm} aria-busy={enviando}>
      <input type="hidden" name="businessId" value={businessId} />
      <label className={styles.anexoBotao} htmlFor="imagens-marca">＋ Anexar imagens</label>
      <input id="imagens-marca" type="file" name="arquivos" accept="image/png,image/jpeg,image/webp,image/avif,image/heic,image/heif" multiple aria-label="Escolher várias imagens da marca" onChange={(evento) => setSelecionados(Array.from(evento.target.files ?? [], (arquivo) => arquivo.name))} />
      <span className={styles.anexoSelecionados} role="status" aria-live="polite">{selecionados.length ? `${selecionados.length} selecionada(s): ${selecionados.join(", ")}` : "Escolha as imagens que tiver. Você pode voltar depois."}</span>
      <button className={styles.anexoEnviar} type="submit" disabled={enviando || restantes === 0 || selecionados.length === 0} aria-label="Enviar imagens da marca">{enviando ? "Enviando…" : "↑ Enviar"}</button>
    </form>
    <p>{restantes === 0 ? "Limite atingido. Remova uma imagem para enviar outra." : "Você pode enviar em mais de uma rodada, até 12 imagens e 9 MB por rodada."}</p>
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
