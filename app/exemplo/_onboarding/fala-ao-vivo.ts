/**
 * A FALA APARECENDO ENQUANTO A PESSOA FALA — Web Speech do navegador.
 *
 * ============================================================
 * POR QUE DUAS TRANSCRIÇÕES, E NÃO UMA.
 *
 * A Web Speech é do NAVEGADOR: não custa nada, responde palavra por
 * palavra, e erra mais. A OpenAI custa por minuto, só responde depois que
 * a pessoa terminou de falar, e erra menos.
 *
 * O briefing de 21/09 pede as duas, nessa ordem: a do navegador enquanto
 * fala, para a tela não ficar muda; a da OpenAI ao terminar, UMA vez, e o
 * texto dela substitui o do navegador porque é mais preciso.
 *
 * O ganho não é só de velocidade. Quando a OpenAI falha — sem chave, 429,
 * rede cortada —, o texto do navegador CONTINUA na tela. Antes disso, uma
 * falha custava tudo o que a pessoa tinha falado.
 * ============================================================
 *
 * ============================================================
 * ISTO NÃO É VOZ DE IA. A decisão de 20/09 (`docs/decisoes.md`) proíbe
 * SÍNTESE — a máquina falando com o cliente. `SpeechRecognition` é o
 * contrário: é o cliente falando com a máquina. O que continua proibido,
 * e continua ausente do repositório, é `speechSynthesis`.
 * ============================================================
 *
 * ============================================================
 * QUEM NÃO TEM. O Firefox não implementa `SpeechRecognition` (nem o
 * prefixado). O Safari e o Chrome têm. Sem ela, `ouvinteDeFala()` devolve
 * `null` e a tela cai no comportamento da v2: grava, espera, e o texto
 * aparece de uma vez quando a OpenAI responde. Nada quebra, e o teclado
 * nunca dependeu disso.
 * ============================================================
 */

/** O que a tela precisa saber a cada pedaço reconhecido. */
export interface Trecho {
  /** o que o navegador já deu por fechado — não muda mais */
  fechado: string;
  /** o que ele ainda está ouvindo — muda a cada palavra */
  provisorio: string;
}

/** O mínimo da API que a gente usa. O TypeScript não a declara. */
interface ResultadoDeFala {
  readonly isFinal: boolean;
  readonly length: number;
  item(i: number): { transcript: string };
  [i: number]: { transcript: string };
}

interface EventoDeFala {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    item(i: number): ResultadoDeFala;
    [i: number]: ResultadoDeFala;
  };
}

interface Reconhecedor {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: EventoDeFala) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type FabricaDeReconhecedor = new () => Reconhecedor;

function fabrica(): FabricaDeReconhecedor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: FabricaDeReconhecedor;
    webkitSpeechRecognition?: FabricaDeReconhecedor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** O navegador desta pessoa escuta? */
export function temFalaAoVivo(): boolean {
  return fabrica() !== null;
}

export interface Ouvinte {
  parar(): void;
}

/**
 * Começa a escutar. Devolve `null` quando o navegador não sabe.
 *
 * `aoOuvir` é chamado a cada pedaço, com o fechado e o provisório
 * separados: a tela mostra os dois com pesos diferentes, porque
 * provisório que parece decidido é pior do que não mostrar nada.
 */
export function ouvinteDeFala(
  aoOuvir: (t: Trecho) => void,
  aoFalhar?: (motivo: string) => void,
): Ouvinte | null {
  const Fabrica = fabrica();
  if (!Fabrica) return null;

  const rec = new Fabrica();
  rec.lang = "pt-BR";
  // `continuous` porque a resposta é uma frase inteira, não um comando —
  // sem isso o reconhecedor fecha sozinho na primeira pausa.
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let fechado = "";
  let parado = false;

  rec.onresult = (e) => {
    let provisorio = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (!r) continue;
      const texto = r[0]?.transcript ?? "";
      if (r.isFinal) fechado += texto;
      else provisorio += texto;
    }
    aoOuvir({ fechado: fechado.trim(), provisorio: provisorio.trim() });
  };

  rec.onerror = (e) => {
    // `no-speech` e `aborted` são o curso normal das coisas: a pessoa
    // ficou quieta, ou parou de gravar. Não são falha e não viram recado.
    if (e.error === "no-speech" || e.error === "aborted") return;
    aoFalhar?.(e.error);
  };

  // O reconhecedor fecha sozinho depois de um silêncio longo. Enquanto a
  // pessoa não apertou "parar", a gente reabre — senão a fala dela some no
  // meio de uma pausa para pensar.
  rec.onend = () => {
    if (parado) return;
    try {
      rec.start();
    } catch {
      // já reiniciou por conta própria; não há o que fazer nem o que dizer
    }
  };

  try {
    rec.start();
  } catch {
    return null;
  }

  return {
    parar() {
      parado = true;
      try {
        rec.stop();
      } catch {
        // já estava parado
      }
    },
  };
}
