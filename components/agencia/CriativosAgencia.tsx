"use client";
import { useState } from "react";
import type { ContextoAgencia, RetornoCarteira } from "@/lib/agencia/contexto";
import { hrefDoCliente } from "@/lib/agencia/contexto";
import type { ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";
import { CabecalhoAgencia, Seta } from "./Comuns";
import { MiniaturaDaPeca } from "./MiniaturaDaPeca";
import styles from "./agencia.module.css";

export type PecaDaAgencia = { cliente: ContextoAgencia; peca: ItemDaGaleria };
const ETAPAS = [{ id: "todas", nome: "Todas as etapas" }, { id: "revisao", nome: "Em revisão" },
  { id: "aprovado", nome: "Peça aprovada" }, { id: "ajustes", nome: "Ajustes solicitados" }, { id: "arquivados", nome: "Arquivados" }];
export function etapaDaPeca(peca: ItemDaGaleria) {
  return peca.revisao?.status === "approved_for_manual_publish" ? "aprovado"
    : peca.revisao?.status === "changes_requested" ? "ajustes" : peca.grupo;
}
export function CriativosAgencia({ agencia, clientes, itens, falhou, retorno, envioDisponivel }: {
  agencia: string; clientes: ContextoAgencia[]; itens: PecaDaAgencia[]; falhou: boolean;
  retorno: RetornoCarteira; envioDisponivel: boolean;
}) {
  const [busca, setBusca] = useState(retorno.busca);
  const [cliente, setCliente] = useState(retorno.filtroCliente ?? "");
  const [etapa, setEtapa] = useState(retorno.etapa ?? "todas");
  const filtro = { ...retorno, busca, etapa: etapa === "todas" ? undefined : etapa, filtroCliente: cliente || undefined };
  const filtrados = itens.filter(i => (!cliente || cliente === i.cliente.businessId)
    && (etapa === "todas" || etapaDaPeca(i.peca) === etapa)
    && `${i.cliente.anunciante} ${i.peca.nome}`.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR")));
  const unico = clientes.length === 1 ? clientes[0] : null;
  return <div className={styles.raiz}>
    <CabecalhoAgencia titulo="Criativos" descricao="Acompanhe as peças de todos os clientes da agência." acao={
      unico && envioDisponivel ? <a className="cta" href={`${hrefDoCliente("/criativos", unico.businessId, filtro)}#agencia-enviar`}>Enviar peça<Seta /></a> : undefined} />
    <p className={styles.introducao}>Cada peça continua ligada ao seu cliente, com revisão e publicação acompanhadas separadamente.</p>
    <div className={styles.filtros}><label className={styles.busca}>Buscar peça ou cliente<input type="search" placeholder="Nome do cliente ou da peça" maxLength={120} value={busca} onChange={e => setBusca(e.target.value)} /></label>
      <label>Cliente<select value={cliente} onChange={e => setCliente(e.target.value)}><option value="">Todos os clientes</option>{clientes.map(c => <option key={c.businessId} value={c.businessId}>{c.anunciante}</option>)}</select></label>
      <label>Etapa<select value={etapa} onChange={e => setEtapa(e.target.value)}>{ETAPAS.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label></div>
    <p className={styles.nota}>{agencia} · peças dos clientes disponíveis nesta carteira.</p>
    {falhou && <p className="form-warning" role="alert">Não conseguimos conferir toda a fila agora. Isso não significa que as peças foram removidas. Atualize a página para tentar novamente.</p>}
    <h2>Fila de acompanhamento</h2>
    <p className={styles.nota} role="status">{filtrados.length} {filtrados.length === 1 ? "peça neste filtro" : "peças neste filtro"}{falhou ? " · leitura incompleta" : ""}</p>
    {filtrados.length ? <div className={styles.fila}>{filtrados.map(({ cliente: c, peca: p }) => <article className={styles.linhaPeca} key={`${c.businessId}:${p.id}`} aria-label={`${c.anunciante} — ${p.nome}`}>
      <MiniaturaDaPeca url={p.imagemUrl} nome={p.nome} /><div><span className={styles.clienteDaPeca}>{c.anunciante}</span><h3>{p.nome}</h3>
        <p>Responsável: {c.gestor ?? "a conferir"} · {p.criadoEm}</p><a className={styles.link} href={`${hrefDoCliente("/criativos", c.businessId, filtro)}&peca=${encodeURIComponent(p.id)}`}>Abrir no cliente<Seta /></a></div>
      <div className={styles.situacaoPeca}><span className={`${styles.status} ${p.tom === "positivo" ? styles.positivo : ""}`}>{p.estado}</span>
        {p.publicacao && <p>{p.publicacao}</p>}{p.detalhe && <p>{p.detalhe}</p>}</div>
    </article>)}</div> : <div className={styles.vazio}><h3>{falhou ? "Fila indisponível" : "Nenhuma peça neste filtro"}</h3>
      <p>{falhou ? "Tente consultar novamente mais tarde." : "Escolha outra etapa ou volte a ver todos os clientes."}</p>
      <button className={styles.secundario} onClick={() => { setBusca(""); setCliente(""); setEtapa("todas"); }}>Limpar filtros</button></div>}
  </div>;
}
