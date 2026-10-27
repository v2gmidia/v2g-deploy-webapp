/** Somente fixtures. UUIDs, aprovações, pontuação e valores não representam QA ou preços. */
import {createHash} from 'node:crypto';
export const BIZ='33333333-3333-4333-8333-333333333333',REQ='55555555-5555-4555-8555-555555555555',PERFIL='11111111-1111-4111-8111-111111111111';
export const IDS=['66666666-6666-4666-8666-666666666666','77777777-7777-4777-8777-777777777777','88888888-8888-4888-8888-888888888888','99999999-9999-4999-8999-999999999999'];
export function fixtureContextoV2({hashRegistroContexto:hash,hashDoPedido}) {
  const sha=s=>createHash('sha256').update(s).digest('hex');
  const observado='2026-10-26T14:00:00Z';
  const aprovar=(id,manifest)=>({id,business_id:BIZ,authorized_by:PERFIL,approved_by:PERFIL,approved_at:'2026-10-26T14:02:00.123Z',
    expires_at:'2026-10-28T00:00:00+00:00',revoked_at:null,created_at:'2026-10-26T14:02:00.123Z',version:1,manifest,manifest_sha256:hash(manifest)});
  const payload={versao:2,objetivo:'OBJETIVO FICTICIO',oferta:'OFERTA FICTICIA',acao:'WHATSAPP FICTICIO',promocao:false,validade:null,referenciaId:'700155112131034'};
  const pedido={id:REQ,business_id:BIZ,requested_by:PERFIL,content_hash:hashDoPedido(payload),payload,status:'awaiting_configuration',created_at:observado};
  const onboardingMarca={aparenciaNaoSei:false,coresConfirmadas:['#123ABC']};
  const origem={versao:1,origem:'upload_cliente',sha256:'1'.repeat(64),registradoEm:observado,finalidadeDoUpload:'identidade_visual'};
  const logo={id:IDS[0],business_id:BIZ,caminho:`identidade/${BIZ}/logo-FICTICIO.png`,sha256:origem.sha256,uso:'logo',autorizacao_id:IDS[1],
    revisado_por:PERFIL,permitido:true,fonte:`arquivo_proprio:${IDS[0]}`,observado_em:observado,condicao_de_uso:'FICTICIO: imagem propria do teste, sem cliente'};
  const logoVigente={id:logo.id,business_id:BIZ,storage_path:logo.caminho,uso:'logo',arquivado_em:null,copy:{origemMaterial:origem}};
  const doc={versao:'FIXTURE-v1',conteudo:'REGRA FICTICIA: nunca inventar fachada.',revisado_por:PERFIL,revisado_em:observado,business_id:null,nicho_id:null};
  const marca=aprovar(IDS[1],{versao:1,request_id:REQ,cores_confirmadas:onboardingMarca.coresConfirmadas,
    onboarding_marca_sha256:hash(onboardingMarca),proveniencia_upload_sha256:hash(origem),logo,ia_autorizada:true,
    uso_autorizado:'geracao_original_do_cliente',destino_autorizado:'gpt-image-2'});
  const manifestCatalogo={id_publico:payload.referenciaId,origem:'meta_ads_library',url:`https://www.facebook.com/ads/library/?id=${payload.referenciaId}`,
    anunciante:'FICTICIO TESTE',data_observada:'2026-10-26',observado_em:observado,inicio_exibido:null,situacao_exibida:'ativo',midia_observada:'imagem',
    fonte_coleta:'biblioteca_meta_interface',coleta_sha256:'a'.repeat(64),jev_sha256:'b'.repeat(64),
    nicho_id:'barbearia',catalogo_versao:'FIXTURE',classificacao_jev:'servico_barbearia',confianca_jev:'0.80',jev_versao:'FIXTURE-NAO-CHAMADO',
    direcao_visual_abstrata:'FIXTURE: composicao original com titulo legivel e area livre para o logo.'};
  const catalogo={public_reference_id:payload.referenciaId,version:1,manifest:manifestCatalogo,manifest_sha256:hash(manifestCatalogo),
    human_state:'reviewed',reviewed_by:PERFIL,reviewed_at:'2026-10-26T14:01:00Z',valid_until:'2026-10-28T00:00:00Z',revoked_at:null,created_at:observado};
  const referencia={...aprovar(IDS[2],{condicao_de_uso:'FIXTURE: somente inspiracao abstrata sem reproducao.',uso:'inspiracao_abstrata_sem_reproducao',permite_copiar:false}),
    public_reference_id:payload.referenciaId,catalog_version:1,catalog_sha256:catalogo.manifest_sha256};
  const contexto={...aprovar(IDS[3],{versao:2,nicho_id:'barbearia',central:doc,nicho:{...doc,nicho_id:'barbearia'},
    central_sha256:sha(doc.conteudo),nicho_sha256:sha(doc.conteudo),destino_autorizado:'gpt-image-2',politica_versao:'FIXTURE-v2',
    autorizacao_custo_id:IDS[0],custo_autorizado:true,quantidade_imagens:1,estimativa_usd:'0.01',reserva_usd:'0.02',limite_usd:'0.03'}),
    request_id:REQ,requested_by:PERFIL,brand_approval_id:marca.id,reference_approval_id:referencia.id};
  return {pedido,profileId:PERFIL,agora:'2026-10-26T15:00:00Z',onboardingMarca,logoVigente,contexto,marca,referencia,catalogo,versaoCatalogoVigente:1};
}
