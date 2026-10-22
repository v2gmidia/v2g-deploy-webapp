"use client";

import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { RedefinirForm } from "@/app/(public)/redefinir/Form";

/** Bancada visual: o submit é interceptado, sem alterar conta ou senha. */
export function PreviaRedefinir() {
  return <EntradaEditorial>
    <h1>Defina sua nova senha.</h1>
    <p className="entrada-introducao">Prévia local. Use somente texto fictício; nenhum envio altera sua conta.</p>
    <div onSubmitCapture={evento => evento.preventDefault()}><RedefinirForm /></div>
  </EntradaEditorial>;
}
