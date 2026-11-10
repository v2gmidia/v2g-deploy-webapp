import type { ReactNode } from "react";
import type { ContextoAgencia, RetornoCarteira } from "@/lib/agencia/contexto";
import { hrefDaCarteira, hrefDoCliente } from "@/lib/agencia/contexto";
import type { ResumoDaCarteira } from "@/lib/agencia/resumo";
import styles from "./agencia.module.css";

export function Seta({ voltar = false }: { voltar?: boolean }) {
  return <svg className={styles.icone} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d={voltar ? "M17 10H4m5-5-5 5 5 5" : "M3 10h13m-5-5 5 5-5 5"} />
  </svg>;
}
export function CabecalhoAgencia({ titulo, descricao, acao }: { titulo: string; descricao: string; acao?: ReactNode }) {
  return <header className={styles.cabecalho}><div><h1>{titulo}<span className={styles.quadrado} aria-hidden="true" /></h1><p>{descricao}</p></div>{acao}</header>;
}
export function CaminhoDoCliente({ contexto, retorno, area = "/inicio" }: {
  contexto: ContextoAgencia; retorno: RetornoCarteira; area?: "/inicio" | "/criativos";
}) {
  return <nav className={styles.caminho} aria-label="Localização"><a href={hrefDaCarteira("/inicio", retorno)}>{contexto.agencia}</a><span>/</span>
    <a href={hrefDaCarteira(area, retorno)}>{area === "/criativos" ? "Criativos da agência" : "Clientes"}</a><span>/</span><span aria-current="page">{contexto.anunciante}</span></nav>;
}
export function ProximoPassoAgencia({ contexto, resumo, retorno }: {
  contexto: ContextoAgencia; resumo: ResumoDaCarteira; retorno: RetornoCarteira;
}) {
  return <aside className={styles.proximo}><h2>Seu próximo passo</h2><h3>{resumo.titulo}</h3><p><strong>{contexto.anunciante}</strong><br />{resumo.corpo}</p>
    <a className="cta" href={hrefDoCliente("/criativos", contexto.businessId, retorno)}>{resumo.rotulo}<Seta /></a>
    <p className={styles.nota}>Responsável: {contexto.gestor ?? "a conferir com a equipe"}</p></aside>;
}
export function ClienteIndisponivel() {
  return <section className={styles.raiz}><CabecalhoAgencia titulo="Cliente indisponível" descricao="Não foi possível confirmar este cliente no contexto atual." />
    <p className="form-warning" role="alert">Volte à carteira e abra um cliente disponível para esta sessão.</p><a className="cta" href="/inicio">Voltar ao Início</a></section>;
}
