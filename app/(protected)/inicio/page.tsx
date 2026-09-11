import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { NumeroQueConta } from "@/components/ui/NumeroQueConta";
import { diaCurto, dinheiro, numero } from "@/lib/formato";
import { contagemOuAusencia, dinheiroOuAusencia } from "@/lib/dia-seguinte/exibir";
import { diaDeOntemEmSaoPaulo } from "@/lib/dia-seguinte/dia";
import { diasAtrasados } from "@/lib/dia-seguinte/dias-em-aberto";
import { PerguntaDoDia } from "./PerguntaDoDia";
import { estadoDoCliente, type EstadoDoCliente } from "@/lib/estado/cliente";
import { HeroDaEtapa } from "@/components/ui/HeroDaEtapa";
import { fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import {
  estadoNaLista,
  fasesDaCadeia,
  posicoesDaCadeia,
  type Etapa,
} from "@/lib/estado/frases";

/**
 * Início / dashboard — porte de `tela-05-dashboard-desktop.html`.
 *
 * ============================================================
 * ESTA TELA NÃO DECIDE MAIS O QUE FALTA. Ela mostra.
 *
 * Até 20/08/2026 ela decidia duas vezes, em dois lugares do mesmo
 * arquivo: um `<BlocoPendencias>` lendo `resumirPendencias`, e trinta
 * linhas abaixo um herói lendo `Object.keys(respostas).length >= 5`. As
 * duas falavam do mesmo assunto e podiam discordar — e discordavam. O
 * contador de chaves era o pior dos dois: ele lia o jsonb CRU, sem
 * `migrarChaves`, então cinco chaves do formato antigo (`"0".."4"`)
 * bastavam para a tela afirmar "a IA já sabe o essencial" a um negócio
 * sem nome e sem descrição. Medido em conta real em 20/08.
 *
 * Agora a única fonte é `estadoDoCliente()`, e o que esta tela escolhe é
 * FORMA, não fato: o `proximo` vai no herói, o resto da cadeia vira lista
 * secundária. Se a frase que você precisa não existe no estado, o lugar
 * de acrescentá-la é `lib/estado/frases.ts` — não aqui.
 * ============================================================
 *
 * OS TRÊS CORPOS DA TELA seguem existindo, e o do meio é o que mais
 * importa:
 *
 * 1. Sem campanha — a pessoa acabou de entrar.
 * 2. Campanha no ar, sem número — o "dia zero". O texto dele mora agora na
 *    etapa `numeros`, e é o herói que o mostra quando é a vez do Facebook.
 *    O comportamento mais destrutivo do cliente ansioso é pausar tudo no
 *    dia 3, justamente quando o aprendizado ia terminar.
 * 3. Com número — o dashboard de verdade, do CONSOLIDADO do backend.
 *    (Era `metrics_daily`, que tem zero linhas. Trocado em 10/09/2026.)
 */

/**
 * O resto do caminho — a cadeia, sem peso.
 *
 * Existe para a pessoa saber que há uma sequência e onde ela está nela. O
 * que ela deve FAZER agora é o herói; isto é o mapa. Etapa concluída fica
 * na lista, marcada: sumir com ela encolheria a lista a cada visita e
 * tiraria justamente a sensação de ter andado.
 *
 * ============================================================
 * DUAS COISAS QUE ESTA LISTA ERRAVA, e as duas viraram regra em
 * `lib/estado/frases.ts` para não voltarem por outra tela:
 *
 * 1. Ela lia `etapa.titulo`, que é CHAMADO DE AÇÃO, e pareava com estado:
 *    "Falta conectar sua conta · Já está feito", duas vozes e uma
 *    contradição na mesma linha. Agora lê `etapa.nome`, que é substantivo
 *    e funciona nos três estados.
 * 2. Ela decidia por `etapa.concluida`, que é dois estados onde há três —
 *    e escrevia "Já está feito" para etapas que nunca aconteceram. Agora
 *    quem decide é a POSIÇÃO em relação à atual.
 * ============================================================
 */
function TrilhaDaExecucao({
  etapas,
  atual,
  andamento,
}: {
  etapas: Etapa[];
  atual: Etapa | null;
  andamento: string | null;
}) {
  const posicoes = posicoesDaCadeia(etapas, atual);
  const feitas = posicoes.filter((p) => p.posicao === "feita").length;

  return (
    <section className="trilha">
      <div className="section-title">
        <h2>Onde seu anúncio está</h2>
        <span className="side-note">
          {feitas} de {etapas.length} etapas
        </span>
      </div>
      <div className="card">
        {/* A frase do backend encabeça a trilha: é a única linha aqui que
            sabe o que o pipeline está fazendo AGORA. As seis abaixo são a
            cadeia local, que sabe a ordem. */}
        {andamento && <p className="trilha-andamento">{andamento}</p>}

        <ol className="trilha-lista">
          {posicoes.map(({ etapa, posicao }) => (
            <li className={`trilha-item e-${posicao}`} key={etapa.id}>
              <span className="trilha-marca" aria-hidden="true" />
              <span className="trilha-texto">
                <b>{etapa.nome}</b>
                <span>{estadoNaLista(etapa, posicao)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default async function InicioPage() {
  // Ver o bloco do portão, logo abaixo: em produção esta constante é
  // `false` por dobra de literal, e tudo que depende dela some com ela.
  const fixture =
    process.env.NODE_ENV !== "production" ? (process.env.V2G_FIXTURE_INICIO ?? null) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Sem fixture, sem sessão, sem tela — como sempre foi.
  if (!user && !fixture) return null;

  // UMA leitura, uma resposta. O `agora` é parâmetro até o fim da cadeia.
  const agora = new Date();
  let estado: EstadoDoCliente | null = fixture ? null : await estadoDoCliente(agora);

  // ============================================================
  // O PORTÃO DAS FIXTURES — dois trincos, e nenhum deles sozinho abre.
  //
  // 1. `process.env.NODE_ENV !== "production"`. O Next troca esta
  //    expressão pelo literal no build; em produção ela vira
  //    `"production" !== "production"`, o bloco morre e o `import()`
  //    morre junto — o módulo não entra no grafo. **O preview da Vercel
  //    também roda com `NODE_ENV=production`**, então ele está fechado
  //    pelo mesmo trinco que o ambiente de verdade.
  // 2. `V2G_FIXTURE_INICIO`, que não existe em ambiente nenhum da Vercel.
  //
  // Um trinco só não bastaria: variável de ambiente se define no painel
  // sem querer, e `NODE_ENV` alguém pode achar que sabe mexer. Os dois
  // juntos exigem duas decisões erradas no mesmo dia.
  //
  // A PROVA não é este comentário. É o `grep` da sentinela no `.next/`
  // depois do build — está escrita em `lib/dev/fixtures-inicio.ts`, e o
  // `conferir:fixtures` reprova se o import estático aparecer.
  // ============================================================
  if (fixture) {
    const { fixtureDoInicio } = await import("@/lib/dev/fixtures-inicio");
    estado = fixtureDoInicio(fixture, agora);
  }

  // Nome de fixture desconhecido não cai no banco por baixo do pano: a
  // tela some, e quem pediu descobre que errou o nome.
  if (!estado) return null;

  // ============================================================
  // SEM NEGÓCIO NÃO É ESTADO DESTA TELA — é cliente que não fez o
  // onboarding, e o lugar dele é lá.
  //
  // Medido em 11/09/2026: `v2g.midia@gmail.com` tem `profile` e ZERO
  // linhas em `businesses`. O trigger `handle_new_user` cria o perfil e
  // REIVINDICA um business por `claim_email` — não cria nenhum. Quem cria
  // é `obterOuCriarBusiness()`, e ela só roda dentro da `/onboarding`.
  // Como `auth/confirmar` manda para `/` e a `/` manda para cá, ninguém
  // passava pela porta que cria o registro.
  //
  // POR QUE AQUI, e não no `proxy.ts` nem no `auth/confirmar`:
  //
  //   - aqui o dado JÁ ESTÁ NA MÃO. `estadoDoCliente()` acabou de ler
  //     `businesses`; a checagem custa zero consulta nova.
  //   - no `proxy.ts` custaria uma consulta ao banco em TODA requisição
  //     protegida, para responder uma pergunta que só importa uma vez na
  //     vida do cliente.
  //   - no `auth/confirmar` pegaria só quem acabou de confirmar e-mail.
  //     Quem já tem conta e nunca terminou o onboarding continuaria
  //     caindo na tela vazia — que é exatamente o caso medido.
  //
  // O QUE ISTO NÃO COBRE, e fica dito: `/anuncios` e `/vendas` continuam
  // mostrando o estado vazio para quem não tem negócio. Elas não estão no
  // escopo deste lote.
  // ============================================================
  if (!estado.temNegocio) redirect("/onboarding");

  const { data: ultimaDecisao } = await supabase
    .from("decisions")
    .select("kind, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { resultado, temNumero } = estado;

  // ============================================================
  // A CADEIA VEM PRONTA. A tela não aplica mais regra nenhuma sobre ela.
  //
  // Até 11/09 esta linha era `concluidasPeloGasto(estado.etapas, ...)` —
  // a `/inicio` fechando `peca` e `no_ar` por conta própria, porque as
  // duas liam `creatives` e `campaigns`, tabelas locais que o backend
  // nunca escreve. Era recorte de UMA tela, e a `/anuncios` lia a mesma
  // cadeia sem ele.
  //
  // A regra passou para dentro de `montarEtapas`, onde vale para todo
  // mundo que lê a cadeia, e a fonte deixou de ser o gasto: agora é
  // `veiculacao`, que o backend expõe. Ver `lib/veiculacao/estado.ts`.
  // ============================================================
  const acumulado = estado.diaSeguinte.acumulado;
  const etapas = estado.etapas;
  const proximo = etapas.find((e) => !e.concluida) ?? null;

  // As quatro fases do wireframe, sobre as seis etapas da cadeia. Quem
  // agrupa é `lib/estado/frases.ts` — a tela não decide o que é fase.
  const fases = fasesDaCadeia(etapas, proximo);
  const fasesFeitas = fases.filter((f) => f.estado === "feita").length;

  // ============================================================
  // O CARD DA PERGUNTA DIÁRIA APARECE NAS DUAS TELAS DA `/inicio`.
  //
  // E isso não é redundância — é o que impede um ciclo fechado. A tela de
  // resultado só é alcançada com `temNumero`, e hoje `temNumero` só fica
  // verdadeiro quando o acumulado tem dado — que só existe DEPOIS de ele
  // responder. Card só na tela de resultado seria uma porta trancada por
  // dentro: ele nunca chegaria lá para poder responder a primeira vez.
  //
  // O dia é ONTEM, no fuso de São Paulo — ver `lib/dia-seguinte/dia.ts`.
  // ============================================================
  const diaDaPergunta = diaDeOntemEmSaoPaulo(agora);
  const linhaDeOntem = estado.diaSeguinte.acumulado?.dias.find(
    (d) => d.dia === diaDaPergunta,
  );
  const vendasDeOntem = linhaDeOntem?.viraramVenda ?? null;
  const receitaDeOntem = linhaDeOntem?.voltouCentavos ?? null;

  // ============================================================
  // OS DIAS QUE ELE PERDEU — por subtração de calendário.
  //
  // E vai continuar sendo por subtração: `perguntas_apresentadas` registra
  // que a pergunta foi MOSTRADA, e dia em que o dono não abriu o app não
  // gera linha nenhuma. A tabela classifica o que já está nesta lista; ela
  // não a produz. Ver o bloco de `diasAtrasados`.
  //
  // Toda a dedução mora numa função só — é onde acrescentar a leitura
  // quando ela existir.
  // ============================================================
  // Sem execução não há card (a condição de baixo), logo não há atrasado a
  // oferecer — e o `idExecucao` da chave só existe aqui dentro.
  const execucaoDoDia = estado.diaSeguinte.execucao;

  // ============================================================
  // A FRASE DO ANDAMENTO É DO BACKEND, E A TELA NÃO A REESCREVE.
  //
  // `lib/dia-seguinte/tipos.ts` guarda o contrato por extenso: "não use
  // `status` para montar texto de tela". O `status` serve para ramificar;
  // quem escreve para o dono é o backend, do mesmo jeito que faz com
  // `nivel_frase`. Traduzir os nove `EstadoExecucao` aqui recriaria o
  // defeito que `lib/resultado/nivel.ts` acabou de corrigir — sete frases
  // próprias contra catorze níveis, e as que faltavam derrubavam a página.
  //
  // Medido em 11/09 na V2G: "Tudo anotado. Começando a montar seu anúncio".
  // ============================================================
  const andamentoDaExecucao = execucaoDoDia?.andamento ?? null;
  const atrasados = execucaoDoDia
    ? await diasAtrasados({
        idExecucao: execucaoDoDia.idExecucao,
        consolidado: estado.diaSeguinte.acumulado,
        ontem: diaDaPergunta,
      })
    : [];

  // Os valores já gravados de cada atrasado, para o campo nascer cheio
  // quando ele abrir — mesma regra do card de ontem.
  const valoresPorDia: Record<string, { vendas: number | null; receita: number | null }> = {};
  for (const d of atrasados) {
    const linha = estado.diaSeguinte.acumulado?.dias.find((x) => x.dia === d);
    valoresPorDia[d] = {
      vendas: linha?.viraramVenda ?? null,
      receita: linha?.voltouCentavos ?? null,
    };
  }

  // ============================================================
  // O CARD FICA MESMO COM OS DOIS RESPONDIDOS. Decisão do Victor, 01/09.
  //
  // Ele sumia quando os dois campos estavam preenchidos, e isso era
  // desenho meu — errado por um motivo que só aparece com dedo em tela de
  // celular: **o dono vai errar**. Digitar 10 quando era 12, ou 200 quando
  // era 2.000. Sem o card, não há como corrigir, e errar em campo de
  // DINHEIRO sem poder corrigir é pior que perguntar de novo.
  //
  // Some junto o efeito colateral: sem card não dava para reenviar um
  // campo só, e o merge por campo — que o backend fez justamente para a
  // correção existir — ficava impossível de exercitar pela tela.
  //
  // Respondido, ele encolhe para uma linha. Ver `PerguntaDoDia`.
  // ============================================================
  const cardDaPergunta =
    execucaoDoDia !== null ? (
      <PerguntaDoDia
        idExecucao={execucaoDoDia.idExecucao}
        dia={diaDaPergunta}
        vendasAtuais={vendasDeOntem}
        receitaAtualCentavos={receitaDeOntem}
        respondeuAlgo={vendasDeOntem !== null || receitaDeOntem !== null}
        atrasados={atrasados}
        valoresPorDia={valoresPorDia}
      />
    ) : null;

  // ============================================================
  // QUEM DECIDE O RAMO É `temNumero`, SOZINHO. O `proximo ||` SAIU.
  //
  // Ele estava aqui desde que a tela tinha dois corpos, e parecia inofensivo:
  // "se ainda falta etapa, mostre o que falta". Só que `proximo` NÃO fala do
  // mesmo assunto que `temNumero`. Ele sai de `montarEtapas`, que lê duas
  // tabelas LOCAIS do Supabase — `creatives` e `campaigns` — enquanto o
  // dinheiro vem do backend, que nunca escreve nessas duas.
  //
  // MEDIDO EM 11/09/2026, na conta da V2G (`a85c37a9`):
  //
  //   backend  aed42ce7 · status=cadastro_completo · tem_dado_da_plataforma=true
  //            R$ 10,25 investidos · 64 cliques · 1.657 impressões
  //   local    creatives ativos = 1, e é um LOGO (uso='campanha' = 0)
  //            campaigns = 0 linhas — na tabela inteira, não só nesta conta
  //
  //   → proximo = 'peca'  ·  temNumero = true  →  caía no ramo "preparando"
  //
  // Uma conta que gastou, foi clicada 64 vezes e apareceu 1.657 vezes lia
  // "sua primeira campanha ainda não está no ar". E como `campaigns` tem zero
  // linha no total, `publicadaEm` é `null` para TODA conta: com o `proximo ||`
  // no lugar, o ramo de resultado era inalcançável para todo mundo — código
  // morto em produção, não um caso da V2G.
  //
  // O §5 do `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md` já dizia qual é o
  // interruptor: *"o único interruptor honesto entre os dois ramos é
  // `tem_dado_da_plataforma` — mais o `temNumero` de `estadoDoCliente()`"*.
  // `proximo` não aparece lá. Decidido pelo Victor em 11/09, após a medição.
  //
  // A CADEIA NÃO SE PERDE: ela deixa de decidir o ramo e passa a aparecer
  // DENTRO dos dois, como trilha — ver `TrilhaDaExecucao`. Etapa aberta com
  // número na mão é informação, não motivo para esconder o número.
  //
  // `proximo` é não-nulo aqui por construção: `etapaNumeros.concluida` é o
  // próprio `temNumero`, então `!temNumero` garante que ao menos ela está
  // aberta. As guardas de baixo ficam porque quem lê não deve precisar
  // reconstruir essa prova.
  // ============================================================
  if (!temNumero) {
    // O bloco "não mexa na campanha" só existe quando há campanha para
    // mexer e a espera é do Facebook. Antes disso ele assustaria sem
    // motivo.
    const diaZero = proximo?.id === "numeros";

    return (
      <>
        <FaixaReconectar />

        {/* ============================================================
            O TOPO SÃO DUAS SUPERFÍCIES, e a divisão é o desenho.

            À esquerda, ONDE VOCÊ ESTÁ — cartão cobalto, as quatro fases.
            À direita, O QUE FAZER AGORA — cartão claro, uma ação.

            Elas não podem ser o mesmo bloco: a primeira é orientação e se
            lê de relance; a segunda pede decisão. Juntas numa faixa só, a
            ação vira detalhe do mapa, e a tela deixa de ter um próximo
            passo para ter um resumo.

            No celular viram duas linhas, nesta ordem — e é a ordem certa:
            saber onde está antes de saber o que fazer.
            ============================================================ */}
        <div className="inicio-topo">
          <section className="ih">
            <span className="eyebrow">Sua campanha</span>
            {/* ============================================================
                A MANCHETE DE VEICULAÇÃO VEM DA FONTE ÚNICA. ITEM B3.

                Era `diaZero ? "Seu anúncio já está no ar" : …`, e
                `diaZero` é `proximo?.id === "numeros"` — a POSIÇÃO DA
                CADEIA. Posição de cadeia não sabe o que a Meta fez com o
                anúncio: na conta da V2G ela dizia "já está no ar" com o
                anúncio em `PAUSED`, enquanto a `/alertas` dizia o
                contrário sobre a mesma conta.

                `diaZero` continua decidindo o resto do ramo — o bloco "o
                que não fazer agora", a sub-linha —, que é o que ele de
                fato sabe: que a cadeia chegou nos números. Só a frase
                sobre o AR trocou de dono.
                ============================================================ */}
            <h2>
              {diaZero
                ? fraseDeVeiculacao(estado.veiculacao, "manchete")
                : "Sua campanha está sendo preparada"}
            </h2>
            <p className="ih-sub">
              Você já concluiu{" "}
              <b>
                {fasesFeitas} de {fases.length}
              </b>{" "}
              fases.
            </p>

            {/* As QUATRO fases, sobre as SEIS etapas — a lista de baixo
                mostra as seis, e nenhuma se perde. Ver `fasesDaCadeia`. */}
            <ol className="fases">
              {fases.map((f, i) => (
                <li className={`fase f-${f.estado}`} key={f.id}>
                  <span className="fase-marca" aria-hidden="true">
                    {f.estado === "feita" ? "✓" : f.estado === "atual" ? i + 1 : "•"}
                  </span>
                  <b>{f.nome}</b>
                  <span>{f.rotulo}</span>
                </li>
              ))}
            </ol>
          </section>

          {proximo && (
            <section className="proximo">
              <span className="eyebrow">Seu próximo passo</span>
              <h3>{proximo.titulo}</h3>
              <p>{proximo.corpo}</p>
              {/* A ÚNICA ação cheia da tela. O rótulo e o destino vêm da
                  etapa, que é quem sabe de quem é a bola — a tela não
                  inventa botão para etapa que não é do cliente. */}
              {proximo.acao ? (
                <a className="cta" href={proximo.acao.href}>
                  {proximo.acao.rotulo}
                </a>
              ) : (
                <p className="proximo-nota">
                  {proximo.bola === "facebook"
                    ? "Agora é com o Facebook. Não precisa fazer nada — e mexer na campanha agora atrasaria."
                    : "Agora é com a gente. Você não precisa fazer nada."}
                </p>
              )}
            </section>
          )}
        </div>

        {/* Ver o bloco de `cardDaPergunta`: aqui NÃO é redundância. Sem o
            card nesta tela, o cliente nunca chegaria à outra para poder
            responder a primeira vez. */}
        {cardDaPergunta}

        <div className="inicio-cols">
          <div className="inicio-col">
            {diaZero && (
              <>
                <div
                  className="fail-block"
                  style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
                >
                  <b className="title">O que não fazer agora</b>
                  <p>
                    Não pause e não mexa no investimento nestes primeiros dias. Cada mudança
                    reinicia o aprendizado do zero, e o que já foi gasto nele se perde. É a
                    coisa mais cara que dá para fazer aqui — e a mais tentadora.
                  </p>
                </div>

                {/* Espaço reservado da missão do dia zero (wireframe do
                    Figma). A mecânica ainda não existe; o lugar dela sim,
                    para a tela não terminar num vazio que empurra a pessoa
                    para a campanha. */}
                <section className="mission-slot">
                  <span className="ms-tag">Enquanto isso</span>
                  <b>Adiante o que vai fazer falta depois</b>
                  <p>
                    O melhor uso destes dias não é olhar a campanha — é deixar pronto o que ela
                    vai pedir a seguir: mais fotos para a IA ter de onde escolher, e seus dados
                    de negócio conferidos, que é de onde ela decide para quem mostrar.
                  </p>
                </section>
              </>
            )}

            <TrilhaDaExecucao
              etapas={etapas}
              atual={proximo}
              andamento={andamentoDaExecucao}
            />

            <Melhoras fotos={estado.melhoras.fotos} />
          </div>

          <div className="inicio-col">
            {diaZero ? <Noturno decisao={ultimaDecisao} /> : <Suporte />}
            <Comando verba={estado.verbaMensal} investido={null} />
          </div>
        </div>
      </>
    );
  }

  // ---------- com número ----------
  // O herói mede CONVERSA, não venda. A campanha é click-to-WhatsApp
  // otimizada para CONVERSATIONS: o evento que o Meta conta e otimiza é
  // "alguém abriu conversa", e é só isso que a plataforma sabe. Se a
  // pessoa comprou depois, quem sabe é o dono do negócio, não o Meta.
  //
  // ============================================================
  // O CUSTO POR CONVERSA SAIU DAQUI, E NÃO VOLTA.
  //
  // Eram duas linhas: `resultado.investido / conversas`, e o render
  // `a {dinheiro(custoPorConversa ?? 0)} cada` — o `?? 0` fazendo
  // "não sabemos" virar "a R$ 0,00 cada", na manchete, em letra grande.
  //
  // O contrato do dashboard proíbe o número em si, não só o `?? 0`: custo
  // derivado é a porta de entrada para o dono comparar com um número que
  // ouviu de alguém, e o produto compara com o CPL-alvo DELE — que não
  // existe em nenhuma das campanhas reais (medido, 10/09/2026). Sem alvo,
  // "R$ 0,16 por conversa" é uma opinião fingindo ser medida.
  //
  // Quem julga é o backend, em `nivelFrase`. `pnpm conferir:resultado` §10
  // lê este arquivo e reprova se o cálculo voltar.
  // ============================================================
  const conversas = resultado.pessoas;

  // ============================================================
  // O ACUMULADO DO NEGÓCIO — o lado que a `metrics_daily` nunca terá.
  //
  // `metrics_daily` só teria o lado da PLATAFORMA, e tem zero linhas
  // (medido em 01/09/2026). O acumulado traz o lado do DONO — quantas
  // viraram venda e quanto entrou — que é o que ele respondeu, e o único
  // lado que existe hoje: o coletor da Meta está desligado até o App
  // Review.
  //
  // É por NEGÓCIO, e não por execução, de propósito: esta tela diz "quanto
  // eu já investi e quanto voltou", e com duas rodadas a versão por
  // execução esconderia a anterior.
  //
  // `acumulado` já está declarado lá em cima, no bloco da regra de
  // evidência: é a MESMA leitura, e as duas coisas que esta tela faz com
  // ele — fechar a cadeia e escrever os números — têm que sair da mesma
  // resposta, ou a trilha e o painel podem discordar.
  // ============================================================
  // ============================================================
  // O PERÍODO É O QUE TEM DADO, não o que a gente pediu.
  //
  // `desde`/`ate` são a janela SOLICITADA — 30 dias. Escrever "12/08 a
  // 10/09" ao lado de R$ 10,25 diz que a campanha rodou trinta dias
  // gastando dez reais, o que é falso: ela tem gasto em três dias.
  //
  // A mesma decisão já existe em `ResultadoParaTela.periodoComDado`, na
  // camada de leitura da `/anuncios`. Aqui é a versão curta, sobre o
  // acumulado do negócio.
  // ============================================================
  const diasComGasto = (acumulado?.dias ?? []).filter((d) => d.investiuCentavos !== null);
  const primeiroDia = diasComGasto[0]?.dia ?? null;
  const ultimoDia = diasComGasto[diasComGasto.length - 1]?.dia ?? null;
  const periodoMedido =
    primeiroDia === null || ultimoDia === null
      ? null
      : primeiroDia === ultimoDia
        ? `em ${diaCurto(primeiroDia)}`
        : `${diaCurto(primeiroDia)} a ${diaCurto(ultimoDia)}`;

  const donoRespondeu =
    acumulado !== null && (acumulado.vendas !== null || acumulado.voltouCentavos !== null);

  return (
    <>
      <FaixaReconectar />

      {/* ============================================================
          O MESMO TOPO DA OUTRA TELA — e a repetição é o desenho.

          Cartão cobalto à esquerda, cartão claro à direita, quatro fases
          no mesmo lugar. Quem passou três semanas em "preparando" e chega
          aqui não deveria precisar reaprender onde as coisas ficam: a
          tela muda de assunto, não de gramática.

          O QUE MUDA: a manchete deixa de ser o estágio e passa a ser a
          frase do backend sobre o que está acontecendo, e abaixo entram
          os números. O que não muda é a estrutura.
          ============================================================ */}
      <div className="inicio-topo">
        <section className="ih">
          <span className="eyebrow">Sua campanha</span>
          {/* A FRASE VEM DO BACKEND, INTEIRA.

              `andamento` é escrito lá e chega pronto — a mesma regra do
              `nivel_frase`. Se ela disser algo que a tela não esperava,
              quem conserta é o backend: traduzir `status` aqui é o
              defeito que `lib/resultado/nivel.ts` acabou de pagar, com
              sete frases locais contra catorze níveis do contrato. */}
          <h2>{andamentoDaExecucao ?? "Seu anúncio já rodou"}</h2>
          <p className="ih-sub">
            Você já concluiu{" "}
            <b>
              {fasesFeitas} de {fases.length}
            </b>{" "}
            fases.
          </p>
          <ol className="fases">
            {fases.map((f, i) => (
              <li className={`fase f-${f.estado}`} key={f.id}>
                <span className="fase-marca" aria-hidden="true">
                  {f.estado === "feita" ? "✓" : f.estado === "atual" ? i + 1 : "•"}
                </span>
                <b>{f.nome}</b>
                <span>{f.rotulo}</span>
              </li>
            ))}
          </ol>
        </section>

        {proximo ? (
          <section className="proximo">
            <span className="eyebrow">Seu próximo passo</span>
            <h3>{proximo.titulo}</h3>
            <p>{proximo.corpo}</p>
            {proximo.acao ? (
              <a className="cta" href={proximo.acao.href}>
                {proximo.acao.rotulo}
              </a>
            ) : (
              <p className="proximo-nota">
                {proximo.bola === "facebook"
                  ? "Agora é com o Facebook. Não precisa fazer nada."
                  : "Agora é com a gente. Você não precisa fazer nada."}
              </p>
            )}
          </section>
        ) : (
          /* Cadeia fechada: o cartão continua ocupando o lugar, porque
             "não há nada te esperando" é informação — e some-lo faria o
             topo mudar de forma justamente na visita em que está tudo em
             ordem. O que ele não tem é botão: não há ação a oferecer. */
          <section className="proximo">
            <span className="eyebrow">Seu próximo passo</span>
            <h3>Nada está esperando por você</h3>
            <p>
              Todas as etapas do seu anúncio estão fechadas. Quando alguma coisa precisar de
              você, ela aparece aqui primeiro.
            </p>
            <p className="proximo-nota">
              A pergunta do dia continua sendo o que mais ajuda — é dela que sai a conta de
              quanto voltou.
            </p>
          </section>
        )}
      </div>

      {/* ============================================================
          OS PRIMEIROS SINAIS — quatro números, e um deles é uma ausência.

          `cliques` entra aqui por pedido do QA (item B6): ele já aparecia
          na `/anuncios` e não no Início, e é o número que o dono entende
          sem tradução nenhuma — "tantas pessoas clicaram".

          `conversas` sai como ausência enquanto `pessoas_que_chegaram_medido`
          não for `true`, e a rota do NEGÓCIO nem manda esse campo — por
          isso é `null` sempre, hoje. A linha de explicação ao lado não é
          decoração: sem ela, o "—" vira um número que faltou carregar.
          ============================================================ */}
      <section className="sinais-bloco">
        <div className="section-title">
          <h2>Os primeiros sinais</h2>
          {periodoMedido && <span className="side-note">{periodoMedido}</span>}
        </div>
        <div className="sinais">
          <div className="sinal">
            <span className="s-label">Investido</span>
            <span className="s-valor">
              {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
            </span>
          </div>
          <div className="sinal">
            <span className="s-label">Pessoas que clicaram</span>
            <span className="s-valor">{contagemOuAusencia(resultado.cliques)}</span>
          </div>
          <div className="sinal">
            <span className="s-label">Vezes que apareceu</span>
            <span className="s-valor">{contagemOuAusencia(resultado.impressoes)}</span>
          </div>
          <div className={`sinal${conversas === null ? " s-ausente" : ""}`}>
            <span className="s-label">Conversas</span>
            <span className="s-valor">{contagemOuAusencia(conversas)}</span>
            {conversas === null && (
              <span className="s-nota">
                A contagem de quem chega pelo anúncio ainda não está de pé. Não quer dizer que
                ninguém chegou.
              </span>
            )}
          </div>
        </div>

        {/* A FRASE DO NÍVEL, COMO VEIO. Sem tradução, sem cor, sem nota.
            Ela é a única coisa nesta tela autorizada a dizer se está bom
            ou ruim — e hoje ela diz que ainda não dá para dizer. */}
        {acumulado?.nivelFrase && <p className="sinal-frase">{acumulado.nivelFrase}</p>}
      </section>

      {/*
        O QUE O DONO RESPONDEU. Só aparece quando ele respondeu alguma
        coisa — um bloco vazio prometendo número é pior que bloco nenhum,
        e é o item B7 do QA: seção sem item não renderiza título.

        `null` NUNCA vira R$ 0,00 aqui: `dinheiroOuAusencia` escreve
        "ainda não sabemos", porque dizer R$ 0,00 sobre o dinheiro do
        cliente quando não se sabe é afirmação falsa. Ver
        `lib/dia-seguinte/exibir.ts`.
      */}
      {cardDaPergunta}

      <div className="inicio-cols">
        <div className="inicio-col">
          {donoRespondeu && acumulado && (
            <section>
              <div className="section-title">
                <h2>O que você me contou</h2>
              </div>
              <div className="card">
                <div className="metrics">
                  <div className="metric">
                    <span className="m-label">Viraram venda</span>
                    <span className="m-value">{contagemOuAusencia(acumulado.vendas)}</span>
                    <span className="m-delta">do que você respondeu</span>
                  </div>
                  <div className="metric">
                    <span className="m-label">Voltou</span>
                    <span className="m-value">
                      {dinheiroOuAusencia(acumulado.voltouCentavos, acumulado.moeda)}
                    </span>
                    <span className="m-delta">
                      {acumulado.diasComOsDoisLados > 0
                        ? `${acumulado.diasComOsDoisLados} dia(s) com os dois lados`
                        : "ainda sem o lado da plataforma"}
                    </span>
                  </div>
                </div>

                {/* ============================================================
                    O "PRA CADA R$ 1,00 VOLTARAM R$ X" SAIU — item B1 do QA.

                    O backend calcula e manda; o número de produção hoje é
                    `117.07`, ou seja, "pra cada R$ 1,00 voltaram R$ 117,07".
                    Ele está ARITMETICAMENTE CERTO e é uma mentira sobre o
                    negócio: os dois lados nunca caíram no mesmo dia
                    (`dias_com_os_dois_lados: 0`), então a conta divide a
                    receita de agosto pelo investimento de setembro.

                    Enquanto `diasComOsDoisLados` for zero, não há retorno
                    para mostrar — e mostrar 117× para o dono é pior do que
                    não mostrar retorno nenhum. `frasePorRealInvestido`
                    continua existindo, sem chamador nesta tela.
                    ============================================================ */}

                {/* Enquanto o coletor da Meta estiver desligado, dizer isso é
                    melhor que deixar o cliente achar que a metade que falta é
                    culpa dele. */}
                {!acumulado.temDadoDaPlataforma && (
                  <p className="rc-tranquilo">
                    O quanto foi investido ainda não chega automático — por isso a conta de
                    retorno fica incompleta por enquanto.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO SEM ITEM NÃO RENDERIZA TÍTULO — item B7. Antes, uma
              conta sem campanha ganhava o cabeçalho "Suas campanhas", o
              link "Ver todas" e uma lista vazia embaixo. */}
          {estado.campanhasNoAr.length > 0 && (
            <section>
              <div className="section-title">
                <h2>Suas campanhas</h2>
                <a href="/anuncios">Ver todas &rarr;</a>
              </div>
              <div className="campaign-list">
                {estado.campanhasNoAr.map((c) => (
                  <div className="list-row" key={c.id}>
                    {/* ============================================================
                        O SELO DE "NO AR" SAIU DAQUI, e a razão MUDOU hoje.

                        Ele saiu porque `status_na_plataforma` não era exposto
                        por rota nenhuma, e o selo era literalmente `?? "No ar"`.

                        Em 11/09/2026 apareceu uma fonte: `veiculacao`, em
                        `GET /negocios/{business_id}/execucao` — ver
                        `lib/veiculacao/estado.ts`. Mas ela é POR NEGÓCIO, e
                        esta lista é POR CAMPANHA: `LinhaDoNegocioPorExecucao`
                        não traz o campo. Carimbar cada linha com o estado do
                        negócio seria afirmar de uma campanha o que se mediu de
                        outra.
                        ============================================================ */}
                    <div className="lr-head">
                      <span className="lr-title">{c.nome ?? "Campanha sem nome"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* A cadeia continua VISÍVEL depois que o número chega. Ela deixou
              de decidir o ramo (ver o bloco da condição), e sumir com ela
              aqui trocaria um erro por outro: a pessoa perderia de vista que
              ainda há etapa aberta justamente quando passa a ter o que
              comemorar. */}
          <TrilhaDaExecucao
            etapas={etapas}
            atual={proximo}
            andamento={andamentoDaExecucao}
          />

          <Melhoras fotos={estado.melhoras.fotos} />
        </div>

        <div className="inicio-col">
          <Noturno decisao={ultimaDecisao} />
          {/* O investido só vai para o Comando quando ele é comparável
              com a verba, que é em reais. Em outra moeda, o card mostra
              só o teto. */}
          <Comando
            verba={estado.verbaMensal}
            investido={
              resultado.moeda === null || resultado.moeda === "BRL"
                ? resultado.investidoCentavos === null
                  ? null
                  : resultado.investidoCentavos / 100
                : null
            }
          />
        </div>
      </div>
    </>
  );
}

/**
 * O que melhora o anúncio e não o trava.
 *
 * FOTO MORA AQUI, e a mudança de lugar é a decisão: até 20/08 ela era o
 * herói da tela, com tarja de "Seu próximo passo" e botão. Ela não bloqueia
 * nada — o `origem_criativo` é fixo em `"gerar"` e a IA monta a peça sem
 * foto do cliente. Prometer que o anúncio depende dela é fazer a pessoa
 * cumprir uma tarefa e não ver resultado nenhum.
 *
 * A contagem vem do estado, com o MESMO filtro que a `/conta` usa.
 */
function Melhoras({ fotos }: { fotos: number }) {
  return (
    <section>
      <div className="section-title">
        <h2>Enquanto isso, se você quiser</h2>
        <span className="side-note">Ajuda, mas não trava nada</span>
      </div>
      <div className="card acct-list">
        <a className="acct-row" href="/conta">
          <span className="ar-text">
            <b>Separar fotos do seu negócio</b>
            <span>
              {fotos === 0
                ? "Você ainda não mandou nenhuma. Quanto mais material, mais a IA tem de onde escolher."
                : `Você já mandou ${fotos} ${fotos === 1 ? "foto" : "fotos"}. Quanto mais material, mais a IA tem de onde escolher.`}
            </span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/meu-negocio">
          <span className="ar-text">
            <b>Conferir o que a gente entendeu do seu negócio</b>
            <span>Principalmente os números — é deles que sai a mira dos anúncios.</span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/expectativas">
          <span className="ar-text">
            <b>Ler os combinados</b>
            <span>Os 4 acordos, antes de qualquer cobrança. Leva 2 minutos.</span>
          </span>
          <Seta />
        </a>
      </div>
    </section>
  );
}

function Noturno({ decisao }: { decisao: { payload: unknown } | null }) {
  return (
    <section className="card noturno">
      <div className="nc-head">
        <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M9 1a5 5 0 1 0 2 8.5A5.5 5.5 0 0 1 9 1z" />
        </svg>
        Enquanto você dormia
      </div>
      {decisao ? (
        <p>{resumoDaDecisao(decisao.payload)}</p>
      ) : (
        <p>
          A IA ainda não tomou nenhuma decisão. Quando tomar — remanejar investimento, pausar o
          que não rende — aparece aqui, com data, hora e motivo.
        </p>
      )}
      <p className="nc-foot">
        <a href="/alertas">ver tudo que a IA já fez</a>
      </p>
    </section>
  );
}

function Comando({ verba, investido }: { verba: number | null; investido: number | null }) {
  return (
    <section className="command-card">
      <b className="title">Você está no comando</b>
      <p className="limit">
        {/* `"BRL"` nos dois: a verba é o que o cliente digitou em reais, e
            quem chama só passa `investido` quando ele é da mesma moeda. */}
        {verba === null
          ? "Você ainda não definiu um teto mensal. "
          : investido !== null
            ? `${dinheiro(investido, "BRL")} de ${dinheiro(verba, "BRL")} investidos este mês · `
            : `Seu teto do mês é ${dinheiro(verba, "BRL")}. `}
        <a href="/verba">{verba === null ? "definir agora" : "mudar limite"}</a>
      </p>
      <a className="cta quiet" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
        Falar com uma pessoa
      </a>
      <p className="note">Gente de verdade, sem robô. Resposta em até 2 horas úteis.</p>
    </section>
  );
}

function resumoDaDecisao(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const chave of ["resumo", "summary", "mensagem", "texto"]) {
      if (typeof p[chave] === "string" && p[chave]) return p[chave] as string;
    }
  }
  return "Abra os avisos para ver o detalhe.";
}

function Suporte() {
  return (
    <section className="trust support-block">
      <b className="title">Travou em alguma parte?</b>
      Gente de verdade responde, sem robô, em até 2 horas úteis.
      <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
        Chamar no WhatsApp &rarr;
      </a>
    </section>
  );
}

const Seta = () => (
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
