export function PreviaDeConta() {
  return <div className="conta-editorial">
    <div className="page-head"><h1>Conta</h1><p>Seus dados, seu negócio e suas conexões.</p></div>
    <p className="previa-local-nota">Prévia local · dados ilustrativos</p>
    <div className="dash-grid conta-layout">
      <div className="dash-main conta-ficha">
        <section className="conta-secao conta-perfil" id="visao-geral"><div className="section-title"><h2>Seu perfil</h2></div>
          <details className="conta-perfil-resumo"><summary><span className="conta-avatar">VC</span><span className="conta-perfil-identidade"><b>Victor Cabral</b><small>victor.c******@gmail.com</small><small>(11) 9 ****-1234</small></span><span className="conta-editar">Editar dados</span></summary>
            <div className="conta-perfil-form"><p className="hint">Prévia local: a edição real usa os dados autenticados.</p></div></details></section>
        <section className="conta-secao conta-negocio" id="negocio"><div className="section-title"><h2>Negócio</h2><span className="side-note">Selecionado agora</span></div>
          <div><div className="conta-negocio-atual"><div><b>V2G</b><span>Negócio selecionado</span></div><span className="conta-estado">Selecionado</span></div>
            <a className="acct-row" href="#negocio"><span className="ar-text"><b>Ver dados do negócio</b><span>Oferta, público, região e informações confirmadas.</span></span></a></div></section>
        <section className="conta-secao conta-conexoes" id="conexoes"><div className="section-title"><h2>Conexões</h2></div>
          <div className="acct-list"><div className="acct-row"><span className="ar-text"><b>Conta de anúncios</b><span>Conectada</span></span></div><div className="acct-row"><span className="ar-text"><b>Página</b><span>V2G mídia</span></span></div></div></section>
        <section className="conta-secao conta-plano" id="plano"><div className="section-title"><h2>Plano</h2><span className="side-note">Por negócio</span></div>
          <div><p className="hint">R$ 500 por mês · 1 conta de anúncios</p><p className="foot-line">Pagamento confirmado. Este registro não informa próxima cobrança ou recibo.</p></div></section>
        <section className="conta-secao conta-identidade" id="identidade"><div className="section-title"><h2>Identidade visual</h2></div>
          <details className="card conta-recolhivel"><summary><span><b>Logo e fotos do negócio</b><small>4 imagens guardadas</small></span><span>Gerenciar</span></summary></details></section>
        <section className="conta-secao conta-preferencias" id="preferencias"><div className="section-title"><h2>Preferências</h2></div><p className="hint">Experimente os temas no seletor de aparência do topo.</p></section>
        <section className="conta-secao conta-requisitos" id="requisitos"><div className="section-title"><h2>Verba e requisitos</h2></div><div><p className="hint">Confira a verba mensal, o WhatsApp Business e o Instagram do seu negócio.</p></div></section>
        <section className="conta-secao conta-contrato" id="contrato"><div className="section-title"><h2>Contrato</h2></div><div><p className="hint">A assinatura e os pedidos aparecem aqui conforme o registro do seu negócio.</p><p className="foot-line">Pausa e cancelamento são tratados com a equipe.</p></div></section>
        <section className="conta-secao conta-atendimento" id="atendimento"><div className="section-title"><h2>Atendimento</h2></div><p className="hint">Fale com a equipe para dúvidas sobre cobrança, resultados ou saída.</p></section>
        <section className="conta-secao conta-sessao" id="sessao"><div className="section-title"><h2>Esta conta</h2></div><div><button className="cta ghost" type="button">Sair desta conta</button><p className="foot-line">Sair não cancela nem apaga nada.</p></div></section>
      </div>
    </div>
  </div>;
}
