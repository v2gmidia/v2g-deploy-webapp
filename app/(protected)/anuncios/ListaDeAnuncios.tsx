"use client";

import { useEffect, useState } from "react";
import type { AnuncioCliente } from "@/lib/anuncios/lista-cliente";
import styles from "./lista-cliente.module.css";

export function ListaDeAnuncios({ anuncios, bibliotecaHref = "/criativos", selecionado = "" }: {
  anuncios: AnuncioCliente[]; bibliotecaHref?: string; selecionado?: string;
}) {
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<string | null>(selecionado || null);
  useEffect(() => { setAberto(selecionado || null); }, [selecionado]);
  const filtros: [string, string][] = [["todos", "Todos"], ["ativos", "Ativos"], ["pausados", "Pausados"]];
  if (anuncios.some(a => a.filtro === "outros")) filtros.push(["outros", "Outros estados"]);
  const encontrados = anuncios.filter(a => (filtro === "todos" || a.filtro === filtro)
    && a.nome.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR")));
  return <div className={styles.pagina}>
    <div className={styles.ferramentas}>
      <div className={styles.filtros} role="group" aria-label="Filtrar anúncios">{filtros.map(([id, rotulo]) => <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{rotulo}<span>{anuncios.filter(a => id === "todos" || a.filtro === id).length}</span></button>)}</div>
      <label><span className="sr-only">Buscar anúncio</span><input type="search" placeholder="Buscar anúncio" value={busca} onChange={e => setBusca(e.target.value)} /></label>
    </div>
    <section aria-label="Seus anúncios" className={styles.lista}>
      {encontrados.map(anuncio => <article className={styles.anuncio} key={anuncio.id} id={`anuncio-${anuncio.id}`}>
        <div className={styles.cabecalho}>
          {anuncio.criativos[0]?.imagem ? <img src={anuncio.criativos[0].imagem} alt={`Criativo ${anuncio.criativos[0].nome}`} />
            : <span className={styles.semImagem} aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8v8h4l10 4V4L8 8H4ZM8 16l2 5M21 9v6" /></svg></span>}
          <div><h2>{anuncio.nome}</h2><p>{anuncio.contexto}</p><span className={styles.status}>{anuncio.status}</span></div>
          <button className={styles.detalhar} type="button" aria-expanded={aberto === anuncio.id} aria-controls={`detalhe-${anuncio.id}`} onClick={() => setAberto(aberto === anuncio.id ? null : anuncio.id)}>{aberto === anuncio.id ? "Fechar detalhes" : "Ver detalhes"}<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={aberto === anuncio.id ? "m5 12 5-5 5 5" : "m5 8 5 5 5-5"} /></svg></button>
        </div>
        <dl className={styles.metricas}>{anuncio.metricas.map(m => <div key={m.rotulo}><dt>{m.rotulo}</dt><dd>{m.valor ?? <><span aria-hidden="true">—</span><span className="sr-only">Não medido</span></>}</dd></div>)}</dl>
        {anuncio.parcial && <p className={styles.nota}>Medições parciais neste período.</p>}
        <div id={`detalhe-${anuncio.id}`} hidden={aberto !== anuncio.id} className={styles.detalhes}>
          <div><h3>Criativos associados</h3>{anuncio.criativos.length ? anuncio.criativos.map(c => <a href={c.href} key={c.id}>{c.imagem && <img src={c.imagem} alt="" />}<span>{c.nome}<small>Ver na biblioteca</small></span></a>)
            : <p>Não há associação confirmada na biblioteca. <a href={bibliotecaHref}>Abrir criativos</a></p>}</div>
          <div><h3>Sobre este anúncio</h3><dl className={styles.sobre}><dt>Campanha</dt><dd>{anuncio.contexto}</dd><dt>Identificação do anúncio</dt><dd>{anuncio.id}</dd></dl>
            <p>O status é o observado na consulta. Estar ativado não comprova entrega agora.</p>
            {anuncio.metricas.some(m => m.valor === null) && <p>O traço indica uma medição indisponível; não significa zero.</p>}
          </div>
        </div>
      </article>)}
      {!encontrados.length && <p className={styles.vazio} role="status">{anuncios.length ? "Nenhum anúncio encontrado. Tente outro nome ou filtro." : "Nenhum anúncio retornou nesta consulta."}</p>}
    </section>
  </div>;
}
