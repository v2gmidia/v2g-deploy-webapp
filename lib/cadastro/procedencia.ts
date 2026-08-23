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

export interface CampoParaGravar {
  campo: string;
  /**
   * O valor já validado. Vira `jsonb` no caminho, e a função usa
   * `#>> '{}'` para extrair — nunca `->>`, que devolveria o escalar com
   * aspas e gravaria `"Sorocaba"` numa coluna text.
   */
  valor: ValorDeCampo;
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

  for (const { campo, valor } of args.campos) {
    const { data, error } = await admin.rpc("confirmar_campo_do_cliente", {
      p_profile_id: args.profileId,
      p_business_id: args.businessId,
      p_tabela: args.tabela,
      p_campo: campo,
      p_valor: valor,
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
