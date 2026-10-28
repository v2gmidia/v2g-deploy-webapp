import { notFound } from "next/navigation";

export const metadata = { title: "Acesso — prévia local V2G", robots: { index: false, follow: false } };

export default async function AcessoDeExemplo({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_interacoes/Acesso") : null;
  if (!modulo) notFound();
  const parametros = await searchParams;
  return <modulo.Acesso modo={parametros.modo === "cadastro" ? "cadastro" : "login"} />;
}
