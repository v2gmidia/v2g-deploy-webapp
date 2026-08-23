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

import { readFileSync } from "node:fs";
import { validarListaDeNichos } from "../lib/nichos/validar.ts";
import {
  conferirEscolhaDeNicho,
  NAO_DEU_PARA_CONFERIR,
  NAO_E_OPCAO,
  PROCEDENCIA_DA_LISTA_VIVA,
  PROCEDENCIA_DA_RESERVA,
} from "../lib/nichos/escolha.ts";
import {
  filtrarNichos,
  nichoPeloRotulo,
  normalizar,
  resolverConsulta,
} from "../lib/nichos/busca.ts";
import type { Nicho } from "../lib/nichos/tipos.ts";

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
      nicho: "petshop",
      rotulo: "Petshop",
      termos_de_busca: ["banho e tosa"],
      sub_tipos: [{ id: "misto", rotulo: "Os dois", nome_exibicao: "Petshop — Os dois" }],
    },
  ];
  const validado = validarListaDeNichos(bom);
  ok(validado !== null, "corpo bem formado passa");
  ok(
    validado?.[0]?.subTipos[0]?.nomeExibicao === "Petshop — Os dois",
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

  // Ausência não é tipo errado: nove dos dez nichos não têm sub-tipo.
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
  console.log("PULANDO OS §§ 3 a 10: sem V2G_BACKEND_URL / V2G_BACKEND_TOKEN.");
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

secao("4. a forma da lista viva");
{
  ok(nichos.length === 10, `dez nichos (vieram ${nichos.length})`);
  ok(
    !nichos.some((n) => n.nicho === "generico"),
    "`generico` não vem — é destino de quem não casa, não escolha de lista",
  );

  const termos = nichos.reduce((s, n) => s + n.termosDeBusca.length, 0);
  // Piso, não igualdade: termo só cresce. 183 é o commit `3b846a1`; 77 é o
  // deploy anterior a ele. Cair abaixo do piso é deploy atrasado.
  ok(termos >= 183, `${termos} termos de busca (piso 183 — abaixo disso o deploy está atrasado)`);

  // Rótulo é voz de dono, não de catálogo. Se `clinica-odontologica`
  // aparecer como "Clínica Odontológica" na tela, o backend regrediu.
  ok(
    nichos.find((n) => n.nicho === "clinica-odontologica")?.rotulo === "Dentista",
    '`clinica-odontologica` -> "Dentista" (voz de dono)',
  );
  ok(
    nichos.find((n) => n.nicho === "consultorio-medico")?.rotulo === "Médico",
    '`consultorio-medico` -> "Médico"',
  );

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

secao("5. o que a busca TEM que achar");
{
  const acha = (q: string) => filtrarNichos(nichos, q).map((n) => n.nicho);

  const sondas: Array<[string, string]> = [
    ["siso", "clinica-odontologica"],
    ["cardiologista", "consultorio-medico"],
    ["martelinho de ouro", "oficina-mecanica"],
    ["banho de gel", "manicure"],
  ];
  for (const [termo, esperado] of sondas) {
    const r = acha(termo);
    ok(
      r.includes(esperado),
      `"${termo}" -> ${esperado}${r.includes(esperado) ? "" : `  (achou: ${r.join(", ") || "nada"} — deploy atrasado?)`}`,
    );
  }

  ok(acha("dent").includes("clinica-odontologica"), 'busca por pedaço de palavra ("dent") já acha');
  ok(
    filtrarNichos(nichos, "").length === nichos.length,
    "consulta vazia mostra os dez (não obriga a digitar, não esconde a lista)",
  );
  ok(filtrarNichos(nichos, "   ").length === nichos.length, "só espaço também mostra os dez");

  // A prova geral da normalização contra o dado REAL: todo termo acentuado
  // do backend tem que ser achável digitado sem acento. Isto cobre os dez
  // que existem hoje e qualquer um que o backend acrescente amanhã.
  const acentuados: string[] = [];
  const quebrados: string[] = [];
  for (const n of nichos) {
    for (const t of n.termosDeBusca) {
      if (normalizar(t) === t.toLowerCase()) continue;
      acentuados.push(t);
      if (!acha(normalizar(t)).includes(n.nicho)) quebrados.push(`${t} (${n.nicho})`);
    }
  }
  ok(acentuados.length > 0, `há termo acentuado no dado real para testar (${acentuados.length})`);
  ok(
    quebrados.length === 0,
    `todo termo acentuado é achável sem acento${quebrados.length ? ` — quebrados: ${quebrados.join(", ")}` : ""}`,
  );
}

secao("6. o que a busca NÃO pode achar — a decisão, não a falha");
{
  // Sugestão aproximada foi PROPOSTA E RECUSADA: a ressalva na tela seria
  // interface pedindo desculpa por não ter o que a pessoa precisa. Quem não
  // acha cai no texto livre. Há dois testes no backend que falham se alguém
  // casar `padaria` ou a família do varejo de alimento em qualquer nicho.
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
  ok(nichoPeloRotulo(nichos, "Dentista")?.nicho === "clinica-odontologica", "rótulo exato acha");
  ok(nichoPeloRotulo(nichos, "dentista")?.nicho === "clinica-odontologica", "caixa não importa");
  ok(
    nichoPeloRotulo(nichos, "  Dentista  ")?.nicho === "clinica-odontologica",
    "espaço nas pontas não importa",
  );
  ok(
    nichoPeloRotulo(nichos, "Clínica de estética")?.nicho === "clinica-estetica",
    "rótulo com acento acha",
  );
  ok(
    nichoPeloRotulo(nichos, "clinica de estetica")?.nicho === "clinica-estetica",
    "e acha digitado sem acento",
  );
  // O outro lado: o que NÃO pode ser aceito como escolha de lista.
  ok(nichoPeloRotulo(nichos, "Dent") === undefined, "pedaço de rótulo NÃO é escolha válida");
  ok(nichoPeloRotulo(nichos, "") === undefined, "vazio não é escolha válida");
  ok(
    nichoPeloRotulo(nichos, "Clínica / Consultório") === undefined,
    "os chips velhos NÃO são nicho — é o buraco que este lote fecha",
  );
  ok(
    nichoPeloRotulo(nichos, "Loja física") === undefined,
    '"Loja física" nunca cobriu nicho nenhum',
  );
}

secao("8. a validação do servidor — a que quebraria calada");
{
  // A reserva de `perguntas.ts`, como o servidor a passa.
  const RESERVA = [
    "Clínica / Consultório",
    "Loja física",
    "Restaurante / Bar",
    "Serviço (advocacia, arquitetura, contabilidade)",
    "Beleza e estética",
  ];
  const comLista = (texto: string) =>
    conferirEscolhaDeNicho({ lista: nichos, reserva: RESERVA, texto });
  const semLista = (texto: string) =>
    conferirEscolhaDeNicho({ lista: null, reserva: RESERVA, texto });

  // ---- com a lista viva ----
  const r1 = comLista("Dentista");
  ok(r1.ok && r1.texto === "Dentista", "chip da lista viva passa");

  // O MOTIVO DE TUDO ISTO: antes deste lote, esta linha reprovava. Nenhum
  // nicho está em `pergunta.opcoes`, então toda escolha válida virava
  // "essa opção não existe" — e o conserto tentador seria apagar a
  // checagem, reabrindo o buraco de forjar `origem: "chip"`.
  ok(comLista("Petshop").ok, "nicho que NUNCA esteve nos chips velhos passa");
  ok(comLista("Oficina mecânica").ok, "e os outros inalcançáveis também");

  const r2 = comLista("dentista");
  ok(r2.ok && r2.texto === "Dentista", "caixa diferente passa e volta com a grafia canônica");
  const r3 = comLista("clinica de estetica");
  ok(
    r3.ok && r3.texto === "Clínica de estética",
    "sem acento passa e volta ACENTUADO (nunca grava o texto do cliente)",
  );

  // Os dois lados: o que a lista viva tem que RECUSAR.
  ok(!comLista("Clínica / Consultório").ok, "chip velho é recusado quando a lista viva está no ar");
  ok(!comLista("Loja física").ok, '"Loja física" recusada — nunca cobriu nicho nenhum');
  ok(!comLista("Dent").ok, "pedaço de rótulo é recusado (substring não é escolha)");
  ok(!comLista("padaria").ok, "termo sem nicho é recusado como chip");
  ok(!comLista("qualquer coisa forjada").ok, "texto forjado com `origem: chip` é recusado");
  const r4 = comLista("padaria");
  ok(!r4.ok && r4.erro === NAO_E_OPCAO, "e a recusa acusa a opção, porque a lista estava no ar");

  // ---- com a lista fora ----
  const r5 = semLista("Loja física");
  ok(r5.ok && r5.texto === "Loja física", "com o backend fora, o chip da RESERVA passa");
  ok(semLista("Clínica / Consultório").ok, "a reserva inteira continua válida na degradação");

  // A ARMADILHA QUE ESTE PAR FECHA: sem a checagem da reserva, quem
  // respondesse durante a queda ouviria que o chip que a tela acabou de
  // mostrar não existe.
  const r6 = semLista("Dentista");
  ok(!r6.ok, "com o backend fora, nicho da lista viva não pode ser confirmado");
  ok(
    !r6.ok && r6.erro === NAO_DEU_PARA_CONFERIR,
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
  ok(!semLista("loja fisica").ok, "a reserva é igualdade exata: nela não há campo para digitar");
}

secao("9. o que o Enter faz — `resolverConsulta`");
{
  const r = (q: string) => resolverConsulta(nichos, q);

  // Campo vazio não é escolha nem texto.
  ok(r("").tipo === "vazia", "campo vazio: Enter não faz nada");
  ok(r("   ").tipo === "vazia", "só espaço também");

  // O CASO QUE MOTIVOU A REGRA (Victor, 22/08): digitou, sobrou um, o
  // instinto é apertar Enter. Antes disto ele ficava preso.
  const pizza = r("pizzaria");
  ok(
    pizza.tipo === "nicho" && pizza.nicho.nicho === "restaurante",
    `"pizzaria" sobra um -> Enter escolhe restaurante${pizza.tipo === "nicho" ? "" : ` (deu ${pizza.tipo})`}`,
  );
  const siso = r("siso");
  ok(
    siso.tipo === "nicho" && siso.nicho.nicho === "clinica-odontologica",
    '"siso" sobra um -> Enter escolhe',
  );

  // O outro lado: com vários na tela, Enter NÃO adivinha.
  const muitos = nichos.filter((n) => filtrarNichos(nichos, "a").includes(n));
  ok(muitos.length >= 2, `há consulta que deixa vários na tela para testar (${muitos.length})`);
  ok(r("a").tipo === "escolha", '"a" deixa vários -> Enter não age, a pessoa toca no chip');

  // Sem resultado vira texto livre — o caminho do "Outro" pela busca.
  const pad = r("padaria");
  ok(pad.tipo === "livre" && pad.texto === "padaria", '"padaria" não acha -> Enter manda texto livre');
  ok(r("  padaria  ").tipo === "livre", "e o texto livre vai aparado");

  // ---- a precedência do rótulo exato ----
  // Assertiva geral, contra o dado real: digitar o rótulo inteiro de
  // QUALQUER nicho tem que escolher aquele nicho. É isto que segura o dia
  // em que um rótulo casar com os termos de outro e deixar dois na tela —
  // aí "sobrou um" falharia e a precedência salva.
  const errados: string[] = [];
  for (const n of nichos) {
    const res = r(n.rotulo);
    if (res.tipo !== "nicho" || res.nicho.nicho !== n.nicho) {
      errados.push(`${n.rotulo} -> ${res.tipo === "nicho" ? res.nicho.nicho : res.tipo}`);
    }
  }
  ok(
    errados.length === 0,
    `digitar o rótulo inteiro escolhe aquele nicho, nos dez${errados.length ? ` — falhou: ${errados.join("; ")}` : ""}`,
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

  // Quantos rótulos hoje deixariam MAIS de um na tela? Zero — mas se um dia
  // deixar, a precedência acima é o que impede a regressão. O número está
  // no log de propósito, para o dia em que mudar.
  const ambiguos = nichos.filter((n) => filtrarNichos(nichos, n.rotulo).length > 1);
  console.log(
    `        (rótulos que hoje deixam mais de um resultado: ${ambiguos.length}${ambiguos.length ? ` — ${ambiguos.map((n) => n.nicho).join(", ")}` : ""})`,
  );
}

secao("10. a marcação `aproximacao` — o palpite tem que se declarar");
{
  const RESERVA = [
    "Clínica / Consultório",
    "Loja física",
    "Restaurante / Bar",
    "Serviço (advocacia, arquitetura, contabilidade)",
    "Beleza e estética",
  ];

  // Lista viva no ar: escolha real, procedência cheia.
  const viva = conferirEscolhaDeNicho({ lista: nichos, reserva: RESERVA, texto: "Dentista" });
  ok(viva.ok && viva.viaReserva === false, "chip da lista viva NÃO é aproximação");

  // Backend fora: o chip de reserva passa, mas marcado.
  const reserva = conferirEscolhaDeNicho({
    lista: null,
    reserva: RESERVA,
    texto: "Clínica / Consultório",
  });
  ok(reserva.ok && reserva.viaReserva === true, "chip da RESERVA vem marcado como aproximação");

  // O par que dá sentido à marcação: o mesmo texto, os dois estados.
  const mesmoTexto = "Beleza e estética";
  const a = conferirEscolhaDeNicho({ lista: nichos, reserva: RESERVA, texto: mesmoTexto });
  const b = conferirEscolhaDeNicho({ lista: null, reserva: RESERVA, texto: mesmoTexto });
  ok(
    !a.ok && b.ok && b.viaReserva === true,
    "\"Beleza e estética\" é recusado com a lista no ar e aproximado com ela fora — os dois lados",
  );

  ok(
    PROCEDENCIA_DA_RESERVA !== (PROCEDENCIA_DA_LISTA_VIVA as string),
    "as duas procedências são valores diferentes",
  );

  // ---- o código e a migration não podem divergir ----
  // A função do banco recusa origem fora do domínio dela. Se alguém
  // renomear a constante aqui sem mexer na `0021`, a gravação passa no
  // typecheck e explode em runtime, no caminho degradado — o pior lugar
  // para descobrir.
  const sql = readFileSync("supabase/migrations/0021_aproximacao_da_reserva.sql", "utf8");
  ok(
    sql.includes(`'${PROCEDENCIA_DA_RESERVA}'`),
    `a migration 0021 conhece '${PROCEDENCIA_DA_RESERVA}'`,
  );
  ok(
    sql.includes("not in ('confirmado', 'manual', 'extraido', 'aproximacao')"),
    "`registrar_procedencia` aceita os quatro valores",
  );
  ok(
    sql.includes("not in ('confirmado', 'aproximacao')"),
    "`confirmar_campo_do_cliente` aceita só os dois do ato do cliente",
  );
  ok(
    sql.includes("drop function if exists public.confirmar_campo_do_cliente(uuid, uuid, text, text, jsonb);"),
    "a assinatura antiga de cinco argumentos é derrubada (senão o PostgREST fica ambíguo)",
  );

  // A trava do valor do cliente compara com o literal `confirmado`. Se
  // alguém "consertar" isso para incluir aproximacao, o palpite passa a
  // ser protegido contra correção — o oposto do que ele significa.
  const m0019 = readFileSync("supabase/migrations/0019_escrever_apenas_se_livre.sql", "utf8");
  const m0013 = readFileSync("supabase/migrations/0013_aplicar_proposta.sql", "utf8");
  ok(
    !m0019.includes("aproximacao") && !m0013.includes("aproximacao"),
    "as travas da 0013 e 0019 NÃO conhecem `aproximacao` — é assim que ele fica abaixo de `confirmado`",
  );
}

// ---------------------------------------------------------------- placar

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
