import { PainelDeAnuncios, type AnuncioDaLista } from "@/app/(protected)/anuncios/PainelDeAnuncios";
import { SeletorDePeriodo } from "@/app/(protected)/inicio/SeletorDePeriodo";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import { fraseDeVeiculacao } from "@/lib/veiculacao/estado";

const ANUNCIOS: AnuncioDaLista[] = [
  { id: "a1", nome: "Campanha Outubro — WhatsApp", estado: "com-numeros", canal: "WhatsApp", periodo: "1 out — hoje",
    metricas: [{ rotulo: "Investido", valor: "R$ 1.284" }, { rotulo: "Impressões", valor: "23.480" }, { rotulo: "Cliques", valor: "846" }, { rotulo: "Conversas", valor: "112" }],
    criativos: [{ id: "c1", nome: "Cabelo luminoso", detalhe: "62 conversas neste anúncio", arte: "crescimento" }, { id: "c2", nome: "Café e pão de queijo", detalhe: "50 conversas neste anúncio", arte: "acompanhamento" }] },
  { id: "a2", nome: "Campanha Produto — WhatsApp", estado: "com-numeros", canal: "WhatsApp", periodo: "15 set — 30 set",
    metricas: [{ rotulo: "Investido", valor: "R$ 892" }, { rotulo: "Impressões", valor: "18.320" }, { rotulo: "Cliques", valor: "612" }, { rotulo: "Conversas", valor: "71" }],
    criativos: [{ id: "c3", nome: "Produto natural", detalhe: "71 conversas neste anúncio", arte: "crescimento" }] },
  { id: "a3", nome: "Campanha Treino — WhatsApp", estado: "sem-numeros", canal: "WhatsApp", periodo: "Em preparo",
    metricas: [{ rotulo: "Investido", valor: "Ainda não sabemos", ausente: true }, { rotulo: "Impressões", valor: "Ainda não sabemos", ausente: true }, { rotulo: "Cliques", valor: "Ainda não sabemos", ausente: true }, { rotulo: "Conversas", valor: "Ainda não sabemos", ausente: true }], criativos: [] },
];

export function PreviaDeAnuncios({ intervalo }: { intervalo: IntervaloDoInicio }) {
  return <div className="anuncios-editorial">
    <header className="anuncios-topo-novo"><div className="page-head"><h1>Anúncios</h1><p>Acompanhe o que está rodando e o resultado de cada anúncio.</p></div>
      <a className="cta" href="/exemplo/criativos">Abrir criativos</a></header>
    <p className="res-veiculacao">Situação fictícia: {fraseDeVeiculacao("no_ar", "manchete")}</p>
    <div className="anuncios-periodo"><a href={`/exemplo/inicio?desde=${intervalo.desde}&ate=${intervalo.ate}`}>Ver resumo deste período</a>
      <SeletorDePeriodo key={`${intervalo.desde}-${intervalo.ate}`} intervalo={intervalo} /></div>
    {intervalo.erro && <p className="form-warning" role="status">{intervalo.erro}</p>}
    <p className="previa-local-nota">Prévia visual: métricas fixas, sem consulta real ao mudar o período.</p>
    <PainelDeAnuncios anuncios={ANUNCIOS} ilustrativo />
  </div>;
}
