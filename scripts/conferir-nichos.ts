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
  nichoPeloIdentificador,
  nichoPeloRotulo,
  normalizar,
  resolverConsulta,
} from "../lib/nichos/busca.ts";
import {
  lerNichoGravado,
  rotuloDoNichoGravado,
  NICHO_FORA_DA_LISTA,
  LISTA_NAO_CARREGOU,
  NICHO_GUARDADO_SEM_LISTA,
} from "../lib/nichos/gravado.ts";
import { acharCampoDoCliente } from "../lib/perfil/catalogo-cliente.ts";
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

// ---------------------------------------------------------------- §2.1

secao("2.1 as duas telas do ramo — mesma coluna, mesmas regras");
{
  const ramo = acharCampoDoCliente("businesses.niche");
  ok(ramo?.seletorDeNicho === true, "a `/meu-negocio` usa o seletor, não um campo de texto");
  ok(ramo?.opcoes === undefined, "e não tem lista de opções escrita à mão competindo com ele");

  // ============================================================
  // O `ajuda` DA TELA NÃO PODE OFERECER O QUE A BUSCA RECUSA.
  //
  // Ele dizia "Padaria, salão, clínica — do jeito que você mesmo chama",
  // e `padaria` é exatamente o termo que não tem nicho em `knowledge/`,
  // que a busca foi construída para não achar, e que tem dois testes no
  // backend garantindo que não case com nada. Uma tela recusava a palavra
  // e a outra a oferecia como modelo de resposta.
  //
  // A conferência é contra a família inteira do varejo de alimento, e não
  // só contra "padaria": o defeito não foi a palavra, foi dar exemplo de
  // ramo que a lista não tem.
  // ============================================================
  const semNicho = ["padaria", "doceria", "mercearia", "confeitaria", "mercadinho", "lavanderia"];
  const ajuda = normalizar(ramo?.ajuda ?? "");
  const oferecidos = semNicho.filter((t) => ajuda.includes(t));
  ok(
    oferecidos.length === 0,
    `o texto de apoio não dá exemplo de ramo que a lista não tem${oferecidos.length ? ` — oferece: ${oferecidos.join(", ")}` : ""}`,
  );

  // Os dois recados da tela são diferentes, e a diferença é quem falhou —
  // a mesma regra dos dois recados de recusa do §8.
  const recados = [NICHO_FORA_DA_LISTA, LISTA_NAO_CARREGOU, NICHO_GUARDADO_SEM_LISTA];
  ok(
    new Set(recados).size === 3,
    "os três recados da tela são diferentes: 'não está na lista', 'a lista não carregou' e 'não deu para carregar o nome do seu ramo'",
  );
  // O terceiro é o do valor gravado que não dá para traduzir. Ele não pode
  // dizer que o dado sumiu — ele existe, é o NOME dele que não carregou.
  ok(
    !normalizar(NICHO_GUARDADO_SEM_LISTA).includes("nao sabe"),
    "e o do catálogo fora não diz que a gente não sabe o ramo — a gente sabe, só não consegue escrever o nome",
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
  const comLista = (texto: string) => conferirEscolhaDeNicho({ lista: nichos, texto });
  const semLista = (texto: string) => conferirEscolhaDeNicho({ lista: null, texto });

  // ---- com a lista viva ----
  const r1 = comLista("Dentista");
  ok(
    r1.ok && r1.nicho === "clinica-odontologica" && r1.rotulo === "Dentista",
    "chip da lista viva passa, e volta com o PAR: `clinica-odontologica` para gravar, \"Dentista\" para mostrar",
  );

  // O MOTIVO DE TUDO ISTO: antes deste lote, esta linha reprovava. Nenhum
  // nicho está em `pergunta.opcoes`, então toda escolha válida virava
  // "essa opção não existe" — e o conserto tentador seria apagar a
  // checagem, reabrindo o buraco de forjar `origem: "chip"`.
  ok(comLista("Petshop").ok, "nicho que NUNCA esteve nos chips velhos passa");
  ok(comLista("Oficina mecânica").ok, "e os outros inalcançáveis também");

  const r2 = comLista("dentista");
  ok(
    r2.ok && r2.rotulo === "Dentista" && r2.nicho === "clinica-odontologica",
    "caixa diferente passa e volta com a grafia canônica",
  );
  const r3 = comLista("clinica de estetica");
  ok(
    r3.ok && r3.rotulo === "Clínica de estética" && r3.nicho === "clinica-estetica",
    "sem acento passa e volta ACENTUADO (nunca grava o texto do cliente)",
  );

  // A COLUNA NUNCA RECEBE RÓTULO, e é a metade de servidor da inversão de
  // 23/08. Se alguém devolver `rotulo` onde o chamador espera `nicho`, a
  // tela continua bonita — e o pipeline perde o identificador do
  // documento do nicho sem que nada apareça.
  const rotulos = new Set(nichos.map((n) => n.rotulo));
  const vazando = nichos
    .map((n) => comLista(n.rotulo))
    .filter((r) => r.ok && rotulos.has(r.nicho));
  ok(
    vazando.length === 0,
    "o que vai para a coluna é identificador, nunca rótulo, nos dez nichos",
  );

  // Os dois lados: o que a lista viva tem que RECUSAR.
  ok(!comLista("Dent").ok, "pedaço de rótulo é recusado (substring não é escolha)");
  ok(!comLista("padaria").ok, "termo sem nicho é recusado como chip");
  ok(!comLista("qualquer coisa forjada").ok, "texto forjado com `origem: chip` é recusado");
  const r4 = comLista("padaria");
  ok(!r4.ok && r4.erro === NAO_E_OPCAO, "e a recusa acusa a opção, porque a lista estava no ar");

  // ---- com a lista fora: NÃO EXISTE RESERVA ----
  // Decisão do Victor, 22/08. Os cinco chips fixos saíram: eles não eram
  // nichos, e gravar um deles seria palpite com cara de escolha do
  // cliente. Com o catálogo fora, a tela mostra só o texto livre.
  for (const antigo of [
    "Clínica / Consultório",
    "Loja física",
    "Restaurante / Bar",
    "Serviço (advocacia, arquitetura, contabilidade)",
    "Beleza e estética",
  ]) {
    ok(!semLista(antigo).ok, `"${antigo}" NÃO passa mais — a reserva não existe`);
  }
  ok(!comLista("Clínica / Consultório").ok, "e também não passa com a lista no ar");

  const r5 = semLista("Dentista");
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

  // A pergunta `ramo` não pode voltar a ter opção fixa: `actions.ts`
  // confere chip contra `pergunta.opcoes`, e uma opção ali seria uma
  // resposta aceita sem passar pelo catálogo — a reserva entrando de novo
  // pela porta dos fundos.
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

secao("10. o que a COLUNA guarda — `lerNichoGravado`");
{
  const ler = (v: unknown) => lerNichoGravado(nichos, v);

  // ============================================================
  // O CICLO INTEIRO: O QUE O ONBOARDING GRAVA É O QUE A TELA LÊ.
  //
  // Escreve pela mesma função da Server Action, lê pela mesma função do
  // componente, e confere que o rótulo que volta é o mesmo que a pessoa
  // tocou. É esta assertiva que pegaria a inversão feita pela metade —
  // gravar identificador e continuar lendo como rótulo deixa a tela
  // mostrando `clinica-odontologica` para o dono do consultório, que é o
  // defeito que o `buraco-meu-negocio-nicho-livre.md` previu.
  // ============================================================
  const quebrados: string[] = [];
  for (const n of nichos) {
    const escolha = conferirEscolhaDeNicho({ lista: nichos, texto: n.rotulo });
    if (!escolha.ok) {
      quebrados.push(`${n.nicho}: a escolha nem passou`);
      continue;
    }
    const lido = ler(escolha.nicho);
    if (lido.tipo !== "reconhecido" || lido.nicho.nicho !== n.nicho) {
      quebrados.push(`${n.nicho}: gravou "${escolha.nicho}" e a leitura deu ${lido.tipo}`);
      continue;
    }
    if (rotuloDoNichoGravado(lido) !== n.rotulo) {
      quebrados.push(`${n.nicho}: a tela mostraria "${rotuloDoNichoGravado(lido)}"`);
    }
  }
  ok(
    quebrados.length === 0,
    `escolher -> gravar -> ler devolve o mesmo rótulo, nos dez${quebrados.length ? ` — ${quebrados.join("; ")}` : ""}`,
  );

  // ---- o identificador é o que a coluna aceita ----
  const dent = ler("clinica-odontologica");
  ok(
    dent.tipo === "reconhecido" && dent.nicho.rotulo === "Dentista",
    "`clinica-odontologica` na coluna vira \"Dentista\" na tela",
  );
  ok(ler("CLINICA-ODONTOLOGICA").tipo === "reconhecido", "caixa não importa na leitura");
  ok(ler("  clinica-odontologica  ").tipo === "reconhecido", "espaço nas pontas não importa");

  // ============================================================
  // RÓTULO GRAVADO NÃO É RECONHECIDO — e esta linha é a decisão de 23/08.
  //
  // A coluna guardava "Dentista" até 22/08. Medido no banco antes de
  // inverter: ZERO linhas tinham rótulo válido (as três com valor tinham
  // "Clínica / Consultório", que nunca foi nicho, e "padaria", fictícia).
  // Por isso não existe caminho de tolerância a rótulo antigo: não havia
  // o que tolerar, e uma segunda regra de leitura seria código sem
  // sujeito, envelhecendo sem ninguém para exercitá-lo.
  //
  // Se um dia esta linha falhar, alguém voltou a gravar rótulo.
  // ============================================================
  ok(ler("Dentista").tipo === "nao-reconhecido", "RÓTULO na coluna não é reconhecido");

  // ---- o que existe hoje no banco, medido em 23/08 ----
  ok(
    ler("Clínica / Consultório").tipo === "nao-reconhecido",
    "o valor real das duas linhas de hoje cai em pendência, não em erro",
  );
  const pad = ler("padaria");
  ok(pad.tipo === "nao-reconhecido", "o texto livre de quem não se achou também");
  ok(
    rotuloDoNichoGravado(pad) === "padaria",
    "e a tela mostra a frase da própria pessoa, não um vizinho aproximado",
  );

  // ---- vazio ----
  ok(ler(null).tipo === "vazio", "coluna nula é vazia");
  ok(ler("").tipo === "vazio" && ler("   ").tipo === "vazio", "string em branco também");

  // ============================================================
  // SEM LISTA NÃO É "NÃO RECONHECIDO", E A DIFERENÇA É QUEM FALHOU.
  //
  // Com o catálogo fora não dá para afirmar que o valor está fora da
  // lista — não há lista. Dizer ao cliente "esse ramo não está na nossa
  // lista" ali é o sistema culpando ele pelo próprio defeito, a mesma
  // regra dos dois recados de recusa do §8.
  // ============================================================
  const semLista = lerNichoGravado(null, "clinica-odontologica");
  ok(semLista.tipo === "sem-lista", "com o catálogo fora, nem identificador válido é resolvido");
  // ACHADO NO NAVEGADOR, 23/08: a tela mostrava `clinica-odontologica`
  // cru para o dono do consultório neste estado. O nome do ramo só existe
  // com a lista viva; sem ela a função devolve vazio e quem chama mostra
  // o `NICHO_GUARDADO_SEM_LISTA` no lugar.
  ok(
    rotuloDoNichoGravado(semLista) === "",
    "e o identificador NÃO vaza para a tela — sem lista não há nome para mostrar",
  );
  ok(
    lerNichoGravado(null, "padaria").tipo === "sem-lista",
    "e nada é acusado de estar fora de uma lista que não carregou",
  );
  ok(lerNichoGravado(null, null).tipo === "vazio", "mas vazio continua vazio, com ou sem lista");

  // ---- igualdade, não substring: o mesmo corte do §7 ----
  ok(
    nichoPeloIdentificador(nichos, "clinica") === undefined,
    "pedaço de identificador não resolve (senão `clinica` viraria uma das três clínicas)",
  );
  ok(nichoPeloIdentificador(nichos, "") === undefined, "vazio não resolve");
}

// ---------------------------------------------------------------- placar

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
