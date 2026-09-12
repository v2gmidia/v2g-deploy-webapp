/**
 * O que o cliente pode mandar — foto do negócio e criativo pronto.
 *
 * ============================================================
 * RECUSAR NO NAVEGADOR É MAIS BARATO QUE RECUSAR DEPOIS DE SUBIR.
 *
 * Quem sobe foto de clínica pelo celular, no 4G, manda arquivo de 8 MB.
 * Descobrir no fim do upload que o formato não serve custa o upload
 * inteiro — e custa de novo, porque a pessoa tenta outra vez.
 *
 * Então tudo que dá para saber ANTES é conferido antes. O backend confere
 * de novo, e é ele que manda; isto aqui é gentileza com a paciência do
 * cliente, não substituto da validação de lá.
 * ============================================================
 *
 * ============================================================
 * VÍDEO É RECUSADO, E A TELA DIZ ANTES DE ELE ESCOLHER.
 *
 * O backend recusa vídeo no upload. Uma tela que só descobre isso depois
 * faz a pessoa esperar o upload de um arquivo de 40 MB para ler "não
 * aceito" — e ela subiu o arquivo certo, do ponto de vista dela.
 *
 * Por isso `ACEITOS_NO_INPUT` existe: vai no `accept` do `<input>`, e o
 * seletor de arquivo do celular já nem mostra vídeo. E `MOTIVO_VIDEO`
 * existe para o caso de ela chegar lá assim mesmo — arrastando, ou por um
 * app que ignora o `accept`.
 * ============================================================
 *
 * SEM `server-only`: a validação roda no navegador, que é o ponto.
 */

import { TETO_DO_NAVEGADOR_BYTES, TETO_DO_NAVEGADOR_MB } from "./limites.mjs";

/** O lado menor da imagem, em pixels. Abaixo disso o backend recusa. */
export const LADO_MINIMO_PX = 1024;

/**
 * O teto de tamanho — **derivado, nunca digitado aqui**.
 *
 * Reexportado para a tela poder escrever o número sem importar dois
 * módulos. Quem manda é `./limites.mjs`, que também alimenta o
 * `bodySizeLimit` do `next.config.mjs`.
 */
export { TETO_DO_NAVEGADOR_BYTES, TETO_DO_NAVEGADOR_MB };

/**
 * O que o `<input type="file">` aceita. Vídeo fica de fora — e WEBP também.
 *
 * ============================================================
 * WEBP SAIU EM 11/09/2026, E A RAZÃO NÃO É NOSSA: A META NÃO ACEITA.
 *
 * Ele passava porque é o que sai de muito celular Android, e do nosso
 * lado abre sem problema. Mas a peça não para aqui: ela vira anúncio, e
 * a Meta recusa WEBP no criativo.
 *
 * Aceitar aqui para recusar três telas adiante é a pior das ordens —
 * a pessoa sobe, espera, e leva a recusa depois de achar que deu certo.
 * Melhor recusar no seletor de arquivo, onde ela ainda tem a foto na
 * mão e pode escolher outra.
 * ============================================================
 */
export const ACEITOS_NO_INPUT = "image/jpeg,image/png";

/** Extensão → tipo esperado. É o que permite pegar o `.jpg` que é `.png`. */
const TIPO_POR_EXTENSAO: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  // `webp` continua MAPEADO de propósito: sem isto, um `.webp` cairia em
  // `formato` — "não conseguimos abrir" —, que é falso e não diz o que
  // fazer. Mapeado, ele chega ao motivo próprio, com o texto certo.
  webp: "image/webp",
};

export type MotivoDaRecusa =
  | "video"
  | "webp"
  | "grande_demais"
  | "formato"
  | "extensao_nao_bate"
  | "pequena_demais"
  | "vazio";

export interface Recusa {
  arquivo: string;
  motivo: MotivoDaRecusa;
  /** O que o DONO lê. Nunca o nome da regra. */
  texto: string;
}

/**
 * ============================================================
 * O TEXTO DA RECUSA NUNCA CULPA E NUNCA EXPLICA A REGRA.
 *
 * "Formato inválido" não diz a ela o que fazer. "Essa foto é pequena
 * demais para virar anúncio — mande a original, sem reduzir" diz.
 *
 * E nenhum deles usa a palavra "erro": ela mandou uma foto do próprio
 * negócio, e não errou nada. O arquivo é que não serve.
 * ============================================================
 */
const TEXTOS: Record<MotivoDaRecusa, string> = {
  video:
    "Por enquanto a gente só consegue usar foto — vídeo ainda não. Escolha uma imagem do seu negócio.",
  // Não diz "não aceitamos": quem não aceita é o Facebook, e a pessoa
  // não tem como saber disso. Diz o que fazer — e "salvar como JPG" é
  // coisa que o celular dela faz sozinho ao compartilhar a foto.
  webp: "Esse formato o Facebook não aceita em anúncio. Mande a mesma foto em JPG ou PNG.",
  // Diz o TETO, e não "arquivo grande demais" — sem o número a pessoa
  // não sabe o quanto reduzir, e tenta de novo no escuro. E não fala em
  // "limite do servidor": o que ela precisa saber é o que fazer.
  grande_demais: `Essa imagem é maior que ${TETO_DO_NAVEGADOR_MB} MB, que é o máximo que a gente consegue receber de uma vez. Mande em tamanho menor.`,
  formato:
    "Esse tipo de arquivo a gente não consegue abrir. Vale JPG ou PNG — que é o que sai do celular.",
  extensao_nao_bate:
    "Esse arquivo parece ter sido renomeado e a gente não consegue abrir. Tente mandar a foto original.",
  pequena_demais:
    "Essa foto é pequena demais para virar anúncio. Se você reduziu para mandar, envie a original.",
  vazio: "Esse arquivo chegou vazio. Tente escolher de novo.",
};

/** O que dá para saber SEM ler a imagem: nome, tipo e tamanho. */
export function conferirAntesDeLer(args: {
  nome: string;
  tipo: string;
  tamanhoBytes: number;
}): Recusa | null {
  const { nome, tipo, tamanhoBytes } = args;
  const recusar = (motivo: MotivoDaRecusa): Recusa => ({
    arquivo: nome,
    motivo,
    texto: TEXTOS[motivo],
  });

  if (tamanhoBytes <= 0) return recusar("vazio");


  // Vídeo primeiro, e com texto próprio: é o caso que a pessoa mais tenta,
  // e "formato não aceito" para um vídeo esconde o que ela precisa saber.
  if (tipo.startsWith("video/")) return recusar("video");

  // WEBP tem motivo próprio, antes do mapa de extensão, para o texto
  // falar do Facebook em vez de dizer que não conseguimos abrir.
  if (tipo === "image/webp" || nome.toLowerCase().endsWith(".webp")) return recusar("webp");

  // ============================================================
  // O TETO DE TAMANHO — E ELE VEM DEPOIS DO FORMATO, DE PROPÓSITO.
  //
  // Pego pelo `conferir:envio` quando estava antes: um vídeo de 50 MB
  // saía como "maior que 9 MB, mande em tamanho menor". É conselho
  // errado — reduzir o vídeo não resolve nada, porque vídeo não entra
  // em tamanho nenhum. O mesmo vale para WEBP.
  //
  // A ordem é a da utilidade do recado: primeiro o que a pessoa não
  // pode consertar reduzindo (vídeo, WEBP), depois o que ela pode.
  //
  // Isto existe porque o Next recusa o corpo da Server Action acima do
  // `bodySizeLimit`, e a recusa DELE acontece no framework: a promessa
  // rejeita e não há `{ok:false}` para a tela mostrar. Foi a causa do
  // defeito de 12/09. Aqui é o único lugar onde a recusa custa zero —
  // a pessoa ainda está com a foto na mão e não gastou 4G nenhum.
  // ============================================================
  if (tamanhoBytes > TETO_DO_NAVEGADOR_BYTES) return recusar("grande_demais");

  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  const esperado = TIPO_POR_EXTENSAO[ext];

  if (!esperado) return recusar("formato");
  if (!tipo.startsWith("image/")) return recusar("formato");

  // ============================================================
  // A EXTENSÃO TEM QUE BATER COM O CONTEÚDO.
  //
  // `foto.jpg` que na verdade é PNG acontece muito — o celular renomeia,
  // o WhatsApp reconverte, o cliente troca a extensão para "funcionar".
  // O backend confere isso e recusa; conferir aqui evita o upload inteiro.
  //
  // O `type` do `File` vem do sistema, não do nome, então ele é a
  // testemunha melhor. Quando os dois discordam, o arquivo não serve.
  // ============================================================
  if (tipo !== esperado) return recusar("extensao_nao_bate");

  return null;
}

/** O que só dá para saber depois de ler as dimensões. */
export function conferirDimensoes(args: {
  nome: string;
  largura: number;
  altura: number;
}): Recusa | null {
  const menor = Math.min(args.largura, args.altura);
  if (menor < LADO_MINIMO_PX) {
    return { arquivo: args.nome, motivo: "pequena_demais", texto: TEXTOS.pequena_demais };
  }
  return null;
}

/**
 * As dimensões, no navegador.
 *
 * `createImageBitmap` em vez de `new Image()` + `onload`: não precisa de
 * DOM, não vaza objeto de URL, e devolve promessa em vez de callback.
 * Falha em ler é recusa por formato — se o navegador não abre, o backend
 * também não vai.
 */
export async function dimensoesDaImagem(
  arquivo: Blob,
): Promise<{ largura: number; altura: number } | null> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const medida = { largura: bitmap.width, altura: bitmap.height };
    bitmap.close();
    return medida;
  } catch {
    return null;
  }
}

/**
 * A conferência inteira de um arquivo, no navegador.
 *
 * Devolve `null` quando passa. A ordem importa: o que é barato de saber
 * vem antes, para o caso comum (vídeo, formato errado) nem chegar a ler a
 * imagem.
 */
export async function conferirArquivo(arquivo: File): Promise<Recusa | null> {
  const antes = conferirAntesDeLer({
    nome: arquivo.name,
    tipo: arquivo.type,
    tamanhoBytes: arquivo.size,
  });
  if (antes) return antes;

  const medida = await dimensoesDaImagem(arquivo);
  if (!medida) {
    return { arquivo: arquivo.name, motivo: "formato", texto: TEXTOS.formato };
  }
  return conferirDimensoes({ nome: arquivo.name, ...medida });
}

/**
 * ============================================================
 * O QUE O DONO LÊ QUANDO O BACKEND RECUSA — E O QUE ELE NUNCA LÊ.
 *
 * A resposta do upload de criativo pronto traz dois campos:
 *
 *   motivo             para o DONO, em português
 *   achados_tecnicos   para o GESTOR, com regra e gravidade
 *
 * **A tela mostra só o primeiro.** O segundo nunca aparece para o
 * cliente: ele acabou de subir a foto da própria clínica, e ler "regra
 * COMPLIANCE_VISUAL_03, gravidade alta" sobre ela é uma experiência de
 * ser auditado, não de ser atendido.
 *
 * Esta função é a única porta pela qual a recusa do backend vira texto de
 * tela — e ela não tem acesso ao outro campo de propósito.
 * ============================================================
 */
export function textoDaRecusaDoBackend(motivo: string | null | undefined): string {
  const limpo = (motivo ?? "").trim();
  if (limpo) return limpo;
  // Sem motivo legível, não se inventa um: diz que não deu e oferece o
  // caminho humano, que é o que sobra quando a máquina não explicou.
  return "Não conseguimos usar essa imagem, e não consegui te dizer o porquê. Fale com a gente que a gente resolve.";
}
