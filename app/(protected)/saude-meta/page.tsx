import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formatarConfianca,
  listarEmRevisao,
  saude,
  type CategoriaErro,
  type ExecucaoEmRevisao,
} from "@/lib/backend";
import { vigiarExecucoes, type Vigilancia as VigilanciaDados } from "@/lib/pipeline/vigilancia";
import { MINUTOS_ATE_DEMORANDO, MINUTOS_ATE_PARADA } from "@/lib/pipeline/relogios";

/**
 * Fila de revisão — TELA DE OPERADOR, não de cliente.
 *
 * Linguagem técnica é aceitável aqui: quem lê sabe o que é gate de
 * confiança e nome de agente. É o oposto da regra do resto do app.
 *
 * A TELA MUDOU DE FONTE. Nasceu apontando para
 * `GET /campanhas/pre-requisitos`, que **não existe** no backend
 * publicado — 404. Agora lê `GET /execucoes-em-revisao`, que existe, é
 * read-only e mostra o que está travado no gate de confiança. O cliente
 * de pré-requisitos fica guardado em `lib/backend/pre-requisitos.ts`.
 * Ver `docs/backend-integracao.md` §6.0 e §7.
 *
 * ACESSO: exige `app_metadata.papel === "operador"`. Barrado no
 * `proxy.ts` e de novo aqui (Decisão 3).
 *
 * NENHUM ENDPOINT DE ESCRITA. As duas chamadas são GET e não tocam na
 * Meta nem no banco. Dá para recarregar quantas vezes quiser.
 */

export const metadata = { title: "Fila de revisão — V2G" };

// Sem cache: uma tela de diagnóstico que mostra estado velho é pior que
// nenhuma tela, porque o operador decide sobre o passado.
export const dynamic = "force-dynamic";

export default async function SaudeMetaPage() {
  // 2ª camada de proteção (docs/arquitetura.md, Decisão 3). O `proxy.ts`
  // já barrou antes, mas esta página verifica de novo — o matcher do
  // proxy pode mudar, e a rota pode ser alcançada por caminho que ele
  // não cubra.
  //
  // `notFound()` e não redirect: para quem não é operador esta rota não
  // existe. Redirecionar confirmaria que há algo aqui, e a primeira coisa
  // que se faz com uma rota que nega é descobrir o que ela mostra.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  const agora = new Date();
  const [fila, backend, vigilancia] = await Promise.all([
    listarEmRevisao(),
    saude(),
    vigiarExecucoes(agora),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Fila de revisão</h1>
        <p>
          Execuções presas no gate de confiança. Lê <code>GET /execucoes-em-revisao</code>, que é
          read-only — recarregar não escreve nada.
        </p>
      </div>

      {fila.ok ? (
        <Veredicto quantas={fila.dados.length} />
      ) : (
        <Falha categoria={fila.categoria} http={fila.http} />
      )}

      <div className="dash-grid">
        <div className="dash-main">
          {fila.ok && <Fila execucoes={fila.dados} />}
          <Vigilancia dados={vigilancia} />
          <NaoVemNaResposta />
        </div>

        <aside className="dash-aside">
          <SaudeDoBackend resultado={backend} />
        </aside>
      </div>
    </>
  );
}

/** A faixa: quantas estão paradas. É a única coisa que grita. */
function Veredicto({ quantas }: { quantas: number }) {
  return (
    <section className="hero-destaque">
      <span className="eyebrow">Gate de confiança</span>
      {quantas === 0 ? (
        <p className="hero-frase">
          Nada <span className="destaque">travado</span> na fila.
        </p>
      ) : (
        <>
          <p className="hero-num">{quantas}</p>
          <p className="hero-legenda">
            {quantas === 1 ? "execução esperando revisão" : "execuções esperando revisão"}
          </p>
        </>
      )}
      <p className="hero-note">
        {quantas === 0
          ? "Nenhuma execução com requer_revisao verdadeiro."
          : "A resposta não traz data de nenhum tipo, então não há como ordenar por tempo de espera nem dizer há quanto tempo cada uma está parada. A ordem abaixo é a que o backend devolveu."}
      </p>
    </section>
  );
}

/**
 * O que ficou pelo caminho. Bloco novo do lote E.
 *
 * NÃO VEM DA API — vem da tabela, pelo `service_role`. A API não expõe
 * campo de tempo nenhum, e sem tempo não dá para dizer que algo parou.
 * As colunas `criado_em`/`atualizado_em` existem na tabela e é delas que
 * este bloco vive. Ver `lib/pipeline/vigilancia.ts`.
 *
 * `null` é estado próprio e não vira lista vazia: "não consegui olhar" e
 * "não há nada parado" são coisas diferentes, e a segunda é a que
 * tranquiliza. Trocar uma pela outra é o jeito mais fácil de esta tela
 * mentir.
 */
function Vigilancia({ dados }: { dados: VigilanciaDados | null }) {
  if (dados === null) {
    return (
      <section>
        <div className="section-title">
          <h2>O que ficou pelo caminho</h2>
        </div>
        <p className="lr-erro">
          Não conseguimos ler a tabela de execuções agora. Isto <b>não</b> quer dizer que não há
          nada parado — quer dizer que não foi possível olhar.
        </p>
      </section>
    );
  }

  const { paradas, orfas, disparosPresos, total } = dados;
  const quantos = paradas.length + orfas.length + disparosPresos.length;

  return (
    <section>
      <div className="section-title">
        <h2>O que ficou pelo caminho</h2>
        <span className="grp-count">{quantos}</span>
      </div>

      <div className="card acct-list">
        {quantos === 0 && (
          <div className="acct-row" aria-disabled="true">
            <span className="ar-text">
              <b>Nada parado.</b>
              <small>
                {total} {total === 1 ? "execução lida" : "execuções lidas"} na tabela, todas com
                movimento recente ou já encerradas.
              </small>
            </span>
          </div>
        )}

        {paradas.map((e) => (
          <div className="acct-row" key={e.id}>
            <span className="ar-text">
              <b>
                {e.nomeDoNegocio ?? e.nomeNaExecucao ?? "(sem negócio ligado)"}
                {" · "}
                {e.status}
              </b>
              <small>
                sem mudança há {e.minutosParada ?? "?"} min
                {e.andamento === "parada" ? " — tratada como parada" : " — está demorando"}
              </small>
            </span>
            <span className="pill off">{e.andamento}</span>
          </div>
        ))}

        {orfas.map((e) => (
          <div className="acct-row" key={`orfa-${e.id}`}>
            <span className="ar-text">
              <b>{e.nomeNaExecucao ?? "(sem nome)"} · órfã</b>
              <small>
                sem <code>business_id</code> e sem <code>cliente_id</code>: não dá para saber de
                qual negócio veio. Criada em {e.criadoEm?.slice(0, 10) ?? "data desconhecida"}.
              </small>
            </span>
            <span className="pill off">{e.status}</span>
          </div>
        ))}

        {disparosPresos.map((d) => (
          <div className="acct-row" key={`preso-${d.businessId}`}>
            <span className="ar-text">
              <b>{d.nome} · disparo preso</b>
              <small>
                em <code>enviando</code> há {d.desdeMin} min. A trava é de 2 min, então a
                tentativa morreu no meio — a próxima gravação de campo do cliente reconcilia
                sozinha.
              </small>
            </span>
            <span className="pill off">enviando</span>
          </div>
        ))}
      </div>

      <p className="diag-meta">
        Os cortes de {MINUTOS_ATE_DEMORANDO} e {MINUTOS_ATE_PARADA} minutos são{" "}
        <b>chute, sem medição</b> — ninguém cronometrou um pipeline ainda. Ajustáveis por{" "}
        <code>V2G_MIN_ATE_DEMORANDO</code> e <code>V2G_MIN_ATE_PARADA</code>.{" "}
        <code>aguardando_fotos</code> fica de fora da conta: não é a gente que está parada, é o
        cliente que ainda não mandou foto.
      </p>
    </section>
  );
}

function Fila({ execucoes }: { execucoes: ExecucaoEmRevisao[] }) {
  if (execucoes.length === 0) return null;
  return (
    <section>
      <div className="section-title">
        <h2>Execuções</h2>
        <span className="grp-count">{execucoes.length}</span>
      </div>
      <div className="campaign-list">
        {execucoes.map((e) => (
          <Execucao key={e.id} e={e} />
        ))}
      </div>
    </section>
  );
}

function Execucao({ e }: { e: ExecucaoEmRevisao }) {
  return (
    <div className="list-row">
      <div className="lr-head">
        {/* O identificador é o `id_execucao`. Encurtado para caber, com o
            completo no `title` — operador precisa copiar o valor inteiro
            para consultar /execucoes/{id}. */}
        <span className="lr-title">
          <code title={e.id}>{e.id.slice(0, 8)}</code>
          {e.nomeCampanha && <span className="lr-nome"> {e.nomeCampanha}</span>}
        </span>
        <span className="pill off">{e.status}</span>
      </div>

      {/* NOME DA CAMPANHA, NÃO DO NEGÓCIO. A resposta não tem nome de
          negócio em campo nenhum — só o nome que o agente de estrutura
          gerou. Apresentar um como o outro seria inventar o dado. */}
      {e.nomeCampanha ? (
        <p className="diag-meta">nome gerado pelo agente de estrutura — não é o nome do negócio</p>
      ) : (
        <p className="diag-meta">sem nome: o agente de estrutura não rodou nesta execução</p>
      )}

      <div className="diag-campos">
        <Campo rotulo="Nicho" valor={e.nichoLegivel ?? "não classificado"} />
        <Campo
          rotulo="Confiança mínima"
          valor={
            e.confiancaMinima !== null ? formatarConfianca(e.confiancaMinima) : "não calculada"
          }
        />
        <Campo rotulo="Aprovações" valor={String(e.quantasAprovacoes)} />
        <Campo rotulo="Agentes que rodaram" valor={String(e.agentesQueRodaram.length)} />
      </div>

      <OQueTravou e={e} />

      {/* As confianças por agente só aparecem quando `confianca_minima`
          veio nula — aí elas são a única informação de confiança que
          existe. Com o campo preenchido, repetir isso é ruído. */}
      {e.confiancaMinima === null && e.confiancas.length > 0 && (
        <p className="diag-meta">
          confiança por agente:{" "}
          {e.confiancas.map((c) => `${c.agente} ${formatarConfianca(c.valor)}`).join(" · ")}
        </p>
      )}
    </div>
  );
}

/**
 * O QUE TRAVOU.
 *
 * `motivos_revisao` é a fonte preferida e vem preenchida em 28 das 29
 * execuções da fila real, no formato `"<agente>: confianca 0.52"` — ela
 * traz o agente E o número que reprovou.
 *
 * `agentesQueTravaram` é o plano B, derivado do `requer_revisao` que cada
 * agente carrega em si. Ele cobre a execução legada, onde `motivos` vem
 * vazio.
 *
 * OS DOIS NUNCA APARECEM JUNTOS: em 28 dos 29 casos diriam a mesma coisa,
 * e a segunda lista leria como se fossem problemas diferentes.
 */
function OQueTravou({ e }: { e: ExecucaoEmRevisao }) {
  if (e.motivosRevisao.length > 0) {
    return (
      <ul className="diag-lista critica" style={{ marginTop: 10 }}>
        {e.motivosRevisao.map((m, i) => (
          <li key={i}>
            <code>{m}</code>
          </li>
        ))}
      </ul>
    );
  }

  if (e.agentesQueTravaram.length > 0) {
    return (
      <>
        <ul className="diag-lista critica" style={{ marginTop: 10 }}>
          {e.agentesQueTravaram.map((agente) => (
            <li key={agente}>
              <code>{agente}</code> pediu revisão
            </li>
          ))}
        </ul>
        <p className="diag-meta">
          motivos_revisao veio vazio — isto é derivado do requer_revisao de cada agente
        </p>
      </>
    );
  }

  return (
    <p className="lr-erro">
      requer_revisao é verdadeiro, mas motivos_revisao veio vazio e nenhum agente marcou
      requer_revisao em si mesmo. O backend não informa o que travou.
    </p>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span className="diag-campo">
      <span className="dc-rotulo">{rotulo}</span>
      <span className="dc-valor">{valor}</span>
    </span>
  );
}

/**
 * O que a resposta NÃO traz.
 *
 * Fica na tela, e não só no comentário do código, porque a primeira coisa
 * que um operador faz ao não ver o tempo de espera é procurar o filtro.
 * Dizer que o dado não existe economiza essa busca — e impede que alguém
 * "conserte" a tela adicionando um campo inventado.
 */
function NaoVemNaResposta() {
  return (
    <section>
      <div className="section-title">
        <h2>O que a resposta não traz</h2>
      </div>
      <div className="card acct-list">
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Há quanto tempo está parado</b>
            <span>
              <code>RespostaExecucao</code> não tem <code>criado_em</code> nem{" "}
              <code>atualizado_em</code> — conferido no <code>/openapi.json</code>, e{" "}
              <code>GET /execucoes/{"{id}"}</code> devolve o mesmo schema. Não há como calcular nem
              estimar.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Nome do negócio</b>
            <span>
              Não existe em campo nenhum. O que aparece acima é o nome da campanha gerada, de{" "}
              <code>resultados[&quot;estruturar-campanha&quot;]</code>, e só nas execuções em que
              esse agente rodou.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Qual cliente é</b>
            <span>
              <code>cliente_id</code> existe no schema mas veio nulo em toda a fila. Sem ele não dá
              para ligar a execução a um cliente do nosso banco.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Escala única de confiança</b>
            <span>
              <code>confianca_minima</code> vem sempre em 0–1. As confianças por agente também —
              exceto na execução legada de status <code>gerado</code>, onde vêm em 0–100. A tela
              detecta a escala por valor e mostra em porcentagem; onde não dá para desambiguar, o
              número cru aparece do lado.
            </span>
          </span>
        </div>
        <div className="acct-row" aria-disabled="true">
          <span className="ar-text">
            <b>Pré-requisitos da conta Meta</b>
            <span>
              <code>GET /campanhas/pre-requisitos</code> não está publicado — devolve 404. O cliente
              está escrito e testado, esperando a rota subir.
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * Os textos de falha, um por categoria. Cada um diz O QUE FAZER, porque
 * numa tela de operador "erro" sem próximo passo é só um beco.
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
      "O TLS não validou. NÃO É INSTABILIDADE E RECARREGAR NÃO VAI RESOLVER — é configuração do outro lado. Veja o codigo= na linha [backend:…] do log: DEPTH_ZERO_SELF_SIGNED_CERT é certificado autoassinado, e o conserto é emitir o do domínio. Desabilitar a verificação não é opção: aceitaria qualquer certificado no caminho e abriria interceptação do X-V2G-Token.",
    recarregar: false,
  },
  nao_autorizado: {
    titulo: "Backend recusou o token (401 ou 403)",
    texto:
      "O X-V2G-Token está errado, ausente ou foi revogado. É configuração nossa, não sessão do usuário. A checagem do header roda antes do roteamento, então 401 aqui significa token — não rota.",
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
      "A chamada passou do timeout. Este endpoint é read-only e rápido — se está estourando, o backend está sob carga ou travado.",
    recarregar: true,
  },
  nao_encontrado: {
    titulo: "Endpoint não encontrado (404)",
    texto:
      "A rota /execucoes-em-revisao não respondeu. Como o token autentica antes do roteamento, 404 aqui é rota ausente, não credencial. Confira a lista real em GET /openapi.json — é a fonte de verdade, e o handoff do backend já divergiu dela antes.",
    recarregar: false,
  },
  conflito: {
    titulo: "Conflito de estado (409)",
    texto:
      "Inesperado num endpoint read-only. Se aparecer, ele deixou de ser read-only e este código precisa ser revisto.",
    recarregar: false,
  },
  dados_invalidos: {
    titulo: "O backend recusou a requisição",
    texto:
      "Esta chamada não manda parâmetro nenhum, então isso indica mudança de contrato no backend.",
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
      "O backend respondeu com sucesso, mas o corpo não passou na validação — não era array, ou os itens não têm id_execucao e requer_revisao. Isso é mudança de contrato, e o validador em lib/backend/execucoes.ts precisa ser ajustado ao formato novo. Não ajuste a tela para 'aceitar': ela deixaria de saber o que mostra.",
    recarregar: false,
  },
};

function Falha({ categoria, http }: { categoria: CategoriaErro; http?: number }) {
  const f = FALHAS[categoria];
  return (
    <section className="fail-block">
      <b className="title">{f.titulo}</b>
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
 * O corpo é exibido como veio. É diagnóstico: o operador precisa do dado
 * cru, não da nossa interpretação dele.
 */
function SaudeDoBackend({ resultado }: { resultado: Awaited<ReturnType<typeof saude>> }) {
  return (
    <section className="trust support-block">
      <b className="title">Backend (GET /saude)</b>
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
