/**
 * O que o cliente pode mandar — `pnpm conferir:envio`
 *
 * ============================================================
 * A RECUSA ERRADA CUSTA O UPLOAD INTEIRO, NO 4G, DUAS VEZES.
 *
 * Quem sobe foto pelo celular manda arquivo de 8 MB. Recusar tarde faz a
 * pessoa esperar o upload para ler que não serve — e tentar de novo, com
 * o mesmo arquivo, porque ela não entendeu o que estava errado.
 *
 * Por isso o que se confere aqui não é só "recusa o que deve": é que cada
 * recusa tem um texto que diz O QUE FAZER, e que nenhum deles culpa quem
 * mandou a foto do próprio negócio.
 * ============================================================
 *
 * Puro: não toca rede, banco, nem navegador.
 */

import {
  ACEITOS_NO_INPUT,
  conferirAntesDeLer,
  conferirDimensoes,
  LADO_MINIMO_PX,
  textoDaRecusaDoBackend,
} from "../lib/criativos/envio.ts";

let passou = 0;
let falhou = 0;

function ok(condicao: boolean, rotulo: string) {
  if (condicao) {
    passou++;
    console.log("  ok   ", rotulo);
  } else {
    falhou++;
    console.log("  FALHA", rotulo);
  }
}

const secao = (t: string) => console.log("\n" + t);

console.log("\nO que o cliente pode mandar\n" + "=".repeat(64));

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  const antes = falhou;
  ok(false, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhou === antes + 1;
  falhou = antes;
  ok(pegou, "e a falha foi contada — o placar abaixo vale alguma coisa");
}

const jpg = { nome: "loja.jpg", tipo: "image/jpeg", tamanhoBytes: 800_000 };

secao("1. o caminho feliz");
{
  ok(conferirAntesDeLer(jpg) === null, "JPG de celular passa");
  ok(
    conferirAntesDeLer({ nome: "a.png", tipo: "image/png", tamanhoBytes: 1 }) === null,
    "PNG passa",
  );
  {
    // ============================================================
    // WEBP DEIXOU DE PASSAR EM 11/09/2026 — e a trava inverteu.
    //
    // Ela dizia "WEBP passa — é o que sai de muito celular Android". O
    // fato continua verdadeiro; o que mudou é que a peça vira anúncio, e
    // a Meta não aceita WEBP no criativo.
    //
    // O motivo é PRÓPRIO, e não `formato`: o texto de `formato` diz que
    // a gente não consegue abrir o arquivo, o que é falso — a gente abre.
    // Quem não aceita é o Facebook, e a saída é outra.
    // ============================================================
    const r = conferirAntesDeLer({ nome: "a.webp", tipo: "image/webp", tamanhoBytes: 1 });
    ok(r !== null, "WEBP é recusado — a Meta não aceita em anúncio");
    ok(r?.motivo === "webp", "  e com motivo próprio, não `formato`");
    ok(/JPG|PNG/i.test(r?.texto ?? ""), "  o texto diz o que mandar no lugar");
    ok(!/erro|inválid|falhou/i.test(r?.texto ?? ""), "  e não culpa quem mandou");
    // o `.webp` renomeado para `.jpg` continua caindo na trava da extensão
    const renomeado = conferirAntesDeLer({ nome: "a.jpg", tipo: "image/webp", tamanhoBytes: 1 });
    ok(renomeado?.motivo === "webp", "  `.jpg` que é WEBP por dentro também é pego");
  }
  ok(
    !/webp/i.test(ACEITOS_NO_INPUT),
    "e o `accept` do input não oferece WEBP",
  );
  ok(
    conferirDimensoes({ nome: "a.jpg", largura: 1080, altura: 1920 }) === null,
    "foto de story (1080×1920) passa",
  );
}

secao("2. VÍDEO — recusado, e com texto próprio");
{
  const r = conferirAntesDeLer({ nome: "reels.mp4", tipo: "video/mp4", tamanhoBytes: 40_000_000 });
  ok(r !== null, "vídeo é recusado");
  ok(r?.motivo === "video", "com motivo `video`, e não `formato`");
  ok(/v[ií]deo/i.test(r!.texto), "e o texto diz a palavra vídeo — a pessoa precisa saber o que houve");
  ok(/foto|imagem/i.test(r!.texto), "e diz o que mandar no lugar");

  // ============================================================
  // O `accept` DO INPUT É A PRIMEIRA DEFESA, e é a que evita a viagem.
  //
  // Com ele, o seletor de arquivo do celular nem mostra vídeo. A
  // conferência acima é para quem chega assim mesmo — arrastando, ou por
  // app que ignora o `accept`.
  // ============================================================
  ok(!/video/.test(ACEITOS_NO_INPUT), "`accept` do input não oferece vídeo");
  ok(ACEITOS_NO_INPUT.includes("image/jpeg"), "e oferece JPG");
}

secao("3. a extensão que não bate com o conteúdo");
{
  const r = conferirAntesDeLer({ nome: "foto.jpg", tipo: "image/png", tamanhoBytes: 500_000 });
  ok(r?.motivo === "extensao_nao_bate", "`.jpg` que é PNG por dentro é recusado");
  ok(!/extens|formato|MIME|PNG|JPG/i.test(r!.texto), "e o texto NÃO explica a regra para o dono");
  ok(/original/i.test(r!.texto), "diz o que fazer: mandar a original");

  ok(
    conferirAntesDeLer({ nome: "planilha.pdf", tipo: "application/pdf", tamanhoBytes: 9 })?.motivo ===
      "formato",
    "PDF é recusado por formato",
  );
  ok(
    conferirAntesDeLer({ nome: "semextensao", tipo: "image/jpeg", tamanhoBytes: 9 })?.motivo ===
      "formato",
    "arquivo sem extensão é recusado",
  );
  ok(
    conferirAntesDeLer({ nome: "a.jpg", tipo: "image/jpeg", tamanhoBytes: 0 })?.motivo === "vazio",
    "arquivo vazio é recusado antes de qualquer outra coisa",
  );
}

secao("4. o lado menor, e o caso que engana");
{
  ok(LADO_MINIMO_PX === 1024, "o mínimo é 1024 no lado MENOR");
  ok(
    conferirDimensoes({ nome: "a.jpg", largura: 1024, altura: 1024 })=== null,
    "exatamente 1024×1024 passa — o mínimo é inclusivo",
  );
  ok(
    conferirDimensoes({ nome: "a.jpg", largura: 1023, altura: 4000 })?.motivo === "pequena_demais",
    "1023×4000 é RECUSADA: o que vale é o lado menor, não a área",
  );
  const r = conferirDimensoes({ nome: "a.jpg", largura: 400, altura: 400 })!;
  ok(/reduziu|original/i.test(r.texto), "e o texto aponta a causa provável: foto reduzida para enviar");
  ok(!/1024|pixel|px\b/i.test(r.texto), "sem falar em pixel — o dono não mede foto em pixel");
}

secao("5. NENHUM texto culpa quem mandou a foto");
{
  const todos = [
    conferirAntesDeLer({ nome: "a.mp4", tipo: "video/mp4", tamanhoBytes: 1 })!,
    conferirAntesDeLer({ nome: "a.pdf", tipo: "application/pdf", tamanhoBytes: 1 })!,
    conferirAntesDeLer({ nome: "a.jpg", tipo: "image/png", tamanhoBytes: 1 })!,
    conferirAntesDeLer({ nome: "a.jpg", tipo: "image/jpeg", tamanhoBytes: 0 })!,
    conferirDimensoes({ nome: "a.jpg", largura: 10, altura: 10 })!,
  ];
  for (const r of todos) {
    ok(!/\berro\b|inv[áa]lid|falhou|incorret/i.test(r.texto), `\`${r.motivo}\`: sem palavra de erro`);
    ok(!/você (não|nao) /i.test(r.texto), `\`${r.motivo}\`: não começa pelo que ele deixou de fazer`);
    ok(r.texto.length > 30, `\`${r.motivo}\`: diz o que fazer, não só o que houve`);
  }
}

secao("6. a recusa do BACKEND — só o `motivo`, nunca os achados técnicos");
{
  ok(
    textoDaRecusaDoBackend("A imagem tem texto demais para o Facebook aceitar.") ===
      "A imagem tem texto demais para o Facebook aceitar.",
    "o `motivo` do backend passa inteiro para a tela",
  );

  // ============================================================
  // `achados_tecnicos` NÃO TEM PORTA. E é de propósito.
  //
  // A função recebe UM argumento. Não existe caminho pelo qual o campo
  // do gestor chegue à tela do dono, porque não existe parâmetro para
  // ele — quem quisesse mostrar teria que mudar a assinatura, que é uma
  // decisão visível em revisão.
  // ============================================================
  ok(textoDaRecusaDoBackend.length === 1, "a função recebe um argumento só: o motivo");

  const semMotivo = textoDaRecusaDoBackend(null);
  ok(semMotivo.length > 0, "sem motivo, ainda sai texto");
  ok(!/undefined|null/i.test(semMotivo), "e o texto não vaza `null`");
  ok(/fale com a gente/i.test(semMotivo), "e oferece o caminho humano, que é o que sobra");
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nISTO CONFERE A RECUSA NO NAVEGADOR. O backend confere de novo e é\n" +
    "ele que manda — se as duas discordarem, quem está errado é este\n" +
    "arquivo.\n",
);
