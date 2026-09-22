/**
 * Confere o `GET /nichos` e a busca de nicho.
 *
 * POR QUE ESTE CONFERIDOR EXISTE. O que ele cobre é invisível para o build
 * e para o typecheck, e três dos casos já morderam de verdade:
 *
 *  - **normalizar só um lado.** `rodizio` não casou com o termo gravado
 *    `rodízio` numa verificação de produção. A conclusão errada dali é "o
 *    termo está errado", e o conserto errado é tirar o acento do
 *    `knowledge/restaurante.md` — mexer no dado para um teste ruim passar,
 *    e quebrar a grafia que o cliente lê na tela;
 *  - **`padaria` achar alguma coisa.** Não existe nicho de padaria, e
 *    sugerir o vizinho foi RECUSADO. A busca não achar é a decisão
 *    funcionando; se um dia casar, é regressão silenciosa;
 *  - **401 lido como 404.** Sem o header o backend devolve 401 para rota
 *    existente. Já custou tempo nesta história.
 *
 * TESTA OS DOIS LADOS DE CADA CORTE: o que tem que achar e o que tem que
 * não achar. Um teste que só olha o lado em que nada acontece passa sem
 * provar nada.
 *
 * O §0 é controle negativo: se a asserção não estiver pegando erro, todo o
 * verde abaixo é verde sem valor.
 *
 * ESTE CONFERIDOR PRECISA DE REDE E DE TOKEN, ao contrário dos outros.
 * É o ponto: a lista é do backend, e um teste contra cópia local provaria
 * só que a cópia concorda consigo mesma. Sem `V2G_BACKEND_URL` e
 * `V2G_BACKEND_TOKEN` ele PULA os §§ de rede e avisa alto — não finge que
 * passou.
 *
 * O QUE ELE NÃO COBRE, e é honesto dizer: as poucas linhas de transporte
 * de `listarNichos()` (montar a URL, pôr o header, mapear erro). Aquele
 * arquivo tem `import "server-only"` e não roda fora do Next. O que dá
 * para provar daqui está provado: o §3 bate no endereço real com e sem o
 * header, e o §1 exercita o validador que aquela função chama — o mesmo
 * módulo, não uma cópia.
 *
 * Roda com `pnpm conferir:nichos`.
 */

import { validarListaDeNichos } from "../lib/nichos/validar.ts";
import {
  conferirEscolhaDeNicho,
  NAO_DEU_PARA_CONFERIR,
  NAO_E_OPCAO,
} from "../lib/nichos/escolha.ts";
import { PERGUNTAS } from "../app/(fluxo)/onboarding/perguntas.ts";
import {
  filtrarNichos,
  nichoPeloRotulo,
  normalizar,
  resolverConsulta,
} from "../lib/nichos/busca.ts";
import type { Nicho } from "../lib/nichos/tipos.ts";
import {
  CUSTO_DE_NICHO_APOSENTADO,
  CUSTO_TIPICO,
} from "../app/exemplo/_onboarding/custo-por-contato.ts";
import { readFileSync } from "node:fs";

/**
 * OS CINCO CHIPS QUE SAÍRAM EM 22/08 — fixos, e é para ficarem fixos.
 *
 * Eles não são nichos e nunca mais podem ser aceitos como escolha. Ao
 * contrário dos nomes de nicho, estes não envelhecem: a decisão é que
 * eles fiquem de fora para sempre, então citá-los pelo nome é o jeito
 * certo de conferir.
 */
const CHIPS_VELHOS = [
  "Clínica / Consultório",
  "Loja física",
  "Restaurante / Bar",
  "Serviço (advocacia, arquitetura, contabilidade)",
  "Beleza e estética",
] as const;

let falhas = 0;
let testes = 0;

function ok(condicao: boolean, rotulo: string) {
  testes += 1;
  if (condicao) {
    console.log(`  ok    ${rotulo}`);
  } else {
    falhas += 1;
    console.log(`  FALHA ${rotulo}`);
  }
}

function secao(titulo: string) {
  console.log(`\n${titulo}`);
}

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a asserção pega erro?");
{
  const antes = falhas;
  ok(1 + 1 === 3, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhas === antes + 1;
  falhas = antes;
  testes -= 1;
  if (!pegou) {
    console.log("\nO MECANISMO DE ASSERÇÃO NÃO PEGA ERRO. Nada abaixo vale.");
    process.exit(1);
  }
  console.log("  (pegou — o placar abaixo vale)");
}

// ---------------------------------------------------------------- §1

secao("1. o validador de fronteira — tudo ou nada");
{
  const bom = [
    {
      // Nome inventado de propósito: esta é uma fixture de FORMA, e um
      // nicho real aqui se confunde com a lista viva — foi o que
      // aconteceu com o `petshop` que estava neste lugar até 22/09, e que
      // saiu do catálogo em setembro.
      nicho: "nicho-de-teste",
      rotulo: "Nicho de teste",
      termos_de_busca: ["termo de teste"],
      sub_tipos: [{ id: "um", rotulo: "Um", nome_exibicao: "Nicho de teste — Um" }],
    },
  ];
  const validado = validarListaDeNichos(bom);
  ok(validado !== null, "corpo bem formado passa");
  ok(
    validado?.[0]?.subTipos[0]?.nomeExibicao === "Nicho de teste — Um",
    "snake_case vira camelCase na fronteira (`nome_exibicao` → `nomeExibicao`)",
  );
  ok(validado?.[0]?.termosDeBusca.length === 1, "os termos chegam inteiros");

  // Os dois lados: além do que passa, o que TEM que ser recusado.
  ok(
    validarListaDeNichos([]) === null,
    "lista vazia reprova (zero chip é pior que cinco chips imprecisos)",
  );
  ok(validarListaDeNichos(null) === null, "null reprova");
  ok(validarListaDeNichos({ nichos: bom }) === null, "objeto no lugar de array reprova");
  ok(
    validarListaDeNichos([{ rotulo: "Dentista" }]) === null,
    "item sem `nicho` reprova a LISTA INTEIRA, não só o item",
  );
  ok(validarListaDeNichos([{ nicho: "x", rotulo: "" }]) === null, "rótulo vazio reprova");
  ok(
    validarListaDeNichos([{ nicho: "x", rotulo: "X", termos_de_busca: "dentista" }]) === null,
    "termos como string em vez de lista reprova (mudança de contrato)",
  );
  ok(
    validarListaDeNichos([{ nicho: "x", rotulo: "X", termos_de_busca: [1, 2] }]) === null,
    "termos não-texto reprovam",
  );
  ok(
    validarListaDeNichos([{ nicho: "x", rotulo: "X", sub_tipos: [{ id: "a" }] }]) === null,
    "sub-tipo sem `nome_exibicao` reprova",
  );

  // Ausência não é tipo errado: nenhum dos oito nichos tem sub-tipo hoje.
  const semOpcionais = validarListaDeNichos([{ nicho: "x", rotulo: "X" }]);
  ok(
    semOpcionais?.[0]?.subTipos.length === 0 && semOpcionais?.[0]?.termosDeBusca.length === 0,
    "ausência de `sub_tipos`/`termos_de_busca` vira lista vazia, não reprova",
  );
}

// ---------------------------------------------------------------- §2

secao("2. normalização — os DOIS lados, sempre");
{
  ok(normalizar("Rodízio") === "rodizio", "acento sai");
  ok(normalizar("RODÍZIO") === normalizar("rodizio"), "caixa e acento dos dois lados");
  ok(normalizar("  banho   de  gel ") === "banho de gel", "espaço sobrando some");
  ok(
    normalizar("Estética") === "estetica" && normalizar("Japonês") === "japones",
    "os acentos que existem em `knowledge/`",
  );
  // O caso que motivou a regra: se só um lado normalizar, isto dá false.
  ok(
    normalizar("rodizio") === normalizar("rodízio"),
    "`rodizio` digitado = `rodízio` gravado (a armadilha de produção)",
  );
}

// ---------------------------------------------------------------- rede

const temEnv = Boolean(process.env.V2G_BACKEND_URL && process.env.V2G_BACKEND_TOKEN);
if (!temEnv) {
  console.log("\n" + "=".repeat(68));
  console.log("PULANDO OS §§ 3 a 9: sem V2G_BACKEND_URL / V2G_BACKEND_TOKEN.");
  console.log("Estes são os que provam que a BUSCA funciona. Sem eles, o");
  console.log("verde acima diz só que o validador e a normalização estão de pé.");
  console.log("=".repeat(68));
  console.log(
    `\n${falhas === 0 ? "TUDO CERTO (PARCIAL)" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
  );
  process.exit(falhas === 0 ? 0 : 1);
}

const base = process.env.V2G_BACKEND_URL!.replace(/\/+$/, "");

secao("3. o endpoint responde — e responde 401, não 404, sem o header");
{
  const semHeader = await fetch(`${base}/nichos`, { headers: { Accept: "application/json" } });
  ok(
    semHeader.status === 401,
    `sem \`X-V2G-Token\` -> 401 (veio ${semHeader.status}; 404 aqui seria leitura errada de rota ausente)`,
  );
}

// A lista REAL, pelo mesmo caminho que a produção usa: mesmo header, e o
// corpo passando pelo validador de verdade — não por uma cópia dele.
const bruto = await (
  await fetch(`${base}/nichos`, {
    headers: { "X-V2G-Token": process.env.V2G_BACKEND_TOKEN!, Accept: "application/json" },
    cache: "no-store",
  })
).json();

const nichos: Nicho[] | null = validarListaDeNichos(bruto);
if (!nichos) {
  console.log("\n  FALHA  o corpo do `GET /nichos` não passou no validador de fronteira.");
  console.log("\nTEM FALHA — o endpoint real não deu lista utilizável. NÃO troque isto pelo");
  console.log("fallback: fallback passando não prova que a busca funciona.");
  process.exit(1);
}

/*
 * ============================================================
 * A REGRA DOS §§ 4 A 10: NÃO NOMEIE ITEM DA LISTA.
 *
 * Até 22/09/2026 estas seções citavam nichos e termos pelo nome —
 * `consultorio-medico`, "cardiologista", "martelinho de ouro", "banho de
 * gel", "pizzaria" -> `restaurante`, `Petshop`, "Clínica de estética" — e
 * afirmavam contagens: dez nichos, 183 termos.
 *
 * Aí o Gabriel encolheu o `knowledge/` para oito nichos e 113 termos, DE
 * PROPÓSITO. Doze conferências ficaram vermelhas de uma vez, e a leitura
 * natural do vermelho era "o backend quebrou" ou "a rede caiu". Não
 * quebrou nada: o conferidor é que estava conferindo uma cópia congelada
 * da lista de agosto, escrita dentro dele mesmo.
 *
 * Um conferidor assim tem dois defeitos, e o segundo é o pior:
 *
 *   1. ele fica vermelho quando o backend faz algo LEGÍTIMO;
 *   2. e vermelho crônico é conferidor que ninguém mais lê — aí o dia em
 *      que quebrar de verdade, o vermelho não diz nada de novo.
 *
 * Então nenhum caso fixo daqui para baixo nomeia nicho ou termo. Cada um
 * é DERIVADO da lista viva no momento da execução: "para todo nicho, o
 * próprio rótulo acha ele", "para todo termo acentuado, sem acento
 * acha", "pegue um termo que hoje deixa um só e confira que o Enter
 * escolhe". Nomes fixos sobraram só onde eles precisam continuar NÃO
 * existindo (padaria, os cinco chips velhos) — esses não envelhecem,
 * porque a decisão é que eles fiquem de fora para sempre.
 *
 * O CENSO É IMPRESSO, NÃO ASSERTADO. Quantos nichos e quantos termos é
 * assunto do backend, não deste repositório. O número aparece no log
 * toda execução, para quem quiser ver que mudou — e não derruba a suíte
 * quando muda.
 * ============================================================
 */

secao("4. a forma da lista viva");
{
  const termos = nichos.reduce((s, n) => s + n.termosDeBusca.length, 0);
  const subtipos = nichos.reduce((s, n) => s + n.subTipos.length, 0);
  console.log(
    `        CENSO DE HOJE: ${nichos.length} nichos, ${termos} termos, ${subtipos} subtipos.`,
  );
  console.log("        (impresso, não assertado — quem decide o tamanho é o backend)");

  // O único piso que não é do backend: lista vazia não serve a tela
  // nenhuma, e `validarListaDeNichos` já recusa `[]`.
  ok(nichos.length > 0, "a lista não vem vazia");

  // Nicho sem termo é chip que só se acha pelo rótulo — e o rótulo é uma
  // palavra só. Quem digita o que FAZ, e não o que É, não acha.
  const semTermo = nichos.filter((n) => n.termosDeBusca.length === 0);
  ok(
    semTermo.length === 0,
    `todo nicho tem ao menos um termo de busca${semTermo.length ? ` — sem: ${semTermo.map((n) => n.nicho).join(", ")}` : ""}`,
  );

  ok(
    !nichos.some((n) => n.nicho === "generico"),
    "`generico` não vem — é destino de quem não casa, não escolha de lista",
  );

  // ---- a voz de dono, sem citar nicho nenhum ----
  // O rótulo é o que vai para o chip e para `businesses.niche`. A
  // regressão que isto pega é o backend passar a mandar o IDENTIFICADOR
  // embelezado no lugar do rótulo: `clinica-odontologica` virando
  // "Clínica Odontológica" em vez de "Dentista".
  //
  // A prova sem nomear ninguém: o rótulo normalizado não pode ser igual
  // ao identificador com os hífens virando espaço.
  const decatalogo = nichos.filter(
    (n) => normalizar(n.rotulo) === normalizar(n.nicho.replace(/-/g, " ")),
  );
  ok(
    decatalogo.length === 0,
    `nenhum rótulo é o identificador embelezado (voz de dono)${decatalogo.length ? ` — ${decatalogo.map((n) => n.nicho).join(", ")}` : ""}`,
  );

  const vazios = nichos.filter((n) => !n.nicho.trim() || !n.rotulo.trim());
  ok(vazios.length === 0, "nenhum nicho ou rótulo em branco");

  // Dois nichos com o mesmo rótulo normalizado tornariam `nichoPeloRotulo`
  // ambíguo — e a validação do servidor aceitaria um por outro.
  const rotulos = new Set(nichos.map((n) => normalizar(n.rotulo)));
  ok(rotulos.size === nichos.length, "nenhum rótulo repetido (senão a validação vira ambígua)");

  // Chip que não se acha é chip morto.
  const mortos = nichos.filter((n) => !filtrarNichos(nichos, n.rotulo).includes(n));
  ok(
    mortos.length === 0,
    `todo nicho é achável pelo próprio rótulo${mortos.length ? ` — mortos: ${mortos.map((n) => n.nicho).join(", ")}` : ""}`,
  );
}

secao("5. o que a busca TEM que achar — varrido, não amostrado");
{
  const acha = (q: string) => filtrarNichos(nichos, q).map((n) => n.nicho);

  // ============================================================
  // TODO TERMO DO BACKEND ACHA O NICHO DELE. Os 113, um por um.
  //
  // Isto substituiu quatro sondas escritas à mão ("cardiologista",
  // "martelinho de ouro", "banho de gel", "siso"), das quais três
  // apontavam para nichos que não existem mais. A varredura cobre as
  // quatro, cobre as outras 109, e cobre as que o backend acrescentar
  // amanhã sem ninguém tocar neste arquivo.
  // ============================================================
  const quebrados: string[] = [];
  let conferidos = 0;
  for (const n of nichos) {
    for (const t of n.termosDeBusca) {
      conferidos += 1;
      if (!acha(t).includes(n.nicho)) quebrados.push(`"${t}" (${n.nicho})`);
    }
  }
  ok(
    quebrados.length === 0,
    `os ${conferidos} termos do backend acham o nicho deles${quebrados.length ? ` — quebrados: ${quebrados.slice(0, 5).join(", ")}` : ""}`,
  );

  // Busca por pedaço de palavra, sem nomear o pedaço: as 4 primeiras
  // letras do rótulo de cada nicho têm que achar aquele nicho. É o
  // "digitou 'dent', já achou Dentista" — para todos.
  const pedacoQuebrado = nichos.filter((n) => {
    const pedaco = normalizar(n.rotulo).slice(0, 4);
    return pedaco.length === 4 && !acha(pedaco).includes(n.nicho);
  });
  ok(
    pedacoQuebrado.length === 0,
    `as 4 primeiras letras do rótulo já acham o nicho${pedacoQuebrado.length ? ` — falhou: ${pedacoQuebrado.map((n) => n.nicho).join(", ")}` : ""}`,
  );

  ok(
    filtrarNichos(nichos, "").length === nichos.length,
    "consulta vazia mostra TODOS (não obriga a digitar, não esconde a lista)",
  );
  ok(filtrarNichos(nichos, "   ").length === nichos.length, "só espaço também mostra todos");

  // A prova geral da normalização contra o dado REAL: todo termo acentuado
  // do backend tem que ser achável digitado sem acento.
  const acentuados: string[] = [];
  const semAcentoQuebrado: string[] = [];
  for (const n of nichos) {
    for (const t of n.termosDeBusca) {
      if (normalizar(t) === t.toLowerCase()) continue;
      acentuados.push(t);
      if (!acha(normalizar(t)).includes(n.nicho)) semAcentoQuebrado.push(`${t} (${n.nicho})`);
    }
  }
  ok(acentuados.length > 0, `há termo acentuado no dado real para testar (${acentuados.length})`);
  ok(
    semAcentoQuebrado.length === 0,
    `todo termo acentuado é achável sem acento${semAcentoQuebrado.length ? ` — quebrados: ${semAcentoQuebrado.join(", ")}` : ""}`,
  );
}

secao("6. o que a busca NÃO pode achar — a decisão, não a falha");
{
  // Estes nomes SÃO fixos de propósito, e não envelhecem: a decisão é que
  // eles fiquem de fora. Sugestão aproximada foi PROPOSTA E RECUSADA — a
  // ressalva na tela seria interface pedindo desculpa por não ter o que a
  // pessoa precisa. Quem não acha cai no texto livre. Há dois testes no
  // backend que falham se alguém casar `padaria` ou a família do varejo
  // de alimento em qualquer nicho.
  for (const termo of [
    "padaria",
    "doceria",
    "mercearia",
    "confeitaria",
    "mercadinho",
    "lavanderia",
  ]) {
    const r = filtrarNichos(nichos, termo).map((n) => n.nicho);
    ok(
      r.length === 0,
      `"${termo}" não acha nada${r.length ? `  — casou com ${r.join(", ")}, e não devia` : ""}`,
    );
  }
}

secao("7. `nichoPeloRotulo` — igualdade, não substring");
{
  // ---- o que TEM que ser aceito: todo rótulo vivo, de três formas ----
  const falhou: string[] = [];
  for (const n of nichos) {
    const formas: [string, string][] = [
      ["exato", n.rotulo],
      ["caixa baixa", n.rotulo.toLowerCase()],
      ["com espaço nas pontas", `  ${n.rotulo}  `],
      ["sem acento", normalizar(n.rotulo)],
    ];
    for (const [como, texto] of formas) {
      if (nichoPeloRotulo(nichos, texto)?.nicho !== n.nicho) falhou.push(`${n.nicho} (${como})`);
    }
  }
  ok(
    falhou.length === 0,
    `todo rótulo acha, nas 4 formas — exato, caixa, espaço e sem acento${falhou.length ? ` — falhou: ${falhou.join(", ")}` : ""}`,
  );

  // A prova de que a forma "sem acento" não passou de graça: precisa
  // haver rótulo acentuado na lista viva para ela significar alguma coisa.
  const comAcento = nichos.filter((n) => normalizar(n.rotulo) !== n.rotulo.toLowerCase());
  ok(
    comAcento.length > 0,
    `há rótulo acentuado para a forma sem acento provar algo (${comAcento.length})`,
  );

  // ---- o que NÃO pode ser aceito ----
  // Pedaço de rótulo, derivado: metade do rótulo mais longo da lista.
  const maisLongo = [...nichos].sort((a, b) => b.rotulo.length - a.rotulo.length)[0]!;
  const metade = maisLongo.rotulo.slice(0, Math.floor(maisLongo.rotulo.length / 2)).trim();
  ok(
    nichoPeloRotulo(nichos, metade) === undefined,
    `pedaço de rótulo NÃO é escolha válida ("${metade.slice(0, 24)}…")`,
  );
  ok(nichoPeloRotulo(nichos, "") === undefined, "vazio não é escolha válida");

  // Os cinco chips velhos: fixos e eternos, porque a decisão é que eles
  // nunca voltem a ser escolha.
  for (const velho of CHIPS_VELHOS) {
    ok(nichoPeloRotulo(nichos, velho) === undefined, `"${velho}" NÃO é nicho`);
  }
}

secao("8. a validação do servidor — a que quebraria calada");
{
  const comLista = (texto: string) => conferirEscolhaDeNicho({ lista: nichos, texto });
  const semLista = (texto: string) => conferirEscolhaDeNicho({ lista: null, texto });

  // ============================================================
  // TODO NICHO DA LISTA VIVA PASSA — e volta com a grafia do backend.
  //
  // O MOTIVO DE TUDO ISTO: antes do lote de 22/08 esta linha reprovava.
  // Nenhum nicho está em `pergunta.opcoes`, então toda escolha válida
  // virava "essa opção não existe" — e o conserto tentador seria apagar a
  // checagem, reabrindo o buraco de forjar `origem: "chip"`.
  //
  // Antes isto era conferido em dois nichos escolhidos a dedo, e os dois
  // morreram em setembro. Agora é a lista inteira, em três grafias.
  // ============================================================
  const recusados: string[] = [];
  const grafiaErrada: string[] = [];
  for (const n of nichos) {
    for (const texto of [n.rotulo, n.rotulo.toLowerCase(), normalizar(n.rotulo)]) {
      const r = comLista(texto);
      if (!r.ok) recusados.push(`${n.nicho} <- "${texto}"`);
      else if (r.texto !== n.rotulo) grafiaErrada.push(`${n.nicho}: devolveu "${r.texto}"`);
    }
  }
  ok(
    recusados.length === 0,
    `todo nicho vivo passa, em 3 grafias${recusados.length ? ` — recusados: ${recusados.join(", ")}` : ""}`,
  );
  ok(
    grafiaErrada.length === 0,
    `e volta SEMPRE com a grafia canônica do backend, nunca o texto do cliente${grafiaErrada.length ? ` — ${grafiaErrada.join(", ")}` : ""}`,
  );

  // Os dois lados: o que a lista viva tem que RECUSAR.
  const maisLongo = [...nichos].sort((a, b) => b.rotulo.length - a.rotulo.length)[0]!;
  const metade = maisLongo.rotulo.slice(0, Math.floor(maisLongo.rotulo.length / 2)).trim();
  ok(!comLista(metade).ok, "pedaço de rótulo é recusado (substring não é escolha)");
  ok(!comLista("padaria").ok, "termo sem nicho é recusado como chip");
  ok(!comLista("qualquer coisa forjada").ok, "texto forjado com `origem: chip` é recusado");
  const r4 = comLista("padaria");
  ok(!r4.ok && r4.erro === NAO_E_OPCAO, "e a recusa acusa a opção, porque a lista estava no ar");

  // ---- com a lista fora: NÃO EXISTE RESERVA ----
  // Decisão do Victor, 22/08. Os cinco chips fixos saíram: eles não eram
  // nichos, e gravar um deles seria palpite com cara de escolha do
  // cliente. Com o catálogo fora, a tela mostra só o texto livre.
  for (const antigo of CHIPS_VELHOS) {
    ok(!semLista(antigo).ok, `"${antigo}" NÃO passa mais — a reserva não existe`);
  }
  ok(!comLista(CHIPS_VELHOS[0]!).ok, "e também não passa com a lista no ar");

  const umVivo = nichos[0]!.rotulo;
  const r5 = semLista(umVivo);
  ok(!r5.ok, "com o catálogo fora, nem nicho de verdade pode ser confirmado");
  ok(
    !r5.ok && r5.erro === NAO_DEU_PARA_CONFERIR,
    "e o recado diz que NÓS não conseguimos conferir — não acusa o cliente",
  );
  // O `as string` é para o TypeScript deixar comparar dois literais que ele
  // já sabe diferentes. A conferência continua valendo para o humano: no dia
  // em que alguém "simplificar" os dois recados num só, esta linha cai — e é
  // ela que guarda a diferença entre culpar o cliente e admitir o defeito.
  ok(
    (NAO_DEU_PARA_CONFERIR as string) !== NAO_E_OPCAO,
    "os dois recados são diferentes, e têm que continuar sendo",
  );

  // A pergunta `ramo` não pode ganhar opção fixa: `actions.ts` confere
  // chip contra `pergunta.opcoes`, e uma opção ali seria uma resposta
  // aceita sem passar pelo catálogo — a reserva entrando de novo pela
  // porta dos fundos.
  const ramo = PERGUNTAS.find((q) => q.id === "ramo");
  ok(ramo?.seletorDeNicho === true, "a pergunta `ramo` usa o seletor");
  ok(
    ramo !== undefined && ramo.opcoes.length === 0,
    `\`ramo\` não tem opção fixa nenhuma (tem ${ramo?.opcoes.length ?? "?"})`,
  );
}

secao("9. o que o Enter faz — `resolverConsulta`");
{
  const r = (q: string) => resolverConsulta(nichos, q);

  // Campo vazio não é escolha nem texto.
  ok(r("").tipo === "vazia", "campo vazio: Enter não faz nada");
  ok(r("   ").tipo === "vazia", "só espaço também");

  // ============================================================
  // O CASO QUE MOTIVOU A REGRA (Victor, 22/08): digitou, sobrou um, o
  // instinto é apertar Enter. Antes disto ele ficava preso.
  //
  // Era conferido com "pizzaria" -> `restaurante`. `restaurante` saiu do
  // catálogo e a linha virou vermelha sem nada ter quebrado. Agora o
  // termo é DERIVADO: procura-se na lista viva um termo que hoje deixe um
  // resultado só, e confere-se que o Enter escolhe aquele.
  // ============================================================
  const sobraUm = nichos
    .flatMap((n) => n.termosDeBusca.map((t) => [t, n.nicho] as const))
    .find(([t]) => filtrarNichos(nichos, t).length === 1);
  ok(sobraUm !== undefined, "há termo que hoje deixa um resultado só, para testar o Enter");
  if (sobraUm) {
    const [termo, esperado] = sobraUm;
    const res = r(termo);
    ok(
      res.tipo === "nicho" && res.nicho.nicho === esperado,
      `"${termo}" sobra um -> Enter escolhe ${esperado}${res.tipo === "nicho" ? "" : ` (deu ${res.tipo})`}`,
    );
  }

  // O outro lado: com vários na tela, Enter NÃO adivinha. A consulta
  // também é derivada — a primeira letra que deixe dois ou mais.
  const letra = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .find((c) => filtrarNichos(nichos, c).length >= 2);
  ok(letra !== undefined, "há consulta de uma letra que deixa vários na tela");
  if (letra) {
    ok(
      r(letra).tipo === "escolha",
      `"${letra}" deixa ${filtrarNichos(nichos, letra).length} -> Enter não age, a pessoa toca no chip`,
    );
  }

  // Sem resultado vira texto livre — o caminho do "Outro" pela busca.
  // "padaria" é fixo e eterno pelo mesmo motivo do §6.
  const pad = r("padaria");
  ok(pad.tipo === "livre" && pad.texto === "padaria", '"padaria" não acha -> Enter manda texto livre');
  ok(r("  padaria  ").tipo === "livre", "e o texto livre vai aparado");

  // ---- a precedência do rótulo exato ----
  // Digitar o rótulo inteiro de QUALQUER nicho tem que escolher aquele
  // nicho. É isto que segura o dia em que um rótulo casar com os termos
  // de outro e deixar dois na tela — aí "sobrou um" falharia e a
  // precedência salva.
  const errados: string[] = [];
  for (const n of nichos) {
    const res = r(n.rotulo);
    if (res.tipo !== "nicho" || res.nicho.nicho !== n.nicho) {
      errados.push(`${n.rotulo} -> ${res.tipo === "nicho" ? res.nicho.nicho : res.tipo}`);
    }
  }
  ok(
    errados.length === 0,
    `digitar o rótulo inteiro escolhe aquele nicho, em todos${errados.length ? ` — falhou: ${errados.join("; ")}` : ""}`,
  );

  // E o mesmo digitado sem acento e em caixa baixa.
  const semAcento = nichos.filter((n) => {
    const res = r(normalizar(n.rotulo));
    return res.tipo !== "nicho" || res.nicho.nicho !== n.nicho;
  });
  ok(
    semAcento.length === 0,
    `o rótulo sem acento e em caixa baixa também escolhe${semAcento.length ? ` — falhou: ${semAcento.map((n) => n.nicho).join(", ")}` : ""}`,
  );

  // Quantos rótulos hoje deixariam MAIS de um na tela? Se um dia deixar, a
  // precedência acima é o que impede a regressão. O número está no log de
  // propósito, para o dia em que mudar.
  const ambiguos = nichos.filter((n) => filtrarNichos(nichos, n.rotulo).length > 1);
  console.log(
    `        (rótulos que hoje deixam mais de um resultado: ${ambiguos.length}${ambiguos.length ? ` — ${ambiguos.map((n) => n.nicho).join(", ")}` : ""})`,
  );
}

secao("10. o que o WEBAPP escreve à mão sobre a lista");
{
  // ============================================================
  // ESTA SEÇÃO É NOVA, E É A QUE TERIA PEGO O ESTRAGO DE SETEMBRO.
  //
  // Os §§ 4 a 9 conferem o backend contra ele mesmo. Nenhum deles
  // perguntava a coisa que quebrou: **o que o webapp escreveu à mão
  // continua apontando para nicho que existe?**
  //
  // Quando o catálogo encolheu, dois lugares ficaram apontando para o
  // vazio sem uma linha vermelha em lugar nenhum:
  //
  //   - a lista de oito chips da bancada, com SEIS nichos extintos;
  //   - a tabela de custo por contato, com DOIS dos três.
  //
  // Nenhum dos dois é o backend quebrando. É o webapp ficando para trás,
  // que é um defeito nosso e precisa de alarme nosso.
  // ============================================================

  // ---- 10.1 a tabela de custo por contato ----
  const vivos = new Set(nichos.map((n) => n.nicho));
  const custosMortos = Object.keys(CUSTO_TIPICO).filter((k) => !vivos.has(k));
  ok(
    custosMortos.length === 0,
    `todo nicho com custo por contato existe na lista viva${custosMortos.length ? ` — mortos: ${custosMortos.join(", ")}` : ""}`,
  );

  // O outro lado: um nicho aposentado que VOLTE ao catálogo precisa sair
  // da gaveta e voltar para a tabela ativa, senão o número existe e a
  // tela continua dizendo que não sabe.
  const ressuscitados = Object.keys(CUSTO_DE_NICHO_APOSENTADO).filter((k) => vivos.has(k));
  ok(
    ressuscitados.length === 0,
    `nenhum custo aposentado voltou ao catálogo${ressuscitados.length ? ` — promova de volta: ${ressuscitados.join(", ")}` : ""}`,
  );

  // Quantos dos nichos vivos têm custo conhecido? Impresso, não assertado:
  // é pergunta de produto, não de código. Hoje é 1 de 8.
  const comCusto = nichos.filter((n) => CUSTO_TIPICO[n.nicho] !== undefined);
  console.log(
    `        (nichos com custo por contato conhecido: ${comCusto.length} de ${nichos.length} — nos outros a tela diz que não sabe)`,
  );

  // ---- 10.2 nenhuma cópia da lista escrita à mão ----
  // A bancada tinha uma. Ela recebe a lista viva por prop desde 22/09, e
  // esta trava existe para o dia em que alguém achar mais rápido colar
  // oito pares do que passar a prop.
  const fontes = [
    "app/exemplo/_onboarding/perguntas.ts",
    "app/exemplo/_onboarding/Onboarding.tsx",
    "app/(fluxo)/onboarding/perguntas.ts",
  ];
  const comCopia: string[] = [];
  for (const arquivo of fontes) {
    const texto = readFileSync(new URL(`../${arquivo}`, import.meta.url), "utf8");
    // `{ nicho: "algo"` só aparece quando alguém escreveu um item de
    // lista à mão. O tipo (`nicho: string`) não casa, e o acesso
    // (`n.nicho`) também não.
    if (/\{\s*nicho:\s*"/.test(texto)) comCopia.push(arquivo);
  }
  ok(
    comCopia.length === 0,
    `nenhuma tela guarda cópia da lista à mão${comCopia.length ? ` — tem em: ${comCopia.join(", ")}` : ""}`,
  );
}

// ---------------------------------------------------------------- placar

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
