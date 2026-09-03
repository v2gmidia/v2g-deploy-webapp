"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  consolidadoDoNegocio,
  execucaoDoNegocio,
  gravarRespostaDoDono,
  MENSAGEM_GENERICA_BACKEND,
} from "@/lib/backend";
import { diaDeOntemEmSaoPaulo, diasAntesDe } from "@/lib/dia-seguinte/dia";
import {
  diaPodeSerRespondido,
  DIAS_DE_MEMORIA,
} from "@/lib/dia-seguinte/dias-em-aberto";
import { PERGUNTA_GRAVADA } from "@/lib/dia-seguinte/pergunta";
import { montarRespostaDoDono } from "@/lib/dia-seguinte/resposta";

/**
 * A resposta da pergunta diária.
 *
 * ============================================================
 * O `id_execucao` NÃO VEM DO FORMULÁRIO. NUNCA.
 *
 * Ele é buscado aqui, a partir do `business_id` que saiu de um `select`
 * sob RLS com `.eq("profile_id", user.id)`. É a mesma disciplina do
 * `lib/pipeline/execucao-do-cliente.ts`: o passo "confere o dono" não é um
 * `if` que alguém pode esquecer, é a AUSÊNCIA de um caminho que aceite id
 * de fora.
 *
 * O backend confere de novo, pelo `profile_id` — decisão do Victor em
 * 01/09. As duas camadas, e a de cá é a que não depende de o outro lado
 * estar certo.
 * ============================================================
 */

export interface ResultadoDaResposta {
  ok: boolean;
  erro?: string;
}

/**
 * O dia sobre o qual se pergunta: ONTEM, no fuso de São Paulo.
 *
 * Decidido em 01/09 — o dono responde sobre o dia que fechou. E o fuso é
 * regra, não formatação: calculado em UTC, às 22h de Brasília isto daria
 * anteontem, e a resposta iria por cima do dia errado. Ver `./dia.ts`.
 */
function diaDaPergunta(): string {
  return diaDeOntemEmSaoPaulo(new Date());
}

export async function responderPerguntaDoDiaAction(entrada: {
  /**
   * `undefined` = não mexeu neste campo. `null` = disse "não sei".
   *
   * A distinção é o que impede o botão "não sei" de virar "não mexi" — e
   * vice-versa. Ver `montarRespostaDoDono`.
   */
  vendas?: number | null;
  receitaCentavos?: number | null;
  /**
   * O dia que a tela estava perguntando, `YYYY-MM-DD`. Omitido = ontem.
   *
   * Passou a existir com a correção de dia atrasado. **Vem do cliente, e
   * por isso é conferido no servidor** — ver `diaPodeSerRespondido`.
   */
  dia?: string;
}): Promise<ResultadoDaResposta> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };

  // Sob RLS: é isto que garante que o negócio é dele.
  const { data: negocio } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!negocio) return { ok: false, erro: "Não encontramos seu negócio." };
  const businessId = negocio.id as string;

  const execucao = await execucaoDoNegocio({ businessId, profileId: user.id });
  if (!execucao.ok) return { ok: false, erro: MENSAGEM_GENERICA_BACKEND };
  if (!execucao.dados) {
    // Sem execução não há onde gravar — e o contrato é explícito: "nunca
    // se grava resposta órfã". Não é erro do cliente; é tela que não
    // deveria ter sido oferecida.
    return { ok: false, erro: "Sua campanha ainda não começou a rodar." };
  }

  const ontem = diaDaPergunta();

  // ============================================================
  // A LEITURA DEIXOU DE SER OBRIGATÓRIA PARA ESCREVER.
  //
  // Antes do merge por campo, não conseguir ler impedia gravar: montar com
  // um campo só apagaria o outro. Agora o campo não mexido é OMITIDO, e
  // omitir preserva — então a leitura serve apenas para a checagem local
  // de "sobrou alguma coisa", que o backend refaz.
  //
  // Recusar a resposta do cliente por causa de uma leitura que falhou
  // seria cobrar dele um problema nosso.
  // ============================================================
  // A JANELA INTEIRA DA MEMÓRIA, e não só o dia pedido.
  //
  // Ela serve a dois usos: o valor atual do dia que ele está respondendo, e
  // a lista de dias em aberto que decide se o dia PEDIDO é permitido. Uma
  // janela de um dia só bastava enquanto a pergunta era sempre sobre
  // ontem; com atrasado, ela cegaria a conferência.
  const consolidado = await consolidadoDoNegocio({
    businessId,
    profileId: user.id,
    desde: diasAntesDe(ontem, DIAS_DE_MEMORIA - 1),
    ate: ontem,
    diaDaPergunta: ontem,
  });

  // ============================================================
  // O DIA VEM DO CLIENTE, ENTÃO O SERVIDOR CONFERE.
  //
  // Antes desta mudança o dia era calculado aqui e não havia o que
  // conferir. Agora a tela escolhe qual dia está corrigindo, e cliente
  // manda o que quiser — sem esta linha, um POST à mão gravaria resposta em
  // qualquer data, inclusive futura.
  //
  // A conferência usa a MESMA função que monta a tela. Uma regra paralela
  // no servidor divergiria, e a que divergisse seria a que ninguém olha.
  // ============================================================
  const dia = entrada.dia ?? ontem;
  const permitido = await diaPodeSerRespondido({
    dia,
    ontem,
    idExecucao: execucao.dados.idExecucao,
    consolidado: consolidado.ok ? consolidado.dados : null,
  });

  if (!permitido) {
    // Sem consolidado legível, só ontem passa — é o único dia que não
    // depende de saber o que já foi respondido. Recusar aqui não perde
    // dado: ele responde de novo quando a leitura voltar.
    return {
      ok: false,
      erro: "Não consegui confirmar de que dia é essa resposta. Tente de novo.",
    };
  }

  const montagem = montarRespostaDoDono({
    dia,
    pergunta: PERGUNTA_GRAVADA,
    mexeu: { vendas: entrada.vendas, receitaCentavos: entrada.receitaCentavos },
    consolidado: consolidado.ok ? consolidado.dados : null,
    origem: "app",
  });

  if (!montagem.ok) return { ok: false, erro: montagem.erro };

  const gravado = await gravarRespostaDoDono({
    idExecucao: execucao.dados.idExecucao,
    corpo: montagem.corpo,
  });

  if (!gravado.ok) return { ok: false, erro: MENSAGEM_GENERICA_BACKEND };

  revalidatePath("/inicio");
  return { ok: true };
}
