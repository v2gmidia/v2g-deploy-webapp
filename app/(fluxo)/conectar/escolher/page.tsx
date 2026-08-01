import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarContasDeAnuncio, listarPerfisDeInstagram } from "@/lib/meta/graph";
import { diagnosticar, registrarErroMeta } from "@/lib/meta/erros";
import { FormularioEscolha } from "./Formulario";

/**
 * Escolha da conta de anúncio e do perfil de Instagram.
 *
 * O token é lido do Vault pela `obter_token_meta` (só `service_role`) e
 * NUNCA sai desta função: as chamadas ao Meta acontecem aqui no
 * servidor, e o que desce para o navegador é só a lista já formatada.
 *
 * Contas inelegíveis aparecem desabilitadas, com o motivo. Sumir com
 * elas faz o cliente achar que a conta dele não existe e transforma o
 * suporte em adivinhação.
 */
export default async function EscolherPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <Aviso titulo="Sua sessão expirou." texto="Entre de novo para continuar." />;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <Aviso
        titulo="Não encontramos seu negócio."
        texto="Comece contando sobre ele — são quatro perguntas rápidas."
        acao={{ href: "/onboarding", rotulo: "Contar sobre o meu negócio" }}
      />
    );
  }

  const admin = createAdminClient();
  const { data: token, error: erroToken } = await admin.rpc("obter_token_meta", {
    p_business_id: business.id,
  });

  if (erroToken || !token) {
    return (
      <Aviso
        titulo="Sua conexão com o Instagram não está mais válida."
        texto="Isso acontece quando a autorização expira ou é removida no Facebook. Conectar de novo resolve — leva menos de um minuto."
        acao={{ href: "/conectar", rotulo: "Conectar de novo" }}
      />
    );
  }

  let contas;
  let perfis;
  try {
    [contas, perfis] = await Promise.all([
      listarContasDeAnuncio(token),
      listarPerfisDeInstagram(token),
    ]);
  } catch (erro) {
    registrarErroMeta("escolher:listagem", erro);
    const diagnostico = diagnosticar(erro);

    if (diagnostico.quebrou) {
      // O token morreu entre a conexão e agora. Marca no banco para a
      // faixa de reconexão aparecer nas outras telas, e não tenta de
      // novo: no Meta um erro 190 não volta a funcionar sozinho.
      await admin.rpc("marcar_conexao_meta_quebrada", {
        p_business_id: business.id,
        p_status: diagnostico.motivo,
        p_erro: diagnostico.mensagem ?? null,
      });
      return (
        <Aviso
          titulo="A conexão com o Instagram caiu."
          texto={`${diagnostico.mensagem} Conectar de novo resolve.`}
          acao={{ href: "/conectar", rotulo: "Conectar de novo" }}
        />
      );
    }

    return (
      <Aviso
        titulo="Não conseguimos ler suas contas agora."
        texto="O Instagram não respondeu como esperávamos. Tente de novo em alguns minutos."
        acao={{ href: "/conectar", rotulo: "Tentar de novo" }}
      />
    );
  }

  const elegiveis = contas.filter((c) => c.elegivel);

  // ---- os becos: cada causa tem texto próprio e saída humana ----
  if (contas.length === 0) {
    return (
      <BecoSemSaida
        titulo="Não achamos nenhuma conta de anúncio."
        texto="Este perfil do Facebook não tem conta de anúncio ligada a ele. Isso é comum — a maioria das pessoas nunca precisou criar uma. A gente cria junto com você, é rápido."
      />
    );
  }

  if (elegiveis.length === 0) {
    return (
      <BecoSemSaida
        titulo="A conta que achamos não está liberada para anunciar."
        texto={
          contas[0]?.motivoInelegivel ??
          "A conta de anúncio deste perfil está com alguma restrição no Facebook."
        }
        detalhe={contas.map((c) => `${c.nome} — ${c.motivoInelegivel}`)}
      />
    );
  }

  const temInstagram = perfis.some((p) => p.instagramId);

  return (
    <div className="auth-grid">
      <main className="auth-card">
        <p className="eyebrow">Quase lá</p>
        <h1 className="auth-h">Qual conta a gente usa?</h1>
        <p className="auth-sub">
          Achamos {elegiveis.length === 1 ? "uma conta" : `${elegiveis.length} contas`} ligada
          {elegiveis.length === 1 ? "" : "s"} ao seu perfil. Escolha em qual os anúncios vão
          rodar.
        </p>

        {!temInstagram && (
          <div className="trust">
            <b>Não achamos um Instagram profissional</b>
            Dá para seguir só com a conta de anúncio, mas os anúncios ficam melhores quando saem
            do seu perfil.{" "}
            <a
              className="wa"
              href="https://wa.me/5521980351531?text=Oi!%20Conectei%20minha%20conta%20na%20V2G%20mas%20n%C3%A3o%20achou%20meu%20Instagram%20profissional."
              target="_blank"
              rel="noopener"
            >
              Fala com a gente
            </a>{" "}
            que a gente resolve isso junto.
          </div>
        )}

        <FormularioEscolha contas={contas} perfis={perfis} />
      </main>

      <aside className="auth-aside">
        <section className="proof-card">
          <b className="title">Dá para mudar depois</b>
          <p>
            Se escolher a conta errada, é só conectar de novo e escolher outra. Nada fica
            travado, e nenhum anúncio sobe antes de você aprovar.
          </p>
        </section>
      </aside>
    </div>
  );
}

function Aviso({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: { href: string; rotulo: string };
}) {
  return (
    <div className="auth-grid solo">
      <main className="auth-card">
        <h1 className="auth-h">{titulo}</h1>
        <p className="auth-sub">{texto}</p>
        {acao && (
          <a className="cta" href={acao.href}>
            {acao.rotulo}
          </a>
        )}
      </main>
    </div>
  );
}

/**
 * O beco de "nenhuma conta elegível" — o maior ponto de perda do funil.
 * Nunca termina sem caminho: todo texto aqui sai numa pessoa de verdade.
 */
function BecoSemSaida({
  titulo,
  texto,
  detalhe,
}: {
  titulo: string;
  texto: string;
  detalhe?: string[];
}) {
  return (
    <div className="auth-grid solo">
      <main className="auth-card">
        <p className="eyebrow">Precisa de um passo a mais</p>
        <h1 className="auth-h">{titulo}</h1>
        <p className="auth-sub">{texto}</p>

        {detalhe && detalhe.length > 0 && (
          <div className="trust">
            <b>O que encontramos</b>
            {detalhe.map((linha) => (
              <span key={linha} style={{ display: "block", marginTop: 4 }}>
                {linha}
              </span>
            ))}
          </div>
        )}

        <a
          className="cta"
          href="https://wa.me/5521980351531?text=Oi!%20Tentei%20conectar%20minha%20conta%20na%20V2G%20e%20apareceu%20que%20n%C3%A3o%20h%C3%A1%20conta%20de%20an%C3%BAncio%20dispon%C3%ADvel."
          target="_blank"
          rel="noopener"
        >
          Falar com uma pessoa agora
        </a>
        <p className="card-note" style={{ marginTop: 12 }}>
          Resposta em até 2 horas úteis, sem robô. A gente resolve isso junto com você — é o
          passo que mais trava gente, e ninguém precisa passar por ele sozinho.
        </p>
      </main>
    </div>
  );
}
