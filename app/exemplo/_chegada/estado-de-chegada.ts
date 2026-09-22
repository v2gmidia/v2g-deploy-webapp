import { montarEtapas } from "@/lib/estado/frases";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import type { ResumoDePendencias } from "@/lib/cadastro/pendencias";

/**
 * O ESTADO DE QUEM ACABOU DE CHEGAR — fixture da bancada.
 *
 * ============================================================
 * POR QUE NÃO DÁ PARA REUSAR O `exemploDoInicio("preparando")`.
 *
 * Aquele fixture tem `conexaoAtiva: true` — a conexão já foi feita e a
 * preparação está de fato andando. É outro momento.
 *
 * O momento desta tela é o de cinco minutos depois do cadastro: o
 * cadastro fechou, **a conexão não**, e nada foi para lugar nenhum. É
 * nele que a `/inicio` de hoje diz duas coisas ao mesmo tempo — "sua
 * campanha está sendo preparada, 0 de 4 etapas" e "falta conectar sua
 * conta" — e o dono não sabe se espera ou age.
 * ============================================================
 *
 * A CADEIA VEM DE `montarEtapas`, e não de uma lista escrita aqui. É a
 * mesma função que a `/inicio` usa, então a bancada não pode discordar da
 * produção sobre qual é o próximo passo — que é justamente o assunto
 * desta tela.
 */

const CADASTRO_FECHADO: ResumoDePendencias = {
  vazio: true,
  titulo: "Seu cadastro está completo",
  corpo: "Não falta nada do seu lado.",
  acao: null,
  nossaDivida: false,
  itens: [],
  quantosNaoSei: 0,
};

/** Os dois momentos que esta tela desenha. */
export type MomentoDaChegada =
  /** acabou de terminar o cadastro; falta conectar */
  | "falta_conectar"
  /** conectou; agora é a vez da V2G, e ele não tem o que fazer */
  | "e_com_a_gente";

export function estadoDeChegada(agora: Date, momento: MomentoDaChegada): EstadoDoCliente {
  const conectou = momento === "e_com_a_gente";
  const etapas = montarEtapas(
    {
      temNegocio: true,
      cadastro: CADASTRO_FECHADO,
      conexaoAtiva: conectou,
      cadastroEnviadoEm: agora.toISOString(),
      execucao: null,
      pecasProntas: 0,
      pecasParaAprovar: 0,
      campanhaCriadaEm: null,
      publicacaoFalhou: false,
      publicadaEm: null,
      temNumero: false,
      execucaoDoBackend: null,
      execucaoIlegivel: false,
      // NUNCA FOI AO AR, e é isto que faz a pergunta do dia sumir.
      veiculacao: "nunca_foi_ao_ar",
    },
    agora,
  );

  return {
    temNegocio: true,
    negocioId: "exemplo-chegada",
    etapas,
    proximo: etapas.find((e) => !e.concluida) ?? null,
    melhoras: { fotos: 0, temLogo: false },
    blocosDaTrilha: conectou ? 2 : 1,
    // SEM CAMPANHA NÃO HÁ MEDIÇÃO — e ausência é `null`, nunca zero.
    resultado: {
      investidoCentavos: null,
      moeda: null,
      pessoas: null,
      cliques: null,
      impressoes: null,
    },
    campanhasNoAr: [],
    verbaMensal: 1200,
    temNumero: false,
    // Execução nula = ainda não disparou. Acumulado nulo = não há o que
    // acumular. São estados diferentes de "não consegui ler", e os dois
    // são normais aqui.
    diaSeguinte: { execucao: null, acumulado: null },
    veiculacao: "nunca_foi_ao_ar",
  };
}
