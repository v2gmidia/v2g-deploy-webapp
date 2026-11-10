"use client";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CarteiraAgencia } from "@/components/agencia/CarteiraAgencia";
import { CriativosAgencia } from "@/components/agencia/CriativosAgencia";
import { CriativosDoCliente } from "@/components/agencia/CriativosDoCliente";
import { ResumoMetaDoInicio } from "@/app/(protected)/inicio/ResumoMetaDoInicio";
import { retornoDaCarteira, type BuscaAgencia, type ContextoAgencia } from "@/lib/agencia/contexto";
import { resumirCarteira } from "@/lib/agencia/resumo";
import { intervaloDoInicio } from "@/lib/inicio/periodo";
import { diasDoPeriodo } from "@/lib/inicio/serie-meta";
import type { CampanhaMeta, ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import type { ItemDaGaleria } from "@/app/(protected)/criativos/GaleriaCriativos";

// V2G_AGENCIA_ENSAIO_LOCAL_0911 — importação dinâmica dev-only, sem dados reais.
const businessId = "11111111-1111-4111-8111-111111111111";
const contexto: ContextoAgencia = { businessId, agencia: "Agência de ensaio", anunciante: "Anunciante de ensaio",
  ramo: "Bebidas · dado fictício", praca: "Região de ensaio", verbaMensal: 3000, gestor: "Gestor de ensaio" };
const resumo = resumirCarteira(businessId, [{ id: "22222222-2222-4222-8222-222222222222", business_id: businessId, sha256: "a".repeat(64), status: "approved_for_manual_publish" }], []);
const itens: ItemDaGaleria[] = [{ id: "revisao-22222222-2222-4222-8222-222222222222", nome: "Peça de ensaio local", imagemUrl: "/exemplo/agencia/arte",
  grupo: "biblioteca", estado: "Peça aprovada pelo gestor", tom: "positivo", criadoEm: "Enviado em 09/11/2026", detalhe: "Receber mensagens no WhatsApp · exemplo fictício",
  publicacao: "Ainda sem confirmação de publicação.", revisao: { status: "approved_for_manual_publish", revisadoEm: "2026-11-09T17:00:00Z", publicacaoConfirmada: false, falhaPublicacao: false }, associacoes: [] }];

export function NavegacaoDoEnsaio({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  function navegar(event: MouseEvent<HTMLDivElement>) {
    const a = (event.target as HTMLElement).closest("a");
    if (!a) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === "/exemplo/agencia") return;
    const area = url.pathname.replace(/^\/exemplo/, "");
    event.preventDefault();
    if (area !== "/inicio" && area !== "/criativos") { setAviso("Esta ação não é executada pela bancada. Nenhum dado foi enviado."); return; }
    const visao = `${url.searchParams.has("cliente") ? "cliente" : "agencia"}-${area.slice(1)}`;
    url.searchParams.set("visao", visao);
    if (new URLSearchParams(window.location.search).get("carteira") === "dupla") url.searchParams.set("carteira", "dupla");
    router.push(`/exemplo/agencia?${url.searchParams}${url.hash}`);
  }
  return <div onClickCapture={navegar}>{aviso && <p className="form-warning" role="status">{aviso}</p>}{children}</div>;
}
export function TelasDoEnsaio({ busca }: { busca: BuscaAgencia }) {
  const router = useRouter();
  const [cenario, setCenario] = useState("medido");
  const [volume, setVolume] = useState(false);
  const dupla = busca.carteira === "dupla";
  const primeiro = dupla ? { ...contexto, agencyBusinessId: businessId, agencia: "Piligrin · ensaio local", anunciante: "Dúú · dados fictícios" } : contexto;
  const segundo: ContextoAgencia = { businessId: "77777777-7777-4777-8777-777777777777", agencyBusinessId: businessId,
    agencia: primeiro.agencia, anunciante: "FamFire · cadastro de ensaio", ramo: null, praca: null, verbaMensal: null, gestor: null };
  const contextoAtual = dupla && busca.cliente === segundo.businessId ? segundo : primeiro;
  const resumoAtual = contextoAtual === segundo ? resumirCarteira(segundo.businessId, [], []) : resumo;
  const itensAtuais = contextoAtual === segundo ? [] : itens;
  async function abrirEnsaio(_anterior: { erro?: string }, dados: FormData) {
    const id = dados.get("cliente"), area = dados.get("area");
    if (![primeiro.businessId, segundo.businessId].includes(String(id)) || (area !== "/inicio" && area !== "/criativos")) return { erro: "Cliente fora deste ensaio." };
    const parametros = new URLSearchParams({ carteira: "dupla", cliente: String(id), visao: `cliente-${area.slice(1)}` });
    for (const chave of ["busca_carteira", "pagina_carteira", "etapa_carteira", "filtro_cliente_carteira", "pendentes_carteira", "peca"])
      if (typeof dados.get(chave) === "string") parametros.set(chave, String(dados.get(chave)));
    router.push(`/exemplo/agencia?${parametros}`);
    return {};
  }
  const intervalo = intervaloDoInicio(busca, "2026-11-09");
  const dias = diasDoPeriodo(intervalo.desde, intervalo.ate).map((dia, i) => ({ dia, gasto: [4514,2937,0,6687,2876,2918,2592][i % 7]!, impressoes: 1000 + i * 100, cliques: 20 + i }));
  if (cenario === "lacunas" && dias[2]) dias[2] = { ...dias[2], gasto: null as unknown as number };
  const gasto = dias.some(d => d.gasto === null) ? null : dias.reduce((t,d) => t+d.gasto,0);
  const campanha: CampanhaMeta = { id: "10001", nome: "Campanha de ensaio", statusConfigurado: "ACTIVE", statusEfetivo: "ACTIVE", conjuntos: [],
    metricas: { estado: cenario === "lacunas" ? "parcial" : "observado", gasto, impressoes: dias.reduce((t,d)=>t+d.impressoes,0), cliques: dias.reduce((t,d)=>t+d.cliques,0), conversas: null,
      dias: dias.map(d=>d.dia), entregaObservada: true, serieDiaria: { estado: "disponivel", dias } } };
  const resultado: ResultadoInventarioMeta = cenario === "falha" ? { ok: false, motivo: "indisponivel", mensagem: "Falha fictícia da consulta. Tente novamente.", contas: [{ id: "act_10001" }], contaSelecionada: "act_10001" }
    : { ok: true, contas: [{ id: "act_10001" }], contaSelecionada: "act_10001", dados: { businessId, contaId: "act_10001", periodo: intervalo, moeda: "BRL", fuso: "America/Sao_Paulo", coletadoEm: "2026-11-09T20:00:00Z", campanhas: [campanha] } };
  const retorno = retornoDaCarteira(busca, typeof busca.visao === "string" && busca.visao.startsWith("cliente-"));
  const clientes = [{ contexto: primeiro, resumo }, ...(volume ? Array.from({ length: 49 }, (_, i) => ({ contexto: { ...contexto, businessId: `${String(i+10).padStart(8,"0")}-1111-4111-8111-111111111111`, anunciante: `Cliente fictício ${i+2}` }, resumo }))
    : dupla ? [{ contexto: segundo, resumo: resumirCarteira(segundo.businessId, [], []) }] : [])];
  const resultadoAtual: ResultadoInventarioMeta = contextoAtual === segundo ? { ok: false, motivo: "sem_conta", mensagem: "Este anunciante de ensaio ainda não tem conta de anúncios vinculada. Nenhum número do Dúú é mostrado aqui.", contas: [], contaSelecionada: null } : resultado;
  return <><div style={{ margin: "20px 0", display: "flex", flexWrap: "wrap", gap: "20px" }}>
    <label>Cenário <select value={cenario} onChange={e=>setCenario(e.target.value)}><option value="medido">Medição fictícia</option><option value="falha">Falha após leitura</option><option value="lacunas">Lacuna e zero</option></select></label>
    {busca.visao === "agencia-inicio" || !busca.visao ? <label><input type="checkbox" checked={volume} onChange={e=>setVolume(e.target.checked)} /> Simular 50 clientes fictícios</label> : null}
  </div>
    {busca.visao === "cliente-inicio" ? <ResumoMetaDoInicio resultado={resultadoAtual} escopo={{ businessId: contextoAtual.businessId, perfilId: "perfil-ficticio", ...intervalo }} intervalo={intervalo}
      pendencia={null} falhaPendencia={false} faixa={null} complemento={null} detalheAgencia={{ contexto: contextoAtual, resumo: resumoAtual, retorno }} />
      : busca.visao === "cliente-criativos" ? <CriativosDoCliente contexto={contextoAtual} retorno={retorno} itens={itensAtuais} falhou={cenario === "falha"}
        pecaSolicitada={typeof busca.peca === "string" ? busca.peca : undefined} envio={<p>Envio desabilitado no ensaio. Nenhuma peça será salva.</p>} criacao={null} analise={null} />
      : busca.visao === "agencia-criativos" ? <CriativosAgencia agencia={primeiro.agencia} clientes={dupla ? [primeiro, segundo] : [primeiro]} itens={itens.map(peca=>({ cliente: primeiro, peca }))} falhou={cenario === "falha"} retorno={retorno} envioDisponivel
        ativoId={contextoAtual.businessId} abrirCliente={dupla ? abrirEnsaio : undefined} />
      : <CarteiraAgencia key={volume ? "50" : dupla ? "2" : "1"} agencia={primeiro.agencia} clientes={clientes} retorno={retorno}
        ativoId={contextoAtual.businessId} abrirCliente={dupla ? abrirEnsaio : undefined} />}
  </>;
}
