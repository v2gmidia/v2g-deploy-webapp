import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pedidoAssinadoDaRequisicao } from "@/lib/meta/signed-request";

/**
 * `POST /auth/meta/exclusao-de-dados` — o pedido de exclusão da Meta.
 *
 * Obrigatória para publicar o app, e obrigatória pela LGPD. A Meta espera
 * um JSON com `url` e `confirmation_code`.
 *
 * ============================================================
 * ELE APAGA DE VERDADE, E É O PONTO INTEIRO DESTA ROTA.
 *
 * A forma fácil de atender ao requisito é devolver 200 com um código e
 * não apagar nada — o painel da Meta aceita, e ninguém confere. Isso é
 * conformidade DECLARADA, não conformidade: a promessa existe e o efeito
 * não, e não há como distinguir de fora.
 *
 * É o mesmo padrão que o backend catalogou no `CLAUDE.md` §11.1 — a
 * ausência de medição saindo igual à ausência de dado. Aqui a versão é
 * jurídica: "apagamos" e "não apagamos" saem idênticos pela porta.
 *
 * O que quebra o empate é o registro: `apagar_dados_da_meta` devolve a
 * contagem do que saiu, a contagem fica na `exclusoes_de_dados`, e a
 * página do código mostra. Se apagou zero, a página diz zero.
 * ============================================================
 *
 * ============================================================
 * ESCOPO ESTRITO — o que veio da Meta. NÃO apaga a conta.
 *
 * Decisão do Victor, 04/09/2026, e o argumento: o `signed_request` prova
 * que quem pediu é o mesmo usuário do Meta, não que ele quer perder a
 * conta que paga R$ 490/mês. Prometer menos e cumprir por inteiro é
 * melhor que prometer tudo e ter que segurar.
 *
 * A página de status diz o que saiu, o que ficou, e como pedir o resto.
 * Ver `docs/exclusao-de-dados-meta.md`.
 * ============================================================
 *
 * APAGA ANTES DE RESPONDER, de propósito. Fila daria resposta mais rápida
 * e criaria um estado — "pedido aceito, nada apagado" — que precisaria de
 * alguém para drenar, e não há esse alguém no webapp. Medido: o conjunto
 * é pequeno (uma conexão, um segredo, poucas linhas), e enquanto for
 * assim, apagar na hora é o desenho honesto. Se `metrics_daily` crescer
 * quando o coletor ligar, isto vira fila — e aí `concluido_em` nulo passa
 * a ter significado, que hoje ele só tem em caso de erro.
 */
export async function POST(request: Request) {
  const pedido = await pedidoAssinadoDaRequisicao(request);
  if (!pedido) {
    return NextResponse.json({ erro: "assinatura invalida" }, { status: 400 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  if (!base) {
    // Sem a base não dá para montar a URL de status, e a Meta EXIGE uma
    // URL consultável. Devolver um código sem endereço seria devolver um
    // código que não significa nada.
    console.error("[meta:exclusao] NEXT_PUBLIC_SITE_URL ausente — pedido nao atendido");
    return NextResponse.json({ erro: "indisponivel" }, { status: 500 });
  }

  // 16 bytes de aleatoriedade real, em hex. Não é `randomUUID` porque o
  // código é lido e digitado por gente, e o formato com hífens convida a
  // erro de transcrição.
  const codigo = randomBytes(16).toString("hex");
  const url = `${base}/exclusao-de-dados/${codigo}`;

  try {
    const admin = createAdminClient();

    // O pedido é registrado ANTES de apagar. Se o apagamento estourar no
    // meio, existe a linha dizendo que alguém pediu — e um pedido perdido
    // é pior que um pedido com erro registrado.
    const { error: erroInsert } = await admin.from("exclusoes_de_dados").insert({
      codigo,
      meta_user_id: pedido.userId,
    });
    if (erroInsert) throw new Error(erroInsert.message);

    const { data, error } = await admin.rpc("apagar_dados_da_meta", {
      p_meta_user_id: pedido.userId,
    });
    if (error) throw new Error(error.message);

    const resumo = (data ?? {}) as Record<string, unknown>;
    const negocios = Array.isArray(resumo.negocios) ? (resumo.negocios as string[]) : [];

    await admin
      .from("exclusoes_de_dados")
      .update({
        concluido_em: new Date().toISOString(),
        o_que_foi_apagado: resumo,
        business_ids: negocios,
      })
      .eq("codigo", codigo);

    // Nem o `user_id` do Meta nem o código completo vão para o log: o
    // código é a credencial que abre a página de status.
    console.log(
      `[meta:exclusao] concluida :: negocios=${negocios.length} ` +
        `contas=${String(resumo.contas ?? 0)} metricas=${String(resumo.metricas ?? 0)}`,
    );

    return NextResponse.json({ url, confirmation_code: codigo });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "desconhecido";
    console.error(`[meta:exclusao] falha :: ${mensagem}`);

    // A falha fica gravada, e a página do código vai dizer que não deu.
    // Engolir isto devolvendo um código verde seria a mentira que esta
    // rota existe para não contar.
    try {
      const admin = createAdminClient();
      await admin.from("exclusoes_de_dados").update({ erro: mensagem }).eq("codigo", codigo);
    } catch {
      // Se nem o registro do erro grava, o log acima é o que sobra.
    }

    return NextResponse.json({ erro: "falha ao apagar" }, { status: 500 });
  }
}
