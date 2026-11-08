"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CarregandoAcesso } from "./CarregandoAcesso";
import { TelaEntrada } from "./TelaEntrada";
import { signInAction, signUpAction } from "./actions";

export default function EntrarPage() {
  return (
    <Suspense fallback={<CarregandoAcesso />}>
      <EntrarContent />
    </Suspense>
  );
}

function EntrarContent() {
  const searchParams = useSearchParams();
  return <TelaEntrada
    mode={searchParams.get("modo") === "cadastro" ? "cadastro" : "login"}
    next={searchParams.get("next") ?? ""}
    adicionar={searchParams.get("adicionar") === "1"}
    signUpAction={signUpAction}
    signInAction={signInAction}
  />;
}
