import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pedidoAssinadoDaRequisicao } from "@/lib/meta/signed-request";

/**
 * `POST /auth/meta/desautorizar` — a Meta avisa que alguém tirou o app.
 *
 * URL de retorno de desautorização, obrigatória para publicar o app.
 *
 * ============================================================
 * DESAUTORIZAR NÃO É EXCLUIR, E A DIFERENÇA É O CLIENTE.
 *
 * Aqui a pessoa removeu o app do Facebook dela. O que a gente perde é o
 * ACESSO: o token sai do Vault, a conexão vira `revoked`, as contas de
 * anúncio ficam marcadas, e a faixa de reconexão aparece na interface.
 *
 * O que a gente NÃO faz é apagar o negócio. Um clique numa tela de
 * configuração do Facebook não é um pedido para perder a conta que paga —
 * e quem quiser apagar tem o outro callback, que existe para isso.
 * ============================================================
 *
 * ============================================================
 * SEM SESSÃO, POR DESENHO. Quem chama é a Meta, não o navegador do
 * cliente. Então a única prova de identidade é a assinatura do
 * `signed_request` contra o `META_APP_SECRET` — ver
 * `lib/meta/signed-request.ts`. Não há segunda camada aqui, e é por isso
 * que aquela verificação falha fechada em todos os casos.
 * ============================================================
 *
 * SEMPRE 200 quando a assinatura confere, inclusive se não houver nada
 * para revogar: a Meta repete o callback em erro, e um 500 num pedido que
 * já foi atendido viraria retentativa sem fim. `desautorizar_meta` é
 * idempotente — na segunda chamada o laço não acha conexão e devolve 0.
 */
export async function POST(request: Request) {
  const pedido = await pedidoAssinadoDaRequisicao(request);

  // 400, e não 200: assinatura inválida não é um pedido nosso para
  // atender. Responder 200 aqui ensinaria a Meta que qualquer corpo serve.
  if (!pedido) {
    return NextResponse.json({ erro: "assinatura invalida" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("desautorizar_meta", {
      p_meta_user_id: pedido.userId,
    });
    if (error) throw new Error(error.message);

    // O `user_id` do Meta NÃO entra no log: é identificador de pessoa, e
    // log de produção é lido por gente que não precisa dele. O que
    // interessa para diagnóstico é quantas conexões foram atingidas.
    console.log(`[meta:desautorizar] conexoes revogadas :: ${data ?? 0}`);
    return NextResponse.json({ ok: true, conexoes: data ?? 0 });
  } catch (erro) {
    console.error(
      `[meta:desautorizar] falha :: ${erro instanceof Error ? erro.message : "desconhecido"}`,
    );
    // 500 aqui é o certo, e é o oposto do caso acima: a assinatura era
    // válida e o pedido é legítimo — a gente é que não conseguiu
    // atender. Retentativa da Meta é exatamente o que se quer.
    return NextResponse.json({ erro: "falha ao revogar" }, { status: 500 });
  }
}
