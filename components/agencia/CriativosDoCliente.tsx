"use client";
import { useState, type ReactNode } from "react";
import type { ContextoAgencia, RetornoCarteira } from "@/lib/agencia/contexto";
import { hrefDaCarteira } from "@/lib/agencia/contexto";
import type { GrupoDaGaleria, ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";
import { CabecalhoAgencia, CaminhoDoCliente, Seta } from "./Comuns";
import { MiniaturaDaPeca } from "./MiniaturaDaPeca";
import styles from "./agencia.module.css";

const data = (v: string) => new Date(v).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
export function CriativosDoCliente({ contexto, retorno, itens, falhou, pecaSolicitada, envio, criacao, analise }: {
  contexto: ContextoAgencia; retorno: RetornoCarteira; itens: ItemDaGaleria[]; falhou: boolean;
  pecaSolicitada?: string; envio: ReactNode; criacao: ReactNode; analise: ReactNode;
}) {
  const pedida = itens.find(p => p.id === pecaSolicitada);
  const [pedidoRecusado, setPedidoRecusado] = useState(pecaSolicitada !== undefined && !pedida);
  const [aba, setAba] = useState<GrupoDaGaleria>(pedida?.grupo ?? "biblioteca");
  const [selecao, setSelecao] = useState(pedida?.id ?? null);
  const visiveis = itens.filter(p => p.grupo === aba);
  const selecionada = pedidoRecusado ? undefined : visiveis.find(p => p.id === selecao) ?? visiveis[0];
  const abas = ([{ id: "biblioteca", nome: "Biblioteca" }, { id: "revisao", nome: "Em revisão" },
    ...(itens.some(p => p.grupo === "instagram") ? [{ id: "instagram", nome: "Instagram" }] : []), { id: "arquivados", nome: "Arquivados" }] as { id: GrupoDaGaleria; nome: string }[]);
  return <div className={styles.raiz}>
    <CaminhoDoCliente contexto={contexto} retorno={retorno} area="/criativos" />
    <CabecalhoAgencia titulo="Criativos" descricao={`${contexto.anunciante} · biblioteca e acompanhamento das peças`}
      acao={envio ? <a className="cta" href="#agencia-enviar">Enviar peça<Seta /></a> : undefined} />
    {falhou && <p className="form-warning" role="alert">Não conseguimos conferir toda a biblioteca agora. As peças visíveis não representam uma leitura completa. Atualize a página para tentar novamente.</p>}
    {pedidoRecusado && <div className="form-warning" role="alert"><p>Não foi possível abrir a peça solicitada neste cliente. Nenhuma outra peça foi escolhida no lugar dela.</p>
      <button className={styles.secundario} onClick={() => setPedidoRecusado(false)}>Ver biblioteca deste cliente</button></div>}
    <div className={styles.abas} role="group" aria-label={`Filtrar biblioteca de ${contexto.anunciante}`}>{abas.map(a => <button type="button" key={a.id} aria-pressed={aba === a.id}
      onClick={() => { setAba(a.id); setSelecao(null); setPedidoRecusado(false); }}>{a.nome}<span>{falhou ? "—" : itens.filter(p => p.grupo === a.id).length}</span></button>)}</div>
    {visiveis.length > 1 && <div className={styles.seletorPeca} aria-label="Escolher peça">{visiveis.map(p => <button key={p.id} className={styles.secundario} aria-pressed={selecionada?.id === p.id} onClick={() => { setSelecao(p.id); setPedidoRecusado(false); }}>{p.nome}</button>)}</div>}
    {selecionada ? <div className={styles.biblioteca}><article className={styles.cartaoPeca}>
      <MiniaturaDaPeca url={selecionada.imagemUrl} nome={selecionada.nome} grande />
      <div className={styles.corpoPeca}><span className={`${styles.status} ${selecionada.tom === "positivo" ? styles.positivo : ""}`}>{selecionada.estado}</span><h2>{selecionada.nome}</h2>
        <p>{selecionada.detalhe}</p><p>{selecionada.criadoEm}</p></div></article>
      <section className={styles.acompanhamento} aria-labelledby="agencia-acompanhamento"><h2 id="agencia-acompanhamento">Acompanhamento da peça</h2>
        <dl className={styles.fatos}><dt>Cliente</dt><dd>{contexto.anunciante}</dd><dt>Agência</dt><dd>{contexto.agencia}</dd><dt>Responsável</dt><dd>{contexto.gestor ?? "A conferir com a equipe"}</dd></dl>
        {selecionada.revisao ? <ol className={styles.trilha}>
          <li><b>Peça recebida</b><p>{selecionada.criadoEm}</p></li>
          <li data-pendente={!selecionada.revisao.revisadoEm}><b>{selecionada.estado}</b><p>{selecionada.revisao.revisadoEm && Number.isFinite(Date.parse(selecionada.revisao.revisadoEm)) ? data(selecionada.revisao.revisadoEm) : "Decisão do gestor ainda sem data conferida."}</p></li>
          <li data-pendente={!selecionada.revisao.publicacaoConfirmada}><b>{selecionada.revisao.publicacaoConfirmada ? "Publicação registrada pelo gestor" : selecionada.revisao.falhaPublicacao ? "Conferência da publicação indisponível" : "Publicação em conferência"}</b>
            <p>{selecionada.publicacao ?? "Ainda sem confirmação de publicação."}</p></li>
        </ol> : <p className={styles.nota}>O estado desta peça é apresentado conforme a biblioteca. Um vínculo com anúncio não confirma entrega atual.</p>}
        <div className={styles.publicacao}><h3>Publicação</h3><p>{selecionada.publicacao ?? "Sem confirmação de publicação nesta leitura."}</p>
          {(selecionada.associacoes ?? []).map(a => <a className={styles.link} key={a.nome} href={a.href}>{a.nome}<Seta /></a>)}</div>
        {selecionada.acao && <a className={styles.link} href={selecionada.acao.href}>{selecionada.acao.rotulo}<Seta /></a>}
      </section></div> : <div className={styles.vazio}><h3>{falhou ? "Biblioteca indisponível" : "Nenhuma peça nesta etapa"}</h3>
        <p>{falhou ? "Tente consultar novamente." : "Quando uma peça deste cliente chegar a esta etapa, ela aparece aqui."}</p></div>}
    {envio && <section className={styles.envio} id="agencia-enviar"><h2>Enviar peça para {contexto.anunciante}</h2>{envio}</section>}
    {(criacao || analise) && <details className={styles.outros}><summary>Outras opções de criativos deste cliente</summary>
      {criacao && <section>{criacao}</section>}{analise && <section>{analise}</section>}</details>}
    <div className={styles.voltar}><a className={styles.link} href={hrefDaCarteira("/criativos", retorno)}><Seta voltar />Voltar aos criativos da agência</a></div>
  </div>;
}
