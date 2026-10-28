"use client";

import { REFERENCIAS_BARBEARIA_PILOTO, URL_BIBLIOTECA } from "@/lib/jev/catalogo-barbearia";
import styles from "./referencias-do-nicho.module.css";
import { OrientacaoExterna } from "./OrientacaoExterna";
import type { DadosDaOrientacao } from "@/lib/criativos/orientacao-externa";
import type { ContextoDoCriativo } from "@/lib/criativos/contexto-do-negocio";

export function ReferenciasDoNicho({ valor, escolher, desabilitado = false, orientacao, contexto }: {
  valor: string; escolher: (id: string) => void; desabilitado?: boolean;
  orientacao?: DadosDaOrientacao;
  contexto?: ContextoDoCriativo;
}) {
  return <details className={styles.bloco}>
    <summary>Ver referências de anúncios para barbearia</summary>
    <p>Abra o anúncio original na Biblioteca e escolha uma referência para orientar sua peça. São exemplos observados, sem resultado de vendas comprovado. Não copie a imagem ou marca de terceiros.</p>
    <p className={styles.nota}>O corte inicial de 80% no Jev indica pertinência do texto ao nicho de barbearia. Não é uma nota de qualidade ou chance de venda.</p>
    <p>Escolher uma referência guarda sua preferência. A criação de imagem ainda depende da identidade autorizada do seu negócio e da revisão dessa referência.</p>
    <fieldset disabled={desabilitado}>
      <legend>Referência para este criativo</legend>
      <label className={styles.linha}><input type="radio" checked={!valor} onChange={() => escolher("")} />Sem referência</label>
      {REFERENCIAS_BARBEARIA_PILOTO.map((ref, indice) => <div className={styles.linha} key={ref.id}>
        <label><input type="radio" checked={valor === ref.id} onChange={() => escolher(ref.id)} aria-label={`Usar referência do anúncio ${ref.id}`} />Referência {indice + 1}</label>
        <span>Início exibido: {ref.inicioExibido.split("-").reverse().join("/")}</span>
        <a href={`${URL_BIBLIOTECA}${ref.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Abrir anúncio ${ref.id} na Biblioteca`}>Abrir na Biblioteca</a>
      </div>)}
    </fieldset>
    {valor && orientacao ? <OrientacaoExterna key={`${contexto?.businessId ?? ""}:${valor}`} referenciaId={valor} dados={orientacao} desabilitado={desabilitado} contexto={contexto} /> : null}
    <p className={styles.nota}>A data exibida não comprova veiculação contínua nem desempenho. O link pode deixar de abrir na plataforma de origem.</p>
  </details>;
}
