"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { acompanharGeracaoAction } from "./geracao-actions";
import { RECADOS_GERACAO, rotuloDoAndamento, type AndamentoGeracao } from "@/lib/criativos/geracao/contrato-fila";
import styles from "./pedido-de-imagem.module.css";
import { useEsperaLocal } from "./useEsperaLocal";

type Operacao = "consultar" | "submeter" | "cancelar";
export type ConsultarGeracao = (businessId: string, requestId: string, operacao: Operacao) => Promise<AndamentoGeracao>;

/** Um controlador por pedido. Recarregar/montar só consulta; nunca envia POST. */
export function AndamentoDaImagem({ businessId, requestId, habilitada,
  consultar = acompanharGeracaoAction, simulacao = false,
}: { businessId: string; requestId: string; habilitada: boolean; consultar?: ConsultarGeracao; simulacao?: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<AndamentoGeracao | null>(null);
  const [pendente, setPendente] = useState(false);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [falhaDeConsulta, setFalhaDeConsulta] = useState(false);
  const [operacaoAtual, setOperacaoAtual] = useState<Operacao>("consultar");
  const identidade = `${businessId}:${requestId}`;
  const [identidadeLida, setIdentidadeLida] = useState(identidade);
  const espera = useEsperaLocal(pendente ? operacaoAtual : null);
  const vivo = useRef(false);
  const ocupado = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const concluido = useRef(false);
  const ciclo = useRef(0);
  const consultarRef = useRef(consultar);
  consultarRef.current = consultar;

  const chamar = useCallback(async function consultarPedido(operacao: Operacao = "consultar") {
    if (!vivo.current || ocupado.current || !habilitada) return;
    ocupado.current = true;
    const iniciadoNoCiclo = ciclo.current;
    if (timer.current) clearTimeout(timer.current);
    setPendente(true);
    setOperacaoAtual(operacao);
    let resposta: AndamentoGeracao;
    try { resposta = await consultarRef.current(businessId, requestId, operacao); }
    catch { resposta = { ok: false, motivo: "conferir_estado" }; }
    if (!vivo.current || iniciadoNoCiclo !== ciclo.current) return;
    ocupado.current = false;
    if (resposta.ok && (resposta.businessId !== businessId || resposta.requestId !== requestId))
      resposta = { ok: false, motivo: "negocio_mudou" };
    setIdentidadeLida(`${businessId}:${requestId}`);
    setFalhaDeConsulta(!resposta.ok && resposta.motivo === "conferir_estado");
    setEstado(anterior => !resposta.ok && resposta.motivo === "conferir_estado" && anterior?.ok ? anterior : resposta);
    setPendente(false);
    if (resposta.ok) setImagemFalhou(false);
    if (resposta.ok && resposta.status === "artifact_available" && !concluido.current) {
      concluido.current = true;
      router.refresh(); // Relê a biblioteca existente, sem nova submissão.
    }
    if (resposta.ok && resposta.consultarEm === 2000)
      timer.current = setTimeout(() => { void consultarPedido("consultar"); }, 2000);
  }, [businessId, requestId, habilitada, router]);

  useEffect(() => {
    ciclo.current += 1;
    vivo.current = true;
    ocupado.current = false;
    concluido.current = false;
    setEstado(null);
    setFalhaDeConsulta(false);
    setImagemFalhou(false);
    void chamar();
    return () => { vivo.current = false; ciclo.current += 1; if (timer.current) clearTimeout(timer.current); };
  }, [chamar]);

  if (!habilitada) return <p className="form-warning" role="status">{RECADOS_GERACAO.indisponivel}</p>;
  // Nenhum estado/imagem do negócio anterior aparece enquanto o novo é consultado.
  const exibido = identidadeLida === identidade ? estado : null;
  const falha = exibido && !exibido.ok ? exibido.motivo : null;
  return <div className={styles.andamento} aria-label="Andamento da criação">
    {simulacao ? <p className={styles.avisoSimulacao}>Imagem fictícia para testar o fluxo. Nenhum anúncio será publicado.</p> : null}
    <div className={styles.estado} role="status" aria-live="polite" aria-atomic="true">
      {!exibido ? espera.visivel ? <p>Consultando o pedido…</p> : null : exibido.ok
        ? <><strong>{rotuloDoAndamento(exibido.status, exibido.simulada)}</strong>
          {exibido.status === "queued" ? <p>Seu pedido está guardado e aguarda processamento.</p> : null}
          {exibido.status === "running" ? <p>O processamento foi iniciado. A geração não informa percentual nem previsão de término.</p> : null}
          {exibido.status === "storage_pending" ? <p>A imagem foi recebida. Estamos concluindo o arquivo, sem criar outra imagem.</p> : null}
          {exibido.status === "reconciliation_required" ? <p>Estamos conferindo o que aconteceu. Nenhuma nova criação será iniciada por esta consulta.</p> : null}
          {exibido.status === "failed" ? <p>O processamento foi encerrado. O pedido foi preservado para a equipe conferir.</p> : null}
          {exibido.status === "cancelled" ? <p>Este pedido foi cancelado e não será reenviado automaticamente.</p> : null}
          {exibido.status === "artifact_available" ? <p>{exibido.simulada ? "Arquivo de teste guardado" : "Imagem guardada"} na biblioteca deste negócio. Nenhum anúncio foi publicado.</p> : null}</>
        : <p className={exibido.motivo === "conferir_estado" ? "form-error" : "form-warning"}>{RECADOS_GERACAO[exibido.motivo]}</p>}
      {falhaDeConsulta && exibido?.ok ? <p className="form-warning">Não foi possível atualizar. Acima está o último estado confirmado deste pedido, não uma confirmação atual. Consulte o andamento novamente; nenhuma nova geração foi iniciada.</p> : null}
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">{espera.visivel ? <p>{operacaoAtual === "consultar"
      ? espera.longa ? "A consulta está demorando. O estado anterior permanece visível; ainda não há uma nova confirmação." : "Atualizando o andamento deste pedido…"
      : operacaoAtual === "cancelar" ? "Aguardando a confirmação do cancelamento. O pedido só estará cancelado quando o servidor confirmar."
      : "Aguardando a confirmação da criação. Não reenvie: consulte este mesmo pedido para acompanhar."}</p> : null}</div>
    {exibido?.ok && exibido.imagemUrl ? <div className={simulacao ? styles.resultadoSimulado : undefined}>
      {imagemFalhou ? <p className="form-warning" role="alert">Não foi possível abrir a imagem com o acesso atual. Consulte o andamento para conferir novamente.</p>
        : <img className={styles.resultado} src={exibido.imagemUrl} alt={exibido.simulada ? "Imagem fictícia do teste de criação" : "Imagem criada para este negócio"}
          width={1088} height={1088} onError={() => setImagemFalhou(true)} />}
      {simulacao && !imagemFalhou ? <span aria-hidden="true">SIMULAÇÃO LOCAL</span> : null}
    </div> : null}
    <div className={styles.acoes}>
      {exibido && !exibido.ok && exibido.motivo === "nao_iniciado"
        && (exibido.podeSubmeter === true || simulacao && exibido.podeSubmeter === undefined) ? <button type="button" className="cta" disabled={pendente}
        onClick={() => { void chamar("submeter"); }}>{exibido.tipoCriacao === "real" ? "Criar imagem" : "Criar imagem de teste"}</button> : null}
      <button type="button" className="cta ghost" disabled={pendente || falha === "negocio_mudou"}
        onClick={() => { void chamar("consultar"); }}>{pendente ? "Atualizando…" : "Atualizar andamento"}</button>
      {exibido?.ok && exibido.status === "queued" && exibido.simulada && !falhaDeConsulta ? <button type="button" className="cta ghost" disabled={pendente}
        onClick={() => { void chamar("cancelar"); }}>Cancelar pedido na fila</button> : null}
    </div>
  </div>;
}
