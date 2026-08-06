import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComportamentoLP } from "./ComportamentoLP";
import "./lp.css";

/**
 * A LANDING PAGE — a rota "/" para quem ainda não tem conta.
 *
 * Portada de `design/landing.html` do repositório de design, que até
 * agora era só protótipo estático: ninguém a via, porque "/" mandava
 * todo visitante direto para /entrar.
 *
 * TRÊS COISAS MUDARAM NO CONTEÚDO, e nenhuma é estética:
 *
 * 1. A LP vendia "anúncios no Instagram e no Google". A gente só roda
 *    Meta. Prometer Google numa página pública é vender o que não
 *    entregamos — corrigido em quatro lugares.
 *
 * 2. O FAQ dizia "a IA nunca gasta mais do que você mandou". É a mesma
 *    promessa falsa que já tinha sido corrigida em /conta: o Meta gasta
 *    até 125% num dia e compensa nos seguintes. Agora a LP explica o
 *    comportamento em vez de prometer o que a plataforma não faz.
 *
 * 3. O herói tinha um cliente inventado — "Doceria da Marina", com
 *    R$ 3,40 de retorno e 14 vendas na semana. Depoimento fabricado numa
 *    página pública não é licença poética, é propaganda enganosa. O card
 *    virou o que sempre foi de fato: uma ILUSTRAÇÃO da interface, dita
 *    com todas as letras na própria peça. Quando houver cliente real
 *    disposto a dar número real, ele entra aqui e a etiqueta sai.
 *
 * O CSS vive em `./lp.css`, importado só por esta rota — são 21 KB que
 * nenhuma tela do app usa.
 */
export default async function LandingPage() {
  // Quem já entrou não vê a página de vendas: vê o painel. A decisão
  // mora aqui, e não no `proxy.ts`, porque "/" é rota PÚBLICA — colocá-la
  // na lista de prefixos protegidos mandaria o visitante anônimo para
  // /entrar, que é exatamente o que esta página veio consertar.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/inicio");

  return (
    <div className="lp">
      {/* ============================================================
           NAV
           ============================================================ */}
      <nav className="lp-nav">
        <div className="lp-container">
          <a className="brand" href="/">
            <Image className="mark-img" src="/marca.png" alt="" width={240} height={242} />
            <div className="wm">V2G<small>Tráfego no piloto</small></div>
          </a>
          <div className="nav-links">
            <a className="txt" href="#como-funciona">Como funciona</a>
            <a className="txt" href="#preco">Preço</a>
            <a className="txt" href="#duvidas">Dúvidas</a>
            <a className="btn btn-light btn-nav" href="/entrar">Começar agora</a>
          </div>
        </div>
      </nav>

      {/* ============================================================
           HERO
           ============================================================ */}
      <header className="hero">
        <div className="dotgrid"></div>
        <div className="lp-container hero-inner">
          <div className="hero-copy">
            <div className="hero-mark">
              <Image className="mark-img" src="/marca.png" alt="" width={240} height={242} />
            </div>
            <span className="hero-eyebrow"><span className="pip"></span>A Contabilizei do marketing</span>
            <h1>Sua agência de tráfego cabe no <em>bolso</em>. E custa um terço.</h1>
            <p className="hero-sub">A V2G põe uma inteligência artificial pra cuidar dos seus anúncios no Instagram e no Facebook. Você vê cada real que entra e sai, aprova cada peça antes de ir ao ar, e acompanha tudo na palma da mão — sem depender de agência, sem entender de tráfego.</p>
            <div className="hero-cta-row">
              <a className="btn btn-light btn-lg" href="/entrar">Começar agora <span className="arrow">&rarr;</span></a>
              <a className="btn btn-ghost-light btn-lg" href="#como-funciona">Ver como funciona</a>
            </div>
            <div className="hero-trust">
              <span><span className="tk"><svg width="9" height="9" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>R$ 490/mês, sem fidelidade</span>
              <span><span className="tk"><svg width="9" height="9" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>Cancele em 2 toques, no app</span>
              <span><span className="tk"><svg width="9" height="9" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>7 dias de garantia</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="proof-float">
              <div className="pf-top">
                <span className="pf-avatar" aria-hidden="true">V</span>
                <span className="pf-who">
                  <b>Seu negócio, na tela inicial</b>
                  <span>Exemplo de como a V2G mostra o resultado</span>
                </span>
              </div>
              <p className="pf-phrase">Pra cada R$ 1 que você colocou, voltaram <b>R$ 3,40</b></p>
              <div className="pf-metrics">
                <div className="pf-m"><span className="l">Vendas na semana</span><span className="v win">14</span></div>
                <div className="pf-m"><span className="l">Investido</span><span className="v">R$ 620</span></div>
              </div>
              <span className="pf-tag">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="3" y="1" width="6" height="4"/><rect x="1" y="2" width="2" height="2"/><rect x="9" y="2" width="2" height="2"/><rect x="4" y="5" width="4" height="2"/><rect x="5" y="7" width="2" height="2"/><rect x="3" y="9" width="6" height="2"/></svg>
                Exemplo de tela — não é resultado de cliente
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
           DOR
           ============================================================ */}
      <section className="section">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="sec-eyebrow">Você conhece esse filme</span>
            <h2>Anunciar hoje é caro, confuso e fora do seu controle.</h2>
            <p className="sec-lead">Quem tem um negócio local sabe: pra aparecer no Instagram e no Facebook, ou você se vira sozinho no escuro, ou entrega tudo pra uma agência — e nenhum dos dois caminhos te deixa no comando.</p>
          </div>
          <div className="pains">
            <div className="pain reveal">
              <div className="p-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v18"/><path d="M16 7c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3"/></svg></div>
              <h3>R$ 1.500 a R$ 3.000 por mês</h3>
              <p>É o que uma agência cobra — muitas ainda pedem seis meses de fidelidade antes de mostrar um único resultado.</p>
            </div>
            <div className="pain reveal">
              <div className="p-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16v.01"/><path d="M12 13a2.5 2.5 0 1 0-2.5-3"/><circle cx="12" cy="12" r="9"/></svg></div>
              <h3>Relatório que ninguém entende</h3>
              <p>CTR, ROAS, CPM... uma sopa de sigla que não responde a única pergunta que importa: entrou dinheiro ou não?</p>
            </div>
            <div className="pain reveal">
              <div className="p-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5h16v11H7l-3 3V5z"/><path d="M9 10h.01M12.5 10h.01M16 10h.01"/></svg></div>
              <h3>E quando você pergunta, ninguém responde</h3>
              <p>O dinheiro é seu, o negócio é seu — mas o controle fica com quem some do WhatsApp quando você mais precisa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           VIRADA
           ============================================================ */}
      <section className="section ice">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="sec-eyebrow">Agora imagina o contrário</span>
            <h2>Você no comando — com a IA fazendo o trabalho pesado.</h2>
            <p className="sec-lead">A V2G não é mais uma agência. É uma inteligência artificial que monta, roda e ajusta seus anúncios sozinha, todos os dias — e presta contas pra você em português de gente.</p>
          </div>
          <div className="shift-grid">
            <div className="shift reveal">
              <div className="s-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
              <h3>Trabalha enquanto você dorme</h3>
              <p>De madrugada a IA tira dinheiro do anúncio que não rende e reforça o que traz cliente. Você acorda com o ajuste feito.</p>
            </div>
            <div className="shift reveal">
              <div className="s-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v16"/></svg></div>
              <h3>Mostra tudo, o tempo todo</h3>
              <p>Quanto você investiu, quanto voltou, quantas vendas. Sem relatório pra esperar, sem sigla pra decifrar.</p>
            </div>
            <div className="shift reveal">
              <div className="s-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12l5 5L20 7"/></svg></div>
              <h3>Nada vai ao ar sem você</h3>
              <p>A IA cria a oferta e as artes; você só aprova ou pede outra. O piloto é você — ela é o copiloto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           COMO FUNCIONA
           ============================================================ */}
      <section className="section" id="como-funciona">
        <div className="lp-container">
          <div className="sec-head center reveal">
            <span className="sec-eyebrow">Como funciona</span>
            <h2>Do cadastro ao primeiro anúncio no ar em <em>10 minutos</em>.</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="s-n">1</div>
              <h3>Você conta do seu negócio</h3>
              <p>Uma conversa rápida, na sua língua: o que você vende, pra quem, onde. Manda umas fotos e pronto — quem não tem logo, a IA cria a cara da marca.</p>
              <span className="s-note">Leva uns 10 minutos</span>
            </div>
            <div className="step reveal">
              <div className="s-n">2</div>
              <h3>A IA monta tudo</h3>
              <p>Ela cria a estrutura dos anúncios, escreve os textos e desenha as artes. Cuida da parte técnica por trás — você não mexe em nada complicado.</p>
              <span className="s-note">Você aprova cada peça</span>
            </div>
            <div className="step reveal">
              <div className="s-n">3</div>
              <h3>Vai ao ar — e você acompanha</h3>
              <p>Seus anúncios entram no Instagram e no Facebook. A IA ajusta sozinha todo dia, e você vê o resultado na palma da mão, quando quiser.</p>
              <span className="s-note">Sem fidelidade, cancela quando quiser</span>
            </div>
          </div>
          <div className="steps-cta reveal">
            <a className="btn btn-primary btn-lg" href="/entrar">Quero começar minha primeira campanha <span className="arrow">&rarr;</span></a>
          </div>
        </div>
      </section>

      {/* ============================================================
           PREÇO
           ============================================================ */}
      <section className="section ice" id="preco">
        <div className="lp-container">
          <div className="sec-head center reveal">
            <span className="sec-eyebrow">Preço</span>
            <h2>Um preço. Tudo incluso. Cancele quando quiser.</h2>
            <p className="sec-lead">Sem taxa de adesão, sem multa, sem fidelidade. O valor não muda no mês que vem — esse é o preço, e pronto.</p>
          </div>

          <div className="price-wrap">
            <div className="price-card reveal">
              <div className="pc-dots"></div>
              <div className="pc-body">
                <span className="pc-label">Plano Piloto</span>
                <div className="pc-amount">R$ 490<small>/mês</small></div>
                <p className="pc-sub">Menos de R$ 17 por dia pra ter uma agência de IA cuidando dos seus anúncios de ponta a ponta.</p>
                <ul>
                  <li><span className="tk"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>IA criando e ajustando suas campanhas todo dia</li>
                  <li><span className="tk"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>Relatório dos seus anúncios no WhatsApp</li>
                  <li><span className="tk"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>Painel do negócio na palma da mão</li>
                  <li><span className="tk"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg></span>Suporte de gente de verdade, sem robô</li>
                </ul>
                <a className="btn btn-light btn-lg" href="/entrar">Ativar meu plano <span className="arrow">&rarr;</span></a>
                <p className="pc-fine">O investimento nos anúncios é à parte e definido por você — a partir de R$ 10 por dia.</p>
              </div>
            </div>

            <div className="price-side">
              <div className="compare reveal">
                <h3>Por que é um terço do preço</h3>
                <div className="compare-row">
                  <span className="who"><b>Agência tradicional</b><br />por mês, + fidelidade</span>
                  <span className="val them">R$ 1.500&ndash;3.000</span>
                </div>
                <div className="compare-bar"><i className="them"></i></div>
                <div className="compare-row" style={{marginTop: "14px"}}>
                  <span className="who"><b>V2G</b><br />por mês, sem fidelidade</span>
                  <span className="val us">R$ 490</span>
                </div>
                <div className="compare-bar"><i className="us" style={{width: "22%"}}></i></div>
              </div>

              <div className="pix-note reveal">
                <b>Prefere Pix? Sai ainda mais em conta.</b>
                <p>6 meses por R$ 2.646 &mdash; dá <mark>R$ 441/mês</mark>. Ou 12 meses por R$ 4.704 &mdash; <mark>R$ 392/mês</mark>, uma economia de R$ 1.176 no ano. Cancelou antes do fim? Devolvemos os meses que você não usou.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           PROMESSA HONESTA — os 3 nãos
           ============================================================ */}
      <section className="section">
        <div className="lp-container">
          <div className="sec-head reveal">
            <span className="sec-eyebrow">O combinado, antes de você pagar</span>
            <h2>A gente prefere dizer os <em>nãos</em> agora.</h2>
            <p className="sec-lead">Se você já foi enganado por quem prometeu o mundo, isso aqui vai soar diferente. A V2G não serve pra todo mundo — e a gente conta antes, não depois.</p>
          </div>
          <div className="promise">
            <div className="promise-item reveal">
              <div className="no"><span className="x"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l6 6M9 3l-6 6"/></svg></span>A gente não promete um número de vendas.</div>
              <div className="yes">Ninguém garante isso de verdade — nem a agência mais cara da cidade. <b>Em compensação, você vê todo dia quanto entrou e quanto voltou</b>, sem depender de relatório de ninguém.</div>
            </div>
            <div className="promise-item reveal">
              <div className="no"><span className="x"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l6 6M9 3l-6 6"/></svg></span>A gente não põe um gerente de conta só seu no telefone.</div>
              <div className="yes">Isso é coisa de agência premium, e entra na conta todo mês. <b>Em compensação, quem responde é gente de verdade no WhatsApp</b>, sem robô, quantas vezes você precisar.</div>
            </div>
            <div className="promise-item reveal">
              <div className="no"><span className="x"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 3l6 6M9 3l-6 6"/></svg></span>A gente não atende quem investe mais de R$ 3 mil por mês.</div>
              <div className="yes">Nesse tamanho, o formato certo é outro, com mais estratégia dedicada. <b>Se não é o seu caso agora, ótimo — é exatamente pra esse porte que a V2G foi feita.</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           GARANTIA
           ============================================================ */}
      <section className="section tight">
        <div className="lp-container">
          <div className="guarantee reveal">
            <div className="g-seal">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2l7 3v6c0 4.5-3 8-7 11-4-3-7-6.5-7-11V5l7-3z"/><path d="M8.5 12l2.5 2.5 4.5-5" strokeWidth="1.8"/></svg>
            </div>
            <div>
              <h3>7 dias de garantia. Não gostou, devolvemos 100%.</h3>
              <p>Sem perguntas e sem ressentimento. E a porta de saída fica sempre aberta: cancele em 2 toques, direto no app, sem precisar ligar pra ninguém.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           FAQ
           ============================================================ */}
      <section className="section ice" id="duvidas">
        <div className="lp-narrow">
          <div className="sec-head center reveal">
            <span className="sec-eyebrow">Dúvidas</span>
            <h2>O que todo mundo pergunta antes de começar.</h2>
          </div>
          <div className="faq reveal">
            <details>
              <summary>Preciso entender de tráfego ou de tecnologia? <span className="chev"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v10M4 9h10"/></svg></span></summary>
              <div className="faq-body">Não. Se você usa WhatsApp e Instagram, já sabe o suficiente. A parte técnica fica toda com a IA — você só conta do seu negócio, aprova as peças e acompanha o resultado em linguagem de gente.</div>
            </details>
            <details>
              <summary>Preciso mexer em conta de anúncio, Business Manager, essas coisas? <span className="chev"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v10M4 9h10"/></svg></span></summary>
              <div className="faq-body">Nada disso. A V2G cuida da configuração por trás dos panos. Pra você, é só "conectar sua empresa" — a gente resolve o resto.</div>
            </details>
            <details>
              <summary>Quanto preciso investir em anúncio, além da mensalidade? <span className="chev"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v10M4 9h10"/></svg></span></summary>
              <div className="faq-body">Você decide, a partir de R$ 10 por dia. Esse valor vai direto para o Instagram e o Facebook e é separado da mensalidade de R$ 490. E você define um limite mensal. O Facebook pode gastar um pouco mais num dia bom e menos nos seguintes para compensar — no fim do mês, fecha no seu limite.</div>
            </details>
            <details>
              <summary>E se eu quiser cancelar? <span className="chev"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v10M4 9h10"/></svg></span></summary>
              <div className="faq-body">Cancela em 2 toques, direto no app, sem ligar pra ninguém e sem multa. <b>Sem fidelidade, sem letra miúda.</b> Nos 7 primeiros dias, se não gostar, devolvemos tudo.</div>
            </details>
            <details>
              <summary>Como eu sei que está funcionando? <span className="chev"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 4v10M4 9h10"/></svg></span></summary>
              <div className="faq-body">Todo dia você vê, em números simples, quanto investiu, quanto voltou e quantas vendas os anúncios trouxeram — mais um resumo do que a IA fez por você. Nada de sigla, nada de relatório pra esperar.</div>
            </details>
          </div>
        </div>
      </section>

      {/* ============================================================
           CTA FINAL
           ============================================================ */}
      <section className="section">
        <div className="lp-container">
          <div className="final-cta reveal">
            <div className="fc-dots"></div>
            <div className="fc-body">
              <h2>Seu próximo cliente já está <em>rolando o feed</em>.</h2>
              <p>Em 10 minutos sua primeira campanha pode estar a caminho do ar. Sem fidelidade, com 7 dias de garantia e a saída sempre à vista.</p>
              <a className="btn btn-light btn-lg" href="/entrar">Começar agora <span className="arrow">&rarr;</span></a>
              <p className="fc-fine">R$ 490/mês · cancele em 2 toques · fala com gente de verdade no WhatsApp</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
           RODAPÉ
           ============================================================ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="f-brand">
            <Image className="mark-img" src="/marca.png" alt="" width={240} height={242} />
            <span className="wm">V2G</span>
          </div>
          <div className="f-links">
            <a href="#como-funciona">Como funciona</a>
            <a href="#preco">Preço</a>
            <a href="#duvidas">Dúvidas</a>
            <a href="/entrar">Entrar</a>
            <a href="/">Ver as telas</a>
          </div>
          <p className="f-legal">V2G Tecnologia LTDA · CNPJ 00.000.000/0001-00 · Este é um material de demonstração. Valores e resultados exibidos são ilustrativos.</p>
        </div>
      </footer>

      <ComportamentoLP />
    </div>
  );
}
