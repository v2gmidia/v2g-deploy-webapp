"use client";

import { useState } from "react";
import styles from "./previa-do-pedido.module.css";

/** Bancada local: nenhum dado sai do navegador nem sobrevive ao recarregamento. */
export function PreviaDoPedido({ hoje }: { hoje: string }) {
  const [objetivo, setObjetivo] = useState("");
  const [oferta, setOferta] = useState("");
  const [promocao, setPromocao] = useState(false);
  const [validade, setValidade] = useState("");
  const [acao, setAcao] = useState("");
  const prazoVencido = promocao && Boolean(validade) && validade < hoje;

  const faltam = [
    !objetivo.trim() && "o objetivo da peça",
    !oferta.trim() && "a oferta ou serviço",
    promocao && (!validade ? "a validade da promoção" : prazoVencido ? "uma nova data para a promoção vencida" : false),
    !acao.trim() && "o destino da resposta",
  ].filter(Boolean);

  return <main className={styles.pagina}>
    <header className={styles.topo}>
      <h1>O que esta peça precisa comunicar?</h1>
      <p>Rascunho do pedido de criação. Conte o que quer anunciar em suas palavras; não é preciso escrever um prompt para a IA.</p>
    </header>

    <p className="form-warning" role="status"><b>Prévia local.</b> Este pedido não é salvo, não gera imagem e desaparece ao sair ou atualizar a página. Não use dados reais de clientes aqui.</p>

    <div className={styles.grade}>
      <section className={styles.entrada} aria-labelledby="pedido-titulo">
        <h2 id="pedido-titulo">Seu pedido</h2>
        <label htmlFor="pedido-objetivo">Qual o objetivo deste criativo?</label>
        <textarea id="pedido-objetivo" rows={3} maxLength={500} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex.: apresentar um serviço novo" />

        <label htmlFor="pedido-oferta">O que será anunciado?</label>
        <textarea id="pedido-oferta" rows={3} maxLength={500} value={oferta} onChange={(e) => setOferta(e.target.value)} placeholder="Descreva o produto, serviço ou oferta sem inventar preço" />

        <label className={styles.opcao} htmlFor="pedido-promocao"><input id="pedido-promocao" type="checkbox" checked={promocao} onChange={(e) => setPromocao(e.target.checked)} /> É uma promoção por tempo limitado</label>
        {promocao ? <><label htmlFor="pedido-validade">Até quando vale?</label><input id="pedido-validade" type="date" min={hoje} value={validade} aria-invalid={prazoVencido} aria-describedby={prazoVencido ? "pedido-validade-erro" : undefined} onChange={(e) => setValidade(e.target.value)} />{prazoVencido ? <p id="pedido-validade-erro" className="form-error">Essa data já passou. Escolha hoje ou uma data futura.</p> : null}</> : null}

        <label htmlFor="pedido-acao">O que a pessoa deve fazer depois de ver a peça?</label>
        <input id="pedido-acao" type="text" maxLength={200} value={acao} onChange={(e) => setAcao(e.target.value)} placeholder="Ex.: chamar no WhatsApp da empresa" />
      </section>

      <aside className={styles.resumo} aria-labelledby="resumo-titulo" aria-live="polite">
        <h2 id="resumo-titulo">Conferência do pedido</h2>
        <p>Esta é apenas a informação declarada aqui. Identidade visual, imagens reais do negócio e referências revisadas ainda precisariam ser vinculadas antes da geração.</p>
        {faltam.length ? <p className={styles.pendencias}>Ainda falta: {faltam.join(", ")}.</p> : <p className={styles.pronto}>Pedido preenchido nesta prévia. Ainda não está pronto para gerar.</p>}
        <dl>
          <dt>Objetivo</dt><dd>{objetivo.trim() || "Não informado"}</dd>
          <dt>Oferta ou serviço</dt><dd>{oferta.trim() || "Não informado"}</dd>
          <dt>Prazo</dt><dd>{promocao ? validade || "Não informado" : "Sem promoção informada"}</dd>
          <dt>Destino da resposta</dt><dd>{acao.trim() || "Não informado"}</dd>
        </dl>
      </aside>
    </div>
  </main>;
}
