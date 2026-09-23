import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * AVISAR O CLIENTE QUE O ANÚNCIO ENTROU NO AR.
 *
 * ============================================================
 * ⚠️ ESTA FUNÇÃO NÃO MANDA MENSAGEM NENHUMA. ELA REGISTRA A DÍVIDA.
 *
 * O canal decidido é o WhatsApp. **Não existe, neste repositório nem no
 * `backend_v2g`, nenhuma integração que MANDE WhatsApp.** Varrido em
 * 23/09/2026:
 *
 *   - `package.json` e `pyproject.toml`: zero bibliotecas de envio
 *     (Twilio, Z-API, Baileys, wppconnect, 360dialog, Infobip, Gupshup);
 *   - zero chamadas a `graph.facebook.com/.../messages` ou equivalente;
 *   - as 11 ocorrências de `wa.me` no webapp são LINKS que o cliente
 *     clica para falar com a V2G — o sentido contrário deste aviso;
 *   - `api.whatsapp.com/send` em `lib/meta/publicar.ts:707` é o destino
 *     DENTRO do anúncio, para onde o consumidor final vai ao clicar;
 *   - no backend, toda menção a WhatsApp é texto de criativo
 *     ("Chama no WhatsApp" como CTA), não envio;
 *   - `.env.example` não tem variável de canal nenhuma.
 *
 * O repositório já sabia disso, escrito em
 * `docs/estado/pilares-10-09.md:60`: *"nos três degraus a mensagem só
 * alcança quem já voltou."* Hoje nada sai daqui para o cliente.
 *
 * **PLUGAR O ENVIO DE VERDADE AQUI**, quando a integração existir —
 * dentro de `entregar()`, logo abaixo. O resto desta função já está
 * pronto para isso: ela sabe quem avisar, sobre o quê, e registra que
 * ficou devendo.
 *
 * NÃO MEDIDO: o n8n fica fora dos dois repositórios (CLAUDE.md), e pode
 * ter um nó de WhatsApp que eu não enxergo daqui. Se tiver, é lá que o
 * `entregar()` vai chamar.
 * ============================================================
 *
 * ============================================================
 * POR QUE REGISTRAR, E NÃO SÓ NÃO FAZER NADA.
 *
 * Um `TODO` não é dívida: é lembrete que some no `git log`. Uma linha em
 * `decisions` com `status = 'pending'` é uma pergunta que o banco
 * responde — "quem ficou sem aviso?" — e que continua respondendo depois
 * que todo mundo esqueceu.
 *
 * E ela é acionável HOJE, sem integração nenhuma: alguém do time roda a
 * consulta, vê a lista, e manda a mensagem na mão. É pior que automático
 * e é infinitamente melhor que o cliente descobrir pelo extrato.
 * ============================================================
 */

/** O que o aviso precisa saber para ser mandado, um dia, por qualquer canal. */
export interface AvisoPendente {
  campanhaId: string;
  negocioId: string;
  /** o WhatsApp da PESSOA (`profiles.whatsapp`), não o do anúncio */
  whatsapp: string | null;
  /** o nome do negócio, para a mensagem não começar com "olá cliente" */
  nomeDoNegocio: string | null;
  /** quando a campanha entrou no ar */
  noArDesde: string;
}

export type ResultadoDoAviso =
  /** registrado como pendente; ninguém foi avisado ainda */
  | { entregue: false; registrado: true }
  /** nem registrar deu certo — o motivo está no log */
  | { entregue: false; registrado: false; motivo: string };

/**
 * A porta de saída, hoje fechada.
 *
 * Quando o canal existir, é ESTA função que ganha corpo — e a de cima
 * continua igual, porque ela já faz a parte que não muda: descobrir quem
 * avisar e sobre o quê.
 *
 * Ela devolve `false` em vez de lançar: o aviso não ter saído **nunca**
 * pode fazer a ativação parecer que falhou. A campanha está no ar; o que
 * faltou foi contar.
 */
async function entregar(_aviso: AvisoPendente): Promise<boolean> {
  // ============================================================
  // PLUGAR O ENVIO DE VERDADE AQUI.
  //
  // Canal decidido: WhatsApp. Integração: não existe ainda (ver o bloco
  // do topo). Quando existir, este corpo vira a chamada e devolve `true`
  // só quando o outro lado confirmar — nunca por ter tentado.
  //
  // O que a mensagem precisa dizer, quando for escrita: que o anúncio
  // entrou no ar, sem jargão e sem número de campanha. E NÃO pode
  // celebrar: entrar no ar não é conquista do cliente, é o serviço
  // começando. Celebração antes de resultado é o que este produto não faz.
  // ============================================================
  return false;
}

/**
 * Descobre quem avisar, tenta entregar, e registra a dívida se não deu.
 *
 * Recebe só o id da campanha — o negócio, o WhatsApp e o nome saem da
 * linha, nunca de parâmetro. É a mesma disciplina da trava de identidade
 * do Bloco 2: quem chama não escolhe de quem é o aviso.
 */
export async function avisarClienteQueCampanhaEstaNoAr(
  campanhaId: string,
): Promise<ResultadoDoAviso> {
  try {
    const supa = createAdminClient();

    const { data: campanha } = await supa
      .from("campaigns")
      .select("id, business_id, ativada_em")
      .eq("id", campanhaId)
      .maybeSingle();

    if (!campanha?.business_id) {
      return {
        entregue: false,
        registrado: false,
        motivo: "campanha sem negócio — não há quem avisar",
      };
    }

    const negocioId: string = campanha.business_id;

    const { data: negocio } = await supa
      .from("businesses")
      .select("id, name, profile_id")
      .eq("id", negocioId)
      .maybeSingle();

    // ============================================================
    // O NÚMERO É `profiles.whatsapp`, E NÃO `businesses.whatsapp_do_anuncio`.
    //
    // São dois números diferentes e a confusão seria cara:
    //
    //   profiles.whatsapp            o da PESSOA que contratou. O cadastro
    //                                o exige dizendo, com estas palavras,
    //                                "é por ele que a gente te avisa"
    //                                (`entrar/actions.ts:55-57`).
    //   businesses.whatsapp_do_anuncio  o do NEGÓCIO, para onde o anúncio
    //                                manda o consumidor final (0022).
    //
    // Avisar no segundo seria mandar a mensagem para a caixa de entrada
    // que o próprio anúncio está enchendo de cliente.
    // ============================================================
    const perfilId = (negocio?.profile_id as string | null) ?? null;
    const { data: perfil } = perfilId
      ? await supa.from("profiles").select("whatsapp").eq("id", perfilId).maybeSingle()
      : { data: null };

    const aviso: AvisoPendente = {
      campanhaId: String(campanha.id),
      negocioId,
      whatsapp: (perfil?.whatsapp as string | null) ?? null,
      nomeDoNegocio: (negocio?.name as string | null) ?? null,
      noArDesde: (campanha.ativada_em as string | null) ?? new Date().toISOString(),
    };

    const entregue = await entregar(aviso);

    // ============================================================
    // `status: 'pending'` É O ESTADO CERTO, e não 'failed'.
    //
    // Falhou seria mentira: não houve tentativa que deu errado — não há
    // canal. `pending` é o default da coluna (`0001_init.sql:570`) e diz
    // exatamente o que é: esperando ser feito.
    //
    // `needs_review` marca porque alguém PRECISA olhar. É o mesmo campo
    // que a fila de revisão usa, e é o que transforma esta linha de
    // registro morto em pergunta que o time responde.
    // ============================================================
    await supa.from("decisions").insert({
      business_id: negocioId,
      campaign_id: campanhaId,
      kind: "aviso_de_no_ar",
      payload: {
        ...aviso,
        canal: "whatsapp",
        entregue,
        motivo: entregue ? null : "nao ha integracao de envio de WhatsApp neste repositorio",
      },
      status: entregue ? "done" : "pending",
      needs_review: !entregue,
    });

    return { entregue: false, registrado: true };
  } catch (erro) {
    // O aviso é o último passo e o menos crítico: a campanha já está no
    // ar. Quebrar aqui não pode derrubar nada acima.
    console.error(`[aviso] não deu para registrar o aviso de ${campanhaId} ::`, erro);
    return { entregue: false, registrado: false, motivo: String(erro) };
  }
}
