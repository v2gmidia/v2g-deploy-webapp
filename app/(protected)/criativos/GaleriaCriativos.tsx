"use client";

import { useMemo, useState } from "react";

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
  { id: "instagram", rotulo: "Instagram" },
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

function CardDoCriativo({ item }: { item: ItemDaGaleria }) {
  const avisoDeExclusao = typeof item.expiraEmDias === "number"
    ? item.expiraEmDias <= 1 ? "Arquivo expira amanhã" : `Arquivo expira em ${item.expiraEmDias} dias`
    : null;

  return <article className="criativo-card">
    <div className="criativo-card-imagem">
      {item.imagemUrl
        // A origem é privada e chega como URL assinada após conferir o negócio.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={item.imagemUrl} alt={`Prévia de ${item.nome}`} />
        : item.arte
          ? <ArteDeExemplo tipo={item.arte} />
          : <div className="criativo-sem-previa"><IconeImagem /><span>Prévia indisponível</span></div>}
      <span className={`criativo-vinculo-badge ${(item.associacoes?.length ?? 0) > 0 ? "com-vinculo" : "sem-vinculo"}`}>
        {(item.associacoes?.length ?? 0) > 0
          ? `${item.associacoes!.length} ${item.associacoes!.length === 1 ? "anúncio" : "anúncios"}`
          : "Sem anúncio"}
      </span>
    </div>
    <div className="criativo-card-corpo">
      <div className="criativo-card-titulo">
        <h3>{item.nome}</h3>
        <span className={`criativo-status criativo-status-${item.tom}`}>{item.estado}</span>
      </div>
      <div className="criativo-associacoes">
        <span className="criativo-associacoes-rotulo">Associação ao anúncio</span>
        {(item.associacoes?.length ?? 0) > 0 ? item.associacoes!.map((associacao) =>
          <a key={associacao.nome} href={associacao.href}><IconeVinculo /><span>
            <b>{associacao.nome}</b>{associacao.ilustrativa ? <small>Exemplo da prévia local</small> : null}
          </span><IconeSeta /></a>)
          : <p>Este criativo ainda não está associado a nenhum anúncio.</p>}
      </div>
      {item.detalhe ? <p className="criativo-detalhe">{item.detalhe}</p> : null}
      {avisoDeExclusao ? <p className="criativo-expira"><IconeAviso />{avisoDeExclusao}</p> : null}
      <div className="criativo-card-rodape">
        <span>{item.criadoEm}</span>
        {item.acao ? <a href={item.acao.href}>{item.acao.rotulo}<IconeSeta /></a> : null}
      </div>
    </div>
  </article>;
}

export function GaleriaCriativos({ itens }: { itens: ItemDaGaleria[] }) {
  const contagens = useMemo(() => new Map(ABAS.map((aba) => [
    aba.id, itens.filter((item) => item.grupo === aba.id).length,
  ])), [itens]);
  const primeiraComItens = ABAS.find((aba) => (contagens.get(aba.id) ?? 0) > 0)?.id ?? "biblioteca";
  const [abaAtiva, setAbaAtiva] = useState<GrupoDaGaleria>(primeiraComItens);
  const visiveis = itens.filter((item) => item.grupo === abaAtiva);

  return <section className="criativos-galeria" aria-labelledby="galeria-titulo">
    <div className="criativos-galeria-head">
      <div><h2 id="galeria-titulo">Sua biblioteca</h2><p>Crie, revise e reutilize peças sem perder de vista os anúncios ligados a elas.</p></div>
      <a className="criativos-filtro" href="/anuncios">Ver todos os anúncios<IconeSeta /></a>
    </div>
    <div className="criativos-abas" role="tablist" aria-label="Filtrar criativos por estado">
      {ABAS.map((aba) => {
        const ativa = abaAtiva === aba.id;
        return <button key={aba.id} type="button" role="tab" aria-selected={ativa}
          className={ativa ? "ativa" : undefined} onClick={() => setAbaAtiva(aba.id)}>
          {aba.rotulo}<span>{contagens.get(aba.id) ?? 0}</span>
        </button>;
      })}
    </div>
    {visiveis.length > 0
      ? <div className="criativos-grade">{visiveis.map((item) => <CardDoCriativo key={item.id} item={item} />)}</div>
      : <div className="criativos-vazio"><IconeImagem /><div><h3>Nenhuma peça aqui.</h3><p>Quando um criativo chegar a esta etapa, ele aparece nesta galeria.</p></div></div>}
  </section>;
}

const IconeImagem = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m4 17 5-4 3.5 3 3-2.5 4.5 4" /></svg>;
const IconeSeta = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>;
const IconeAviso = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 3 18 17H2L10 3Z" /><path d="M10 8v4M10 14.5v.2" /></svg>;
const IconeVinculo = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7.5 12.5 12.5 7.5M6.2 14.8l-1 1a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0M13.8 5.2l1-1a3.2 3.2 0 0 1 4.5 4.5l-3 3a3.2 3.2 0 0 1-4.5 0" /></svg>;
