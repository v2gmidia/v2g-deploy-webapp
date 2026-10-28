"use client";

import { TelaEntrada } from "@/app/(public)/entrar/TelaEntrada";
import type { AuthActionState } from "@/app/(public)/entrar/actions";

export function Acesso({ modo }: { modo: "cadastro" | "login" }) {
  const simular = async (): Promise<AuthActionState> => ({ error: "Prévia local: nenhum acesso ou cadastro foi enviado. Os campos servem para experimentar a interação." });
  return <div className="auth-shell"><main className="auth-wrap">
    <TelaEntrada mode={modo} caminhoDaEntrada="/exemplo/acesso" signUpAction={simular} signInAction={simular} />
  </main></div>;
}
