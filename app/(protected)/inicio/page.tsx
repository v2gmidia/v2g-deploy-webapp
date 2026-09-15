import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { diaDeOntemEmSaoPaulo } from "@/lib/dia-seguinte/dia";
import { diasAtrasados } from "@/lib/dia-seguinte/dias-em-aberto";
import { estadoDoCliente, type EstadoDoCliente } from "@/lib/estado/cliente";
import { tituloDaAba } from "@/lib/titulos";
import { TelaDoInicio } from "./TelaDoInicio";

export const metadata = tituloDaAba("/inicio");

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

/*
 * ESTA PÁGINA BUSCA; QUEM DESENHA É `TelaDoInicio` — separado em 15/09/2026
 * para a bancada `/exemplo/inicio` desenhar a MESMA tela com dado falso. Ver
 * o comentário do topo de `TelaDoInicio.tsx`.
 */
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

  const diaDaPergunta = diaDeOntemEmSaoPaulo(agora);

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

  const atrasados = execucaoDoDia
    ? await diasAtrasados({
        idExecucao: execucaoDoDia.idExecucao,
        consolidado: estado.diaSeguinte.acumulado,
        ontem: diaDaPergunta,
      })
    : [];

  return (
    <TelaDoInicio
      estado={estado}
      ultimaDecisao={ultimaDecisao}
      diaDaPergunta={diaDaPergunta}
      atrasados={atrasados}
      faixa={<FaixaReconectar />}
    />
  );
}
