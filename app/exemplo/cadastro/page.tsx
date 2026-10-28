import { notFound } from "next/navigation";
import { MENSAGEM_CADASTRO_NEUTRA } from "@/lib/auth-errors";

export const metadata = { title: "Cadastro — prévia local V2G", robots: { index: false, follow: false } };

export default async function PreviaCadastroPage() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_cadastro/Previa") : null;
  if (!modulo) notFound();
  return <modulo.PreviaCadastro mensagem={MENSAGEM_CADASTRO_NEUTRA} />;
}
