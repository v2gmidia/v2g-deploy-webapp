import { NextResponse } from "next/server";

/**
 * A TRANSCRIÇÃO DO ÁUDIO DO ONBOARDING — bancada, e só ela.
 *
 * ============================================================
 * MESMO TRINCO DA BANCADA: em produção esta rota é 404.
 *
 * `process.env.NODE_ENV !== "production"` é trocado pelo literal no
 * build, então o corpo inteiro morre no pacote de produção junto com a
 * `/exemplo/[tela]`. Nenhuma tela do app chama este caminho.
 * ============================================================
 *
 * ============================================================
 * OPENAI, E NÃO ANTHROPIC — pedido do briefing, e ele tem razão técnica:
 * a Anthropic não tem rota de transcrição de áudio. A chave é a
 * `OPENAI_API_KEY`, que NÃO existe no `.env.example` deste repositório
 * (medido em 20/09/2026) — ver DUVIDAS.md, DUVIDA-ONB-1.
 *
 * SEM A CHAVE, NADA QUEBRA. A rota responde 501 com o motivo escrito, o
 * microfone da tela já nasce desabilitado com esse mesmo motivo do lado,
 * e o teclado continua funcionando. A regra é a do produto: o que não tem
 * fonte não some da tela sem explicação, e não derruba o resto.
 * ============================================================
 *
 * O ÁUDIO ORIGINAL NÃO É GRAVADO AQUI. Ele volta para o cliente junto da
 * transcrição e fica com ele (na bancada, em memória; em produção, no
 * bucket que a DUVIDA-ONB-3 descreve). Esta rota não escreve em lugar
 * nenhum — nem banco, nem disco.
 */

/** O modelo de transcrição da OpenAI. Um lugar só. */
const MODELO = "gpt-4o-mini-transcribe";

/** Teto do arquivo que a rota aceita: 20 MB, o mesmo da API da OpenAI. */
const TETO_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    // 404 seco, sem corpo: é o que uma rota inexistente responde, e é o que
    // esta rota é em produção. Corpo nenhum também quer dizer que não há
    // texto meu a caminho de tela nenhuma.
    return new NextResponse(null, { status: 404 });
  }

  const chave = process.env.OPENAI_API_KEY;
  if (!chave) {
    return NextResponse.json(
      {
        motivo:
          "A transcrição por áudio ainda não está ligada aqui. Pode escrever pelo teclado.",
      },
      { status: 501 },
    );
  }

  const formulario = await request.formData().catch(() => null);
  const audio = formulario?.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { motivo: "Não chegou áudio nenhum. Tenta gravar de novo?" },
      { status: 400 },
    );
  }
  if (audio.size > TETO_BYTES) {
    return NextResponse.json(
      { motivo: "Esse áudio ficou longo demais. Grava um trecho menor?" },
      { status: 413 },
    );
  }

  const corpo = new FormData();
  corpo.set("file", audio, audio.name || "audio.webm");
  corpo.set("model", MODELO);
  // O idioma é declarado: sem ele, um "alô" curto às vezes volta em outra
  // língua, e o cliente vê a própria frase em espanhol.
  corpo.set("language", "pt");

  try {
    const resposta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}` },
      body: corpo,
      signal: AbortSignal.timeout(60_000),
    });

    if (!resposta.ok) {
      // O corpo da recusa vai para o LOG, não para a tela: ele vem em
      // inglês e com nome de campo da OpenAI dentro.
      const texto = await resposta.text().catch(() => "");
      console.error(
        "[onboarding:transcrever] OpenAI recusou ::",
        resposta.status,
        texto.slice(0, 300),
      );
      return NextResponse.json(
        { motivo: "Não consegui entender esse áudio agora. Pode escrever pelo teclado." },
        { status: 502 },
      );
    }

    const dados = (await resposta.json()) as { text?: unknown };
    const texto = typeof dados.text === "string" ? dados.text.trim() : "";
    if (!texto) {
      return NextResponse.json(
        { motivo: "O áudio veio sem fala. Tenta de novo, ou escreve pelo teclado." },
        { status: 422 },
      );
    }

    return NextResponse.json({ texto });
  } catch (erro) {
    console.error(
      "[onboarding:transcrever] falha na chamada ::",
      erro instanceof Error ? erro.name : "desconhecida",
    );
    return NextResponse.json(
      { motivo: "Não consegui falar com a transcrição agora. Pode escrever pelo teclado." },
      { status: 503 },
    );
  }
}
