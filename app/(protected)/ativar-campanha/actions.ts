"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  conferirAntesDeAtivar,
  type ConfirmacaoDeAtivacao,
  type ConfirmacaoRecusada,
} from "@/lib/campanha/ativacao";
import { ativarCampanha, pausarCampanha } from "@/lib/meta/ativar";

/**
 * AS AÇÕES DA TELA DE ATIVAÇÃO — a casca, com o portão de papel.
 *
 * ============================================================
 * O CORPO NÃO ESTÁ AQUI, e é decisão. Ver `lib/campanha/ativacao.ts`:
 * a página e a ação precisam do MESMO dado, e duas consultas paralelas
 * acabariam discordando. Aqui fica o que só a requisição tem: quem é
 * você, e o que veio no formulário.
 *
 * TRÊS PORTAS, como em `/revisar-perfil`:
 *   1. `proxy.ts` guarda `/ativar-campanha` por PROTECTED_PREFIXES;
 *   2. e de novo por OPERADOR_PREFIXES;
 *   3. cada action chama `operadorOuErro()` na PRIMEIRA linha do corpo,
 *      antes de ler o `formData`.
 * ============================================================
 */

/**
 * O portão de papel. Devolve o e-mail, que é o que vira `ativada_por`.
 *
 * Mesmo corpo de `revisar-perfil/[proposta]/actions.ts:22-34`, e de
 * propósito: duas versões divergentes do mesmo portão é como um lado
 * passa a aceitar o que o outro recusa.
 */
async function operadorOuErro(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") {
    throw new Error("não autorizado");
  }
  // O e-mail é o que fica gravado em `ativada_por`. O id serve de reserva
  // para conta sem e-mail — o campo não pode ficar vazio, porque "quem
  // ativou" é metade do valor do registro.
  return user.email ?? user.id;
}

/**
 * O que o operador vê antes de confirmar.
 *
 * ============================================================
 * ELA RELÊ TUDO, TODA VEZ — NÃO CONFIA EM ESTADO DE TELA.
 *
 * A tela pode estar aberta há meia hora. Entre ela carregar e o clique
 * acontecer, a conta de anúncio pode ter sido desativada, o token pode
 * ter morrido, o cliente pode ter mudado o teto do mês, e a campanha
 * pode ter sido ativada por outra pessoa do time. Nada disso avisa.
 *
 * Por isso esta ação existe separada da leitura da página: ela é chamada
 * de novo no clique, e o que a página mostrou não vale como autorização.
 * A ativação do Bloco 3 chama esta mesma função mais uma vez,
 * imediatamente antes de falar com o Meta.
 * ============================================================
 */
export async function reconferirAction(
  formData: FormData,
): Promise<ConfirmacaoDeAtivacao | ConfirmacaoRecusada> {
  await operadorOuErro();

  // ============================================================
  // O ID VEM DO FORMULÁRIO, E É O ÚNICO QUE VEM.
  //
  // `campanhaId` é o único dado de fora que esta ação aceita. O NEGÓCIO
  // nunca é parâmetro: ele é lido da linha da campanha, lá dentro. Ver a
  // trava em `lib/campanha/ativacao.ts` e a declaração em
  // `lib/seguranca/excecoes.ts`.
  // ============================================================
  const campanhaId = String(formData.get("campanhaId") ?? "").trim();
  if (!campanhaId) {
    return { ok: false, motivo: "campanha_inexistente", texto: "Sem campanha para conferir." };
  }

  return conferirAntesDeAtivar(campanhaId);
}

/**
 * ATIVAR — a ação que gasta dinheiro.
 *
 * ============================================================
 * O QUE ELA NÃO FAZ: confiar em nada que veio da tela.
 *
 * Ela recebe UM dado, o id da campanha. Não recebe o valor confirmado,
 * não recebe "o operador já viu os bloqueios", não recebe o estado que a
 * página desenhou. `ativarCampanha()` reconfere tudo do zero, a
 * centímetros da chamada ao Meta — ver a invariante 1 de
 * `lib/meta/ativar.ts`.
 *
 * Um campo escondido do tipo `confirmado=1` seria a tela autorizando a
 * si mesma, e é exatamente o que não pode existir aqui.
 * ============================================================
 *
 * ============================================================
 * O `try` NÃO É DECORAÇÃO, E O QUE ELE PEGA É DIFERENTE DO RESTO.
 *
 * `ativarCampanha()` já devolve `{ ok: false, mensagem }` para tudo que
 * ela PREVÊ — Meta recusando, bloqueio do pré-voo, trava tomada. O que
 * o `try` pega é o que ela não prevê: banco fora do ar, `service_role`
 * ausente do ambiente, JSON quebrado na resposta.
 *
 * Sem ele isso vira 500 genérico numa tela que acabou de pedir para
 * alguém apertar um botão que gasta dinheiro. O operador ficaria sem
 * saber se a campanha subiu ou não — que é a pior resposta possível
 * aqui, pior que "falhou".
 *
 * A frase que ele grava diz exatamente isso: não sabemos, vá conferir.
 * ============================================================
 */
export async function ativarAction(formData: FormData): Promise<void> {
  const quem = await operadorOuErro();

  const campanhaId = String(formData.get("campanhaId") ?? "").trim();
  if (!campanhaId) return;

  try {
    await ativarCampanha(campanhaId, quem);
  } catch (erro) {
    await registrarQuebra(campanhaId, "ativacao_resultado", erro, quem);
  }

  revalidatePath(`/ativar-campanha/${campanhaId}`);
  revalidatePath("/ativar-campanha");
}

/**
 * PAUSAR — o freio.
 *
 * Mesmo portão, mesmo id, e NENHUMA confirmação de valor: ver a
 * invariante 3 de `lib/meta/ativar.ts`. Parar de gastar não pede licença.
 *
 * O `try` aqui vale ainda mais: se pausar quebrar por motivo nosso, o
 * dinheiro continua saindo enquanto ninguém sabe.
 */
export async function pausarAction(formData: FormData): Promise<void> {
  const quem = await operadorOuErro();

  const campanhaId = String(formData.get("campanhaId") ?? "").trim();
  if (!campanhaId) return;

  try {
    await pausarCampanha(campanhaId, quem);
  } catch (erro) {
    await registrarQuebra(campanhaId, "pausa_resultado", erro, quem);
  }

  revalidatePath(`/ativar-campanha/${campanhaId}`);
  revalidatePath("/ativar-campanha");
}

/**
 * O que sobrou do `catch` vira linha de `decisions`, como tudo o mais.
 *
 * ============================================================
 * ELE PRÓPRIO PODE FALHAR, e isso está tratado.
 *
 * Se o banco caiu, gravar a falha no banco também cai. O `catch` de
 * dentro existe para que a quebra do registro não substitua a quebra
 * original por um 500 — o `console.error` é o último recurso, e é o que
 * sobra quando nem o rastro dá para escrever.
 * ============================================================
 */
async function registrarQuebra(
  campanhaId: string,
  kind: "ativacao_resultado" | "pausa_resultado",
  erro: unknown,
  quem: string,
): Promise<void> {
  console.error(`[ativar-campanha] quebra inesperada em ${campanhaId} ::`, erro);
  try {
    const admin = createAdminClient();
    const { data: campanha } = await admin
      .from("campaigns")
      .select("business_id")
      .eq("id", campanhaId)
      .maybeSingle();

    await admin.from("decisions").insert({
      business_id: campanha?.business_id ?? null,
      campaign_id: campanhaId,
      kind,
      payload: {
        quebra: true,
        por: quem,
        mensagem:
          "Alguma coisa quebrou do nosso lado no meio da operação. NÃO dá para saber se o Meta chegou a receber a mudança — confira no Gerenciador de Anúncios antes de tentar de novo.",
        detalhe: String(erro),
      },
      status: "failed",
      needs_review: true,
    });
  } catch (aoRegistrar) {
    console.error("[ativar-campanha] nem o rastro deu para gravar ::", aoRegistrar);
  }
}
