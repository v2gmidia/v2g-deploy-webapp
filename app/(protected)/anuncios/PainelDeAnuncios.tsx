"use client";

import { useMemo, useState } from "react";

export type AnuncioDaLista = {
  id: string;
  nome: string | null;
  estado: "com-numeros" | "sem-numeros";
  canal?: string | null;
  periodo?: string | null;
  metricas: Array<{ rotulo: string; valor: string; ausente?: boolean }>;
  observacao?: string | null;
  criativos: Array<{ id: string; nome: string; detalhe?: string; arte?: "crescimento" | "acompanhamento" }>;
};

type Filtro = "todos" | AnuncioDaLista["estado"];

export function PainelDeAnuncios({ anuncios, ilustrativo = false }: { anuncios: AnuncioDaLista[]; ilustrativo?: boolean }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [aberto, setAberto] = useState<string | null>(anuncios[0]?.id ?? null);
  const contagens = useMemo(() => ({
    todos: anuncios.length,
    "com-numeros": anuncios.filter((a) => a.estado === "com-numeros").length,
    "sem-numeros": anuncios.filter((a) => a.estado === "sem-numeros").length,
  }), [anuncios]);
  const visiveis = filtro === "todos" ? anuncios : anuncios.filter((a) => a.estado === filtro);

  return <section className="anuncios-painel" aria-labelledby="anuncios-lista-titulo">
    <div className="anuncios-filtros" role="tablist" aria-label="Filtrar anúncios">
      {(["todos", "com-numeros", "sem-numeros"] as const).map((id) => <button key={id} type="button"
        role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)}>
        {id === "todos" ? "Todos" : id === "com-numeros" ? "Com números" : "Sem números ainda"}
        <span>{contagens[id]}</span>
      </button>)}
    </div>
    <div className="anuncios-painel-cabecalho">
      <div><h2 id="anuncios-lista-titulo">Todos os anúncios</h2><p>Abra um anúncio para ver os números e os criativos associados.</p></div>
      {ilustrativo ? <span>Prévia local com dados ilustrativos</span> : null}
    </div>
    <div className="anuncios-lista-nova">
      {visiveis.map((anuncio) => {
        const estaAberto = aberto === anuncio.id;
        return <article className="anuncio-linha-nova" key={anuncio.id}>
          <button className="anuncio-resumo" type="button" aria-expanded={estaAberto}
            onClick={() => setAberto(estaAberto ? null : anuncio.id)}>
            <div className="anuncio-identidade"><span className={`anuncio-estado ${anuncio.estado}`}>
              {anuncio.estado === "com-numeros" ? "Com números" : "Sem números ainda"}</span>
              <h3>{anuncio.nome || "Anúncio sem nome confirmado"}</h3>
              <p>{[anuncio.canal, anuncio.periodo].filter(Boolean).join(" · ") || "Período ainda não informado"}</p>
            </div>
            <dl>{anuncio.metricas.map((metrica) => <div key={metrica.rotulo}><dt>{metrica.rotulo}</dt>
              <dd className={metrica.ausente ? "ausente" : undefined}>{metrica.ausente ? "—" : metrica.valor}</dd></div>)}</dl>
            <IconeChevron />
          </button>
          {estaAberto ? <div className="anuncio-detalhe-novo">
            <div className="anuncio-detalhe-titulo"><div><h4>Criativos usados neste anúncio ({anuncio.criativos.length})</h4>
              <p>Esta ligação só aparece quando a fonte confirma qual arquivo pertence a este anúncio.</p></div>
              <a href="/criativos">Abrir biblioteca →</a></div>
            {anuncio.criativos.length > 0 ? <div className="anuncio-criativos">
              {anuncio.criativos.map((criativo) => <div className="anuncio-criativo" key={criativo.id}>
                <div className={`anuncio-criativo-arte ${criativo.arte ?? "crescimento"}`} aria-hidden="true" />
                <div><b>{criativo.nome}</b>{criativo.detalhe ? <span>{criativo.detalhe}</span> : null}</div>
                <a href="/criativos">Ver criativo</a>
              </div>)}
            </div> : <p className="anuncio-sem-vinculo">O backend ainda não informou quais arquivos pertencem a esta execução. Nenhuma associação foi presumida.</p>}
            {anuncio.observacao ? <p className="anuncio-observacao">{anuncio.observacao}</p> : null}
          </div> : null}
        </article>;
      })}
    </div>
  </section>;
}

const IconeChevron = () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>;
