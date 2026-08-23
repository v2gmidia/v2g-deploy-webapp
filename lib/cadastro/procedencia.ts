import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A única porta pela qual o onboarding grava campo de perfil.
 *
 * NÃO EXISTE `update` DIRETO NAS COLUNAS DE PERFIL a partir daqui para
 * baixo, e a razão é a cicatriz da `/conta`: ela grava `name`, `niche`,
 * `city`, `avg_ticket_*` e `monthly_budget` com um update comum, sem
 * procedência nenhuma. O resultado é que corrigir um campo pela tela de
 * Conta REBAIXA a origem dele para `desconhecida` — o valor fica, a
 * afirmação de quem disse some. Dois caminhos de escrita para a mesma
 * coluna sempre acabam assim.
 *
 * Quem faz o trabalho é `confirmar_campo_do_cliente` (migration 0015,
 * lista branca ampliada pela 0016). Ela grava valor e procedência na
 * MESMA transação, deriva o ato do estado real da coluna e limpa
 * `geo_key` quando a cidade muda. Este módulo é só o transporte.
 */

export type TabelaDePerfil = "businesses" | "identidade_visual" | "narrativa_negocio";

export type ValorDeCampo = string | number | boolean | string[];

/**
 * A procedência que esta porta sabe produzir. Duas, e só duas.
 *
 * `manual` e `extraido` NÃO entram: são o vocabulário de outros canais
 * (alguém da V2G anotou na conversa; o agente tirou da transcrição), e
 * quem escreve com eles é a `escrever_apenas_se_livre` da `0019`. A função
 * do banco recusa qualquer outro valor — a restrição existe nas duas
 * camadas de propósito.
 */
export type OrigemDoCliente = "confirmado" | "aproximacao";

export interface CampoParaGravar {
  campo: string;
  /**
   * O valor já validado. Vira `jsonb` no caminho, e a função usa
   * `#>> '{}'` para extrair — nunca `->>`, que devolveria o escalar com
   * aspas e gravaria `"Sorocaba"` numa coluna text.
   */
  valor: ValorDeCampo;
  /**
   * A procedência deste campo. Omitido = `confirmado`, que é o caso de
   * todo mundo que existia antes da migration `0021`.
   *
   * POR CAMPO E NÃO POR LOTE: numa mesma gravação pode haver um campo que
   * o cliente afirmou e outro que ele aproximou. A resposta de `praca`
   * grava `city` e `radius_km` juntos; se um dia uma dessas virar palpite,
   * marcar o lote inteiro mentiria sobre a outra.
   */
  origem?: OrigemDoCliente;
}

export interface AtoRegistrado {
  campo: string;
  /** derivado pelo banco a partir do que estava lá, não informado por nós */
  ato: "confirmou" | "corrigiu" | "preencheu";
  procedenciaAnterior: string;
}

export type ResultadoDaGravacao =
  | { ok: true; atos: AtoRegistrado[] }
  | { ok: false; erro: string; campoQueFalhou: string; gravados: AtoRegistrado[] };

/**
 * Grava N campos, um por chamada, parando na primeira falha.
 *
 * **A ORDEM IMPORTA PARA QUEM CHAMA.** A função do banco é atômica por
 * campo, não por lote: são N transações. Um par como
 * `avg_ticket_min`/`avg_ticket_max` pode ficar meio gravado se a segunda
 * chamada falhar, e aí `ticketEscalar` calcula um ponto médio entre um
 * valor novo e um velho — errado sem parecer errado.
 *
 * Por isso a regra de uso: **chame isto ANTES de marcar a resposta como
 * concluída no jsonb.** Com o jsonb ainda sem a marca, a pergunta
 * continua aberta, o cliente responde de novo e as colunas são reescritas
 * juntas. A inconsistência se cura sozinha na próxima tentativa em vez de
 * ficar guardada.
 *
 * `profileId` NÃO vem do formulário. Ele sai de `auth.getUser()` de quem
 * chama, e a função do banco confere de novo que o negócio é desse perfil
 * — a segunda camada existe porque ela é `security definer` e ignora RLS.
 */
export async function gravarCamposDoCliente(args: {
  profileId: string;
  businessId: string;
  tabela: TabelaDePerfil;
  campos: CampoParaGravar[];
}): Promise<ResultadoDaGravacao> {
  const admin = createAdminClient();
  const atos: AtoRegistrado[] = [];

  for (const { campo, valor, origem } of args.campos) {
    const { data, error } = await admin.rpc("confirmar_campo_do_cliente", {
      p_profile_id: args.profileId,
      p_business_id: args.businessId,
      p_tabela: args.tabela,
      p_campo: campo,
      p_valor: valor,
      // ============================================================
      // ESTE ARGUMENTO EXIGE A MIGRATION `0021` APLICADA.
      //
      // Ele é sempre mandado, inclusive com o valor padrão, e é decisão:
      // mandar só quando é `aproximacao` faria o caminho degradado ser o
      // ÚNICO a exercitar a assinatura nova. O erro apareceria pela
      // primeira vez com o backend já fora — o pior momento possível para
      // descobrir que a migration não rodou.
      //
      // Mandando sempre, banco velho quebra na primeira gravação de
      // qualquer campo, em desenvolvimento, na hora. Ver
      // `docs/migration-no-repo-nao-e-migration-aplicada.md`.
      // ============================================================
      p_origem: origem ?? "confirmado",
    });

    if (error) {
      // A mensagem crua da função é para o log, não para a tela: ela cita
      // nome de tabela e de coluna. Mesma regra do `lib/auth-errors.ts`.
      console.error(
        `[procedencia] falha em ${args.tabela}.${campo} :: ${error.message}`,
      );
      return {
        ok: false,
        erro: "Não conseguimos salvar essa resposta. Tente de novo.",
        campoQueFalhou: campo,
        gravados: atos,
      };
    }

    const bruto = data as { campo?: string; ato?: string; procedencia_anterior?: string } | null;
    atos.push({
      campo,
      ato: (bruto?.ato as AtoRegistrado["ato"]) ?? "preencheu",
      procedenciaAnterior: bruto?.procedencia_anterior ?? "desconhecida",
    });
  }

  return { ok: true, atos };
}
