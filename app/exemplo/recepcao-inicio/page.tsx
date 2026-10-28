import { notFound } from "next/navigation";

export const metadata = { title: "Recepção após cadastro — prévia local", robots: { index: false, follow: false } };

export default async function PreviaRecepcaoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_recepcao-inicio/Previa") : null;
  if (!modulo) notFound();
  const params = await searchParams;
  return <modulo.PreviaRecepcao caso={typeof params.caso === "string" ? params.caso : "pendente"} />;
}
