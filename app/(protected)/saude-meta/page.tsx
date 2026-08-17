import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { consultarPreRequisitos, saude, type CategoriaErro } from "@/lib/backend";

/**
 * Saúde da conta Meta — TELA DE OPERADOR, não de cliente.
 *
 * Linguagem técnica é aceitável aqui: quem lê sabe o que é conta de
 * anúncio, Página e pré-requisito. É o oposto da regra do resto do app.
 *
 * ACESSO: exige `app_metadata.papel === "operador"`. Barrado no
 * `proxy.ts` e de novo aqui (Decisão 3). Fora do menu também — mas isso
 * é conveniência, não controle: quem controla é o papel.
 *
 * NENHUM ENDPOINT DE ESCRITA. `GET /campanhas/pre-requisitos` é read-only
 * e não toca na Meta nem no banco; `GET /saude` não exige token. Dá para
 * recarregar esta tela quantas vezes quiser sem consequência.
 */

export const metadata = { title: "Saúde da conta Meta — V2G" };

// Sem cache: uma tela de diagnóstico que mostra estado velho é pior que
// nenhuma tela, porque o operador toma decisão sobre o passado.
export const dynamic = "force-dynamic";

export default async function SaudeMetaPage() {
  // 2ª camada de proteção (docs/arquitetura.md, Decisão 3). O `proxy.ts`
  // já barrou quem não é operador antes de chegar aqui, mas esta página
  // verifica de novo, independentemente — o proxy pode ter o matcher
  // alterado, ou a rota pode ser alcançada por um caminho que ele não
  // cubra.
  //
  // `notFound()` e não redirect: para quem não é operador, esta rota não
  // existe. Um redirecionamento confirmaria que existe algo aqui, e a
  // primeira coisa que se faz com uma rota que "existe mas nega" é
  // tentar descobrir o que ela mostra.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  // As duas em paralelo: são independentes, e o `/saude` responde em
  // milissegundos enquanto o outro pode levar segundos.
  const [preReq, backend] = await Promise.all([consultarPreRequisitos(), saude()]);

  return (
    <>
      <div className="page-head">
        <h1>Saúde da conta Meta</h1>
        <p>
          Diagnóstico de operador. Lê <code>GET /campanhas/pre-requisitos</code> do backend, que é
          read-only — recarregar não escreve nada, nem aqui nem na Meta.
        </p>
      </div>

      {preReq.ok ? <Veredicto dados={preReq.dados} /> : <Falha categoria={preReq.categoria} http={preReq.http} />}

      <div className="dash-grid">
        <div className="dash-main">
          {preReq.ok && (
            <>
              <Listagem
                titulo="Bloqueios"
                itens={preReq.dados.bloqueios}
                vazio="Nenhum bloqueio. A conta passa na conferência de pré-requisitos."
                critico
              />
              <Listagem
                titulo="Avisos"
                itens={preReq.dados.avisos}
                vazio="Nenhum aviso."
              />
              <WhatsApp estado={preReq.dados.temWhatsapp} />
            </>
          )}

          <AindaNaoExiste />
        </div>

        <aside className="dash-aside">
          <SaudeDoBackend resultado={backend} />
        </aside>
      </div>
    </>
  );
}

/** A faixa: apta ou não. É a única coisa que grita nesta tela. */
function Veredicto({ dados }: { dados: { ok: boolean; bloqueios: string[] } }) {
  const apta = dados.ok;
  return (
    <section className="hero-destaque">
      <span className="eyebrow">Pré-requisitos de publicação</span>
      <p className="hero-frase">
        {apta ? (
          <>
            A conta está <span className="destaque">apta a publicar</span>.
          </>
        ) : (
          <>
            A conta <span className="destaque">não está apta</span> a publicar.
          </>
        )}
      </p>
      <p className="hero-note">
        {apta
          ? "O backend não encontrou nenhum bloqueio. Isso não garante que a criação vá passar — o validate_only do conjunto ainda pode recusar por motivo que este endpoint não checa."
          : `${dados.bloqueios.length} ${dados.bloqueios.length === 1 ? "bloqueio" : "bloqueios"} abaixo, com o texto exato que o backend devolveu.`}
      </p>
    </section>
  );
}

/**
 * Bloqueios e avisos, um por linha, COM O TEXTO DO BACKEND.
 *
 * Sem reescrever, sem "melhorar", sem mapear para mensagem nossa. Numa
 * tela de operador o texto original é o dado — reescrever esconderia
 * justamente a informação que faz alguém entender o que o backend
 * verificou.
 */
function Listagem({
  titulo,
  itens,
  vazio,
  critico = false,
}: {
  titulo: string;
  itens: string[];
  vazio: string;
  critico?: boolean;
}) {
  return (
    <section>
      <div className="section-title">
        <h2>{titulo}</h2>
        <span className="grp-count">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <p className="hint">{vazio}</p>
      ) : (
        <ul className={`diag-lista${critico ? " critica" : ""}`}>
          {itens.map((texto, i) => (
            // Índice como chave: a lista vem do backend, é imutável dentro
            // desta renderização e não tem id. Não há reordenação possível.
            <li key={i}>
              <code>{texto}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * WhatsApp da Página — TRÊS ESTADOS, e o terceiro é o que importa.
 *
 * `null` significa "o backend não informou". NÃO significa "não tem".
 * Esta distinção não é preciosismo: os campos de WhatsApp da Página do
 * Facebook vêm ausentes mesmo quando o número existe, e foi exatamente
 * por tratar ausência como negativa que a interface passou a acusar todo
 * cliente de não ter WhatsApp (`docs/oauth-meta.md` §2.1).
 */
function WhatsApp({ estado }: { estado: boolean | null }) {
  const conteudo =
    estado === true
      ? {
          pill: "ok",
          rotulo: "Tem WhatsApp",
          texto: "O backend confirmou número de WhatsApp vinculado à Página.",
        }
      : estado === false
        ? {
            pill: "crit",
            rotulo: "Sem WhatsApp",
            texto:
              "O backend afirma que não há WhatsApp vinculado. Campanha de conversa não sobe assim — ver /whatsapp-business.",
          }
        : {
            pill: "off",
            rotulo: "Não informado",
            texto:
              "O campo tem_whatsapp veio ausente ou não-booleano. Isso NÃO é 'não tem': é falta de informação. Não conclua nada a partir daqui — quem dá o veredicto confiável é o validate_only do conjunto, que reprova com subcode 2446885 quando o número é conta pessoal.",
          };

  return (
    <section>
      <div className="section-title">
        <h2>WhatsApp da Página</h2>
        <span className={`pill ${conteudo.pill}`}>{conteudo.rotulo}</span>
      </div>
      <p className="hint">{conteudo.texto}</p>
    </section>
  );
}

/**
 * Os textos de falha, um por categoria.
 *
 * Cada um diz O QUE FAZER, porque numa tela de operador "erro" sem
 * próximo passo é só um beco. E `certificado` recebe atenção especial:
 * ela não é instabilidade, e sem dizer isso alguém fica recarregando.
 */
const FALHAS: Record<CategoriaErro, { titulo: string; texto: string; recarregar: boolean }> = {
  indisponivel: {
    titulo: "Backend não configurado neste ambiente",
    texto:
      "Faltam V2G_BACKEND_URL ou V2G_BACKEND_TOKEN nas variáveis de ambiente deste deploy. Recarregar não resolve — as variáveis precisam ser preenchidas e o processo reiniciado.",
    recarregar: false,
  },
  certificado: {
    titulo: "Certificado HTTPS do backend não é confiável",
    texto:
      "O TLS do backend não validou. NÃO É INSTABILIDADE E RECARREGAR NÃO VAI RESOLVER — é configuração do outro lado. Confira no log do servidor o codigo= da linha [backend:…]: DEPTH_ZERO_SELF_SIGNED_CERT significa certificado autoassinado, e o conserto é emitir o certificado do domínio no Easypanel. Desabilitar a verificação não é opção: aceitaria qualquer certificado no caminho e abriria interceptação do X-V2G-Token.",
    recarregar: false,
  },
  nao_autorizado: {
    titulo: "Backend recusou o token (401 ou 403)",
    texto:
      "O X-V2G-Token está errado, ausente ou foi revogado. Isso é configuração nossa, não sessão do usuário. Confira se o valor no deploy é o mesmo que o backend espera.",
    recarregar: false,
  },
  rede: {
    titulo: "Não conseguimos alcançar o backend",
    texto:
      "DNS ou conexão. Veja o codigo= no log: ENOTFOUND é nome que não resolve, ECONNREFUSED é porta fechada. Recarregar pode resolver se for intermitente.",
    recarregar: true,
  },
  tempo_esgotado: {
    titulo: "O backend não respondeu no tempo",
    texto:
      "A chamada passou do timeout. Este endpoint é read-only e rápido — se está estourando, o backend está sob carga ou travado. Vale recarregar uma vez.",
    recarregar: true,
  },
  nao_encontrado: {
    titulo: "Endpoint não encontrado (404)",
    texto:
      "A rota /campanhas/pre-requisitos não existe na versão do backend que está no ar — e hoje é esse o estado. O token autentica (senão viria 401, que a checagem de header devolve antes do roteamento), mas a rota não está publicada. Confira a lista real em GET /openapi.json: se ela não aparecer ali, não é problema de configuração deste lado.",
    recarregar: false,
  },
  conflito: {
    titulo: "Conflito de estado (409)",
    texto:
      "Inesperado num endpoint read-only. Se aparecer, o endpoint deixou de ser read-only e este código precisa ser revisto.",
    recarregar: false,
  },
  dados_invalidos: {
    titulo: "O backend recusou os parâmetros",
    texto:
      "Algum query param foi rejeitado. Esta tela chama sem filtros, então isso indica mudança de contrato no backend.",
    recarregar: false,
  },
  servidor: {
    titulo: "O backend quebrou (5xx)",
    texto: "Erro do lado da API. O traceback está no log do backend, não aqui.",
    recarregar: true,
  },
  resposta_ilegivel: {
    titulo: "Resposta 200 com corpo fora do formato",
    texto:
      "O backend respondeu com sucesso, mas o corpo não passou na validação — ok não é booleano, ou bloqueios/avisos não são listas de texto. Isso é mudança de contrato, e o validador em lib/backend/pre-requisitos.ts precisa ser ajustado ao formato novo. Não ajuste a tela para 'aceitar': ela deixaria de saber o que está mostrando.",
    recarregar: false,
  },
};

function Falha({ categoria, http }: { categoria: CategoriaErro; http?: number }) {
  const f = FALHAS[categoria];
  return (
    <section className="fail-block">
      <b>{f.titulo}</b>
      <p style={{ marginTop: 8 }}>{f.texto}</p>
      <p className="diag-meta">
        categoria=<code>{categoria}</code>
        {http !== undefined && (
          <>
            {" · "}http=<code>{http}</code>
          </>
        )}
        {" · "}
        {f.recarregar ? "recarregar pode ajudar" : "recarregar NÃO vai ajudar"}
      </p>
    </section>
  );
}

/**
 * `GET /saude` do backend. Não exige token, então responde mesmo quando o
 * token está errado — e é isso que a torna útil aqui: separa "backend
 * fora do ar" de "backend de pé recusando o nosso token".
 *
 * O corpo é exibido como veio. É diagnóstico, e o operador precisa do
 * dado cru, não da nossa interpretação dele.
 */
function SaudeDoBackend({ resultado }: { resultado: Awaited<ReturnType<typeof saude>> }) {
  return (
    <section className="trust support-block">
      <b>Backend (GET /saude)</b>
      {resultado.ok ? (
        <>
          Respondeu. Corpo cru:
          <pre className="diag-json">{JSON.stringify(resultado.dados, null, 2)}</pre>
        </>
      ) : (
        <>
          Não respondeu — categoria <code>{resultado.categoria}</code>.
          <br />
          Como este endpoint não exige token, falha aqui aponta para rede, TLS ou backend fora do
          ar, e não para credencial errada.
        </>
      )}
    </section>
  );
}

/**
 * O espaço do que ainda não existe.
 *
 * Sem número nenhum, nem de exemplo. Diz o que falta acontecer para o
 * dado existir — que é a informação útil enquanto ele não existe.
 */
function AindaNaoExiste() {
  return (
    <section>
      <div className="section-title">
        <h2>Ainda sem endpoint</h2>
      </div>
      <div className="card acct-list">
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Saldo e forma de pagamento da conta de anúncio</b>
            <span>
              Depende de leitura de <code>funding_source</code> na Marketing API. Não existe rota no
              backend, e o front não consulta a Meta direto para isso.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Campanhas no ar</b>
            <span>
              Hoje toda campanha nasce PAUSED e nada é ativado por código. Este bloco só passa a ter
              conteúdo quando existir ativação — e ela é feita pelo gestor, na Meta.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Resultados: gasto, conversas, custo por conversa</b>
            <span>
              Depende de <code>/insights</code>, que não está implementado em nenhum dos dois lados.
              Enquanto não estiver, não há número para mostrar aqui.
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   VISIBILIDADE — como eu marcaria conta interna

   Hoje esta rota está protegida apenas por SESSÃO: qualquer cliente
   logado que descubra a URL vê o diagnóstico. Não vaza dado de outro
   cliente (o backend responde sobre a conta configurada), mas expõe
   linguagem interna e nomes de endpoint. Fora do menu, como pedido.

   COMO EU MARCARIA, em ordem de preferência:

   1. `app_metadata.papel = "operador"` no usuário do Supabase Auth.
      É o certo: `app_metadata` NÃO é gravável pelo próprio usuário (só
      pela service_role), vem dentro do JWT, e o `proxy.ts` pode barrar
      sem consultar o banco. Custo: um script de administração para
      marcar quem é operador.

   2. `profiles.papel text` com check constraint.
      Mais simples de mexer, e a RLS consegue usar. Custo: uma consulta
      por request no proxy, e o proxy hoje não consulta tabela nenhuma.

   3. Lista de e-mails numa variável de ambiente.
      Interino de dez minutos. Serve para hoje, mas exige deploy para
      mudar e não sobrevive ao primeiro operador novo.

   RECOMENDAÇÃO: (1), e enquanto ele não existir, manter fora do menu como
   está. O que eu NÃO faria é esconder por obscuridade e chamar de
   controle de acesso — por isso está escrito aqui, em vez de implícito.
   ============================================================ */
