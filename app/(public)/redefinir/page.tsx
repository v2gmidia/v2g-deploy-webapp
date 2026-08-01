import { ProofCard } from "@/components/ui/ProofCard";
import { createClient } from "@/lib/supabase/server";
import { RedefinirForm } from "./Form";

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
    <div className="auth-grid">
      <div className="auth-card">
        {linkInvalido ? (
          <>
            <h1 className="auth-h">Este link não é mais válido.</h1>
            <p className="auth-sub">
              Ele pode ter expirado ou já ter sido usado. Peça um novo link de recuperação.
            </p>
            <div className="auth-foot">
              <a href="/recuperar">&larr; Pedir novo link</a>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-h">Defina sua nova senha.</h1>
            <p className="auth-sub">Escolha uma senha forte para proteger sua conta.</p>
            <RedefinirForm />
          </>
        )}
      </div>

      <aside className="auth-aside">
        <ProofCard title="Seus dados protegidos">
          Depois de salvar, sua sessão atual é encerrada e você entra de novo com a senha nova.
        </ProofCard>
      </aside>
    </div>
  );
}
