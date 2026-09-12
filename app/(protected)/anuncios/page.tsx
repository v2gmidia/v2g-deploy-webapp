import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { Pill } from "@/components/ui/Pill";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { COLUNAS_DO_JULGAMENTO, foiReprovada } from "@/lib/criativos/peca";
import { HeroDaEtapa } from "@/components/ui/HeroDaEtapa";
import { resultadoDoNegocio } from "@/lib/resultado/do-negocio";
import { diaPorExtenso } from "@/lib/formato";
import { fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import type { CampanhaNaTela } from "@/lib/resultado/do-negocio";
import type { ValorNaTela } from "@/lib/resultado/tipos";
import type { Etapa } from "@/lib/estado/frases";

/**
 * Seus anúncios — e, desde 10/09/2026, **a tela de resultado**.
 *
 * POR QUE FUNDIR: o cliente não separa a campanha do criativo. Para ele,
 * "meu anúncio" é a foto e o dinheiro por trás dela, juntos. Ter dois
 * itens de menu para isso era raciocínio de gestor de tráfego vazando na
 * interface — quem trabalha com tráfego separa porque precisa mexer nas
 * duas coisas em momentos diferentes; o dono da pizzaria olha o anúncio e
 * pergunta "está rendendo?".
 *
 * ============================================================
 * A FONTE É A API DO BACKEND. `metrics_daily` SAIU.
 *
 * Até 10/09/2026 os números desta tela vinham de `metrics_daily`, com
 * `Number(m.spend ?? 0)` somando — e essa tabela tem ZERO LINHAS. Cada
 * `?? 0` transformava "não sabemos" em "R$ 0,00 investido", que é uma
 * afirmação sobre o dinheiro do cliente, e falsa.
 *
 * Agora quem responde é `lib/resultado/do-negocio.ts`, que lê
 * `GET /negocios/{id}/consolidado` e, para cada ficha de `porExecucao`,
 * `GET /execucoes/{id}/consolidado`. **A ordem é a segurança** — ver o
 * bloco daquele arquivo.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA TELA NÃO MOSTRA MAIS, E POR QUÊ.
 *
 *   "R$ X por conversa"   custo derivado. O contrato do dashboard proíbe:
 *                         é a porta de entrada para o dono comparar com um
 *                         número que ouviu de alguém, e o produto compara
 *                         com o CPL-alvo DELE, que ainda não existe.
 *
 *   "os primeiros números  promessa de prazo. Ninguém aqui mede quando a
 *    aparecem em até 48    plataforma entrega — e o contrato é explícito:
 *    horas"                nada de prazo, desculpa, ou ação que o dono não
 *                         possa executar sozinho.
 *
 *   pílula verde/vermelha  semáforo. Sem CPL-alvo, cor é opinião fingindo
 *                         ser medida. A pílula aqui é `off` — cinza — para
 *                         TODOS os estados, sempre.
 *
 * `pnpm conferir:resultado` §10 lê este arquivo e reprova se voltarem.
 * ============================================================
 */
export default async function AnunciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A resposta para "o que falta" vem pronta e é a MESMA que o `/inicio` e
  // a trilha do onboarding leem. O que muda daqui para lá é o
  // enquadramento, não o fato — ver docs/estado-do-cliente.md §3.
  const estado = await estadoDoCliente(new Date());

  const { data: criativos } = await supabase
    .from("creatives")
    // `COLUNAS_DO_JULGAMENTO` traz `uso, status, arquivado_em` — sem
    // `arquivado_em` no select, o `foiReprovada` lá embaixo vira regra
    // inerte em silêncio.
    .select(`id, campaign_id, file_name, ${COLUNAS_DO_JULGAMENTO}`)
    .order("created_at", { ascending: false });

  const pecas = criativos ?? [];

  const resultado =
    user && estado.negocioId
      ? await resultadoDoNegocio({ businessId: estado.negocioId, profileId: user.id })
      : null;

  // ============================================================
  // "NÃO TEM CAMPANHA" E "O BACKEND ESTÁ FORA" SÃO TELAS DIFERENTES.
  //
  // Confundir os dois faria a tela dizer a um cliente pagante que ele não
  // tem anúncio nenhum porque um servidor piscou. É a mesma família da
  // `/inicio` degradando calada, que este repositório já pagou.
  // ============================================================
  if (resultado === null || resultado.estado === "sem-execucao") {
    return <SemAnuncioNenhum proximo={estado.proximo} fotos={estado.melhoras.fotos} />;
  }

  // O `foiReprovada` no lugar do `p.status === "rejected"` escrito à mão:
  // peça de campanha ARQUIVADA e reprovada vazava e continuaria aparecendo
  // em "precisa de você" para sempre. Ver docs/lote-leitura-de-peca.md §5.1.
  const reprovadas = pecas.filter(foiReprovada);

  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>Cada anúncio e o que ele produziu até agora.</p>
        {/* ============================================================
            A ÚNICA AFIRMAÇÃO DE VEICULAÇÃO DESTA TELA. ITENS B3 e C6.

            No nível do NEGÓCIO, porque é o nível em que o backend
            responde: `veiculacao` só existe em
            `GET /negocios/{id}/execucao`. A frase vem do banco de frases
            de `lib/veiculacao/estado.ts` — esta tela não escreve texto de
            veiculação e não compara o estado com literal nenhum.

            `nao_sabemos` também tem frase, e ela aparece: sumir com a
            linha quando a leitura falha faria a tela ficar calada
            exatamente no caso em que ela devia admitir. É a mesma regra
            do `estado: "indisponivel"` logo abaixo.
            ============================================================ */}
        <p className="res-veiculacao">
          {fraseDeVeiculacao(estado.veiculacao, "manchete")}{" "}
          <span className="hint-inline">
            {fraseDeVeiculacao(estado.veiculacao, "apoio")}
          </span>
        </p>
      </div>

      {reprovadas.length > 0 ? (
        <section className="hero-destaque">
          <span className="eyebrow">Precisa de você</span>
          <p className="hero-frase">
            {reprovadas.length === 1 ? "Uma peça" : `${reprovadas.length} peças`} não{" "}
            {reprovadas.length === 1 ? "passou" : "passaram"} na{" "}
            <span className="destaque">revisão do Facebook</span>.
          </p>
          <p className="hero-note">
            Acontece com frequência e seus outros anúncios não são afetados. A IA já está
            refazendo.
          </p>
          <a className="cta cta-faixa" href="/reprovado">
            Ver o que aconteceu
          </a>
        </section>
      ) : (
        estado.proximo && <HeroDaEtapa etapa={estado.proximo} />
      )}

      <div className="dash-grid">
        <div className="dash-main">
          {resultado.estado === "indisponivel" ? (
            <BackendNaoRespondeu />
          ) : (
            <>
              {/* ============================================================
                  UM CARD POR CAMPANHA, E É ISSO QUE IMPEDE A SOMA ENTRE
                  MOEDAS.

                  Cada card carrega a própria moeda, vinda do topo do
                  consolidado daquela execução. Não existe totalizador nesta
                  tela — e por isso não existe o lugar onde R$ 73,25 e
                  A$ 113,45 virariam um número que não existe.
                  ============================================================ */}
              <section>
                <div className="section-title">
                  {/* N6 do QA: era "Seus anúncios" de novo, igual ao
                      `<h1>` três blocos acima. Título repetido não
                      organiza nada — ensina o olho a pular. Este bloco é
                      a lista em si, então ele diz o que a lista mostra. */}
                  <h2>O que cada um produziu</h2>
                  <span className="grp-count">
                    {resultado.campanhas.length}{" "}
                    {resultado.campanhas.length === 1 ? "anúncio" : "anúncios"}
                  </span>
                </div>
                <div className="res-lista">
                  {resultado.campanhas.map((c) => (
                    <Campanha key={c.idExecucao} campanha={c} />
                  ))}
                </div>
              </section>

              {resultado.moedasMisturadas && (
                <p className="hint">
                  Seus anúncios cobram em moedas diferentes ({resultado.moedas.join(", ")}), então
                  eles aparecem separados. Somar um com o outro daria um número que não existe.
                </p>
              )}

              {/* ============================================================
                  A RESPOSTA DO DONO — UMA VEZ, E DEPOIS DOS CARDS. ITEM B2.

                  DEPOIS e não antes, de propósito: os cards são o que a
                  PLATAFORMA mediu, e este bloco é o que o DONO contou. Pôr
                  a contagem dele no topo faria dela o assunto da tela, e o
                  assunto é o anúncio.

                  Uma vez porque a pergunta foi feita uma vez. Ele responde
                  "quantas vendas ontem?" sobre o negócio dele, não sobre
                  uma campanha — ver `lib/resultado/tipos.ts`, com a
                  medição das duas execuções da V2G que fechou o assunto.
                  ============================================================ */}
              {resultado.doDono?.respondeu && (
                <section className="res-do-dono">
                  <div className="section-title">
                    <h2>O que você contou</h2>
                    <span className="st-note">
                      Isto é o que você respondeu, não o que a plataforma mediu.
                    </span>
                  </div>
                  <div className="res-grid">
                    <Numero valor={resultado.doDono.vendas} rotulo="Vendas que você confirmou">
                      <IconeCarrinho />
                    </Numero>
                    <Numero valor={resultado.doDono.voltou} rotulo="Voltou em vendas">
                      <IconeSeta />
                    </Numero>
                  </div>
                </section>
              )}
            </>
          )}

          {/* SÓ peça de anúncio. O filtro por `uso` é o conserto: sem ele,
              esta seção listava o logo do cliente sob o título "Fotos
              guardadas". As fotos do cliente moram na `/conta`. */}
          <PecasSemAnuncio pecas={pecas.filter((p) => p.uso === "campanha" && !p.campaign_id)} />

          <PecaPronta />
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
          <section className="trust support-block">
            <b className="title">Ficou com dúvida?</b>
            Gente de verdade responde, sem robô, em até 2 horas úteis.
            <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
              Chamar no WhatsApp &rarr;
            </a>
          </section>
        </aside>
      </div>
    </>
  );
}

/**
 * Um número da campanha.
 *
 * ============================================================
 * PRESENTE É NÚMERO GRANDE; AUSENTE É TRAVESSÃO CINZA COM UMA LINHA
 * EXPLICANDO. E A DIFERENÇA VEM DO CAMPO `ausente`, NUNCA DE COMPARAR
 * O TEXTO.
 *
 * O travessão é do wireframe `resultados-nao-medidos`: o número que não
 * existe ocupa o MESMO lugar e o MESMO tamanho do número que existe, em
 * cinza, e leva embaixo o motivo. Antes desta etapa a ausência saía como
 * "investido — ainda não sabemos" numa linha corrida, do tamanho do
 * texto de apoio: honesto, mas o dono lia a ficha inteira sem perceber
 * que faltava alguma coisa.
 *
 * `valor.texto` continua sendo quem escreve o motivo — a camada de
 * leitura é dona dessa frase. Esta tela não a reescreve; só a coloca
 * embaixo do travessão em vez de no meio da linha.
 *
 * Uma tela que comparasse `texto === "ainda não sabemos"` para descobrir
 * isso quebraria no dia em que a frase mudasse.
 * ============================================================
 */
function Numero({
  valor,
  rotulo,
  children,
}: {
  valor: ValorNaTela;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className={valor.ausente ? "res-num vazio" : "res-num"}>
      <span className="res-num-ico" aria-hidden="true">
        {children}
      </span>
      <span className="res-num-corpo">
        <span className="res-num-rotulo">{rotulo}</span>
        {valor.ausente ? (
          <>
            {/* O travessão é decoração: quem lê por leitor de tela ouve a
                frase inteira, não um traço solto. */}
            <span className="res-num-valor" aria-hidden="true">
              &mdash;
            </span>
            <span className="res-num-vazio-nota">{valor.texto}</span>
          </>
        ) : (
          <span className="res-num-valor">{valor.texto}</span>
        )}
      </span>
    </div>
  );
}

/**
 * O backend não respondeu — e isso NÃO é "você não tem anúncio".
 *
 * ============================================================
 * A PALAVRA "ERRO" NÃO APARECE, E NÃO É DELICADEZA.
 *
 * O dono não cometeu erro nenhum e não tem o que consertar. Dizer
 * "erro" faria ele procurar culpa — a dele, provavelmente — numa tela
 * onde a única informação útil é que a CAMPANHA dele não mudou por
 * causa disso.
 *
 * O wireframe `v2g-dashboard-falha-*` traz mais três coisas que não
 * entraram, por não terem fonte:
 *
 *   "Última atualização: hoje, 09:40"  nada registra esse instante
 *   "Ver campanha"                     não existe rota de detalhe ainda
 *   pílula verde "No ar"               não existe status de plataforma
 *
 * Botão que não leva a lugar nenhum ensina que a função existe e está a
 * um clique. Então a v0 omite, em vez de desabilitar.
 * ============================================================
 */
function BackendNaoRespondeu() {
  return (
    <section className="res-falha">
      <div className="res-falha-ico" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 8.5a15 15 0 0 1 20 0" />
          <path d="M5 12a11 11 0 0 1 10.5-1.7" />
          <path d="M8.5 15.5a6 6 0 0 1 4-1.3" />
          <circle cx="12" cy="19.5" r="0.6" fill="currentColor" stroke="none" />
          <path d="M19 13v4" />
          <circle cx="19" cy="20" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <h2>Não conseguimos atualizar seus resultados agora.</h2>
      <p className="res-falha-sub">Sua campanha não mudou por causa disso.</p>
      <p>
        Os números vêm do Facebook, e ele não respondeu desta vez. Seus anúncios continuam
        exatamente como estavam, e nada do que você já aprovou foi desfeito.
      </p>

      <div className="res-falha-nota">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" />
          <path d="M10 6.5v4" strokeLinecap="round" />
          <circle cx="10" cy="13.5" r="0.6" fill="currentColor" stroke="none" />
        </svg>
        <div>
          <b>Por que isso acontece</b>
          {/* Sem promessa de prazo: ninguém aqui mede quando o Facebook
              volta. O "em até 48 horas" que já custou caro em produção
              nasceu de uma frase gentil exatamente deste formato. */}
          <p>
            Às vezes o Facebook demora para responder. Quando a conexão voltar, seus números
            aparecem aqui de novo sozinhos — você não precisa fazer nada.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Os ícones da grade. Ficam aqui, e não em `components/ui`, porque
   são desta grade: cada um nomeia UM número desta tela. Virar
   componente compartilhado convidaria a usar "carrinho" para outra
   coisa em outra tela, e aí o ícone deixa de significar.
   ------------------------------------------------------------ */
const traco = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 17,
  height: 17,
};

const IconeCarteira = () => (
  <svg {...traco}>
    <path d="M2.5 6.5A1.5 1.5 0 0 1 4 5h11.5A1.5 1.5 0 0 1 17 6.5v8A1.5 1.5 0 0 1 15.5 16H4a1.5 1.5 0 0 1-1.5-1.5z" />
    <path d="M13 10.5h2.5" />
  </svg>
);

const IconeToque = () => (
  <svg {...traco}>
    <path d="M6 3.5 13.5 10 10 11l-1.5 3.5z" />
  </svg>
);

const IconeOlho = () => (
  <svg {...traco}>
    <path d="M1.8 10S4.6 5 10 5s8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5z" />
    <circle cx="10" cy="10" r="2.2" />
  </svg>
);

const IconePessoas = () => (
  <svg {...traco}>
    <circle cx="7.5" cy="7" r="2.6" />
    <path d="M2.8 16c0-2.4 2.1-4 4.7-4s4.7 1.6 4.7 4" />
    <path d="M13.5 5.2a2.6 2.6 0 0 1 0 4.6" />
    <path d="M14.8 12.4c1.5.5 2.5 1.8 2.5 3.6" />
  </svg>
);

const IconeCarrinho = () => (
  <svg {...traco}>
    <path d="M2 3h2l1.7 8.4a1.3 1.3 0 0 0 1.3 1.1h6.6a1.3 1.3 0 0 0 1.3-1L17 6H5" />
    <circle cx="7.5" cy="16" r="1.1" />
    <circle cx="14" cy="16" r="1.1" />
  </svg>
);

const IconeSeta = () => (
  <svg {...traco}>
    <path d="M4 13.5 8.5 9l3 3L16 7" />
    <path d="M12.5 6.8H16v3.4" />
  </svg>
);

const IconeLampada = () => (
  <svg {...traco} width="18" height="18">
    <path d="M7.2 13.2a4.6 4.6 0 1 1 5.6 0c-.5.4-.8 1-.8 1.6H8c0-.6-.3-1.2-.8-1.6z" />
    <path d="M8.3 17h3.4" />
  </svg>
);

/**
 * O que a pílula do card diz — e ela fala de NÚMEROS, nunca de ar.
 *
 * ============================================================
 * "AINDA NÃO FOI AO AR" SAIU DAQUI EM 11/09/2026. ITEM C6.
 *
 * Era a única coisa nesta tela que afirmava veiculação, e ela afirmava a
 * partir de `STATUS_COM_CAMPANHA` — uma inferência sobre o `status` do
 * pipeline que o próprio `lib/resultado/do-negocio.ts` declara incapaz
 * de distinguir no ar de pausada, por escrito, no bloco dela.
 *
 * O card não pode falar de ar porque **não existe veiculação por
 * campanha** em rota nenhuma (medido contra o `openapi.json` de
 * produção: `veiculacao` aparece em `RespostaExecucaoDoCliente` e em
 * nenhum outro schema). Quem fala de ar nesta tela é a faixa do NEGÓCIO,
 * uma vez, com `estado.veiculacao` — a fonte única.
 *
 * Os três rótulos agora dizem o que a ficha realmente sabe: se há
 * campanha montada, e se vieram números dela. `sem-campanha` virou "Sem
 * campanha montada" — que é exatamente o que `STATUS_COM_CAMPANHA`
 * mede, sem pedir emprestada uma afirmação que ela não sustenta.
 * ============================================================
 *
 * CINZA NOS TRÊS, SEMPRE — ver o bloco do topo do arquivo. A FORMA é que
 * separa (item C5): contorno para o que ainda não produziu número,
 * preenchido para o que produziu.
 */
const ROTULO_DO_ESTADO = {
  "sem-campanha": "Sem campanha montada",
  "sem-dado": "Sem números ainda",
  "com-dado": "Com números",
} as const;

/**
 * A FORMA DO SELO, por estado. Item C5.
 *
 * ============================================================
 * TEXTO **E** FORMA, NUNCA COR DE JULGAMENTO.
 *
 * Os três selos já eram cinza — a tela nunca teve semáforo, e continua
 * sem ter. O que faltava era o segundo eixo: três pílulas idênticas em
 * cor e em forma, diferentes só na palavra, pedem leitura atenta para
 * uma distinção que devia ser de relance.
 *
 * Preenchido = tem número. Contorno = ainda não tem. A forma carrega
 * PRESENÇA de dado, que é fato, e não qualidade do resultado, que seria
 * julgamento — um card "Com números" não está dizendo que os números são
 * bons.
 * ============================================================
 */
const FORMA_DO_ESTADO = {
  "sem-campanha": "contorno",
  "sem-dado": "contorno",
  "com-dado": "preenchido",
} as const;

function Campanha({ campanha }: { campanha: CampanhaNaTela }) {
  const { resultado: r } = campanha;

  return (
    <article className="res-ficha">
      <div className="res-ficha-head">
        {/* `nome` vindo `null` não vira "Anúncio sem nome": inventar rótulo
            para ausência é o mesmo defeito de inventar zero para ausência. */}
        {campanha.nome && <span className="res-ficha-titulo">{campanha.nome}</span>}
        {/* ============================================================
            A PÍLULA É CINZA NOS TRÊS ESTADOS, SEMPRE.

            O wireframe pinta "No ar" de verde. Verde aqui seria semáforo:
            afirma que está bom sem ninguém ter medido contra alvo nenhum.

            E esta ficha não sabe se a campanha está no ar ou pausada —
            mas **cuidado com o motivo**, porque ele mudou. Não é que
            `status_na_plataforma` não exista: ele existe, e foi medido em
            produção em 11/09/2026 na rota do NEGÓCIO:

              GET /negocios/{id}/execucao
              → status_na_plataforma "PAUSED", veiculacao "ja_foi_ao_ar",
                e um `andamento` escrito pelo backend

            O que não existe é veiculação POR CAMPANHA: nem o consolidado
            do negócio nem a ficha da execução trazem o campo, e aquela
            rota devolve UMA execução só. Como este componente desenha uma
            campanha por vez, ele continua sem poder afirmar — e por isso
            o rótulo dele deixou de falar de ar (ver `ROTULO_DO_ESTADO`).

            Quem afirma é a faixa do NEGÓCIO no topo desta tela, com
            `estado.veiculacao`. O pedido ao backend para destravar o selo
            por campanha está em `docs/estado/veiculacao-uma-fonte-11-09.md`
            §0.
            ============================================================ */}
        <Pill tone="off" forma={FORMA_DO_ESTADO[campanha.estado]}>
          {ROTULO_DO_ESTADO[campanha.estado]}
        </Pill>
      </div>

      {/* CANAL SÓ APARECE SE VIER. `canal_confirmado` é `null` nas duas
          execuções da V2G, medido em 10/09/2026 — e `null` não vira
          "Facebook" por palpite. Está na lista de pedidos ao backend. */}
      {(campanha.canal || r.periodoComDado) && (
        <p className="res-periodo">
          {campanha.canal}
          {campanha.canal && r.periodoComDado ? " · " : ""}
          {r.periodoComDado &&
            (r.periodoComDado.desde === r.periodoComDado.ate
              ? diaPorExtenso(r.periodoComDado.desde)
              : `${diaPorExtenso(r.periodoComDado.desde)} a ${diaPorExtenso(r.periodoComDado.ate)}`)}
        </p>
      )}

      {/* ============================================================
          QUATRO NÚMEROS, TODOS DA PLATAFORMA, NENHUM DERIVADO.

          ERAM SEIS ATÉ 11/09/2026. "Vendas que você confirmou" e "Voltou
          em vendas" saíram daqui — item B2 — e o motivo está medido:

            execução 98447192  nunca foi ao ar · vendas 22 · voltou 1.200,00
            execução aed42ce7  a única que rodou · vendas null · voltou null

          O lado do dono veio inteiro pendurado na rodada que não rodou.
          Não é atribuição por campanha: é artefato de a qual execução a
          pergunta do dia estava amarrada. E na tela produzia, no MESMO
          card, "Ainda não foi ao ar" logo acima de "Voltou em vendas
          1.200,00" — dois rótulos certos formando uma leitura falsa.

          A resposta do dono é sobre o NEGÓCIO, e agora aparece uma vez
          só, na faixa `RespostaDoDono` lá em cima. Ver o bloco de
          `lib/resultado/tipos.ts`. `conferir:veiculacao` §4 reprova se
          voltarem.

          O que o wireframe pede e NÃO entra: "R$ 14,42 por conversa"
          (derivado, proibido pelo contrato e por `conferir:resultado`
          §10) e "↑ +34% vs. 30 dias anteriores" (não existe período
          anterior em rota nenhuma — seriam quatro números inventados).

          "Pessoas alcançadas" virou "o anúncio apareceu N vezes":
          `impressoes` conta APARIÇÕES, não pessoas. A mesma impressão
          pode ser a mesma pessoa dez vezes.
          ============================================================ */}
      <div className="res-grid">
        <Numero valor={r.bloco.investido} rotulo="Investido na Meta">
          <IconeCarteira />
        </Numero>
        <Numero valor={r.bloco.cliques} rotulo="Cliques no anúncio">
          <IconeToque />
        </Numero>
        <Numero valor={r.bloco.impressoes} rotulo="O anúncio apareceu">
          <IconeOlho />
        </Numero>
        <Numero valor={r.bloco.pessoas} rotulo="Pessoas que chegaram">
          <IconePessoas />
        </Numero>
      </div>

      {/* ============================================================
          A FRASE É DO BACKEND, INTEIRA.

          Esta tela não traduz o nível e não tem tabela de frase nenhuma.
          `nivelFrase` vindo `null` não vira frase de degradação escrita
          aqui — vira silêncio, que é honesto. Ver `lib/resultado/nivel.ts`.
          ============================================================ */}
      {r.nivelFrase && (
        <div className="res-nivel">
          <IconeLampada />
          <p>{r.nivelFrase}</p>
        </div>
      )}
    </article>
  );
}

/**
 * Peças de anúncio que existem e ainda não pertencem a nenhum anúncio.
 *
 * ============================================================
 * ELA NÃO SE LIGA MAIS À CAMPANHA, e a perda está dita aqui.
 *
 * `creatives.campaign_id` aponta para `campaigns.id`, do banco do webapp.
 * A campanha que esta tela mostra agora é a EXECUÇÃO do backend, com id
 * de outro espaço. Não há chave que ligue as duas — então a foto que
 * aparecia dentro do card do anúncio não tem mais onde aparecer.
 *
 * Ligar as duas exigiria o backend devolver o `campaign_id` local na
 * ficha da execução. **Está na lista de pedidos.** Até lá, a seção
 * abaixo é a única que fala de peça, e ela não afirma vínculo nenhum.
 * ============================================================
 */
function PecasSemAnuncio({ pecas }: { pecas: Array<{ id: string; file_name: string | null }> }) {
  if (pecas.length === 0) return null;
  return (
    <section>
      <div className="section-title">
        <h2>Peças ainda sem anúncio</h2>
        <span className="grp-count">
          {pecas.length} {pecas.length === 1 ? "peça" : "peças"}
        </span>
      </div>
      <div className="card">
        {pecas.map((p) => (
          <div className="log-row" key={p.id}>
            {p.file_name ?? "Arquivo sem nome"}
          </div>
        ))}
      </div>
      <p className="hint">
        Ainda não estão em nenhum anúncio. A IA usa elas quando montar a próxima peça.
      </p>
    </section>
  );
}

/**
 * A porta para a /criativos — item do QA de 11/09/2026.
 *
 * ============================================================
 * A TELA EXISTIA E NÃO TINHA COMO CHEGAR NELA.
 *
 * `/criativos` não estava em menu nenhum e nenhuma tela apontava para
 * ela: o dono teria que digitar a URL, o que não acontece no celular. O
 * passo 6 do teste de produto não passava por falta de UM link.
 *
 * Fica AQUI porque aqui é onde o dono procuraria — esta é a tela das
 * peças dele. E fica **fora da barra de baixo** de propósito: a decisão
 * do QA-1 é de cinco itens no teto, e o próprio docstring da /criativos
 * recusa virar item de menu (é tarefa, não lugar).
 *
 * Uma função usada nos DOIS ramos da tela, e não o mesmo JSX escrito duas
 * vezes: cópia à mão envelhece de um dos lados.
 * ============================================================
 */
function PecaPronta() {
  return (
    <section>
      <div className="section-title">
        <h2>Tem uma peça pronta?</h2>
      </div>
      <div className="card acct-list">
        <a className="acct-row" href="/criativos">
          <span className="ar-text">
            <b>Conferir se ela serve para anunciar</b>
            <span>
              Você manda a imagem que já tem; a gente responde antes de você gastar com ela.
            </span>
          </span>
          <SetaLinha />
        </a>
      </div>
    </section>
  );
}

/**
 * A mesma seta das listas da /inicio e da /conta.
 *
 * `IconeSeta`, neste arquivo, é a de TENDÊNCIA do card de vendas — outra
 * coisa, apesar do nome. Por isso esta tem nome próprio em vez de
 * reaproveitar aquela.
 */
const SetaLinha = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 3l4 4-4 4" />
  </svg>
);

function SemAnuncioNenhum({ proximo, fotos }: { proximo: Etapa | null; fotos: number }) {
  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>Aqui ficam seus anúncios: a foto, o texto e o que cada um produziu.</p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <section className="empty-card">
            <div className="empty-ico">
              <svg width="34" height="34" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 8v4h3l8 4V4L6 8H3z" />
                <path d="M16 8a3 3 0 0 1 0 4" />
              </svg>
            </div>
            <div className="empty-copy">
              <p className="empty-head">Seu primeiro anúncio ainda não existe.</p>

              {/* O ENQUADRAMENTO É DAQUI; O FATO VEM DO ESTADO. A tela diz
                  por que o anúncio não existe — e quem sabe por quê é a
                  cadeia, não esta função. */}
              {proximo ? (
                <>
                  <p className="empty-body">{proximo.titulo}</p>
                  <p className="empty-body">{proximo.corpo}</p>
                  {proximo.acao && (
                    <a className="cta" href={proximo.acao.href} style={{ width: "max-content" }}>
                      {proximo.acao.rotulo}
                    </a>
                  )}
                </>
              ) : (
                <p className="empty-body">
                  Está tudo certo do seu lado. Assim que a primeira peça ficar pronta, ela
                  aparece aqui para você aprovar.
                </p>
              )}

              <p className="empty-note">
                {fotos === 0
                  ? "Nada vai ao ar sem você aprovar antes."
                  : `Suas ${fotos} ${fotos === 1 ? "foto" : "fotos"} já estão guardadas e a IA usa quando montar a peça. Nada vai ao ar sem você aprovar antes.`}
              </p>
            </div>
            <ul className="empty-list">
              <li>
                <Tick />
                <span>
                  <b>Você aprova cada peça</b> — o texto e a foto passam por você antes de
                  qualquer anúncio aparecer.
                </span>
              </li>
              <li>
                <Tick />
                <span>
                  <b>Pausar mora dentro do anúncio</b> — nunca solto numa lista, para não ser
                  clicado sem querer.
                </span>
              </li>
              <li>
                <Tick />
                <span>
                  <b>O teto é seu</b> — no fim do mês, o gasto fecha no limite que você definiu.
                </span>
              </li>
            </ul>
          </section>

          <PecaPronta />
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
          <section className="trust support-block">
            <b className="title">Sua privacidade</b>
            Suas fotos são usadas só para criar os seus anúncios. Nada é compartilhado com outras
            empresas, e você pode tirar qualquer foto de circulação quando quiser.
          </section>
        </aside>
      </div>
    </>
  );
}

function DicasDeFoto() {
  return (
    <div className="tips-card">
      <p className="tips-title">3 coisas que ajudam sua foto a ir mais longe</p>
      <ul className="tips-list">
        <li>
          <Tick />
          Luz natural, de dia, perto de uma janela.
        </li>
        <li>
          <Tick />O produto ocupando o centro da imagem.
        </li>
        <li>
          <Tick />
          Sem textos ou adesivos em cima da foto — a IA adiciona o que for preciso depois.
        </li>
      </ul>
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
