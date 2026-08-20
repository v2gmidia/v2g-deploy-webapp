import "server-only";

import { createClient } from "@/lib/supabase/server";
import { COLUNAS_DO_CADASTRO } from "@/lib/cadastro/consultar";
import { montarCadastro, type NegocioParaCadastro } from "@/lib/cadastro/montar";
import { resumirPendencias } from "@/lib/cadastro/pendencias";
import {
  blocosDaTrilha,
  montarEtapas,
  type Etapa,
  type MedidaDoCliente,
} from "./frases";

/**
 * A resposta única para "o que falta pra sair anúncio?".
 *
 * Desenho em `docs/estado-do-cliente.md`. Leia o §1 antes de acrescentar
 * uma leitura aqui — e o §3 antes de escrever qualquer frase numa tela.
 *
 * ============================================================
 * A REGRA QUE FAZ ISTO DURAR:
 *
 *   **Nenhuma tela escreve a própria frase sobre o que falta.**
 *
 * Se a frase que a sua tela precisa não existe aqui, o lugar de
 * acrescentá-la é `./frases.ts` — não o `page.tsx`. Um `if` sobre dado de
 * negócio dentro de um componente de tela é o defeito, mesmo quando a
 * frase está certa: foi assim que quatro telas passaram a dizer quatro
 * coisas diferentes sobre a mesma conta, com o módulo da fonte única já
 * importado em uma delas.
 * ============================================================
 *
 * TUDO SOB RLS, com o cliente do próprio usuário. Nenhum `service_role`
 * aqui, e isso é o que mantém `execucoes` fora do alcance: aquela tabela
 * mistura texto de cliente com raciocínio de agente na mesma coluna
 * (`docs/auditoria-resultados.md`), e o que a gente precisa dela — desde
 * quando a bola é nossa — já está em `businesses.cadastro_iniciado_em`, na
 * linha do próprio negócio.
 */

/** Os estados em que a conexão FUNCIONA. O domínio é fechado por check
 *  constraint na 0005: disconnected, connected, expiring, expired, revoked.
 *  `expiring` entra porque ela ainda publica — quem avisa que está para
 *  vencer é a `FaixaReconectar`, e mandar reconectar duas vezes, em dois
 *  lugares, com dois pesos, é ruído. */
const CONEXAO_VIVA: readonly string[] = ["connected", "expiring"];

/** Janela dos números do painel. Mesma dos 7 dias que o `/inicio` já usava. */
const DIAS_DE_JANELA = 7;

export interface ResultadoDaSemana {
  investido: number;
  conversas: number;
  receita: number;
  alcance: number;
}

export interface CampanhaNoAr {
  id: string;
  nome: string | null;
  metaStatus: string | null;
}

export interface EstadoDoCliente {
  temNegocio: boolean;
  negocioId: string | null;
  /** a cadeia inteira, em ordem */
  etapas: Etapa[];
  /**
   * A primeira etapa não concluída — **a única coisa que uma tela tem o
   * direito de chamar de "o que falta"**. `null` quer dizer que está tudo
   * em ordem, e nesse caso nenhuma tela fala de pendência.
   */
  proximo: Etapa | null;
  /**
   * O que melhora o anúncio e NÃO o bloqueia.
   *
   * Foto mora aqui, e não na cadeia, porque ela não trava nada: o
   * `origem_criativo` do payload é fixo em `"gerar"` e a IA monta a peça
   * sem foto do cliente. Chamar foto de "o que falta", como o `/inicio`
   * fazia em destaque e com botão, é prometer que o anúncio depende dela —
   * promessa que o cliente cumpre e não vê resultado nenhum.
   */
  melhoras: { fotos: number; temLogo: boolean };
  /** blocos acesos da trilha do passo 1, de 6 */
  blocosDaTrilha: number;
  resultado: ResultadoDaSemana;
  campanhasNoAr: CampanhaNoAr[];
  /** o teto do mês, já numérico. Sai daqui para o `/inicio` não reler
   *  `businesses` só por causa dele — `monthly_budget` já vem no select. */
  verbaMensal: number | null;
  /** houve gasto na janela */
  temNumero: boolean;
}

const VAZIO: EstadoDoCliente = {
  temNegocio: false,
  negocioId: null,
  etapas: [],
  proximo: null,
  melhoras: { fotos: 0, temLogo: false },
  blocosDaTrilha: 0,
  resultado: { investido: 0, conversas: 0, receita: 0, alcance: 0 },
  campanhasNoAr: [],
  verbaMensal: null,
  temNumero: false,
};

/**
 * `agora` é PARÂMETRO, pelo mesmo motivo do `resumirPendencias`: é o que
 * torna os cortes de tempo testáveis sem esperar dois dias.
 */
export async function estadoDoCliente(agora: Date): Promise<EstadoDoCliente> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return VAZIO;

  const { data: negocio, error } = await supabase
    .from("businesses")
    // `COLUNAS_DO_CADASTRO` + as duas que dizem desde quando a bola é
    // nossa. A constante não é editada: ela é o contrato do que
    // `montarCadastro` lê, e engordá-la faria o `/verba` e o disparo
    // carregarem colunas que não usam.
    .select(`${COLUNAS_DO_CADASTRO}, cadastro_estado, cadastro_iniciado_em`)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[estado] falha ao ler o negócio ::", error.message);
    return VAZIO;
  }
  // Sem negócio não há pendência de cadastro: há cadastro NENHUM, e são
  // coisas diferentes na tela. Ver `pendenciasDoCliente`.
  if (!negocio) return VAZIO;

  const linha = negocio as unknown as NegocioParaCadastro & {
    cadastro_iniciado_em: string | null;
  };

  const desde = new Date(agora);
  desde.setDate(desde.getDate() - DIAS_DE_JANELA);
  const desdeISO = desde.toISOString().slice(0, 10);

  const [{ data: conexao }, { data: criativos }, { data: campanhas }, { data: metricas }] =
    await Promise.all([
      supabase.from("meta_connections").select("status").maybeSingle(),
      supabase
        .from("creatives")
        .select("id, uso, status, copy, arquivado_em")
        .eq("business_id", linha.id)
        .is("arquivado_em", null),
      supabase
        .from("campaigns")
        .select("id, name, meta_status, created_at, published_at, publish_state")
        .order("created_at", { ascending: false }),
      // `date` é `date` no banco, então a comparação é por string ISO de
      // data — sem hora, sem fuso no meio.
      supabase
        .from("metrics_daily")
        .select("spend, conversions, revenue, impressions")
        .gte("date", desdeISO),
    ]);

  // ---- as contagens de peça, cada uma com o seu filtro dito ----
  //
  // O domínio de `uso` é fechado pela 0010: logo, identidade, campanha,
  // referencia. Contar "toda linha de creatives" como foto do cliente é o
  // que fazia a `/anuncios` dizer "você já tem 2 fotos guardadas" para uma
  // conta cujas duas linhas eram logos, uma delas arquivada.
  const pecas = criativos ?? [];
  const fotos = pecas.filter((p) => p.uso === "identidade").length;
  const temLogo = pecas.some((p) => p.uso === "logo");
  const deCampanha = pecas.filter((p) => p.uso === "campanha");

  // Peça pronta é peça com TEXTO escrito. `copy` é `not null default '{}'`,
  // então a linha existir não quer dizer que a IA escreveu alguma coisa —
  // e uma peça sem copy não é peça, é a carcaça dela.
  const pecasProntas = deCampanha.filter(
    (p) => p.copy && typeof p.copy === "object" && Object.keys(p.copy).length > 0,
  ).length;
  const pecasParaAprovar = deCampanha.filter((p) => p.status === "draft").length;

  const listaDeCampanhas = campanhas ?? [];
  const noAr = listaDeCampanhas.filter((c) => c.published_at !== null);
  const esperandoPublicacao = listaDeCampanhas.filter((c) => c.published_at === null);

  const resultado = (metricas ?? []).reduce<ResultadoDaSemana>(
    (acc, m) => ({
      investido: acc.investido + Number(m.spend ?? 0),
      // `conversions` guarda o evento otimizado da campanha, que é conversa
      // iniciada — não venda. O nome da coluna é genérico; o significado,
      // não.
      conversas: acc.conversas + Number(m.conversions ?? 0),
      receita: acc.receita + Number(m.revenue ?? 0),
      alcance: acc.alcance + Number(m.impressions ?? 0),
    }),
    { investido: 0, conversas: 0, receita: 0, alcance: 0 },
  );

  const cadastro = montarCadastro(linha);
  const resumo = resumirPendencias(
    cadastro.completo ? [] : cadastro.pendencias,
    agora,
  );

  const medida: MedidaDoCliente = {
    temNegocio: true,
    cadastro: resumo,
    conexaoAtiva: CONEXAO_VIVA.includes(conexao?.status ?? ""),
    cadastroEnviadoEm: linha.cadastro_iniciado_em,
    pecasProntas,
    pecasParaAprovar,
    campanhaCriadaEm: esperandoPublicacao[0]?.created_at ?? null,
    publicacaoFalhou: listaDeCampanhas.some((c) => c.publish_state === "failed"),
    publicadaEm: noAr[noAr.length - 1]?.published_at ?? null,
    temNumero: resultado.investido > 0,
  };

  const etapas = montarEtapas(medida, agora);

  return {
    temNegocio: true,
    negocioId: linha.id,
    etapas,
    proximo: etapas.find((e) => !e.concluida) ?? null,
    melhoras: { fotos, temLogo },
    blocosDaTrilha: blocosDaTrilha(resumo),
    resultado,
    campanhasNoAr: noAr.map((c) => ({
      id: c.id,
      nome: c.name,
      metaStatus: c.meta_status,
    })),
    verbaMensal:
      linha.monthly_budget === null || linha.monthly_budget === undefined
        ? null
        : Number(linha.monthly_budget),
    temNumero: medida.temNumero,
  };
}
