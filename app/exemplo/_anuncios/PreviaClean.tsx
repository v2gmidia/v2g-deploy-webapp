import { ListaDeAnuncios } from "@/app/(protected)/anuncios/ListaDeAnuncios";
import { SeletorDePeriodo } from "@/app/(protected)/inicio/SeletorDePeriodo";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import type { AnuncioCliente } from "@/lib/anuncios/lista-cliente";
import styles from "@/app/(protected)/anuncios/lista-cliente.module.css";

const metricas = ["Investido", "Mensagens no WhatsApp", "Cliques", "Impressões"].map(rotulo => ({ rotulo, valor: null }));
const exemplos: AnuncioCliente[] = [
  { id: "apresentacao", nome: "Apresentação da marca", contexto: "Visitas ao perfil · exemplo", status: "Ativo · exemplo", filtro: "ativos", metricas,
    criativos: [{ id: "clareza", nome: "Clareza para anunciar", imagem: "/criativos/v2g-clareza-feed-v1.png", href: "/exemplo/criativos?peca=c1" }] },
  { id: "conversas", nome: "Conversas no WhatsApp", contexto: "Mensagens no WhatsApp · exemplo", status: "Pausado · exemplo", filtro: "pausados", metricas,
    criativos: [{ id: "conversas", nome: "Mais conversas", imagem: "/criativos/criativo-conversas.svg", href: "/exemplo/criativos?peca=c2" }] },
];
export function PreviaAnunciosClean({ intervalo, selecionado }: { intervalo: IntervaloDoInicio; selecionado?: string }) {
  return <div className={styles.pagina}>
    <header className={styles.topo}><div className="page-head"><h1>Anúncios</h1><p>Resultados e criativos, anúncio por anúncio.</p></div><a className="cta ghost" href="/exemplo/criativos">Ver criativos</a></header>
    <div className="anuncios-periodo"><p className="previa-local-nota">Prévia local · anúncios de exemplo, sem métricas reais</p><SeletorDePeriodo key={`${intervalo.desde}-${intervalo.ate}`} intervalo={intervalo} /></div>
    {intervalo.erro && <p className="form-warning">{intervalo.erro}</p>}
    <ListaDeAnuncios anuncios={exemplos} selecionado={selecionado} bibliotecaHref="/exemplo/criativos" />
  </div>;
}
