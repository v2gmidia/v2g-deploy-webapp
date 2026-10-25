import { createAdminClient } from "@/lib/supabase/admin";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";
import { randomUUID } from "node:crypto";
import { carteiraDaEvidencia } from "@/lib/contratacao/evidencia-manual-servidor";
import { hojeDaEvidencia, IMPEDIMENTOS_EVIDENCIA, situacaoEvidencia, UUID_EVIDENCIA, type EvidenciaManual } from "@/lib/contratacao/evidencia-manual";
import { EvidenciaForm, RevisarEvidenciaForm } from "./EvidenciaForm";
import styles from "./evidencia.module.css";

const rotulos={pending:"Pendente de conferência",checked:"Conferida pela equipe; vínculo apenas proposto",rejected:"Recusada",blocked:"Pedido com ocorrência impeditiva; não usar como prova ativa",verification_unavailable:"Conferência atual indisponível; não usar como prova ativa"};
export async function ConferenciasManuais({businessId,operatorId}:{businessId?:string;operatorId:string}) {
  let conteudo=null;
  if (businessId) {
    try {
      if(!UUID_EVIDENCIA.test(businessId)) throw Error("negocio_invalido");
      const admin=createAdminClient();
      if(!await carteiraDaEvidencia(admin,businessId,operatorId)) throw Error("carteira_indisponivel");
      const negocio=await admin.from("businesses").select("id, name").eq("id",businessId).maybeSingle();
      if(negocio.error||!negocio.data||negocio.data.id!==businessId) throw Error("negocio_indisponivel");
      const r=await admin.from("commercial_manual_evidence")
        .select("id, business_id, order_id, proposed_profile_id, claimed_email, claimed_cnpj, source_system, source_reference, source_date, recorded_by, recorded_at, status, reviewed_by, reviewed_at, review_note")
        .eq("business_id",businessId).order("recorded_at",{ascending:false}).limit(51);
      if(r.error||!r.data) throw Error("registro_indisponivel");
      const evidencias=r.data as EvidenciaManual[], ids=[...new Set(evidencias.map(x=>x.order_id).filter((x):x is string=>!!x))];
      const [pedidos,eventos]=ids.length ? await Promise.all([
        admin.from("commercial_orders").select("id, business_id, status, provider_charge_id").eq("business_id",businessId).in("id",ids),
        admin.from("commercial_payment_events").select("order_id, provider_charge_id, event_type").in("order_id",ids).in("event_type",IMPEDIMENTOS_EVIDENCIA).limit(101),
      ]) : [{data:[],error:null},{data:[],error:null}];
      const integra=!pedidos.error&&!eventos.error&&!!pedidos.data&&!!eventos.data&&eventos.data.length<101;
      conteudo=<div className={styles.conteudo}>
        <div><h3>{negocio.data.name || "Negócio selecionado"}</h3><p className="note">Negócio: {businessId}. A conferência vale apenas para este negócio.</p></div>
        <EvidenciaForm businessId={businessId} referencia={randomUUID()} hoje={hojeDaEvidencia()}/>
        <div><h3>Evidências registradas</h3>
          {evidencias.length===0 && <p>Nenhuma evidência registrada para este negócio.</p>}
          {evidencias.length>50 && <p className="form-warning">Exibindo as 50 mais recentes. Esta lista não é uma conciliação completa.</p>}
          {evidencias.slice(0,50).map(e=>{
            const situacao=situacaoEvidencia(e,(pedidos.data??[]).find(x=>x.id===e.order_id)??null,eventos.data??[],integra);
            return <section key={e.id} className={styles.registro}>
              <h3>{e.source_system==="direct_pix" ? "Pix direto" : "Contratação histórica"} · {e.source_date}</h3>
              <p><strong>{rotulos[situacao]}</strong></p><p>{e.claimed_email} · {identificarDocumentoContratante(e.claimed_cnpj)}</p>
              <p>Referência: {e.source_reference}</p><p className="note">Pedido: {e.order_id||"sem pedido associado"}. Perfil proposto: {e.proposed_profile_id||"ainda não indicado"}.</p>
              <p className="note">Registro {e.id}, em {e.recorded_at}, por {e.recorded_by}.</p>
              {e.review_note && <p>Conferência: {e.review_note} · {e.reviewed_at} · responsável {e.reviewed_by}.</p>}
              {e.status==="pending" && <RevisarEvidenciaForm id={e.id} businessId={businessId}/>}
            </section>;
          })}</div>
      </div>;
    } catch {
      conteudo=<p className="form-warning" role="status">Não foi possível abrir a conferência deste negócio. Confira o ID, sua atribuição como responsável e a disponibilidade do registro. Nenhum acesso foi alterado.</p>;
    }
  }
  return <details className={styles.secao} open={!!businessId}>
    <summary>Conferir contratação de cliente atual</summary>
    <p>Registre uma evidência existente, sem cobrar novamente. Pendente, conferida e recusada são estados documentais: nenhum deles cria conta, muda titularidade ou concede acesso.</p>
    <form method="get" action="/pedidos"><div className="field"><label htmlFor="evidencia-business">ID exato do negócio da sua carteira</label>
      <input id="evidencia-business" name="negocio" required maxLength={36} defaultValue={businessId??""}/></div>
      <button type="submit">Abrir conferência do negócio</button></form>
    {conteudo}
  </details>;
}
