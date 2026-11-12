"use client";
import { useRef, useState } from "react";
import type { ContextoAgencia, RetornoCarteira } from "@/lib/agencia/contexto";
import type { ResumoDaCarteira } from "@/lib/agencia/resumo";
import { CabecalhoAgencia, ProximoPassoAgencia, Seta } from "./Comuns";
import styles from "./agencia.module.css";
import { AbrirCliente, type AcaoAbrirCliente } from "./AbrirCliente";

export type ClienteDaCarteira = { contexto: ContextoAgencia; resumo: ResumoDaCarteira };

/** Prévia aprovada: carteira → cliente → voltar. Só vínculos já autenticados.
 * Identidade: Casco de produção, Archivo, cobalto, superfícies e raios existentes.
 * O componente apresenta; não cria anunciantes nem altera banco ou permissões. */
export function CarteiraAgencia({ agencia, clientes, retorno, ativoId, abrirCliente }: {
  agencia: string; clientes: ClienteDaCarteira[]; retorno: RetornoCarteira; ativoId?: string; abrirCliente?: AcaoAbrirCliente;
}) {
  const [busca, setBusca] = useState(retorno.busca);
  const [pendentes, setPendentes] = useState(retorno.pendentes);
  const [pagina, setPagina] = useState(retorno.pagina);
  const campoBusca = useRef<HTMLInputElement>(null);
  const filtrados = clientes.filter(c => (!pendentes || c.resumo.temPendencia !== false)
    && c.contexto.anunciante.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR")));
  const paginas = Math.max(1, Math.ceil(filtrados.length / 10));
  const atual = Math.min(pagina, paginas);
  const visiveis = filtrados.slice((atual - 1) * 10, atual * 10);
  const filtro = { busca: busca.trim().slice(0, 120), pendentes, pagina: atual };
  const destaque = clientes.find(c => c.resumo.temPendencia !== false) ?? clientes[0];
  const quantidadePendente = clientes.some(c => c.resumo.temPendencia === null)
    ? "A conferir" : String(clientes.filter(c => c.resumo.temPendencia).length);
  return <div className={styles.raiz}>
    <CabecalhoAgencia titulo="Início" descricao="Sua agência, todos os clientes em um só lugar." acao={
      <button className={`${styles.secundario} ${styles.buscarAtalho}`} onClick={() => {
        campoBusca.current?.scrollIntoView({ block: "center", behavior: "instant" }); campoBusca.current?.focus({ preventScroll: true });
      }}>Buscar cliente na carteira<Seta /></button>} />
    <div className={styles.topoAgencia}><div className={styles.resumoAgencia}>
      <section className={styles.estado} aria-label="Contexto da agência"><b>Sua agência</b><span>{agencia} · visão da carteira</span></section>
      <p className={styles.introducao}>Encontre quem precisa de atenção e continue de onde parou, sem trocar de conta.</p>
      <div className={styles.contagens}><div><strong>{clientes.length}</strong><span>{clientes.length === 1 ? "cliente nesta carteira" : "clientes nesta carteira"}</span></div>
        <div><strong>{quantidadePendente}</strong><span>clientes com etapa de peça a acompanhar</span></div></div>
    </div>{destaque && <ProximoPassoAgencia contexto={destaque.contexto} resumo={destaque.resumo} retorno={filtro} ativoId={ativoId} abrirCliente={abrirCliente} />}</div>
    <section aria-labelledby="agencia-carteira-titulo"><h2 id="agencia-carteira-titulo">Carteira de clientes</h2>
      <div className={styles.filtros}><label className={styles.busca}>Buscar cliente<input ref={campoBusca} type="search" placeholder="Nome do cliente" value={busca} maxLength={120}
        onChange={e => { setBusca(e.target.value); setPagina(1); }} /></label>
        <label className={styles.check}><input type="checkbox" checked={pendentes} onChange={e => { setPendentes(e.target.checked); setPagina(1); }} />Somente com pendências</label></div>
      <p className={styles.nota}>Clientes disponíveis no contexto desta agência. Cada cliente mantém seus resultados e suas peças.</p>
      {visiveis.length ? <table className={styles.carteira}><caption className="sr-only">Clientes da agência {agencia}</caption><thead><tr>
        <th scope="col">Cliente</th><th scope="col">Situação das peças</th><th scope="col">Próximo passo</th><th scope="col">Responsável</th><th scope="col"><span className="sr-only">Abrir cliente</span></th>
      </tr></thead><tbody>{visiveis.map(({ contexto: c, resumo: r }) => <tr key={c.businessId}>
        <td><AbrirCliente contexto={c} ativoId={ativoId} retorno={filtro} acao={abrirCliente} className={styles.nomeCliente}><b>{c.anunciante}</b></AbrirCliente><small>{c.ramo ?? "Atividade não informada"}</small></td>
        <td><span className={`${styles.status} ${r.temPendencia === false ? styles.positivo : ""}`}>{r.situacao}</span></td><td>{r.proximo}</td><td>{c.gestor ?? "A conferir"}</td>
        <td><AbrirCliente contexto={c} ativoId={ativoId} retorno={filtro} acao={abrirCliente} className={styles.link}>Abrir aplicativo<Seta /></AbrirCliente></td>
      </tr>)}</tbody></table> : <div className={styles.vazio}><h3>Nenhum cliente neste filtro</h3><p>Tente outro nome ou veja todos os clientes da carteira.</p>
        <button className={styles.secundario} onClick={() => { setBusca(""); setPendentes(false); setPagina(1); campoBusca.current?.focus(); }}>Limpar filtros</button></div>}
      <div className={styles.paginacao}><p className={styles.nota} role="status">{filtrados.length ? `${(atual - 1) * 10 + 1}–${Math.min(atual * 10, filtrados.length)} de ${filtrados.length}` : "Nenhum cliente encontrado"}</p>
        {paginas > 1 && <div><button disabled={atual === 1} className={styles.secundario} onClick={() => setPagina(atual - 1)}>Anterior</button>
          <span>Página {atual} de {paginas}</span><button disabled={atual === paginas} className={styles.secundario} onClick={() => setPagina(atual + 1)}>Próxima</button></div>}</div>
    </section>
  </div>;
}
