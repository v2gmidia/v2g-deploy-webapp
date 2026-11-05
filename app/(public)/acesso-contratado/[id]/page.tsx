import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { acessoContratadoAtivo, ID_ACESSO_CONTRATADO } from "@/lib/contratacao/acesso-contratado";
import { FormularioAcessoContratado } from "./Formulario";
import { createAdminClient } from "@/lib/supabase/admin";
import { resumoAcessoContratado } from "@/lib/contratacao/cadastro-contratado";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";
export const dynamic = "force-dynamic";
export const metadata = {title:"Acesso ao seu negócio — V2G",robots:{index:false,follow:false},referrer:"no-referrer" as const};
export default async function AcessoContratadoPage({params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  if (!acessoContratadoAtivo() || !ID_ACESSO_CONTRATADO.test(id)) notFound();
  const s = await createClient();
  const {data:{user}} = await s.auth.getUser();
  const next = encodeURIComponent(`/acesso-contratado/${id}`);
  let resumo = null;
  if (user?.email_confirmed_at) {
    try { resumo = await resumoAcessoContratado(createAdminClient(),id,user); } catch { /* fail closed */ }
  }
  return <EntradaEditorial>
    <h1>Acesso ao seu negócio.</h1>
    <p>Recebeu uma liberação da equipe? Use o e-mail indicado por ela para conferir seu acesso.</p>
    {user?.email_confirmed_at ? <>
      <p>Você está conectado como {user.email}.</p>
      {resumo ? <>
        <h2>{resumo.nome}</h2>
        <p>{identificarDocumentoContratante(resumo.documento)} · Código do negócio: {resumo.businessId.slice(0,8)}</p>
        <p>Confira se este é o negócio indicado pela equipe antes de aceitar.</p>
        <FormularioAcessoContratado id={id}/>
      </> : <p className="form-warning" role="status">Não conseguimos confirmar a liberação para esta conta. Confira o e-mail usado ou fale com a equipe.</p>}
    </> : <>
      {user && <p className="form-warning">Confirme seu e-mail pelo link recebido antes de aceitar o acesso.</p>}
      <a className="cta" href={`/entrar?modo=cadastro&adicionar=1&next=${next}`}>Criar meu primeiro acesso</a>
      <a href={`/entrar?modo=login&adicionar=1&next=${next}`}>Já tenho conta</a>
      <p>Após confirmar seu e-mail, volte a este link para aceitar o acesso.</p>
    </>}
  </EntradaEditorial>;
}
