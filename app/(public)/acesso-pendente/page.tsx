import { signOutAction } from "@/app/(protected)/actions";
import { createClient } from "@/lib/supabase/server";
import { vincularComprasAprovadas } from "@/lib/contratacao/vincular";
import { temAcessoWebApp } from "@/lib/contratacao/acesso";
import { redirect } from "next/navigation";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";

export const dynamic = "force-dynamic";

export default async function AcessoPendentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email_confirmed_at) {
    // A aprovação pode acontecer enquanto o comprador mantém a sessão aberta.
    // A mesma vinculação segura do login também roda aqui ao atualizar a tela.
    await vincularComprasAprovadas(user);
    if (await temAcessoWebApp(supabase, user)) redirect("/inicio");
  }
  return (
    <EntradaEditorial>
      <h1>Seu acesso ainda não foi liberado.</h1>
      <p className="entrada-introducao">
        O WebApp abre depois que a V2G aprova o pagamento. Se você já enviou
        o comprovante, aguarde a confirmação da equipe. Não é necessário
        criar outra conta nem pagar novamente.
      </p>
      <p className="entrada-nota">
        Após a liberação, entre com o mesmo e-mail usado na compra. O contrato
        e a reunião serão próximos passos dentro da sua jornada.
      </p>
      <a className="cta" href="/acesso-pendente">Conferir se meu acesso foi liberado</a>
      <form action={signOutAction}>
        <button className="link-btn" type="submit">Sair desta conta</button>
      </form>
    </EntradaEditorial>
  );
}
