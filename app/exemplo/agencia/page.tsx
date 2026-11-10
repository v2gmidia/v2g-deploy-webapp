import { notFound } from "next/navigation";
import { Casco } from "@/components/ui/Casco";
import type { BuscaAgencia } from "@/lib/agencia/contexto";

export default async function AgenciaDeExemplo({ searchParams }: { searchParams: Promise<BuscaAgencia> }) {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_agencia/Bancada") : null;
  if (!modulo) notFound();
  const busca = await searchParams;
  const cliente = typeof busca.visao === "string" && busca.visao.startsWith("cliente-");
  const criativos = typeof busca.visao === "string" && busca.visao.endsWith("criativos");
  return <modulo.NavegacaoDoEnsaio><Casco nome="Pessoa fictícia" nomeNegocio="Agência de ensaio" rotuloDaConta="Agência de ensaio" inicial="A"
    rotaAtiva={criativos ? "/criativos" : "/inicio"}>
    <div className="form-warning"><strong>Bancada local · dados fictícios · sem gravação</strong>
      <p>Esta tela testa os componentes reais. Não é uma sessão do cliente nem uma leitura publicada na QA.</p>
      <nav aria-label="Telas do ensaio" style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        <a href="/exemplo/agencia?visao=agencia-inicio">Agência · Início</a><a href="/exemplo/agencia?visao=agencia-criativos">Agência · Criativos</a>
        <a href="/exemplo/agencia?visao=cliente-inicio">Cliente · Início</a><a href="/exemplo/agencia?visao=cliente-criativos">Cliente · Criativos</a>
      </nav>
    </div><modulo.TelasDoEnsaio key={`${cliente}:${criativos}`} busca={busca} />
  </Casco></modulo.NavegacaoDoEnsaio>;
}
