import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acessoContratadoAtivo } from "@/lib/contratacao/acesso-contratado";
import { FormularioConcessao } from "./Formulario";
import styles from "./acesso.module.css";
export const dynamic = "force-dynamic";
export default async function ConcessaoPage() {
  const s = await createClient();
  const {data:{user},error} = await s.auth.getUser();
  if (error || user?.app_metadata?.papel !== "operador" || !acessoContratadoAtivo()) notFound();
  return <section className={styles.section}>
    <h1>Acesso por contratação existente</h1>
    <p>Use uma evidência de contratação histórica conferida, sem pedido associado, para um negócio da sua carteira. O link permite primeiro cadastro por sete dias. O cliente confirma o próprio e-mail e aceita o vínculo.</p>
    <p>Não gera cobrança nem substitui assinatura, nota fiscal ou verificação de ativos Meta.</p>
    <FormularioConcessao/>
    <a href="/pedidos">Voltar às contratações</a>
  </section>;
}
