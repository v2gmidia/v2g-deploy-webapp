import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { createClient } from "@/lib/supabase/server";
import { RedefinirForm } from "./Form";
import { tituloDaAba } from "@/lib/titulos";

export const metadata = tituloDaAba("/redefinir");

interface RedefinirPageProps {
  searchParams: Promise<{ erro?: string }>;
}

/**
 * `/auth/confirmar` já validou o token e criou a sessão antes de chegar
 * aqui — se não há usuário (ou o link veio marcado como inválido), é
 * porque o token expirou ou já foi usado.
 */
export default async function RedefinirPage({ searchParams }: RedefinirPageProps) {
  const { erro } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const linkInvalido = erro === "invalido" || !user;

  return (
    <EntradaEditorial>
        {linkInvalido ? (
          <>
            <h1>Este link não é mais válido.</h1>
            <p className="entrada-introducao">
              Ele pode ter expirado ou já ter sido usado. Peça um novo link de recuperação.
            </p>
            <a className="cta" href="/recuperar">Pedir novo link</a>
          </>
        ) : (
          <>
            <h1>Defina sua nova senha.</h1>
            <p className="entrada-introducao">Escolha uma senha forte para proteger sua conta.</p>
            <RedefinirForm />
            <p className="entrada-ajuda">Depois de salvar, sua sessão atual é encerrada e você entra de novo com a senha nova.</p>
          </>
        )}
        <a className="entrada-voltar" href="/entrar?modo=login">Voltar para o login</a>
    </EntradaEditorial>
  );
}
