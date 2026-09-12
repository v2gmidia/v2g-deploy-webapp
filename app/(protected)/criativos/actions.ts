"use server";

import { analisarCriativoPronto, type AnaliseDaPeca } from "@/lib/backend";
import { MENSAGEM_GENERICA_BACKEND } from "@/lib/backend/erros";
import { estadoDoCliente } from "@/lib/estado/cliente";

/**
 * Manda a peça para análise.
 *
 * ============================================================
 * O `idExecucao` SAI DA SESSÃO, NUNCA DO FORMULÁRIO.
 *
 * É a mesma regra da `/anuncios`, e pelo mesmo motivo:
 * `POST /execucoes/{id}/criativo-pronto` **não aceita `profile_id`**.
 * Quem tem o `X-V2G-Token` escreve na execução de qualquer cliente.
 *
 * Então a execução não é um argumento desta função — ela é lida aqui
 * dentro, de `estadoDoCliente()`, que por sua vez a obtém de
 * `GET /negocios/{business_id}/execucao` com o `profile_id` conferido.
 * **Não existe superfície que aceite um id de fora**, que é mais forte
 * que conferir um id que chegou.
 *
 * Quem acrescentar um parâmetro `idExecucao` aqui reabre o buraco, e
 * nenhuma checagem de tipo vai reclamar.
 * ============================================================
 */
export type ResultadoDaAnalise =
  | { ok: true; analise: AnaliseDaPeca }
  | { ok: false; recado: string };

export async function analisarPecaAction(dados: FormData): Promise<ResultadoDaAnalise> {
  const arquivos = dados
    .getAll("arquivos")
    .filter((a): a is File => a instanceof File && a.size > 0);

  if (arquivos.length === 0) {
    return { ok: false, recado: "Escolha uma imagem para a gente analisar." };
  }

  const estado = await estadoDoCliente(new Date()).catch(() => null);
  const idExecucao = estado?.diaSeguinte.execucao?.idExecucao ?? null;

  if (!idExecucao) {
    // Não é falha: é a conta ainda não ter uma campanha em montagem. A
    // tela já mostra isso antes do formulário; esta é a segunda linha,
    // para o caso de a execução sumir entre o render e o envio.
    return {
      ok: false,
      recado:
        "A gente ainda não tem uma campanha sua em montagem, e é a ela que a peça se liga. Assim que ela existir, esta página passa a aceitar envio.",
    };
  }

  // ============================================================
  // A ACTION NÃO LANÇA. NUNCA.
  //
  // `analisarCriativoPronto` já devolve `Resultado` em vez de lançar —
  // `chamar()` tem `catch` e converte exceção em `falha(categoria)`. Mas
  // o resto desta função pode lançar por fora disso: `estadoDoCliente()`
  // fala com o Supabase, e um Server Component que lança devolve erro de
  // framework para o cliente, que é a rejeição que deixava a tela presa.
  //
  // O `try` aqui é a segunda linha de defesa. A primeira é o `finally`
  // da tela, e as duas existem porque uma promessa pendente não tem
  // dono: quem a criou não sabe que ela morreu.
  // ============================================================
  try {
    const resposta = await analisarCriativoPronto({ idExecucao, arquivos });

    if (!resposta.ok) {
      // A categoria não vai para a tela: ela é diagnóstico nosso, e
      // "nao_autorizado" não diz nada ao dono. O recado é um só, e não
      // usa a palavra "erro".
      return { ok: false, recado: MENSAGEM_GENERICA_BACKEND };
    }

    return { ok: true, analise: resposta.dados };
  } catch {
    // Sem detalhe e sem categoria: o que chega aqui é o inesperado, e
    // inesperado não tem texto útil para o dono. O que ele precisa saber
    // é que a imagem dele está intacta e que dá para tentar de novo.
    return {
      ok: false,
      recado:
        "A gente não conseguiu terminar de olhar sua imagem agora. Ela não foi publicada nem alterada — tente de novo em um instante.",
    };
  }
}
