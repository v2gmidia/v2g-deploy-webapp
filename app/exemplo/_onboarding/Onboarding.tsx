"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONVITE_ABAIXO_DO_CAMPO,
  CONVITE_NO_MICROFONE,
  NICHOS_DA_BANCADA,
  PASSOS,
  RAIOS,
  TOTAL,
  ondeParou,
  type Passo,
} from "./perguntas";
import { custoDoNicho, frasesDoSlider } from "./custo-por-contato";
import {
  mascararCep,
  mascararWhatsapp,
  validarCep,
  validarDescricao,
  validarEmpresa,
  validarInstagram,
  validarNome,
  validarSite,
  validarWhatsapp,
  type Veredito,
} from "./validacoes";
import { escritasDe, FORA_DE_COLUNA } from "./destino";
import { RECADOS, TEM_AUDIO_GUARDADO, type CasoDeFalha } from "./recados";
import css from "./Onboarding.module.css";

/**
 * O ONBOARDING NOVO — onze perguntas, uma por tela. BANCADA.
 *
 * ============================================================
 * ISTO NÃO É O ONBOARDING DO AR. O que está em produção continua sendo
 * `app/(fluxo)/onboarding/`, com cinco perguntas, e nada dele foi tocado.
 * Esta superfície vive em `/exemplo/onboarding`, que é 404 no build.
 * ============================================================
 *
 * ============================================================
 * O QUE GRAVA, E ONDE. Na bancada, cada resposta vai para o
 * `localStorage` no instante em que é aceita — é o "dá para sair e
 * voltar" do briefing, sem tocar no banco (que esta rodada proíbe).
 *
 * Em produção o destino é outro: `confirmar_campo_do_cliente`, a mesma
 * porta que a `/meu-negocio` usa, que grava valor e procedência na mesma
 * transação. A troca é de uma função — `gravar()`, abaixo. Ver DUVIDAS.
 * ============================================================
 *
 * O TECLADO É A VIA PRINCIPAL. O áudio é alternativa, nunca obrigação:
 * sem chave de transcrição o microfone nasce desabilitado com o motivo
 * escrito ao lado, e a tela inteira continua funcionando.
 *
 * ============================================================
 * SÓ ENTRADA. NUNCA SAÍDA. — decisão do Victor, 20/09/2026.
 *
 * O áudio anda numa direção só: o cliente fala, a máquina transcreve. Não
 * existe voz de IA neste fluxo — nada de `speechSynthesis`, nada de
 * `/audio/speech`, nada de conversa falada. A PERGUNTA é texto na tela, e
 * continua sendo texto na tela.
 *
 * O único `<audio>` desta superfície toca a gravação DO PRÓPRIO CLIENTE,
 * para ele conferir o que disse antes de aceitar a transcrição. Isso é o
 * áudio dele voltando, não a nossa voz falando com ele.
 * ============================================================
 */

const CHAVE_LOCAL = "v2g:onboarding-v2:bancada";
const WHATSAPP_HUMANO = "https://wa.me/5521936182176";
const PISO_MENSAL = 750;
/**
 * Teto de uma gravação só: dois minutos.
 *
 * Não é limite da OpenAI (o dela é de tamanho, 20 MB). É para ninguém
 * falar oito minutos e descobrir o limite depois — e porque uma resposta
 * de dois minutos já é mais do que qualquer uma destas perguntas pede.
 */
const TETO_DE_GRAVACAO_MS = 2 * 60 * 1000;

type Respostas = Record<string, string>;

/**
 * A chave reservada que lista quais perguntas foram respondidas FALANDO.
 *
 * Começa com dois sublinhados para nunca colidir com o id de uma pergunta,
 * e o mapa de `destino.ts` a ignora porque ela não está lá — resposta que
 * não é pergunta não vira escrita.
 */
const CHAVE_AUDIO = "__respondidas_falando";

function lerMarcasDeAudio(respostas: Respostas): string[] {
  const bruto = respostas[CHAVE_AUDIO];
  return bruto ? bruto.split(",").filter(Boolean) : [];
}

/** Uma resposta ditada: o que a transcrição entendeu e o áudio original. */
interface Ditado {
  texto: string;
  audio: Blob;
  url: string;
}

/** Dado de exemplo, para as capturas dos passos do meio e do resumo. */
const EXEMPLO: Respostas = {
  pessoa: "Marina",
  empresa: "Bebidas do Porto",
  local: "18040-000",
  local_raio: "10",
  descricao: "Distribuidora de bebidas geladas com entrega no mesmo dia.",
  instagram: "@bebidasdoporto",
  site: "https://bebidasdoporto.com.br",
  nicho: "distribuidora-de-bebidas",
  whatsapp: "(15) 99876-5432",
  verba: "1200",
  material: "3",
  // Duas respondidas falando, para a marca do resumo aparecer na captura.
  [CHAVE_AUDIO]: "descricao,empresa",
};

export function Onboarding({
  passoInicial = 0,
  transcricaoLigada,
  motivoSemTranscricao,
  comExemplo = false,
  nichoDeExemplo = null,
  mostrarDestino = false,
  falhaDeExemplo = null,
}: {
  passoInicial?: number;
  /** a `OPENAI_API_KEY` existe neste ambiente? Decidido no servidor. */
  transcricaoLigada: boolean;
  motivoSemTranscricao: string;
  /** preenche as respostas anteriores — só para capturar tela */
  comExemplo?: boolean;
  /** troca o tipo de negócio do dado de exemplo — só para capturar tela */
  nichoDeExemplo?: string | null;
  /**
   * `?destino=1` mostra ONDE cada resposta vai cair em produção. É painel
   * de bancada, não tela de cliente: nenhum dono de padaria precisa saber
   * o nome de uma coluna.
   */
  mostrarDestino?: boolean;
  /**
   * `?falha=<caso>` desenha a tela como ela fica quando a transcrição não
   * vem. É para CAPTURAR: nenhuma chamada é feita, nenhum erro é
   * provocado do lado de lá, e a frase sai do mesmo `recados.ts` que a
   * rota devolve — então a captura não pode divergir da tela real.
   */
  falhaDeExemplo?: CasoDeFalha | null;
}) {
  const [passo, setPasso] = useState(passoInicial);
  const [respostas, setRespostas] = useState<Respostas>(
    comExemplo ? { ...EXEMPLO, ...(nichoDeExemplo ? { nicho: nichoDeExemplo } : {}) } : {},
  );
  const [rascunho, setRascunho] = useState("");
  const [recado, setRecado] = useState<string | null>(null);
  const [ditado, setDitado] = useState<Ditado | null>(null);
  /**
   * O ÁUDIO GRAVADO, INDEPENDENTE DA TRANSCRIÇÃO.
   *
   * Ele entra aqui no instante em que a gravação PARA, antes de qualquer
   * chamada. Se a transcrição falhar — sem chave, 429, 500, áudio mudo —
   * o áudio continua na tela, com tocador, e o cliente não perde o que
   * acabou de falar. Era o defeito: o blob morria dentro da função.
   */
  const [audioGuardado, setAudioGuardado] = useState<{ url: string; quando: number } | null>(null);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [entrando, setEntrando] = useState(true);

  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const tetoDeTempo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const atual: Passo | null = passo < TOTAL ? PASSOS[passo]! : null;
  const fim = atual === null;

  // ---- recuperar o que já foi respondido antes -------------------------
  useEffect(() => {
    if (comExemplo) return;
    try {
      const bruto = window.localStorage.getItem(CHAVE_LOCAL);
      if (!bruto) return;
      const guardadas = JSON.parse(bruto) as Respostas;
      setRespostas(guardadas);
      // ============================================================
      // RETOMAR DE ONDE PAROU, e não do começo.
      //
      // Guardar as respostas e ainda assim abrir na pergunta 1 é pedir
      // para a pessoa passar de novo por tudo que ela já respondeu. O
      // ponto de retomada é a PRIMEIRA pergunta sem resposta — não a
      // última respondida, que daria uma pergunta a menos quando ela
      // tivesse voltado para corrigir alguma coisa no meio.
      //
      // `passoInicial` explícito na URL vence: ele existe para capturar
      // tela, e captura não retoma nada.
      // ============================================================
      if (passoInicial === 0) setPasso(ondeParou(guardadas));
    } catch {
      // localStorage bloqueado (janela anônima, cookie desligado): a tela
      // funciona igual, só não lembra quando ele voltar.
    }
  }, [comExemplo, passoInicial]);

  /** Grava a resposta no instante em que ela é aceita. */
  const gravar = useCallback((proximas: Respostas) => {
    setRespostas(proximas);
    try {
      window.localStorage.setItem(CHAVE_LOCAL, JSON.stringify(proximas));
    } catch {
      // ver acima: não lembrar é pior que quebrar, e não quebra.
    }
  }, []);

  // ---- a transição entre perguntas -------------------------------------
  useEffect(() => {
    setEntrando(true);
    const t = setTimeout(() => setEntrando(false), 30);
    return () => clearTimeout(t);
  }, [passo]);

  useEffect(() => {
    // No fim não há passo, e o campo da tela é o da correção do resumo.
    setRascunho(atual ? (respostas[atual.id] ?? "") : (respostas.correcao ?? ""));
    setRecado(null);
    setDitado(null);
    setAudioGuardado((velho) => {
      // `createObjectURL` segura o blob na memória até alguém revogar.
      if (velho) URL.revokeObjectURL(velho.url);
      return null;
    });
    // Foco no campo a cada pergunta nova: quem responde de teclado não
    // deveria ter que clicar antes de digitar.
    const t = setTimeout(() => campo.current?.focus(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  /**
   * A FALHA DE EXEMPLO, para capturar. Não chama nada e não provoca nada:
   * põe na tela o recado que a rota devolveria e, nos casos em que o
   * cliente já tinha gravado, um áudio de um segundo de silêncio gerado
   * aqui — um WAV montado em memória, que é o menor jeito de ter um
   * tocador de verdade sem um arquivo no repositório.
   */
  useEffect(() => {
    if (!falhaDeExemplo) return;
    setRecado(RECADOS[falhaDeExemplo]);
    if (!TEM_AUDIO_GUARDADO[falhaDeExemplo]) return;
    const url = URL.createObjectURL(wavDeSilencio(1));
    setAudioGuardado({ url, quando: Date.now() });
    return () => URL.revokeObjectURL(url);
  }, [falhaDeExemplo, passo]);

  const custo = useMemo(() => custoDoNicho(respostas.nicho ?? null), [respostas.nicho]);
  const falando = useMemo(() => lerMarcasDeAudio(respostas), [respostas]);

  // ---- validação por passo ---------------------------------------------
  function validar(p: Passo, valor: string): Veredito {
    switch (p.id) {
      case "pessoa":
        return validarNome(valor);
      case "empresa":
        return validarEmpresa(valor);
      case "local":
        return validarCep(valor);
      case "descricao":
        return validarDescricao(valor);
      case "instagram":
        return validarInstagram(valor);
      case "site":
        return validarSite(valor);
      case "whatsapp":
        return validarWhatsapp(valor);
      default:
        return { ok: true, valor };
    }
  }

  function avancar(valor: string, extras?: Respostas) {
    if (!atual) return;
    const veredito = validar(atual, valor);
    if (!veredito.ok) {
      setRecado(veredito.recado);
      return;
    }
    // ============================================================
    // DE ONDE VEIO A RESPOSTA fica guardado junto dela.
    //
    // O briefing manda o resumo mostrar "inclusive o que veio de áudio".
    // A marca vive numa chave reservada em vez de num estado à parte
    // porque ela precisa sobreviver a fechar o navegador — se sobrevivesse
    // só a resposta, quem voltasse veria o resumo sem saber o que tinha
    // ditado.
    //
    // `ditado` não-nulo quer dizer que o rascunho saiu de uma transcrição
    // NESTA pergunta. Se a pessoa reescreveu tudo por cima, a marca
    // continua — e continua certa: a origem foi o áudio.
    // ============================================================
    const marcados = new Set(lerMarcasDeAudio(respostas));
    if (ditado) marcados.add(atual.id);
    else marcados.delete(atual.id);
    gravar({
      ...respostas,
      ...extras,
      [atual.id]: veredito.valor,
      [CHAVE_AUDIO]: [...marcados].join(","),
    });
    setPasso((p) => p + 1);
  }

  function voltar() {
    setPasso((p) => Math.max(0, p - 1));
  }

  /** Vai direto para uma pergunta, pelo id. É o "mudar" do resumo. */
  function irPara(id: string) {
    const i = PASSOS.findIndex((p) => p.id === id);
    if (i >= 0) setPasso(i);
  }

  /**
   * A CORREÇÃO DO RESUMO — a segunda pergunta aberta do fluxo.
   *
   * Ela não valida nada: é o cliente dizendo, com as palavras dele, o que
   * a gente entendeu errado. Não existe recusa possível aqui.
   */
  function guardarCorrecao() {
    const texto = rascunho.trim();
    gravar({ ...respostas, correcao: texto });
    setDitado(null);
    setRecado(texto ? "Anotado. Eu levo isso para a conversa." : null);
  }

  // ---- áudio ------------------------------------------------------------
  async function comecarAGravar() {
    setRecado(null);
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(fluxo);
      pedacos.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) pedacos.current.push(e.data);
      };
      rec.onstop = async () => {
        fluxo.getTracks().forEach((t) => t.stop());
        if (tetoDeTempo.current) {
          clearTimeout(tetoDeTempo.current);
          tetoDeTempo.current = null;
        }
        const audio = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        // GUARDA ANTES DE TENTAR. Se a transcrição falhar, o áudio fica.
        setAudioGuardado({ url: URL.createObjectURL(audio), quando: Date.now() });
        await transcrever(audio);
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
      // Teto de tempo no NAVEGADOR: sem ele, alguém fala oito minutos e só
      // descobre o limite quando o arquivo é recusado do outro lado. Aqui
      // a gravação para sozinha e o que foi dito até ali é transcrito.
      tetoDeTempo.current = setTimeout(() => {
        if (gravador.current) {
          pararDeGravar();
          setRecado(RECADOS.teto_de_tempo);
        }
      }, TETO_DE_GRAVACAO_MS);
    } catch {
      // Microfone negado no navegador, ou aparelho sem microfone. Não há
      // áudio para perder, e o teclado continua inteiro.
      setRecado(RECADOS.sem_permissao);
    }
  }

  function pararDeGravar() {
    gravador.current?.stop();
    gravador.current = null;
    setGravando(false);
  }

  /**
   * MOSTRA ANTES DE ACEITAR. A transcrição nunca vira resposta sozinha:
   * ela vira rascunho, o cliente lê, corrige se quiser, e só então
   * confirma. O áudio original fica ao lado, para ele ouvir de novo.
   */
  async function transcrever(audio: Blob) {
    setTranscrevendo(true);
    try {
      const corpo = new FormData();
      corpo.set("audio", new File([audio], "resposta.webm", { type: audio.type }));
      const resposta = await fetch("/exemplo/api-transcrever", { method: "POST", body: corpo });
      const dados = (await resposta.json().catch(() => ({}))) as {
        texto?: string;
        motivo?: string;
      };
      if (!resposta.ok || !dados.texto) {
        // O `motivo` vem da rota, escrito para o dono. Sem ele — resposta
        // que nem JSON é, 500 de proxy, rede cortada — entra o nosso.
        setRecado(dados.motivo ?? RECADOS.recusado);
        // E NÃO limpa `audioGuardado`: o áudio continua na tela.
        return;
      }
      setDitado({ texto: dados.texto, audio, url: URL.createObjectURL(audio) });
      setRascunho(dados.texto);
    } finally {
      setTranscrevendo(false);
    }
  }

  // ---- as peças da tela -------------------------------------------------

  const progresso = fim ? 100 : Math.round((passo / TOTAL) * 100);

  function Cabecalho() {
    return (
      <header className={css.topo}>
        <div className={css.barra} aria-hidden="true">
          <span className={css.barraCheia} style={{ transform: `scaleX(${progresso / 100})` }} />
        </div>
        <div className={css.topoLinha}>
          <span className={css.contador}>
            {fim ? "Tudo respondido" : `Pergunta ${atual!.ordem} de ${TOTAL}`}
          </span>
          <a className={css.humano} href={WHATSAPP_HUMANO} target="_blank" rel="noopener">
            Falar com uma pessoa
          </a>
        </div>
      </header>
    );
  }

  /**
   * O MICROFONE.
   *
   * `aberta` é a pergunta em que vale a pena falar: o botão fica mais
   * convidativo que o teclado — borda de cobalto, tinta de cobalto, altura
   * de botão principal — e ganha a frase que diz COMO falar.
   *
   * O TECLADO NÃO ENCOLHE NEM SOME. O campo continua acima, do mesmo
   * tamanho, e continua recebendo o foco quando a pergunta abre. Quem quer
   * digitar já está digitando.
   *
   * SEM CHAVE, `aberta` NÃO MUDA NADA: convidar para falar num microfone
   * desabilitado seria oferecer o que não existe. O que aparece é o motivo.
   */
  function Microfone({ aberta = false }: { aberta?: boolean }) {
    if (!transcricaoLigada) {
      return (
        <div className={css.microLinha}>
          <button type="button" className={css.micro} disabled aria-describedby="motivo-micro">
            <span aria-hidden="true">🎙</span> Responder falando
          </button>
          <span className={css.microMotivo} id="motivo-micro">
            {motivoSemTranscricao}
          </span>
        </div>
      );
    }
    return (
      <div className={css.microLinha}>
        <button
          type="button"
          className={[css.micro, aberta ? css.microConvite : "", gravando ? css.microAtivo : ""]
            .filter(Boolean)
            .join(" ")}
          onClick={gravando ? pararDeGravar : comecarAGravar}
          disabled={transcrevendo}
        >
          <span aria-hidden="true">🎙</span>{" "}
          {gravando ? "Parar de gravar" : transcrevendo ? "Transcrevendo…" : "Responder falando"}
        </button>
        <span className={aberta ? css.microConvida : css.microMotivo}>
          {gravando
            ? "Estou ouvindo. Toque para parar."
            : aberta
              ? CONVITE_NO_MICROFONE
              : "Ou escreva pelo teclado."}
        </span>
      </div>
    );
  }

  /**
   * O CONVITE, abaixo do campo. Só nas perguntas abertas, e só quando o
   * microfone funciona de verdade.
   */
  function Convite({ aberta = false }: { aberta?: boolean }) {
    if (!aberta || !transcricaoLigada) return null;
    return <p className={css.convite}>{CONVITE_ABAIXO_DO_CAMPO}</p>;
  }

  /**
   * O ÁUDIO QUE FICOU, quando a transcrição não veio.
   *
   * Aparece só quando há áudio e NÃO há transcrição — se houver as duas, o
   * `Ditado` abaixo já mostra o tocador junto do texto. É o que cumpre
   * "nunca perca o áudio já gravado": a falha custa a transcrição, não o
   * que a pessoa falou.
   */
  function AudioSemTexto() {
    if (!audioGuardado || ditado) return null;
    return (
      <div className={css.ditado}>
        <p className={css.ditadoTitulo}>Seu áudio está aqui</p>
        <audio className={css.ditadoAudio} controls src={audioGuardado.url} />
        <p className={css.ditadoNota}>
          Não consegui transformar em texto desta vez, mas o que você falou não se perdeu. Dá
          para ouvir de novo e escrever pelo teclado, ou tentar gravar outra vez.
        </p>
      </div>
    );
  }

  function Ditado() {
    if (!ditado) return null;
    return (
      <div className={css.ditado}>
        <p className={css.ditadoTitulo}>Foi isso que eu entendi:</p>
        <p className={css.ditadoTexto}>{rascunho}</p>
        <audio className={css.ditadoAudio} controls src={ditado.url} />
        <p className={css.ditadoNota}>
          Dá para corrigir no campo acima antes de seguir. Seu áudio fica guardado do lado do
          que você escreveu.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- render

  if (fim) {
    return (
      <div className={css.tela}>
        <Cabecalho />
        <section className={`${css.palco} ${entrando ? css.entrando : ""}`}>
          <h1 className={css.titulo}>Pronto, {respostas.pessoa ?? "tudo certo"}.</h1>
          <p className={css.ajuda}>
            É isto que a gente vai usar para montar seu anúncio. Dá para mudar qualquer coisa
            depois.
          </p>

          <dl className={css.resumo}>
            {LINHAS_DO_RESUMO.map((l) => (
              <Linha
                key={l.id}
                rotulo={l.rotulo}
                valor={l.valor(respostas)}
                aoMudar={() => irPara(l.id)}
                porAudio={falando.includes(l.id)}
              />
            ))}
          </dl>

          {/* ---------- a correção: a segunda pergunta ABERTA ---------- */}
          <h2 className={css.subtitulo}>Tem alguma coisa errada aí?</h2>
          <p className={css.ajuda}>
            Me conta o que eu entendi torto, com suas palavras. A gente arruma antes de montar
            o anúncio.
          </p>

          <div className={css.forma}>
            <textarea
              ref={(el) => {
                campo.current = el;
              }}
              className={css.campoLongo}
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              placeholder="Ex: eu não entrego no mesmo dia, só no dia seguinte"
              aria-label="O que está errado no resumo"
              rows={3}
            />

            <Convite aberta />
            <Microfone aberta />
            <Ditado />
            <AudioSemTexto />
            {recado && <p className={css.recadoCalmo}>{recado}</p>}

            <div className={css.acoes}>
              <button type="button" className={`cta ghost ${css.botao}`} onClick={guardarCorrecao}>
                Guardar a correção
              </button>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar e revisar as respostas
              </button>
            </div>
          </div>

          <p className={css.ajuda}>
            O próximo passo é meia hora com a gente para conferir tudo isso antes de o dinheiro
            começar a rodar.
          </p>
          <a
            className={`cta ${css.botao}`}
            href={`${WHATSAPP_HUMANO}?text=${encodeURIComponent(mensagemDoAgendamento(respostas))}`}
            target="_blank"
            rel="noopener"
          >
            Agendar os 30 minutos
          </a>

          {mostrarDestino && <Destino respostas={respostas} />}
        </section>
      </div>
    );
  }

  const p = atual!;

  return (
    <div className={css.tela}>
      <Cabecalho />

      <section className={`${css.palco} ${entrando ? css.entrando : ""}`} key={p.id}>
        <h1 className={css.titulo}>{p.titulo}</h1>
        {p.ajuda && <p className={css.ajuda}>{p.ajuda}</p>}

        {/* ---------- texto, com áudio ou teclado ---------- */}
        {(p.tipo === "texto" || p.tipo === "site") && (
          <form
            className={css.forma}
            onSubmit={(e) => {
              e.preventDefault();
              avancar(rascunho);
            }}
          >
            {p.id === "descricao" ? (
              <textarea
                ref={(el) => {
                  campo.current = el;
                }}
                className={css.campoLongo}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                placeholder={p.placeholder}
                aria-label={p.rotulo}
                rows={3}
                onKeyDown={(e) => {
                  // Enter avança; Shift+Enter continua quebrando linha.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    avancar(rascunho);
                  }
                }}
              />
            ) : (
              <input
                ref={(el) => {
                  campo.current = el;
                }}
                className={css.campo}
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                placeholder={p.placeholder}
                aria-label={p.rotulo}
                inputMode={p.id === "site" || p.id === "instagram" ? "url" : "text"}
                autoComplete="off"
              />
            )}

            <Convite aberta={p.aberta} />
            {p.audio && <Microfone aberta={p.aberta} />}
            <Ditado />
            <AudioSemTexto />
            {recado && <p className={css.recado}>{recado}</p>}

            <div className={css.acoes}>
              <button type="submit" className={`cta ${css.botao}`}>
                Continuar
              </button>
              {p.tipo === "site" && (
                <button
                  type="button"
                  className={`cta ghost ${css.botao}`}
                  onClick={() => {
                    gravar({ ...respostas, site: "" });
                    setPasso((n) => n + 1);
                  }}
                >
                  Não tenho site
                </button>
              )}
              {passo > 0 && (
                <button type="button" className={css.voltar} onClick={voltar}>
                  Voltar
                </button>
              )}
            </div>
            <p className={css.dica}>Enter para continuar</p>
          </form>
        )}

        {/* ---------- CEP + raio ---------- */}
        {p.tipo === "local" && (
          <form
            className={css.forma}
            onSubmit={(e) => {
              e.preventDefault();
              avancar(rascunho, { local_raio: respostas.local_raio ?? "10" });
            }}
          >
            <input
              ref={(el) => {
                campo.current = el;
              }}
              className={css.campo}
              value={rascunho}
              onChange={(e) => setRascunho(mascararCep(e.target.value))}
              placeholder={p.placeholder}
              aria-label={p.rotulo}
              inputMode="numeric"
              autoComplete="postal-code"
            />
            <p className={css.rotuloGrupo}>Até onde vale a pena buscar cliente?</p>
            <div className={css.escolhas}>
              {RAIOS.map((r) => (
                <button
                  key={r.km}
                  type="button"
                  className={`${css.escolha} ${
                    (respostas.local_raio ?? "10") === String(r.km) ? css.escolhida : ""
                  }`}
                  onClick={() => gravar({ ...respostas, local_raio: String(r.km) })}
                >
                  {r.rotulo}
                  <span className={css.escolhaNota}>{r.km} km</span>
                </button>
              ))}
            </div>
            {recado && <p className={css.recado}>{recado}</p>}
            <div className={css.acoes}>
              <button type="submit" className={`cta ${css.botao}`}>
                Continuar
              </button>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
          </form>
        )}

        {/* ---------- nicho: lista fechada ---------- */}
        {p.tipo === "nicho" && (
          <div className={css.forma}>
            <div className={css.escolhas}>
              {NICHOS_DA_BANCADA.map((n) => (
                <button
                  key={n.nicho}
                  type="button"
                  className={`${css.escolha} ${
                    respostas.nicho === n.nicho ? css.escolhida : ""
                  }`}
                  onClick={() => {
                    gravar({ ...respostas, nicho: n.nicho });
                    setPasso((x) => x + 1);
                  }}
                >
                  {n.rotulo}
                </button>
              ))}
            </div>
            <p className={css.dica}>
              Não achou o seu?{" "}
              <a className={css.humanoLinha} href={WHATSAPP_HUMANO} target="_blank" rel="noopener">
                Fala com a gente
              </a>{" "}
              — a lista é fechada de propósito, porque é ela que diz quanto custa cada contato.
            </p>
            <div className={css.acoes}>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ---------- WhatsApp ---------- */}
        {p.tipo === "telefone" && (
          <form
            className={css.forma}
            onSubmit={(e) => {
              e.preventDefault();
              avancar(rascunho);
            }}
          >
            <input
              ref={(el) => {
                campo.current = el;
              }}
              className={css.campo}
              value={rascunho}
              onChange={(e) => setRascunho(mascararWhatsapp(e.target.value))}
              placeholder={p.placeholder}
              aria-label={p.rotulo}
              inputMode="tel"
              autoComplete="tel-national"
            />
            {recado && <p className={css.recado}>{recado}</p>}
            <div className={css.acoes}>
              <button type="submit" className={`cta ${css.botao}`}>
                Continuar
              </button>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
            <p className={css.dica}>Enter para continuar</p>
          </form>
        )}

        {/* ---------- a verba, com o texto vivo ---------- */}
        {p.tipo === "verba" && (
          <Verba
            valor={Number(respostas.verba ?? 900)}
            custo={custo}
            aoMudar={(v) => gravar({ ...respostas, verba: String(v) })}
            aoSeguir={() => setPasso((x) => x + 1)}
            aoVoltar={voltar}
          />
        )}

        {/* ---------- logo e fotos ---------- */}
        {p.tipo === "material" && (
          <div className={css.forma}>
            <label className={css.arquivo}>
              <input
                type="file"
                accept="image/jpeg,image/png"
                multiple
                onChange={(e) => {
                  const quantos = e.target.files?.length ?? 0;
                  if (quantos > 0) gravar({ ...respostas, material: String(quantos) });
                }}
              />
              <span className={css.arquivoRotulo}>Escolher arquivos</span>
              <span className={css.arquivoNota}>
                {respostas.material
                  ? `${respostas.material} arquivo(s) escolhido(s)`
                  : "JPG ou PNG, a partir de 1024px no lado menor"}
              </span>
            </label>
            <p className={css.dica}>
              A logo é a única obrigatória. As fotos do negócio dão à IA de onde escolher — sem
              nenhum material, a montagem do anúncio para antes de começar.
            </p>
            <div className={css.acoes}>
              <button
                type="button"
                className={`cta ${css.botao}`}
                onClick={() => setPasso((x) => x + 1)}
              >
                Continuar
              </button>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
          </div>
        )}

        {/* ---------- conectar o Facebook ---------- */}
        {p.tipo === "conexao" && (
          <div className={css.forma}>
            <p className={css.texto}>
              A conexão é o que autoriza a gente a criar e publicar o anúncio na conta do seu
              negócio. Sem ela, nada sobe.
            </p>
            {/* Na bancada o botão não conecta nada: conexão com a Meta é
                escrita em conta real, e esta rodada não faz isso. Em
                produção o destino é `/conectar`. */}
            <button type="button" className={`cta ${css.botao}`} disabled>
              Conectar meu Facebook
            </button>
            <p className={css.recadoCalmo}>
              Aqui na bancada este botão não conecta nada — a conexão de verdade mora em
              /conectar.
            </p>
            <div className={css.acoes}>
              <button
                type="button"
                className={`cta ghost ${css.botao}`}
                onClick={() => setPasso((x) => x + 1)}
              >
                Ver o resumo
              </button>
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

/** O mesmo formato de dinheiro do resto da tela — nunca `R$ 1200` cru. */
/**
 * ONDE CADA RESPOSTA VAI CAIR — painel de bancada, atrás de `?destino=1`.
 *
 * Ele lê o mapa de `destino.ts` e não escreve nada. Existe para a
 * pergunta "e isso vai para onde?" ter resposta olhável, em vez de morar
 * só num documento.
 */
function Destino({ respostas }: { respostas: Respostas }) {
  const escritas = escritasDe(respostas);
  const faltando = escritas.filter((e) => !e.colunaExiste);
  return (
    <div className={css.destino}>
      <p className={css.destinoTitulo}>Bancada — onde isto vai cair em produção</p>
      <table className={css.destinoTabela}>
        <thead>
          <tr>
            <th>pergunta</th>
            <th>coluna</th>
            <th>existe?</th>
            <th>o cliente edita depois?</th>
          </tr>
        </thead>
        <tbody>
          {escritas.map((e) => (
            <tr key={e.pergunta}>
              <td>{e.pergunta}</td>
              <td>
                <code>
                  {e.tabela}.{e.campo}
                </code>
              </td>
              <td>{e.colunaExiste ? "sim" : "NÃO — migration 0022, não aplicada"}</td>
              <td>{e.naListaBranca ? "sim" : "não — fora da lista branca"}</td>
            </tr>
          ))}
          {FORA_DE_COLUNA.map((f) => (
            <tr key={f.pergunta}>
              <td>{f.pergunta}</td>
              <td>— não é coluna</td>
              <td colSpan={2}>{f.onde}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={css.destinoNota}>
        {faltando.length === 0
          ? "Todas as respostas têm onde cair."
          : `${faltando.length} resposta(s) sem coluna no banco hoje. A escrita falharia alto, que é melhor do que gravar em lugar nenhum em silêncio.`}
      </p>
    </div>
  );
}

/**
 * Um WAV de N segundos de silêncio, montado em memória.
 *
 * Só a bancada usa, e só para a captura ter um tocador de verdade em vez
 * de um retângulo vazio. 44 bytes de cabeçalho e o resto em zeros — não
 * há arquivo de áudio no repositório por causa disto.
 */
function wavDeSilencio(segundos: number): Blob {
  const taxa = 8000;
  const amostras = taxa * segundos;
  const buffer = new ArrayBuffer(44 + amostras * 2);
  const v = new DataView(buffer);
  const texto = (pos: number, t: string) => {
    for (let i = 0; i < t.length; i++) v.setUint8(pos + i, t.charCodeAt(i));
  };
  texto(0, "RIFF");
  v.setUint32(4, 36 + amostras * 2, true);
  texto(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, taxa, true);
  v.setUint32(28, taxa * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  texto(36, "data");
  v.setUint32(40, amostras * 2, true);
  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * O RESUMO MOSTRA TUDO QUE FOI PERGUNTADO — as onze, inclusive as que
 * ficaram sem resposta, que aparecem como traço e continuam mudáveis.
 *
 * A lista mora aqui e não no JSX porque ela é a mesma que monta a mensagem
 * do WhatsApp: duas listas separadas divergem, e a pessoa que atende
 * receberia um resumo diferente do que o cliente viu na tela.
 */
const LINHAS_DO_RESUMO: {
  id: string;
  rotulo: string;
  valor: (r: Respostas) => string | undefined;
}[] = [
  { id: "pessoa", rotulo: "Você", valor: (r) => r.pessoa },
  { id: "empresa", rotulo: "Empresa", valor: (r) => r.empresa },
  {
    id: "local",
    rotulo: "Atende",
    valor: (r) => (r.local ? `${r.local} · até ${r.local_raio ?? "—"} km` : undefined),
  },
  { id: "descricao", rotulo: "Vende", valor: (r) => r.descricao },
  { id: "instagram", rotulo: "Instagram", valor: (r) => r.instagram },
  // String vazia é a resposta "não tenho site", e ela é resposta.
  { id: "site", rotulo: "Site", valor: (r) => (r.site === "" ? "não tem" : r.site) },
  {
    id: "nicho",
    rotulo: "Tipo de negócio",
    valor: (r) => NICHOS_DA_BANCADA.find((n) => n.nicho === r.nicho)?.rotulo,
  },
  { id: "whatsapp", rotulo: "WhatsApp", valor: (r) => r.whatsapp },
  { id: "verba", rotulo: "Por mês", valor: (r) => porMes(r.verba) },
  {
    id: "material",
    rotulo: "Material",
    valor: (r) => (r.material ? `${r.material} arquivo(s)` : undefined),
  },
  {
    id: "conexao",
    rotulo: "Facebook",
    valor: (r) => (r.conexao ? "conectado" : undefined),
  },
];

/**
 * A MENSAGEM QUE VAI PRONTA PARA QUEM ATENDE.
 *
 * ============================================================
 * QUEM ATENDE NÃO COMEÇA DO ZERO. O botão abre o WhatsApp com o cadastro
 * inteiro escrito — as onze respostas, o que ficou em branco, o que veio
 * falado, e a correção que o cliente escreveu no fim.
 *
 * Ela é montada a partir da MESMA `LINHAS_DO_RESUMO` que desenha a tela.
 * Duas listas separadas divergem, e a pessoa que atende receberia um
 * resumo diferente do que o cliente acabou de ver.
 * ============================================================
 *
 * O TETO existe: o WhatsApp corta mensagem muito longa e o corte cairia no
 * meio do cadastro. A correção é a única parte de tamanho imprevisível,
 * então é ela que é cortada, e com aviso — nunca em silêncio.
 */
const TETO_DA_CORRECAO = 600;

export function mensagemDoAgendamento(respostas: Respostas): string {
  const empresa = respostas.empresa?.trim();
  const pessoa = respostas.pessoa?.trim();
  const falando = lerMarcasDeAudio(respostas);

  const linhas: string[] = [
    pessoa
      ? `Oi! Aqui é ${pessoa}${empresa ? `, da ${empresa}` : ""}. Acabei de preencher o cadastro e quero marcar os 30 minutos.`
      : "Oi! Acabei de preencher o cadastro e quero marcar os 30 minutos.",
    "",
    "O que eu respondi:",
  ];

  for (const l of LINHAS_DO_RESUMO) {
    const v = l.valor(respostas);
    const marca = falando.includes(l.id) ? " (falado)" : "";
    linhas.push(`• ${l.rotulo}: ${v && v.length > 0 ? v : "não respondi"}${marca}`);
  }

  const correcao = respostas.correcao?.trim();
  if (correcao) {
    linhas.push("", "O que eu marquei como errado no resumo:");
    linhas.push(
      correcao.length > TETO_DA_CORRECAO
        ? `${correcao.slice(0, TETO_DA_CORRECAO)}… (cortei aqui, conto o resto na conversa)`
        : correcao,
    );
  }

  return linhas.join(String.fromCharCode(10));
}

function porMes(bruto?: string): string | undefined {
  const n = Number(bruto);
  if (!bruto || !Number.isFinite(n)) return undefined;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Uma linha do resumo.
 *
 * `mudar` leva de volta À PERGUNTA, e não ao passo anterior: o briefing
 * pede "opção de voltar a qualquer pergunta", e uma pessoa que quer
 * corrigir o WhatsApp não deveria passar por mais seis telas para chegar
 * lá. O traço no lugar do valor é ausência, e ausência também se muda.
 */
function Linha({
  rotulo,
  valor,
  aoMudar,
  porAudio = false,
}: {
  rotulo: string;
  valor?: string;
  aoMudar?: () => void;
  /** veio de áudio: a marca fica ao lado, não no lugar do valor */
  porAudio?: boolean;
}) {
  return (
    <div className={css.resumoLinha}>
      <dt className={css.resumoRotulo}>
        {rotulo}
        {porAudio && (
          <span className={css.marcaAudio} title="você respondeu falando">
            <span aria-hidden="true">🎙</span> falado
          </span>
        )}
      </dt>
      <dd className={css.resumoValor}>
        <span>{valor && valor.length > 0 ? valor : "—"}</span>
        {aoMudar && (
          <button type="button" className={css.mudar} onClick={aoMudar}>
            mudar
          </button>
        )}
      </dd>
    </div>
  );
}

/**
 * O SLIDER DA VERBA — e o texto que recalcula a cada movimento.
 *
 * ============================================================
 * O QUE BLOQUEIA E O QUE NÃO BLOQUEIA (briefing de 20/09).
 *
 * O ÚNICO bloqueio é o piso da casa, R$ 750/mês: abaixo dele o produto
 * não roda, e a tela diz por quê em vez de só desabilitar o botão.
 *
 * O "indicado" do nicho **não bloqueia nada**. Entre o piso e ele, o
 * cliente segue se quiser: a tela mostra a conta e cala a boca. Julgar a
 * escolha de quem está pondo o próprio dinheiro é exatamente o que este
 * componente não faz.
 * ============================================================
 */
function Verba({
  valor,
  custo,
  aoMudar,
  aoSeguir,
  aoVoltar,
}: {
  valor: number;
  custo: ReturnType<typeof custoDoNicho>;
  aoMudar: (v: number) => void;
  aoSeguir: () => void;
  aoVoltar: () => void;
}) {
  const [v, setV] = useState(valor);
  const abaixoDoPiso = v < PISO_MENSAL;
  const frases = frasesDoSlider(v, custo, PISO_MENSAL);

  return (
    <div className={css.forma}>
      <output className={css.valorGrande}>
        {new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        }).format(v)}
        <span className={css.valorNota}>por mês</span>
      </output>

      <input
        className={css.slider}
        type="range"
        min={300}
        max={5000}
        step={50}
        value={v}
        aria-label="Quanto investir por mês"
        onChange={(e) => {
          const novo = Number(e.target.value);
          setV(novo);
          aoMudar(novo);
        }}
      />

      <div className={css.vivo}>
        {frases.map((f) => (
          <p key={f} className={css.vivoLinha}>
            {f}
          </p>
        ))}
      </div>

      {abaixoDoPiso && (
        <p className={css.recado}>
          Abaixo de R$ 750 por mês a gente não consegue rodar: sobra pouco por dia para o
          Facebook aprender quem é seu cliente, e o anúncio para antes de achar alguém. Sobe um
          pouco o valor, ou fala com a gente.
        </p>
      )}

      <div className={css.acoes}>
        <button
          type="button"
          className={`cta ${css.botao}`}
          disabled={abaixoDoPiso}
          onClick={aoSeguir}
        >
          Continuar
        </button>
        <a className={`cta ghost ${css.botao}`} href={WHATSAPP_HUMANO} target="_blank" rel="noopener">
          Falar com uma pessoa
        </a>
        <button type="button" className={css.voltar} onClick={aoVoltar}>
          Voltar
        </button>
      </div>
    </div>
  );
}
