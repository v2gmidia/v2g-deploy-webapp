import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mesa do gestor · Demonstração — V2G" };

/** Prévia visual isolada: nenhum dado real, nenhuma consulta administrativa. */
export default async function PreviaMesaDoGestor({ searchParams }: {
  searchParams: Promise<{ leitura?: string; cenario?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const parametros = await searchParams;
  if (parametros.leitura === "contrato") {
    const [{ MesaShell }, { PreviaLeitura }] = await Promise.all([
      import("@/app/(supergestor)/MesaShell"), import("./PreviaLeitura"),
    ]);
    return <MesaShell nome="Demonstração" previa><PreviaLeitura cenario={parametros.cenario} /></MesaShell>;
  }
  const [{ MesaShell }, { MesaDoGestor }, dados] = await Promise.all([
    import("@/app/(supergestor)/MesaShell"),
    import("@/components/gestor/mesa/MesaDoGestor"),
    import("./dados-demonstracao"),
  ]);
  return <MesaShell nome="Demonstração" previa>
    <p><a href="?leitura=contrato">Conferir prévia da leitura de números</a></p>
    <MesaDoGestor contas={dados.CONTAS_DEMONSTRACAO} referencia={dados.REFERENCIA_MESA} demonstracao />
  </MesaShell>;
}
