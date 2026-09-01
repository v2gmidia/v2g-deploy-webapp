import "server-only";
import { enviar, obter, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";
import {
  validarConsolidado,
  validarConsolidadoDoNegocio,
  validarExecucaoDoNegocio,
} from "@/lib/dia-seguinte/validar";
import type {
  Consolidado,
  ConsolidadoDoNegocio,
  ExecucaoDoNegocio,
  RespostaDoDono,
} from "@/lib/dia-seguinte/tipos";

/**
 * As rotas do "dia seguinte": a pergunta diária e a tela de resultado.
 *
 * Contrato em `docs/contrato-do-app-dia-seguinte.md` (worktree
 * `backend_v2g-a2`, fora deste repositório).
 *
 * ============================================================
 * O TOKEN NÃO VAI AO NAVEGADOR. Nenhuma destas funções pode ser importada
 * de componente de cliente — o `server-only` faz o build quebrar se
 * alguém tentar. As telas recebem os dados já prontos, por props ou por
 * Server Action.
 * ============================================================
 *
 * A ORDEM DAS CHAMADAS É FIXA, e vem do contrato: `execucaoDoNegocio()`
 * PRIMEIRO, sempre. O app tem o `business_id` (lê `businesses` sob RLS) e
 * não tem como chegar na execução sozinho — `execucoes` tem RLS ligada e
 * zero políticas. Esta troca é a porta de entrada de qualquer tela.
 */

/**
 * Leituras de tela, com gente esperando. O padrão de 15 s é para o
 * pipeline; aqui o teto é o de quem está olhando a página.
 */
const TETO_DE_TELA_MS = 5_000;

/**
 * `GET /negocios/{business_id}/execucao`
 *
 * ============================================================
 * 404 AQUI É ESTADO NORMAL, NÃO FALHA.
 *
 * O contrato diz: 404 quando o negócio não tem execução, **ou** quando o
 * `profile_id` não bate. Os dois querem dizer a mesma coisa para a tela —
 * "não há execução sua para mostrar" — e nenhum é erro para registrar no
 * log como problema.
 *
 * Por isso devolve `{ ok: true, dados: null }` no 404, e não uma falha:
 * quem chama precisa distinguir "ainda não tem campanha rodando" (mostra
 * a cadeia local e pronto) de "o backend está fora" (mostra estado
 * degradado). Tratar os dois como falha faria a tela acusar defeito onde
 * há só um cliente que ainda não chegou lá.
 * ============================================================
 *
 * `profileId` VAI SEMPRE, e o contrato explica por quê: ele não pega
 * chamador malicioso — que só precisaria mandar o id certo — mas pega o
 * ERRO PROVÁVEL, um bug nosso trocando ids e mostrando a execução de
 * outro cliente. É a rede que pega o nosso bug, não a que pega o ataque.
 *
 * E a divergência responde 404, não 403, de propósito: 403 confirmaria
 * que o negócio existe para quem está adivinhando id.
 */
export async function execucaoDoNegocio(args: {
  businessId: string;
  /** de `auth.getUser()`, nunca de formulário */
  profileId: string;
}): Promise<Resultado<ExecucaoDoNegocio | null>> {
  const resposta = await obter(`/negocios/${encodeURIComponent(args.businessId)}/execucao`, {
    contexto: "execucao-do-negocio",
    timeoutMs: TETO_DE_TELA_MS,
    params: { profile_id: args.profileId },
  });

  if (!resposta.ok) {
    // Ver o bloco acima: ausência de execução não é falha.
    if (resposta.categoria === "nao_encontrado") return { ok: true, dados: null };
    return resposta;
  }

  const validado = validarExecucaoDoNegocio(resposta.dados);
  if (!validado) {
    registrarErroBackend("execucao-do-negocio", {
      metodo: "GET",
      caminho: "/negocios/{id}/execucao",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}

/**
 * `GET /execucoes/{id}/consolidado`
 *
 * O padrão do backend é `ate` = hoje e `desde` = `ate - 29d`. Não
 * repetimos esses defaults aqui: dois lugares decidindo a janela é a
 * forma de defeito que este repositório passa a vida consertando. Quem
 * precisar de outra janela passa as duas datas.
 *
 * ATENÇÃO — este consolidado é por EXECUÇÃO. Serve para "como está indo
 * ESTA campanha", e é errado para "quanto eu já investi e quanto voltou":
 * um negócio com duas execuções mostraria só a mais recente. **A `/inicio`
 * usa a `consolidadoDoNegocio()` logo abaixo**, que soma as rodadas.
 */
export async function consolidadoDaExecucao(args: {
  idExecucao: string;
  /** `YYYY-MM-DD`. Omitidos, valem os defaults do backend. */
  desde?: string;
  ate?: string;
}): Promise<Resultado<Consolidado>> {
  const resposta = await obter(
    `/execucoes/${encodeURIComponent(args.idExecucao)}/consolidado`,
    {
      contexto: "consolidado",
      timeoutMs: TETO_DE_TELA_MS,
      params: { desde: args.desde, ate: args.ate },
    },
  );

  if (!resposta.ok) return resposta;

  const validado = validarConsolidado(resposta.dados);
  if (!validado) {
    registrarErroBackend("consolidado", {
      metodo: "GET",
      caminho: "/execucoes/{id}/consolidado",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}

/**
 * `GET /negocios/{business_id}/consolidado` — o ACUMULADO do negócio.
 *
 * ============================================================
 * É ESTA QUE A `/inicio` USA, e não a por execução.
 *
 * A `/inicio` diz "quanto eu já investi e quanto voltou", e isso é do
 * NEGÓCIO. A rota por execução responde "como está indo esta campanha" —
 * defensável para acompanhar uma rodada, errado para o acumulado: um
 * negócio com duas execuções mostraria só a mais recente, e o que a
 * rodada anterior gastou e devolveu sumiria da tela.
 * ============================================================
 *
 * OS DOIS LADOS SE COMPORTAM AO CONTRÁRIO NO MESMO DIA, e quem resolve é
 * o backend: a métrica da plataforma SOMA (duas campanhas no ar gastaram
 * as duas), a resposta do dono NÃO SOMA (ele responde sobre o mesmo fato
 * do mundo, uma vez por execução). Somar os dois dobraria a receita — e o
 * erro superestimaria o retorno, que é o lado errado para errar quando o
 * número na tela é "voltou R$ X".
 *
 * **Não refaça essa conta aqui.** A rota já entrega uma resposta por dia,
 * com a execução mais recente vencendo.
 *
 * `diasComRespostaDeMaisDeUmaExecucao > 0` é DEFEITO DE FLUXO, não de
 * soma: alguém perguntou duas vezes ao mesmo dono no mesmo dia. Vai para
 * diagnóstico, nunca para a tela do cliente.
 */
export async function consolidadoDoNegocio(args: {
  businessId: string;
  /** de `auth.getUser()`, nunca de formulário */
  profileId: string;
  /** `YYYY-MM-DD`. Omitidos, valem os defaults do backend. */
  desde?: string;
  ate?: string;
  /**
   * O dia sobre o qual a tela vai perguntar. Volta como ECO em
   * `diaDaPergunta`, junto com `respondeuNoDia` — e é o eco que torna a
   * resposta legível. Ver `respostaConfiavelSobre()`.
   */
  diaDaPergunta?: string;
}): Promise<Resultado<ConsolidadoDoNegocio>> {
  const resposta = await obter(
    `/negocios/${encodeURIComponent(args.businessId)}/consolidado`,
    {
      contexto: "consolidado-do-negocio",
      timeoutMs: TETO_DE_TELA_MS,
      params: {
        profile_id: args.profileId,
        desde: args.desde,
        ate: args.ate,
        dia_da_pergunta: args.diaDaPergunta,
      },
    },
  );

  if (!resposta.ok) return resposta;

  const validado = validarConsolidadoDoNegocio(resposta.dados);
  if (!validado) {
    registrarErroBackend("consolidado-do-negocio", {
      metodo: "GET",
      caminho: "/negocios/{id}/consolidado",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}

/**
 * `POST /execucoes/{id}/resposta-do-dono`
 *
 * ============================================================
 * ISTO ESCREVE, E O UPSERT FAZ MERGE POR CAMPO (backend, 01/09/2026).
 *
 *   campo AUSENTE  → preserva o que está no servidor
 *   `null`         → APAGA de propósito ("não sei")
 *   número         → grava. `0` é resposta, não ausência.
 *
 * Não monte o `corpo` à mão. Use `montarRespostaDoDono()` de
 * `lib/dia-seguinte/resposta.ts`, que omite o que não foi mexido — e é a
 * omissão que impede apagar um campo que ninguém pediu para apagar.
 *
 * O 201 não avisa o que mudou. Não há como descobrir estrago pela
 * resposta.
 * ============================================================
 */
export async function gravarRespostaDoDono(args: {
  idExecucao: string;
  corpo: RespostaDoDono;
}): Promise<Resultado<unknown>> {
  return enviar(
    `/execucoes/${encodeURIComponent(args.idExecucao)}/resposta-do-dono`,
    {
      dia: args.corpo.dia,
      // ============================================================
      // A OMISSÃO TEM QUE CHEGAR ATÉ O JSON.
      //
      // Com o merge por campo, a diferença entre "campo ausente" e
      // "`null`" é a diferença entre preservar e apagar. Montar a chave
      // com `undefined` não basta: `JSON.stringify` a descarta, e daria
      // certo por acidente — mas um `?? null` que alguém acrescentasse
      // aqui viraria apagamento silencioso. O espalhamento condicional
      // deixa a intenção explícita.
      // ============================================================
      ...(args.corpo.vendas !== undefined ? { vendas: args.corpo.vendas } : {}),
      ...(args.corpo.receitaCentavos !== undefined
        ? { receita_centavos: args.corpo.receitaCentavos }
        : {}),
      pergunta: args.corpo.pergunta,
      ...(args.corpo.origem ? { origem: args.corpo.origem } : {}),
    },
    { contexto: "resposta-do-dono", timeoutMs: TIMEOUTS.rapido },
  );
}
