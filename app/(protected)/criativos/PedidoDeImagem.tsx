"use client";

import { useActionState, useState } from "react";
import type { PedidoDeImagem } from "@/lib/criativos/pedido-imagem";
import { guardarPedidoAction, type EstadoDoPedido } from "./geracao-actions";
import styles from "./pedido-de-imagem.module.css";

export function PedidoDeImagem({ businessId, requestId, hoje, pedidos, falhou, previa = false }: {
  businessId: string; requestId: string; hoje: string;
  pedidos: PedidoDeImagem[]; falhou: boolean; previa?: boolean;
}) {
  const [id, setId] = useState(requestId);
  return <section className={styles.secao} aria-labelledby="criar-peca-titulo">
    <h2 id="criar-peca-titulo" className="section-title">Preparar uma peça</h2>
    {previa ? <p className="form-warning" role="status">Prévia local da interface. Nada é guardado aqui e nenhum serviço externo é chamado. Use apenas dados fictícios.</p> : null}
    <p>Guarde o que você quer anunciar. A geração de imagem ainda não está liberada; este pedido não envia materiais para uma IA nem publica anúncios.</p>
    <Formulario key={id} businessId={businessId} requestId={id} hoje={hoje}
      previa={previa} novoPedido={() => setId(crypto.randomUUID())} />
    <div className={styles.historico} aria-labelledby="pedidos-criacao-titulo">
      <h3 id="pedidos-criacao-titulo">Pedidos de criação</h3>
      {falhou ? <p className="form-warning" role="status">Não foi possível recuperar os pedidos agora. Isso não significa que a lista está vazia. Atualize a página antes de repetir um envio.</p>
        : pedidos.length === 0 ? <p>Nenhum pedido guardado neste negócio.</p>
        : <><p>Até 20 pedidos mais recentes. Todos ainda aguardam a liberação da geração.</p>
          <ul className={styles.lista}>{pedidos.map((pedido) => <li key={pedido.id}>
            <details><summary><span>{pedido.payload.objetivo}</span><span className={styles.data}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(pedido.created_at))}</span></summary>
              <dl><dt>Oferta ou serviço</dt><dd>{pedido.payload.oferta}</dd>
                <dt>Destino da resposta</dt><dd>{pedido.payload.acao}</dd>
                <dt>Validade</dt><dd>{pedido.payload.validade ? pedido.payload.validade.split("-").reverse().join("/") : "Sem promoção com prazo"}</dd>
                <dt>Estado</dt><dd>Pedido guardado. Nenhuma imagem gerada ou publicada.</dd></dl>
            </details>
          </li>)}</ul></>}
    </div>
  </section>;
}

function Formulario({ businessId, requestId, hoje, novoPedido, previa }: {
  businessId: string; requestId: string; hoje: string; novoPedido: () => void; previa: boolean;
}) {
  const [estado, action, pendente] = useActionState<EstadoDoPedido, FormData>(previa
    ? async () => ({ erro: "Prévia local: o pedido não foi guardado. O envio real exige sessão autorizada e persistência habilitada." })
    : guardarPedidoAction, {});
  const [objetivo, setObjetivo] = useState("");
  const [oferta, setOferta] = useState("");
  const [acao, setAcao] = useState("");
  const [promocao, setPromocao] = useState(false);
  const [validade, setValidade] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const vencida = promocao && Boolean(validade) && validade < hoje;
  const travado = pendente || estado.ok === true;
  return <form action={action} className={styles.formulario}>
    <input type="hidden" name="requestId" value={requestId} />
    <input type="hidden" name="businessId" value={businessId} />
    <fieldset disabled={travado}>
      <legend className="sr-only">Dados do pedido de criação</legend>
      <label htmlFor="criacao-objetivo">Qual é o objetivo desta peça?</label>
      <textarea id="criacao-objetivo" name="objetivo" rows={2} required minLength={2} maxLength={500}
        value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex.: apresentar um serviço novo" />
      <label htmlFor="criacao-oferta">O que será anunciado?</label>
      <textarea id="criacao-oferta" name="oferta" rows={3} required minLength={2} maxLength={500}
        value={oferta} onChange={(e) => setOferta(e.target.value)} placeholder="Produto, serviço ou oferta; inclua preço somente se for real" />
      <label htmlFor="criacao-acao">O que a pessoa deve fazer depois?</label>
      <input id="criacao-acao" name="acao" required minLength={2} maxLength={200}
        value={acao} onChange={(e) => setAcao(e.target.value)} placeholder="Ex.: chamar no WhatsApp da empresa" />
      <label className={styles.opcao}><input type="checkbox" name="promocao" checked={promocao}
        onChange={(e) => setPromocao(e.target.checked)} />É uma promoção por tempo limitado</label>
      {promocao ? <><label htmlFor="criacao-validade">Até quando vale?</label>
        <input id="criacao-validade" name="validade" type="date" min={hoje} required value={validade}
          aria-invalid={vencida} aria-describedby={vencida ? "criacao-prazo-erro" : undefined}
          onChange={(e) => setValidade(e.target.value)} />
        {vencida ? <p id="criacao-prazo-erro" className="form-error">Essa data já passou. Escolha hoje ou uma data futura.</p> : null}</> : null}
      <label className={styles.opcao}><input type="checkbox" name="confirmado" required checked={confirmado}
        onChange={(e) => setConfirmado(e.target.checked)} />Conferi a oferta, o prazo e o destino da resposta.</label>
    </fieldset>
    {estado.erro ? <p className="form-error" role="alert">{estado.erro}</p> : null}
    {estado.ok ? <><p className="form-notice" role="status">{estado.repetido ? "Este pedido já estava guardado." : "Pedido guardado neste negócio."} A geração ainda aguarda liberação. Nenhuma imagem foi gerada ou publicada.</p>
      <button type="button" className="cta ghost" onClick={novoPedido}>Preparar outro pedido</button></>
      : <button className="cta" type="submit" disabled={pendente || vencida}>{pendente ? "Guardando pedido…" : "Guardar pedido"}</button>}
  </form>;
}
