"use client";

import { useActionState } from "react";
import {
  registrarInteressadoAction,
  registrarInteracaoAction,
  type RevOpsActionState,
} from "./actions";

const inicial: RevOpsActionState = {};

export function FormInteressado({ referencia }: { referencia: string }) {
  const [estado, acao, pendente] = useActionState(registrarInteressadoAction, inicial);
  return <form action={acao} className="revops-formulario">
    <div className="revops-form-head">
      <h2>Novo interessado</h2>
      <p>Cria pessoa, empresa e oportunidade separadas. Nada é unido por texto.</p>
    </div>
    <input type="hidden" name="sourceExternalId" value={referencia} />
    <div className="revops-campos-duplos">
      <label>Nome da pessoa<input name="personName" required minLength={2} maxLength={160} /></label>
      <label>Empresa declarada<input name="organizationName" required minLength={2} maxLength={200} /></label>
      <label>E-mail, se houver<input name="personEmail" type="email" maxLength={200} /></label>
      <label>Telefone, se houver<input name="personPhone" type="tel" maxLength={40} /></label>
      <label>Origem<select name="channel" defaultValue="instagram">
        <option value="lp">LP</option><option value="instagram">Instagram</option>
        <option value="whatsapp">WhatsApp</option><option value="referral">Indicação</option>
        <option value="meet">Meet</option><option value="phone">Ligação</option>
        <option value="email">E-mail</option><option value="other">Outra</option>
      </select></label>
      <label>Estado da evidência<select name="evidenceKind" defaultValue="human_report">
        <option value="source_fact">Fato da fonte</option>
        <option value="human_report">Relato humano</option>
        <option value="inference">Inferência para revisão</option>
      </select></label>
      <label>Data da entrada<input name="occurredAt" type="datetime-local" required /></label>
      <label>Instagram<select name="instagramDiagnostic" defaultValue="not_assessed">
        <option value="not_assessed">Ainda não avaliado</option>
        <option value="guidance_needed">Precisa de orientação — não veta compra</option>
        <option value="adequate">Estrutura adequada</option>
      </select></label>
    </div>
    <label>O que a fonte ou o relato sustenta<textarea name="summary" required minLength={2} maxLength={2000} rows={3} /></label>
    <label>Próximo passo<textarea name="nextStep" maxLength={500} rows={2} placeholder="Se ficar vazio, a ausência aparece como dado faltante." /></label>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    {estado.ok && <p className="form-notice">{estado.ok}</p>}
    <button className="cta" type="submit" disabled={pendente}>
      {pendente ? "Registrando…" : "Registrar interessado"}
    </button>
  </form>;
}

export function FormInteracao({ oportunidades }: {
  oportunidades: Array<{ id: string; empresa: string }>;
}) {
  const [estado, acao, pendente] = useActionState(registrarInteracaoAction, inicial);
  return <form action={acao} className="revops-formulario">
    <div className="revops-form-head">
      <h2>Nova interação</h2>
      <p>A referência da fonte é a chave de idempotência. Repeti-la não cria outro evento.</p>
    </div>
    <div className="revops-campos-duplos">
      <label>Oportunidade<select name="opportunityId" required defaultValue="">
        <option value="" disabled>Escolha uma empresa</option>
        {oportunidades.map((oportunidade) => <option key={oportunidade.id} value={oportunidade.id}>
          {oportunidade.empresa}
        </option>)}
      </select></label>
      <label>Tipo de evento<select name="interactionType" defaultValue="message">
        <option value="message">Interação</option><option value="meeting_scheduled">Reunião agendada</option>
        <option value="meeting_held">Reunião realizada</option><option value="proposal_sent">Proposta enviada</option>
        <option value="proposal_liked">Gostou da proposta</option><option value="purchase_reported">Compra relatada</option>
        <option value="diagnosis">Diagnóstico</option><option value="guidance">Orientação</option><option value="other">Outro</option>
      </select></label>
      <label>Sistema da fonte<select name="sourceSystem" defaultValue="manual">
        <option value="manual">Registro manual</option><option value="lp">LP</option>
        <option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option>
        <option value="meet">Meet</option><option value="referral">Indicação</option>
        <option value="commercial_order">Pedido</option><option value="webapp">WebApp</option><option value="other">Outro</option>
      </select></label>
      <label>Referência única da fonte<input name="sourceExternalId" required maxLength={300} placeholder="Ex.: ID da reunião ou referência interna" /></label>
      <label>Canal<select name="channel" defaultValue="whatsapp">
        <option value="lp">LP</option><option value="instagram">Instagram</option>
        <option value="whatsapp">WhatsApp</option><option value="referral">Indicação</option>
        <option value="meet">Meet</option><option value="phone">Ligação</option>
        <option value="email">E-mail</option><option value="webapp">WebApp</option><option value="other">Outro</option>
      </select></label>
      <label>Estado da evidência<select name="evidenceKind" defaultValue="source_fact">
        <option value="source_fact">Fato da fonte</option>
        <option value="human_report">Relato humano</option>
        <option value="inference">Inferência para revisão</option>
      </select></label>
      <label>Data do evento<input name="occurredAt" type="datetime-local" required /></label>
      <label>Transcrição<select name="transcriptStatus" defaultValue="not_applicable">
        <option value="not_applicable">Não se aplica</option>
        <option value="pending">Transcrição pendente</option>
        <option value="available">Disponível</option>
        <option value="unavailable">Indisponível</option>
      </select></label>
    </div>
    <label>Autor na fonte, se conhecido<input name="sourceAuthor" maxLength={200} /></label>
    <label>Resumo fiel ao estado da evidência<textarea name="summary" required minLength={2} maxLength={2000} rows={3} /></label>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    {estado.ok && <p className="form-notice">{estado.ok}</p>}
    <button className="cta" type="submit" disabled={pendente || oportunidades.length === 0}>
      {pendente ? "Registrando…" : "Registrar interação"}
    </button>
  </form>;
}
