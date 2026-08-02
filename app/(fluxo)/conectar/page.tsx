import { createClient } from "@/lib/supabase/server";
import { ERROS_DE_CALLBACK } from "@/lib/meta/erros";
import { ESCOPOS } from "@/lib/meta/oauth";

/**
 * Preparação para o consentimento do Meta.
 *
 * A PALAVRA "META" NÃO APARECE. O cliente conecta "o Instagram do meu
 * negócio" — é assim que ele chama, e a interface fala a língua dele.
 *
 * Mas o popup do Facebook VAI aparecer cheio de jargão que a nossa
 * interface não usa: "Meta", "Business Manager", "gerenciar suas contas
 * de anúncios". Quem não foi avisado abandona ali achando que caiu num
 * golpe. Esta tela existe basicamente para esse aviso — o botão é a
 * parte fácil.
 */
interface Props {
  searchParams: Promise<{ erro?: string }>;
}

export default async function ConectarPage({ searchParams }: Props) {
  const { erro } = await searchParams;
  const mensagemDeErro = erro ? ERROS_DE_CALLBACK[erro] : undefined;

  const supabase = await createClient();
  const { data: conexao } = await supabase
    .from("meta_connections")
    .select("status, connected_at, scopes, meta_page_id")
    .maybeSingle();

  const jaConectado = conexao?.status === "connected";

  // Uma conexão feita ANTES de um escopo novo entrar continua válida, mas
  // sem a permissão — e o Meta não avisa. Comparar o que foi concedido
  // com o que o código pede hoje é o que transforma isso num aviso em vez
  // de um comportamento estranho que ninguém explica.
  const concedidos = new Set(conexao?.scopes ?? []);
  const faltando = jaConectado ? ESCOPOS.filter((e) => !concedidos.has(e)) : [];
  const precisaReconectar = faltando.length > 0 || (jaConectado && !conexao?.meta_page_id);

  return (
    <div className="auth-grid">
      <main className="auth-card">
        <p className="eyebrow">Conectar sua conta</p>
        <h1 className="auth-h">Vamos conectar o Instagram do seu negócio.</h1>
        <p className="auth-sub">
          É o que permite a gente criar e cuidar dos seus anúncios sem precisar da sua senha.
        </p>

        {mensagemDeErro && <p className="form-error">{mensagemDeErro}</p>}

        {jaConectado && !precisaReconectar && (
          <p className="form-notice">
            Seu Instagram já está conectado. Se quiser trocar de conta, é só conectar de novo.
          </p>
        )}

        {precisaReconectar && (
          <div
            className="fail-block"
            style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
          >
            <b>Sua conexão precisa ser refeita uma vez</b>
            <p>
              A gente melhorou a conexão desde a última vez que você conectou — agora ela também
              guarda de qual página seus anúncios vão sair, que é o que faltava para publicar.
              Refazer leva dois cliques e nada do que você já configurou se perde.
            </p>
          </div>
        )}

        <div className="trust">
          <b>A próxima tela é do Facebook, não nossa</b>
          Ela vai falar em &quot;Meta&quot;, &quot;Business Manager&quot;, &quot;gerenciar suas
          contas de anúncios&quot; e &quot;acessar suas Páginas&quot;. É o nome técnico das
          coisas, e é assim para qualquer empresa que anuncia no Instagram. Pode seguir: é a tela
          oficial deles.
        </div>

        <div className="trust">
          <b>Por que ele pede &quot;gerenciar seus anúncios&quot;</b>
          É essa permissão que deixa a gente criar e ajustar seus anúncios por você — que é o
          serviço que você contratou. Sem ela, a gente só conseguiria olhar. Ela não dá acesso ao
          seu perfil pessoal, às suas mensagens nem ao seu feed.
        </div>

        <div className="trust">
          <b>Por que ele pede acesso às suas Páginas</b>
          Seus anúncios saem de uma página, e é o WhatsApp dela que recebe as conversas. A gente
          precisa ver quais páginas você tem para você escolher de qual eles vão sair. A gente não
          publica nada na página nem lê as conversas dela.
        </div>

        <a className="cta" href="/auth/meta/iniciar">
          {jaConectado ? "Conectar outra conta" : "Conectar meu Instagram"}
        </a>

        <p className="card-note" style={{ marginTop: 14 }}>
          Não tem conta profissional no Instagram?{" "}
          <a
            href="https://wa.me/5521980351531?text=Oi!%20Quero%20conectar%20meu%20Instagram%20na%20V2G%2C%20mas%20acho%20que%20minha%20conta%20n%C3%A3o%20%C3%A9%20profissional."
            target="_blank"
            rel="noopener"
          >
            Fala com a gente
          </a>{" "}
          — a gente resolve isso junto, leva 5 minutos.
        </p>
      </main>

      <aside className="auth-aside">
        <section className="proof-card">
          <b className="title">O que a V2G nunca faz</b>
          <ul className="proof-list">
            <li>
              <Tick />
              <span>
                <b>Nunca posta no seu feed.</b> A gente não pede permissão para publicar nada no
                seu perfil. O que criamos são anúncios, que aparecem para quem você escolhe.
              </span>
            </li>
            <li>
              <Tick />
              <span>
                <b>Nunca pede sua senha.</b> Quem confirma que é você é o próprio Facebook. A
                gente nunca vê nem guarda sua senha.
              </span>
            </li>
            <li>
              <Tick />
              <span>
                <b>Nunca lê suas mensagens.</b> Não pedimos acesso ao seu direct nem às suas
                conversas.
              </span>
            </li>
          </ul>
        </section>

        <section className="proof-card">
          <b className="title">Você continua dono de tudo</b>
          <p>
            A conta de anúncio é sua, o Instagram é seu. Se um dia sair da V2G, leva tudo com
            você — e dá para desconectar quando quiser, direto por aqui.
          </p>
        </section>
      </aside>
    </div>
  );
}

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);
