"use client";

import { useId, useRef, useState } from "react";
import { prepararOrientacaoExterna, type DadosDaOrientacao } from "@/lib/criativos/orientacao-externa";
import styles from "./referencias-do-nicho.module.css";
import type { ContextoDoCriativo } from "@/lib/criativos/contexto-do-negocio";
import { ContextoDoNegocio, OrigemDoCampo } from "./ContextoDoNegocio";

export function OrientacaoExterna({ referenciaId, dados, desabilitado = false, contexto }: {
  referenciaId: string; dados: DadosDaOrientacao; desabilitado?: boolean; contexto?: ContextoDoCriativo;
}) {
  const id = useId(), campo = useRef<HTMLTextAreaElement>(null);
  const [identidade, setIdentidade] = useState("");
  const [nome, setNome] = useState(contexto?.nome?.valor ?? "");
  const [cores, setCores] = useState(contexto?.cores?.valor ?? "");
  const [oferta, setOferta] = useState(contexto?.oferta?.valor ?? "");
  const [apoio, setApoio] = useState(contexto?.apoio.map(c => `${c.rotulo}: ${c.campo.valor}`).join("\n") ?? "");
  const [direcao, setDirecao] = useState("");
  const [conferencia, setConferencia] = useState<string | null>(null);
  const [copia, setCopia] = useState<{ texto: string; estado: "copiando" | "copiado" | "manual" } | null>(null);
  const orientacao = prepararOrientacaoExterna({ ...dados, oferta: dados.oferta?.trim() || oferta,
    referenciaId, identidade: contexto ? (nome.trim() && cores.trim() ? `${nome}; cores: ${cores}` : "") : identidade,
    contextoApoio: apoio, direcao });
  const texto = orientacao.ok ? orientacao.texto : "";
  const conferido = Boolean(texto && conferencia === texto);
  const estado = copia?.texto === texto ? copia.estado : null;
  async function copiar() {
    if (!texto || !conferido || desabilitado) return;
    setCopia({ texto, estado: "copiando" });
    try {
      await navigator.clipboard.writeText(texto);
      setCopia({ texto, estado: "copiado" });
    } catch {
      setCopia({ texto, estado: "manual" });
      campo.current?.focus(); campo.current?.select();
    }
  }
  return <details className={styles.orientacao}>
    <summary>Preparar orientação para outra ferramenta</summary>
    <p>Você escolhe a ferramenta e anexa sua logo e fotos próprias por lá. A V2G prepara apenas o texto abaixo; não envia arquivos nem gera uma imagem nesta etapa.</p>
    <ContextoDoNegocio contexto={contexto} />
    <div className={styles.campos}>
      {contexto ? <>
        <label htmlFor={`${id}-nome`}>Nome do negócio neste criativo</label>
        <textarea id={`${id}-nome`} rows={2} maxLength={200} disabled={desabilitado} value={nome} onChange={e => setNome(e.target.value)} />
        <OrigemDoCampo campo={contexto.nome} valor={nome} />
        <label htmlFor={`${id}-cores`}>Cores para este criativo</label>
        <textarea id={`${id}-cores`} rows={2} maxLength={250} disabled={desabilitado} value={cores} onChange={e => setCores(e.target.value)} placeholder="Informe as cores que faltam" />
        <OrigemDoCampo campo={contexto.cores} valor={cores} />
      </> : <><label htmlFor={`${id}-marca`}>Nome e cores do seu negócio</label>
      <textarea id={`${id}-marca`} rows={2} maxLength={500} disabled={desabilitado}
        value={identidade} onChange={e => setIdentidade(e.target.value)} placeholder="Ex.: Barbearia Exemplo; azul escuro e amarelo; logo original anexada" /></>}
      {!dados.oferta?.trim() ? <><label htmlFor={`${id}-oferta`}>Serviço ou oferta que deve aparecer</label>
        <textarea id={`${id}-oferta`} rows={2} maxLength={500} disabled={desabilitado}
          value={oferta} onChange={e => setOferta(e.target.value)} placeholder="Informe apenas o serviço, preço ou condição que realmente oferece" />
        <OrigemDoCampo campo={contexto?.oferta} valor={oferta} /></> : null}
      {contexto?.apoio.length ? <><label htmlFor={`${id}-apoio`}>Contexto de apoio para este criativo (opcional)</label>
        <textarea id={`${id}-apoio`} rows={4} maxLength={3500} disabled={desabilitado} value={apoio} onChange={e => setApoio(e.target.value)} />
        <small>Do seu cadastro. Edite ou apague o que não serve para este criativo; isso não muda as respostas salvas.</small></> : null}
      <label htmlFor={`${id}-direcao`}>O que você gostou na composição da referência?</label>
      <textarea id={`${id}-direcao`} rows={2} maxLength={400} disabled={desabilitado}
        value={direcao} onChange={e => setDirecao(e.target.value)} placeholder="Ex.: título em destaque, pouco texto e espaço para minha foto" />
    </div>
    {!orientacao.ok ? <p className={styles.nota} role="status">{orientacao.erro}</p> : <>
      <label className={styles.rotuloTexto} htmlFor={`${id}-texto`}>Orientação para revisar e copiar</label>
      <textarea id={`${id}-texto`} className={styles.textoOrientacao} ref={campo} readOnly rows={12} value={texto}
        onFocus={e => e.currentTarget.select()} />
    </>}
    <label className={styles.conferencia}><input type="checkbox" disabled={!orientacao.ok || desabilitado} checked={conferido}
      onChange={e => setConferencia(e.target.checked ? texto : null)} />Conferi os dados desta orientação. Isso não altera meu cadastro nem autoriza geração automática.</label>
    <button className="cta ghost" type="button" onClick={copiar} disabled={!orientacao.ok || !conferido || desabilitado || estado === "copiando"}>
      {estado === "copiando" ? "Copiando…" : "Copiar orientação"}
    </button>
    {estado === "copiado" ? <p className="form-notice" role="status">Orientação copiada. Revise e cole na ferramenta que você escolher.</p> : null}
    {estado === "manual" ? <p className="form-warning" role="status">Não foi possível copiar automaticamente. O texto está selecionado: copie pelo menu do aparelho ou pelo teclado.</p> : null}
    <p className={styles.nota}>Depois, volte para “Já tenho um criativo”, selecione a imagem pronta e envie para revisão. A referência escolhida acompanha o envio; nada é publicado automaticamente.</p>
  </details>;
}
