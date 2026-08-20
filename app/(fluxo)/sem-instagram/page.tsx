/**
 * "Sua conta do Instagram precisa ser profissional."
 *
 * O outro caminho de quem trava — e, junto com o WhatsApp Business,
 * provavelmente o maior ponto de perda do funil. Recebe o mesmo cuidado:
 * tela própria, passo a passo, e uma pessoa do outro lado.
 *
 * CUIDADO AO MEXER AQUI: a gente NÃO consegue verificar se a conta é
 * profissional. `instagram_basic` foi removido dos escopos porque o
 * Facebook recusa a autorização inteira sem o produto Instagram Graph API
 * no painel (ver a nota longa em `lib/meta/graph.ts`). Sem o escopo, o
 * Facebook não devolve erro — ele OMITE o campo. Uma verificação aqui
 * diria "não é profissional" para todo mundo, inclusive para quem é.
 *
 * Por isso esta tela NUNCA afirma o estado da conta do cliente. Ela
 * explica o requisito e ensina a conferir. É a mesma lição que derrubou o
 * selo de WhatsApp (`docs/oauth-meta.md` §2.1): interface não afirma o
 * que não verificou.
 */
export default function SemInstagramPage() {
  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>Seu Instagram precisa estar no modo profissional</h1>
        <p>
          É uma chavinha dentro do próprio Instagram, de graça, que libera o perfil para anunciar.
          Sem ela o Facebook não deixa nenhum anúncio sair — nem o nosso, nem o de ninguém.
        </p>
      </div>

      <section className="hero-destaque">
        <span className="eyebrow">O que muda no seu perfil</span>
        <p className="hero-frase">
          Praticamente <span className="destaque">nada</span> para quem te segue.
        </p>
        <p className="hero-note">
          O perfil continua com o mesmo nome, as mesmas fotos e os mesmos seguidores. O que muda é
          que você passa a ver quantas pessoas viram cada post — e passa a poder anunciar.
        </p>
      </section>

      <section className="passos-card">
        <div className="section-title">
          <h2>Como fazer, pelo celular</h2>
          <span className="st-note">uns 3 minutos</span>
        </div>

        <ol className="passos">
          <li>
            <span className="passo-num">1</span>
            <div>
              <b>Abra o Instagram e vá no seu perfil</b>
              <p>Toque na sua foto, no canto de baixo à direita.</p>
            </div>
          </li>
          <li>
            <span className="passo-num">2</span>
            <div>
              <b>Menu → Configurações e privacidade</b>
              <p>
                O menu é o botão de três risquinhos, no canto de cima à direita. Role até{" "}
                <b>Tipo de conta e ferramentas</b>.
              </p>
            </div>
          </li>
          <li>
            <span className="passo-num">3</span>
            <div>
              <b>Mudar para conta profissional</b>
              <p>
                Ele pergunta a categoria do seu negócio — escolha a que mais se parece, não
                precisa ser exata. Depois ele oferece <b>Criador</b> ou <b>Empresa</b>: escolha{" "}
                <b>Empresa</b>.
              </p>
            </div>
          </li>
          <li>
            <span className="passo-num">4</span>
            <div>
              <b>Ligue o perfil na sua página do Facebook</b>
              <p>
                Ainda nas configurações, procure <b>Compartilhamento com outros aplicativos</b> ou{" "}
                <b>Central de contas</b>, e conecte a página do seu negócio. É esse vínculo que
                permite o anúncio aparecer no Instagram.
              </p>
            </div>
          </li>
        </ol>

        <div className="trust">
          <b className="title">Como saber se deu certo</b>
          No seu perfil vai aparecer um botão novo, escrito <b>Ferramentas profissionais</b> ou{" "}
          <b>Painel profissional</b>. Se ele está lá, está pronto.
          <br />
          <a className="cta" href="/inicio" style={{ marginTop: 12, width: "max-content" }}>
            Voltar para o início
          </a>
        </div>
      </section>

      <section className="trust">
        <b className="title">Se travar em algum passo, chama</b>
        O Instagram muda o nome dos menus de tempos em tempos, e às vezes o que está escrito aqui
        não bate com o que você vê. Manda um print que a gente te diz onde tocar.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Preciso%20deixar%20meu%20Instagram%20profissional%20para%20anunciar%20pela%20V2G."
          target="_blank"
          rel="noopener"
        >
          Chamar no WhatsApp &rarr;
        </a>
      </section>
    </main>
    </div>
  );
}

