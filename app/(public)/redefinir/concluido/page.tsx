import { EntradaEditorial } from "@/components/ui/EntradaEditorial";

export const metadata = { title: "Senha salva — V2G", robots: { index: false, follow: false } };

/** Confirmação informativa, sem conceder acesso ou depender da sessão encerrada. */
export default async function RedefinicaoConcluida({ searchParams }: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  return <EntradaEditorial>
    <h1>Sua nova senha foi salva.</h1>
    <p className="entrada-introducao">Entre novamente com a nova senha para continuar.</p>
    {aviso === "sessao" && <p className="form-warning" role="status">
      Não foi possível confirmar o encerramento da sessão. Entre novamente com a nova senha.
    </p>}
    <a className="cta" href="/entrar?modo=login&adicionar=1">Entrar com a nova senha</a>
  </EntradaEditorial>;
}
