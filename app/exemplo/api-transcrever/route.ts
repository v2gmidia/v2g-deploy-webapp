import { NextResponse } from "next/server";
import { RECADOS, STATUS_DA_ROTA } from "../_onboarding/recados";

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
      { motivo: RECADOS.sem_chave },
      { status: STATUS_DA_ROTA.sem_chave },
    );
  }

  const formulario = await request.formData().catch(() => null);
  const audio = formulario?.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { motivo: RECADOS.sem_audio },
      { status: STATUS_DA_ROTA.sem_audio },
    );
  }
  if (audio.size > TETO_BYTES) {
    return NextResponse.json(
      { motivo: RECADOS.longo },
      { status: STATUS_DA_ROTA.longo },
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
      // ============================================================
      // CADA FALHA COM O SEU RECADO, e nenhum deles culpa quem falou.
      //
      // Um recado genérico faz a pessoa tentar de novo na hora em todos os
      // casos — e em 429 tentar de novo na hora é exatamente o que piora.
      // O que muda é O QUE FAZER, não o tom.
      // ============================================================
      const caso =
        resposta.status === 429
          ? "limite"
          : resposta.status === 401 || resposta.status === 403 || resposta.status >= 500
            ? "fora_do_ar"
            : "recusado";
      return NextResponse.json({ motivo: RECADOS[caso] }, { status: STATUS_DA_ROTA[caso] });
    }

    const dados = (await resposta.json()) as { text?: unknown };
    const texto = typeof dados.text === "string" ? dados.text.trim() : "";
    if (!texto) {
      return NextResponse.json(
        { motivo: RECADOS.mudo },
        { status: STATUS_DA_ROTA.mudo },
      );
    }

    return NextResponse.json({ texto });
  } catch (erro) {
    console.error(
      "[onboarding:transcrever] falha na chamada ::",
      erro instanceof Error ? erro.name : "desconhecida",
    );
    return NextResponse.json(
      { motivo: RECADOS.rede },
      { status: STATUS_DA_ROTA.rede },
    );
  }
}
