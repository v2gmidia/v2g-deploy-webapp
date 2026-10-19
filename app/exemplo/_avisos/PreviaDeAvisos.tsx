import { AbasDeAvisos } from "@/app/(protected)/alertas/AbasDeAvisos";

const pendencias = <section className="avisos-secao">
  <div className="section-title"><div><h2>Precisa de você</h2></div><span className="grp-count">2 itens</span></div>
  <div className="avisos-pendencias">
    <article className="aviso-linha atencao"><span className="aviso-sinal" aria-hidden="true" /><div className="aviso-corpo">
      <div className="aviso-meta"><span>Criativos</span><time>Hoje, 14:20</time></div><h3>Ajuste pedido no criativo Campanha de outubro</h3>
      <p>O gestor pediu uma troca no texto antes da publicação.</p></div><a className="aviso-acao" href="/exemplo/criativos">Ver criativo <span aria-hidden="true">→</span></a></article>
    <article className="aviso-linha atencao"><span className="aviso-sinal" aria-hidden="true" /><div className="aviso-corpo">
      <div className="aviso-meta"><span>Anúncios</span><time>Ontem, 17:45</time></div><h3>Não foi possível publicar o anúncio</h3>
      <p>A conta de anúncios precisa ser reconectada para continuar.</p></div><a className="aviso-acao" href="/exemplo/conta#conexoes">Resolver conexão <span aria-hidden="true">→</span></a></article>
  </div>
</section>;

const atualizacoes = <section className="avisos-secao">
  <div className="section-title"><div><h2>Atualizações</h2></div></div>
  <div className="avisos-registros">
    <article className="atualizacao-linha"><time>Hoje, 10:12</time><div><span className="avisos-origem">Retorno dos criativos</span><h3>Criativo aprovado pelo gestor</h3><p>A publicação pelo gestor ainda precisa ser confirmada.</p></div></article>
    <article className="atualizacao-linha"><time>17 de outubro</time><div><span className="avisos-origem">Conta</span><h3>Limite mensal atualizado</h3><p>O novo limite do negócio foi registrado.</p></div></article>
    <article className="atualizacao-linha"><time>15 de outubro</time><div><span className="avisos-origem">Relatórios</span><h3>Relatório disponível</h3><p>O resumo mais recente já pode ser consultado.</p></div></article>
  </div>
</section>;

export function PreviaDeAvisos() {
  return <div className="avisos-editorial">
    <div className="page-head avisos-cabecalho"><h1>Avisos</h1><p>O que precisa de você aparece primeiro.</p></div>
    <p className="foot-line">Prévia local com dados ilustrativos.</p>
    <AbasDeAvisos pendencias={pendencias} atualizacoes={atualizacoes} quantasPendencias={2} quantasAtualizacoes={3} />
    <footer className="avisos-suporte"><span>Precisa de ajuda com algum aviso?</span><a href="#">Falar com uma pessoa →</a>
      <small>Os avisos aparecem no app. O envio automático pelo WhatsApp ainda não está disponível.</small></footer>
  </div>;
}
