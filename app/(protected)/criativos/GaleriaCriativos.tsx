"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./galeria-carregamento.module.css";
import biblioteca from "./biblioteca.module.css";
import { useEsperaLocal } from "./useEsperaLocal";

export type GrupoDaGaleria = "biblioteca" | "instagram" | "revisao" | "arquivados";

export type ItemDaGaleria = {
  id: string;
  nome: string;
  imagemUrl: string | null;
  grupo: GrupoDaGaleria;
  estado: string;
  tom: "neutro" | "positivo" | "atencao" | "critico";
  criadoEm: string;
  detalhe?: string | null;
  acao?: { rotulo: string; href: string } | null;
  associacoes?: Array<{ nome: string; href: string; ilustrativa?: boolean }>;
  expiraEmDias?: number | null;
  arte?: "crescimento" | "acompanhamento" | "clareza" | "resultado" | null;
};

const ABAS: Array<{ id: GrupoDaGaleria; rotulo: string }> = [
  { id: "biblioteca", rotulo: "Biblioteca" },
  { id: "revisao", rotulo: "Em revisão" },
  { id: "arquivados", rotulo: "Arquivados" },
];

function ArteDeExemplo({ tipo }: { tipo: NonNullable<ItemDaGaleria["arte"]> }) {
  const textos = {
    crescimento: ["Mais clientes", "para o seu negócio."],
    acompanhamento: ["Seu anúncio", "com acompanhamento."],
    clareza: ["Mais clareza", "para anunciar."],
    resultado: ["Resultados", "que fazem sentido."],
  }[tipo];

  return <div className={`criativo-arte criativo-arte-${tipo}`} aria-hidden="true">
    <span className="criativo-arte-marca">V2G <small>mídia</small></span>
    <strong>{textos[0]}<br /><em>{textos[1]}</em></strong>
    <span className="criativo-arte-apoio">Anúncios simples, com acompanhamento de verdade.</span>
    <span className="criativo-arte-acao">QUERO ANUNCIAR →</span>
    <span className="criativo-arte-forma" />
  </div>;
}

function CardDoCriativo({ item, selecionado }: { item: ItemDaGaleria; selecionado: boolean }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const imagem = useRef<HTMLImageElement>(null);
  useEffect(() => { if (selecionado && !dialogo.current?.open) dialogo.current?.showModal(); }, [selecionado]);
  const [imagemFalhou, setImagemFalhou] = useState<string | null>(null);
  const [imagemCarregada, setImagemCarregada] = useState<string | null>(null);
  const carregando = Boolean(item.imagemUrl && imagemCarregada !== item.imagemUrl && imagemFalhou !== item.imagemUrl);
  const espera = useEsperaLocal(carregando ? item.imagemUrl : null);
  useEffect(() => {
    // Uma imagem em cache pode terminar antes da hidratação e do onLoad.
    if (!item.imagemUrl || !imagem.current?.complete) return;
    if (imagem.current.naturalWidth > 0) setImagemCarregada(item.imagemUrl);
    else setImagemFalhou(item.imagemUrl);
  }, [item.imagemUrl]);
  const avisoDeExclusao = typeof item.expiraEmDias === "number"
    ? item.expiraEmDias <= 1 ? "Arquivo expira amanhã" : `Arquivo expira em ${item.expiraEmDias} dias`
    : null;

  return <article className={biblioteca.card}>
    <button type="button" className={biblioteca.abrirImagem} aria-label={`Ver criativo ${item.nome}`} aria-haspopup="dialog" onClick={() => dialogo.current?.showModal()}>
    <div className={`${biblioteca.imagem} ${styles.previa}`} aria-busy={carregando}>
      {item.imagemUrl && imagemFalhou !== item.imagemUrl
        // A origem é privada e chega como URL assinada após conferir o negócio.
        // eslint-disable-next-line @next/next/no-img-element
        ? <><img ref={imagem} src={item.imagemUrl} alt={`Prévia de ${item.nome}`} loading="lazy"
          data-carregando={carregando || undefined} onLoad={() => setImagemCarregada(item.imagemUrl)} onError={() => setImagemFalhou(item.imagemUrl)} />
          {carregando ? <span className={styles.espera}>{espera.visivel ? "Carregando prévia…" : <span className="sr-only">Carregando prévia</span>}</span> : null}</>
        : item.arte
          ? <ArteDeExemplo tipo={item.arte} />
          : <div className="criativo-sem-previa"><IconeImagem /><span>Prévia indisponível</span></div>}
    </div>
    </button>
    <button type="button" className={biblioteca.nome} onClick={() => dialogo.current?.showModal()}>{item.nome}</button>
    <p className={biblioteca.data}>{item.criadoEm}</p>
    {item.grupo === "revisao" ? <span className={biblioteca.revisao}>{item.estado}</span>
      : item.grupo === "arquivados" ? <span className={biblioteca.estado}>{item.estado}</span> : null}
    {item.grupo !== "revisao" && <div className={biblioteca.associacoes}>
        {(item.associacoes?.length ?? 0) > 0 && <span className={biblioteca.legenda}>Anúncio associado</span>}
        {(item.associacoes?.length ?? 0) > 0 ? item.associacoes!.map((associacao) =>
          <a key={associacao.nome} href={associacao.href}><IconeVinculo /><span>
            {associacao.nome}
          </span><IconeSeta /></a>)
          : <p>Sem anúncio associado</p>}
      </div>}
      {avisoDeExclusao ? <p className="criativo-expira"><IconeAviso />{avisoDeExclusao}</p> : null}
    <dialog ref={dialogo} className={biblioteca.dialogo} aria-labelledby={`titulo-${item.id}`}>
      <div className={biblioteca.dialogoTopo}><h2 id={`titulo-${item.id}`}>{item.nome}</h2>
        <button type="button" className="cta ghost" onClick={() => dialogo.current?.close()}>Fechar</button></div>
      <div className={biblioteca.detalhes}>
        {item.imagemUrl && imagemFalhou !== item.imagemUrl ? <img src={item.imagemUrl} alt={item.nome} /> : item.arte ? <ArteDeExemplo tipo={item.arte} /> : <p>Prévia indisponível</p>}
        <div><p className={biblioteca.estado}>{item.estado}</p><p className={biblioteca.data}>{item.criadoEm}</p>
          {item.detalhe ? <p>{item.detalhe}</p> : null}
          {item.grupo === "revisao" ? <p>O gestor confere a imagem antes de disponibilizá-la para os anúncios.</p> : <>
            <h3>Anúncios associados</h3>
            <div className={biblioteca.associacoes}>{item.associacoes?.length ? item.associacoes.map((associacao) => <a key={associacao.nome} href={associacao.href}>{associacao.nome}<IconeSeta /></a>) : <p>Sem anúncio associado</p>}</div>
          </>}
        </div>
      </div>
    </dialog>
  </article>;
}

export function GaleriaCriativos({ itens, falhou = false, carregando = false, revisaoRecebida = 0, abaInicial = "biblioteca", selecionado = "" }: {
  abaInicial?: GrupoDaGaleria; selecionado?: string;
  itens: ItemDaGaleria[]; previa?: boolean; falhou?: boolean; carregando?: boolean; revisaoRecebida?: number;
}) {
  // Instagram é origem, não etapa: peças legadas continuam na Biblioteca.
  const grupo = (item: ItemDaGaleria) => item.grupo === "instagram" ? "biblioteca" : item.grupo;
  const contagens = useMemo(() => new Map(ABAS.map((aba) => [
    aba.id, itens.filter((item) => grupo(item) === aba.id).length,
  ])), [itens]);
  const [abaAtiva, setAbaAtiva] = useState<GrupoDaGaleria>(grupo(itens.find(i => i.id === selecionado) ?? { grupo: abaInicial } as ItemDaGaleria));
  useEffect(() => { if (revisaoRecebida > 0) { setAbaAtiva("revisao"); } }, [revisaoRecebida]);
  const visiveis = itens.filter((item) => grupo(item) === abaAtiva);

  return <section className="criativos-galeria" aria-labelledby="galeria-titulo" aria-busy={carregando}>
    {selecionado && !itens.some(i => i.id === selecionado) && <p className="form-warning">Não foi possível localizar o criativo neste negócio.</p>}
    <h2 id="galeria-titulo" className="sr-only">Sua biblioteca</h2>
    <div className={biblioteca.ferramentas}>
    <div className={biblioteca.abas} role="group" aria-label="Filtrar criativos por estado">
      {ABAS.map((aba) => {
        const ativa = abaAtiva === aba.id;
        return <button key={aba.id} type="button" aria-pressed={ativa}
          className={ativa ? "ativa" : undefined} onClick={() => setAbaAtiva(aba.id)}>
          {aba.rotulo}<span>{falhou || carregando ? "—" : contagens.get(aba.id) ?? 0}</span>
        </button>;
      })}
    </div>
    </div>
    {falhou ? <p className="form-warning" role="alert">Não foi possível conferir toda a biblioteca agora. Isso não significa que os criativos foram removidos.</p> : null}
    {carregando && visiveis.length > 0 ? <p role="status">Atualizando a biblioteca. Os criativos anteriores permanecem visíveis até a consulta terminar.</p> : null}
    {visiveis.length > 0
      ? <div className={biblioteca.grade}>{visiveis.map((item) => <CardDoCriativo key={item.id} item={item} selecionado={item.id === selecionado} />)}</div>
      : falhou ? <p role="status">A biblioteca está indisponível. Tente consultar novamente.</p>
      : carregando ? <p role="status">Carregando a biblioteca deste negócio…</p>
      : <div className="criativos-vazio"><IconeImagem /><div><h3>Nenhuma peça aqui.</h3><p>{abaAtiva === "revisao" ? "As imagens enviadas aguardam a revisão do gestor aqui." : "Quando um criativo chegar a esta etapa, ele aparece nesta galeria."}</p></div></div>}
  </section>;
}

const IconeImagem = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-4 3.5 3 3-2.5 4.5 4" /></svg>;
const IconeSeta = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>;
const IconeAviso = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 3 18 17H2L10 3Z" /><path d="M10 8v4M10 14.5v.2" /></svg>;
const IconeVinculo = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7.5 12.5 12.5 7.5M6.2 14.8l-1 1a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0M13.8 5.2l1-1a3.2 3.2 0 0 1 4.5 4.5l-3 3a3.2 3.2 0 0 1-4.5 0" /></svg>;
