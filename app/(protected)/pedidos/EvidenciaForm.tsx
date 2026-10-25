"use client";
import { useActionState } from "react";
import { registrarEvidenciaManualAction, revisarEvidenciaManualAction, type EstadoEvidencia } from "./evidencias-actions";
import styles from "./evidencia.module.css";

const inicial: EstadoEvidencia={};
function Feedback({estado}:{estado:EstadoEvidencia}) {
  return <>{estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}</>;
}
/** Operate: extensao da ficha Pedidos, identidade editorial preservada.
 * Campos em duas colunas no desktop e uma no celular; conferir nunca concede acesso. */
export function EvidenciaForm({businessId,referencia,hoje}:{businessId:string;referencia:string;hoje:string}) {
  const [estado,acao,pendente]=useActionState(registrarEvidenciaManualAction,inicial);
  return <form action={acao}>
    <input type="hidden" name="id" value={referencia}/><input type="hidden" name="businessId" value={businessId}/>
    <div className={styles.campos}>
      <div className="field"><label htmlFor="evidencia-email">E-mail indicado para o cliente</label><input id="evidencia-email" name="email" type="email" required maxLength={254}/></div>
      <div className="field"><label htmlFor="evidencia-cnpj">CNPJ da contratação</label><input id="evidencia-cnpj" name="cnpj" inputMode="numeric" required maxLength={18}/></div>
      <div className="field"><label htmlFor="evidencia-order">ID do pedido existente, se houver</label><input id="evidencia-order" name="orderId" maxLength={36}/></div>
      <div className="field"><label htmlFor="evidencia-profile">ID do perfil existente, se houver</label><input id="evidencia-profile" name="profileId" maxLength={36}/></div>
      <div className="field"><label htmlFor="evidencia-source">Origem da evidência</label><select id="evidencia-source" name="source" required defaultValue="">
        <option value="">Selecione a origem</option><option value="direct_pix">Pix direto</option><option value="historical_contract">Contratação histórica</option></select></div>
      <div className="field"><label htmlFor="evidencia-date">Data da evidência</label><input id="evidencia-date" name="sourceDate" type="date" max={hoje} required/></div>
    </div>
    <div className="field"><label htmlFor="evidencia-reference">Referência para localizar a fonte</label>
      <input id="evidencia-reference" name="reference" required minLength={5} maxLength={300} aria-describedby="evidencia-reference-ajuda"/>
      <p id="evidencia-reference-ajuda" className="note">Use uma identificação estável do registro bancário ou documento em local restrito. Não cole senha, chave, dados de cartão ou link público. Relato e imagem de comprovante não confirmam crédito.</p></div>
    <p className="note">Sem conta do cliente? Deixe o perfil vazio. O e-mail é uma indicação para conferência, não uma identidade autenticada. Não crie outra compra para cadastrar um cliente antigo.</p>
    <Feedback estado={estado}/><button className="cta" type="submit" disabled={pendente}>{pendente ? "Registrando…" : "Registrar evidência pendente"}</button>
  </form>;
}
export function RevisarEvidenciaForm({id,businessId}:{id:string;businessId:string}) {
  const [estado,acao,pendente]=useActionState(revisarEvidenciaManualAction,inicial);
  return <form action={acao}>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="businessId" value={businessId}/>
    <div className="field"><label htmlFor={`decisao-${id}`}>Decisão documental</label><select id={`decisao-${id}`} name="status" required defaultValue="">
      <option value="">Selecione a decisão</option><option value="checked">Conferida pela equipe</option><option value="rejected">Recusada</option></select></div>
    <div className="field"><label htmlFor={`nota-${id}`}>O que foi conferido ou motivo da recusa</label><textarea id={`nota-${id}`} name="note" required minLength={5} maxLength={1000} rows={3}/></div>
    <div className={styles.confirmacoes}>
      <label><input type="checkbox" name="identityChecked" value="yes"/> Conferi pessoa, e-mail, CNPJ e negócio na fonte, sem aproximação de dados.</label>
      <label><input type="checkbox" name="sourceChecked" value="yes"/> Localizei e conferi a evidência. Para Pix, conferi o crédito na conta recebedora e a identificação da transferência, não apenas a imagem.</label>
    </div>
    <p className="note">As duas conferências são obrigatórias para marcar como conferida. Esta decisão não aprova pagamento no pedido, não assina contrato e não concede acesso.</p>
    <Feedback estado={estado}/><button type="submit" disabled={pendente}>{pendente ? "Salvando…" : "Salvar conferência"}</button>
  </form>;
}
