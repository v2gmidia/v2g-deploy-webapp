import { randomUUID } from "node:crypto";
import { carregarGaleriaDoNegocio } from "@/lib/criativos/galeria-da-sessao";
import { createClient } from "@/lib/supabase/server";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { tituloDaAba } from "@/lib/titulos";
import { Analisar } from "./Analisar";
import { AmostraDeVereditos } from "./Amostra";
import { PedirRevisao } from "./PedirRevisao";
import { TelaDeCriativos } from "./TelaDeCriativos";
import { carregarPedidosDaSessao } from "@/lib/criativos/pedidos-da-sessao";
import { PedidoDeImagem } from "./PedidoDeImagem";
import { catalogoBarbeariaDisponivel } from "@/lib/jev/catalogo-da-sessao";
import { carregarContextoDoCriativo } from "@/lib/criativos/contexto-do-negocio-da-sessao";
import { agenciaHabilitada } from "@/lib/agencia/habilitacao";
import { retornoDaCarteira, selecionarVisaoAgencia, type BuscaAgencia } from "@/lib/agencia/contexto";

export const metadata = tituloDaAba("/criativos");

export default async function CriativosPage({ searchParams }: { searchParams: Promise<BuscaAgencia> }) {
  const busca = await searchParams;
  const agencia = agenciaHabilitada()
    ? await (await import("@/lib/agencia/da-sessao")).carregarAgenciaDaSessao() : { status: "desligado" as const };
  const contextoAgencia = agencia.status === "agencia" ? agencia.contexto : null;
  const visao = agencia.status === "desligado" ? "direto" : selecionarVisaoAgencia(contextoAgencia, busca, agencia.status === "agencia");
  if (agencia.status === "indisponivel" || visao === "invalido"
    || contextoAgencia && visao === "cliente" && busca.peca !== undefined && typeof busca.peca !== "string") {
    const { ClienteIndisponivel } = await import("@/components/agencia/Comuns");
    return <ClienteIndisponivel />;
  }
  if (visao === "carteira" && agencia.status === "agencia") {
    const { CriativosAgencia } = await import("@/components/agencia/CriativosAgencia");
    const { abrirClienteAction } = await import("../agencia/actions");
    const clientes = agencia.clientes;
    const habilitada = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true";
    const galerias = await Promise.all(clientes.map(async cliente => ({ cliente,
      galeria: await carregarGaleriaDoNegocio(cliente.businessId, { revisaoHabilitada: habilitada,
        geracaoHabilitada: cliente.businessId === agencia.businessIdAtivo && process.env.V2G_CREATIVE_REQUESTS_ENABLED === "true" && process.env.V2G_CREATIVE_BACKEND_ENABLED === "true",
        contextoAgencia: cliente, retorno: retornoDaCarteira(busca) }) })));
    return <CriativosAgencia key={agencia.agencyBusinessId}
      agencia={agencia.agencia} clientes={clientes} ativoId={agencia.businessIdAtivo} abrirCliente={abrirClienteAction}
      itens={galerias.flatMap(({ cliente, galeria }) => galeria.itens.map(peca => ({ cliente, peca })))}
      falhou={galerias.some(({ galeria: g }) => g.falhaDaGaleria || g.revisaoInconsistente || g.filaTruncada || g.caminhoLegadoInconsistente || g.falhaPublicacoes)}
      retorno={retornoDaCarteira(busca)} envioDisponivel={habilitada} />;
  }
  const estado = await estadoDoCliente(new Date());
  const revisaoHabilitada = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true";
  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !user) return null;
  const negocioId = estado.negocioId;
  if (contextoAgencia && contextoAgencia.businessId !== negocioId) {
    const { ClienteIndisponivel } = await import("@/components/agencia/Comuns");
    return <ClienteIndisponivel />;
  }
  const referenciasDisponiveis = negocioId ? await catalogoBarbeariaDisponivel(negocioId) : false;
  const pedidosHabilitados = process.env.V2G_CREATIVE_REQUESTS_ENABLED === "true" && Boolean(negocioId);
  const geracaoHabilitada = pedidosHabilitados && process.env.V2G_CREATIVE_BACKEND_ENABLED === "true";
  const [contextoCriativo, pedidosCriacao] = await Promise.all([
    negocioId && (revisaoHabilitada || pedidosHabilitados)
      ? carregarContextoDoCriativo(negocioId) : Promise.resolve(null),
    pedidosHabilitados ? carregarPedidosDaSessao(negocioId!)
      : Promise.resolve({ pedidos: [], falhou: false }),
  ]);
  const { itens, hoje, falhaDaGaleria, revisaoInconsistente, filaTruncada, caminhoLegadoInconsistente, falhaPublicacoes } = negocioId
    ? await carregarGaleriaDoNegocio(negocioId, { revisaoHabilitada, geracaoHabilitada,
      contextoAgencia: contextoAgencia ?? undefined, retorno: retornoDaCarteira(busca, true) })
    : { itens: [], hoje: "", falhaDaGaleria: false, revisaoInconsistente: false,
      filaTruncada: false, caminhoLegadoInconsistente: false, falhaPublicacoes: false };

  const amostra = process.env.NODE_ENV !== "production" ? (process.env.V2G_FIXTURE_ANALISE ?? null) : null;
  const podeAnalisar = estado.diaSeguinte.execucao !== null;

  if (contextoAgencia) {
    const { CriativosDoCliente } = await import("@/components/agencia/CriativosDoCliente");
    const contextoDoAnunciante = contextoCriativo ? { ...contextoCriativo, nome: { valor: contextoAgencia.anunciante,
      origem: agencia.status === "agencia" && agencia.origem === "vinculo" ? "agency_advertisers.advertiser_name" : "onboarding.respostas.nome", em: null, estado: "declarado_cliente" as const } } : undefined;
    return <CriativosDoCliente key={`${contextoAgencia.businessId}:${typeof busca.peca === "string" ? busca.peca : ""}`} contexto={contextoAgencia} retorno={retornoDaCarteira(busca, true)} itens={itens}
      falhou={Boolean(falhaDaGaleria || revisaoInconsistente || filaTruncada || caminhoLegadoInconsistente)} pecaSolicitada={typeof busca.peca === "string" ? busca.peca : undefined}
      envio={revisaoHabilitada && negocioId ? <PedirRevisao key={negocioId} businessId={negocioId} hoje={hoje}
        referenciasDisponiveis={referenciasDisponiveis} contexto={contextoDoAnunciante} /> : null}
      criacao={pedidosHabilitados ? <PedidoDeImagem key={negocioId} businessId={negocioId!} requestId={randomUUID()} hoje={hoje}
        pedidos={pedidosCriacao.pedidos} falhou={pedidosCriacao.falhou} geracaoHabilitada={geracaoHabilitada}
        referenciasDisponiveis={referenciasDisponiveis} contexto={contextoDoAnunciante} /> : null}
      analise={amostra ? <AmostraDeVereditos qual={amostra} /> : <Analisar key={negocioId ?? "sem-negocio"} podeEnviar={podeAnalisar} businessId={negocioId ?? ""} />} />;
  }

  return <>
    {negocioId && (revisaoHabilitada || pedidosHabilitados) && !contextoCriativo
      ? <p className="form-warning">Não conseguimos recuperar os dados do cadastro para este preparo. Atualize a página ou preencha os campos necessários; isso não significa que suas respostas foram apagadas.</p> : null}
    {revisaoInconsistente ? <p className="form-warning">Uma peça está com o vínculo do arquivo inconsistente; sua prévia não foi aberta. Peça ajuda à equipe para conferir o envio.</p> : null}
    <TelaDeCriativos
      itens={itens}
      veiculacao={estado.veiculacao}
      bibliotecaFalhou={Boolean(falhaDaGaleria)}
      criacao={pedidosHabilitados ? <PedidoDeImagem key={negocioId} businessId={negocioId!}
        requestId={randomUUID()} hoje={hoje} pedidos={pedidosCriacao.pedidos}
        falhou={pedidosCriacao.falhou} geracaoHabilitada={geracaoHabilitada}
        referenciasDisponiveis={referenciasDisponiveis} contexto={contextoCriativo ?? undefined} /> : null}
      envioDisponivel={revisaoHabilitada && Boolean(negocioId)}
      envio={revisaoHabilitada && negocioId
        ? <PedirRevisao key={negocioId} businessId={negocioId} hoje={hoje}
          referenciasDisponiveis={referenciasDisponiveis} contexto={contextoCriativo ?? undefined} />
        : null}
      analise={amostra
        ? <AmostraDeVereditos qual={amostra} />
        : <Analisar key={negocioId ?? "sem-negocio"} podeEnviar={podeAnalisar} businessId={negocioId ?? ""} />}
    />
  </>;
}
