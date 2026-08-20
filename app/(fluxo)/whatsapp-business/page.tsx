import { createClient } from "@/lib/supabase/server";

/**
 * "Seu WhatsApp precisa ser o Business."
 *
 * POR QUE ESTA TELA EXISTE: o Meta recusa anúncio de conversa quando o
 * número ligado à Página é uma conta pessoal.
 *
 *   (#100 / 2446885) "O número do WhatsApp vinculado à sua Página é uma
 *   conta pessoal. Você deve conectar uma conta do WhatsApp Business para
 *   direcionar o tráfego para o WhatsApp."
 *
 * Isso não é configuração fina: é pré-requisito do produto inteiro. Todo
 * cliente que usa o WhatsApp comum — que é a maioria dos pequenos
 * negócios — trava aqui. Junto com "sem Instagram profissional", é o
 * caminho de quem não consegue seguir, e por isso recebe tela própria em
 * vez de virar mensagem de erro no fim da publicação.
 *
 * O gatilho é a recusa do `validate_only` do CONJUNTO, que chega antes de
 * qualquer objeto ser criado (`docs/publicar-campanha.md` §0.d). É
 * confiável e vem em português — diferente da leitura dos campos de
 * WhatsApp da Página, que não funciona (`docs/oauth-meta.md` §2.1).
 *
 * O TOM: ninguém aqui sabe o que é "WhatsApp Business". A tela não
 * assume. Também não trata a troca como problema do cliente — ele não
 * fez nada errado, o app dele é o normal.
 */
export default async function WhatsAppBusinessPage() {
  const supabase = await createClient();

  const { data: negocio } = await supabase
    .from("businesses")
    .select("name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nome = negocio?.name?.trim();

  return (
    <div className="auth-grid solo">
      <main className="auth-card">
      <div className="page-head">
        <h1>Falta um passo antes do seu anúncio subir</h1>
        <p>
          O número de WhatsApp ligado {nome ? `à página do ${nome}` : "à sua página"} é uma conta
          pessoal. O Facebook só deixa o anúncio mandar gente para o WhatsApp quando o número está
          num aplicativo chamado <b>WhatsApp Business</b>.
        </p>
      </div>

      <section className="hero-destaque">
        <span className="eyebrow">O que isso significa</span>
        <p className="hero-frase">
          É <span className="destaque">outro aplicativo</span>, gratuito, do próprio WhatsApp — e
          você continua com o mesmo número.
        </p>
        <p className="hero-note">
          Suas conversas vão junto. Você não perde contato, não muda de número e não precisa
          avisar ninguém.
        </p>
      </section>

      <section className="passos-card">
        <div className="section-title">
          <h2>Como fazer, em três passos</h2>
          <span className="st-note">uns 10 minutos</span>
        </div>

        <ol className="passos">
          <li>
            <span className="passo-num">1</span>
            <div>
              <b>Instale o WhatsApp Business</b>
              <p>
                Procure por <b>WhatsApp Business</b> na loja de aplicativos do seu celular — Play
                Store no Android, App Store no iPhone. É de graça, e o ícone é parecido com o do
                WhatsApp normal, mas com um <b>B</b> dentro.
              </p>
              <p className="passo-aviso">
                Não desinstale o WhatsApp comum antes. O próprio aplicativo novo vai perguntar se
                você quer trazer suas conversas — responda que sim.
              </p>
            </div>
          </li>

          <li>
            <span className="passo-num">2</span>
            <div>
              <b>Registre o seu número de sempre</b>
              <p>
                Ao abrir, ele pede o número. Use <b>o mesmo</b> que você já usa no negócio. Ele
                envia um código por SMS, você digita, e pronto — as conversas antigas aparecem
                lá.
              </p>
              <p className="passo-aviso">
                Depois disso, o WhatsApp comum para de funcionar com esse número no mesmo
                aparelho. É esperado: agora ele mora no Business.
              </p>
            </div>
          </li>

          <li>
            <span className="passo-num">3</span>
            <div>
              <b>Ligue ele na sua página do Facebook</b>
              <p>
                No Facebook, abra a página do seu negócio, vá em{" "}
                <b>Configurações → WhatsApp</b> e conecte o número. É esse vínculo que faz o
                botão do anúncio abrir a conversa certa.
              </p>
            </div>
          </li>
        </ol>

        <div className="trust">
          <b className="title">Quando terminar, é só voltar aqui</b>
          A gente confere de novo na hora de publicar. Enquanto isso, nada foi criado e nenhuma
          verba foi gasta — seu anúncio fica esperando, do jeito que está.
          <br />
          <a className="cta" href="/inicio" style={{ marginTop: 12, width: "max-content" }}>
            Voltar para o início
          </a>
        </div>
      </section>

      <section className="trust">
        <b className="title">Prefere que a gente faça junto?</b>
        A gente acompanha por chamada de vídeo ou por mensagem, no seu ritmo. Sem custo e sem
        robô — é uma pessoa do outro lado.
        <br />
        <a
          className="wa"
          href="https://wa.me/5521936182176?text=Oi!%20Preciso%20trocar%20meu%20WhatsApp%20para%20o%20WhatsApp%20Business%20para%20conseguir%20anunciar%20pela%20V2G."
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

