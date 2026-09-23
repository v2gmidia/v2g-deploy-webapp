"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONVITE_ABAIXO_DO_CAMPO,
  CONVITE_NO_MICROFONE,
  type NichoDaTela,
  PASSOS,
  RAIOS,
  TOTAL,
  ondeParou,
  ABRANGENCIA_BRASIL,
  atendeOBrasilInteiro,
  NICHO_OUTRO,
  type Passo,
} from "./perguntas";
import { rotuloParaFrase, type Palpite } from "./classificar";
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
import { ouvinteDeFala, temFalaAoVivo, type Ouvinte, type Trecho } from "./fala-ao-vivo";
import { coresDaLogo, PAPEIS_DA_COR, type CorDaLogo } from "./cores-da-logo";
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
  empresa: "Marina Arquitetura",
  local: "18040-000",
  local_raio: "10",
  descricao: "Projeto de interiores para apartamento pequeno, do desenho à obra.",
  instagram: "@marinaarquiteta",
  site: "https://marinaarquiteta.com.br",
  // `arquitetura` existe no GET /nichos e é um dos dois com custo
  // conhecido — o exemplo precisa de um nicho REAL, senão a captura
  // mostra uma tela que ninguém consegue reproduzir.
  nicho: "arquitetura",
  whatsapp: "(15) 99876-5432",
  verba: "1200",
  material: "3",
  // As cores que a extração devolveria para a logo de exemplo.
  cores: "#1F4B99,#E8A33D",
  // A descrição é a única que aceita áudio desde 21/09, e é a que aparece
  // marcada como falada no resumo.
  [CHAVE_AUDIO]: "descricao",
};

/**
 * A volta da classificação do texto livre. Ver `api-classificar-nicho`.
 *
 * `palpite` e `humano` não são opostos por acaso: ou eu tenho um nicho
 * para propor, ou eu tenho uma pessoa para oferecer. Não existe terceiro
 * caminho em que a tela fica quieta.
 */
interface PropostaDeNicho {
  palpite: Palpite | null;
  humano: boolean;
  motivo?: string;
}

export function Onboarding({
  nichos,
  passoInicial = 0,
  transcricaoLigada,
  motivoSemTranscricao,
  comExemplo = false,
  nichoDeExemplo = null,
  mostrarDestino = false,
  falhaDeExemplo = null,
  falaDeExemplo = false,
}: {
  /**
   * A LISTA VIVA, vinda do `GET /nichos` pelo componente de servidor.
   *
   * Lista VAZIA não é acidente nem "ainda carregando": é o backend fora
   * do ar, e a tela tem um desenho para isso. Ver o bloco dos chips.
   *
   * Os `termos` vêm junto porque o fluxo do "Outro" depende deles: é
   * sobre eles que `classificar.ts` acha o nicho do texto livre antes de
   * gastar uma chamada ao agente.
   */
  nichos: NichoDaTela[];
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
  /**
   * `?aovivo=1` desenha o bloco da fala ao vivo com um exemplo dentro.
   *
   * Existe porque fala nao cabe em captura estatica: sem isto, a unica
   * forma de olhar essa tela seria falar num microfone. Nenhuma chamada e
   * feita e nenhum microfone e aberto — sao duas strings no estado.
   */
  falaDeExemplo?: boolean;
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
  /**
   * O QUE O NAVEGADOR ESTÁ OUVINDO, palavra por palavra.
   *
   * Separado em fechado e provisório porque a tela mostra os dois com
   * pesos diferentes — provisório que parece decidido é pior do que não
   * mostrar nada.
   */
  const [aoVivo, setAoVivo] = useState<Trecho | null>(null);
  /**
   * O QUE A CLASSIFICAÇÃO DEVOLVEU para o texto livre do "Outro".
   *
   * ============================================================
   * TRÊS ESTADOS, E O TERCEIRO É O QUE IMPORTA.
   *
   * `null`        — ainda não perguntei nada; a tela mostra o campo.
   * `{palpite}`   — tenho uma proposta para confirmar.
   * `{humano}`    — não tenho, e a tela diz isso sem enfeitar.
   *
   * O terceiro não é fracasso do fluxo, é o fluxo funcionando. Quem
   * conserta bicicleta não está na lista de oito nichos, e nenhuma IA vai
   * fazer ele caber. Propor "o seu caso é Advogado" para essa pessoa é
   * pior do que dizer que não sei — e ela ainda não pagou nada para ter
   * motivo de relevar.
   * ============================================================
   */
  const [proposta, setProposta] = useState<PropostaDeNicho | null>(null);
  /** A classificação está em curso — o botão espera, não some. */
  const [classificando, setClassificando] = useState(false);
  /**
   * As cores tiradas da logo. `null` = ainda não olhou nenhuma logo;
   * lista vazia = olhou e não achou cor, que é resposta e não erro.
   */
  const [cores, setCores] = useState<(CorDaLogo & { usar: boolean })[] | null>(null);
  /** O texto do navegador já foi substituído pelo da OpenAI? */
  const [refinado, setRefinado] = useState(false);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [entrando, setEntrando] = useState(true);

  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const tetoDeTempo = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ouvinte = useRef<Ouvinte | null>(null);
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
    // O passo 7 tem DUAS respostas, e o campo de texto e a segunda. Semear
    // do `atual.id` punha o slug do nicho ("arquitetura") dentro do campo
    // "e qual e o seu negocio?" — o que a pessoa leria como se ela tivesse
    // escrito aquilo.
    const semente = !atual
      ? (respostas.correcao ?? "")
      : atual.id === "nicho"
        ? (respostas.nicho_outro ?? "")
        : (respostas[atual.id] ?? "");
    setRascunho(semente);
    setRecado(null);
    setDitado(null);
    setAoVivo(null);
    setRefinado(false);
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
    if (!falaDeExemplo) return;
    setGravando(true);
    setAoVivo({
      fechado: "Eu faço projeto de interiores para apartamento pequeno,",
      provisorio: "do desenho até o acompanhamento",
    });
    return () => setGravando(false);
  }, [falaDeExemplo, passo]);

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

  /**
   * O raio escolhido, com o padrão de 10 km, e o caso que muda a tela.
   *
   * `atendeOBrasilInteiro` mora em `perguntas.ts` e não aqui porque o
   * `ondeParou` precisa da mesma resposta para saber se o passo 3 está
   * completo — se cada um decidisse por conta, a tela e a retomada
   * discordariam sobre o CEP ser obrigatório.
   */
  const raioEscolhido = respostas.local_raio ?? "10";
  const oBrasilInteiro = atendeOBrasilInteiro({ ...respostas, local_raio: raioEscolhido });

  // ---- validação por passo ---------------------------------------------
  function validar(p: Passo, valor: string): Veredito {
    switch (p.id) {
      case "pessoa":
        return validarNome(valor);
      case "empresa":
        return validarEmpresa(valor);
      case "local":
        // Brasil inteiro sem CEP é resposta, não campo em branco: quem
        // vende online não tem um ponto de onde o raio parta. Com CEP
        // digitado, o formato continua valendo — meio CEP não passa.
        if (oBrasilInteiro && valor.trim() === "") return { ok: true, valor: "" };
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

      // ============================================================
      // A DO NAVEGADOR COMEÇA JUNTO com a gravação, não depois.
      //
      // Ela escuta o mesmo microfone em paralelo e não interfere no
      // `MediaRecorder`: são dois consumidores do mesmo fluxo. O que ela
      // devolve vai para a tela na hora, e para o campo quando a pessoa
      // para — assim existe texto editável mesmo antes de a OpenAI
      // responder, e mesmo que ela nunca responda.
      // ============================================================
      setAoVivo({ fechado: "", provisorio: "" });
      setRefinado(false);
      ouvinte.current = ouvinteDeFala(
        (t) => setAoVivo(t),
        () => {
          // Falha da Web Speech NÃO vira recado: a gravação continua, a
          // OpenAI ainda vai responder, e o que a pessoa não pode é achar
          // que perdeu o que falou. O que some é só o texto ao vivo.
          setAoVivo(null);
        },
      );
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
    ouvinte.current?.parar();
    ouvinte.current = null;
    setGravando(false);
    // O que o navegador entendeu vai para o campo NA HORA. A OpenAI
    // substitui depois, se vier. Sem isto, a pessoa que falou um minuto
    // olharia para um campo vazio enquanto a chamada acontece.
    setAoVivo((t) => {
      const doNavegador = [t?.fechado, t?.provisorio].filter(Boolean).join(" ").trim();
      if (doNavegador) setRascunho(doNavegador);
      return t;
    });
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
      // A DA OPENAI SUBSTITUI a do navegador — é para isso que ela existe.
      // `refinado` marca que a troca aconteceu, e a nota na tela diz isso
      // em português, porque a pessoa acabou de ver o texto mudar sozinho.
      setDitado({ texto: dados.texto, audio, url: URL.createObjectURL(audio) });
      setRascunho(dados.texto);
      setRefinado(true);
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
              ? CONVITE_NO_MICROFONE +
                (temFalaAoVivo() ? " O texto aparece enquanto você fala." : "")
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

  /**
   * O QUE ESTÁ SENDO OUVIDO, enquanto está sendo ouvido.
   *
   * Aparece enquanto o microfone está aberto e some quando a OpenAI
   * devolve o texto refinado — a partir daí quem manda é o campo, que é
   * editável. Fica também depois de parar, quando a OpenAI ainda não
   * respondeu: o silêncio entre "parei de falar" e "apareceu o texto" era
   * o pedaço em que a tela não dizia nada.
   */
  function AoVivo() {
    if (!aoVivo || refinado) return null;
    const vazio = !aoVivo.fechado && !aoVivo.provisorio;
    return (
      <div className={css.aoVivo}>
        <p className={css.aoVivoTitulo}>
          {gravando && <span className={css.pulso} aria-hidden="true" />}
          {gravando ? "Estou ouvindo" : "Foi isso que eu ouvi"}
        </p>
        <p className={css.aoVivoTexto} aria-live="polite">
          {vazio ? (
            <span className={css.provisorio}>Pode falar…</span>
          ) : (
            <>
              {aoVivo.fechado}
              {aoVivo.provisorio && (
                <>
                  {aoVivo.fechado ? " " : ""}
                  <span className={css.provisorio}>{aoVivo.provisorio}</span>
                </>
              )}
            </>
          )}
        </p>
        {!gravando && transcrevendo && (
          <p className={css.aoVivoNota}>
            Conferindo o que você falou com mais cuidado — o texto pode mudar um pouco.
          </p>
        )}
      </div>
    );
  }

  /** A nota de que o texto do campo foi trocado pelo mais preciso. */
  function Refinado() {
    if (!refinado) return null;
    return (
      <p className={css.recadoCalmo}>
        Revisei o que você falou e ajustei o texto. Dá para corrigir no campo antes de seguir.
      </p>
    );
  }

  /**
   * AS CORES DA EMPRESA, tiradas da logo.
   *
   * ============================================================
   * PERGUNTA, NÃO AFIRMA. O algoritmo conta pixel; ele não sabe qual cor
   * o dono chamaria de "a nossa". Por isso a frase é uma pergunta e cada
   * bolinha é um seletor de cor de verdade — o nativo do sistema, que é
   * melhor do que qualquer roda que eu desenhasse.
   *
   * Lista vazia NÃO é falha: logo preta e branca não tem cor de marca, e
   * a tela diz isso em vez de inventar um azul.
   * ============================================================
   */
  function Cores() {
    if (cores === null) return null;
    if (cores.length === 0) {
      return (
        <p className={css.recadoCalmo}>
          Não achei cor de marca nessa logo — ela deve ser preto e branco. Sem problema: a
          gente escolhe as cores do anúncio com você depois.
        </p>
      );
    }

    /** Muda uma cor e guarda só as que continuam marcadas. */
    const mexer = (i: number, mudanca: Partial<CorDaLogo & { usar: boolean }>) => {
      const novas = cores.map((x, j) => (j === i ? { ...x, ...mudanca } : x));
      setCores(novas);
      gravar({
        ...respostas,
        cores: novas.filter((x) => x.usar).map((x) => x.hex).join(","),
      });
    };

    const marcadas = cores.filter((c) => c.usar);

    return (
      <div className={css.cores}>
        <p className={css.rotuloGrupo}>Essas são as cores da sua empresa?</p>
        <div className={css.coresLinha}>
          {cores.map((c, i) => (
            <div key={`${c.hex}-${i}`} className={css.cor}>
              {/* A BOLINHA É O SELETOR DE COR, não uma amostra ao lado de um
                  botão: tocar nela abre o seletor do sistema, que é onde
                  quem quer trocar já espera que esteja. */}
              <input
                type="color"
                className={`${css.bolinha} ${c.usar ? "" : css.bolinhaFora}`}
                value={c.hex}
                aria-label={`Trocar a cor ${PAPEIS_DA_COR[i] ?? ""} da empresa`}
                onChange={(e) => mexer(i, { hex: e.target.value.toUpperCase() })}
              />
              <span className={css.corPapel}>{PAPEIS_DA_COR[i] ?? "Cor"}</span>
              <span className={css.corCodigo}>{c.hex}</span>
              <label className={css.corMarca}>
                <input
                  type="checkbox"
                  checked={c.usar}
                  onChange={(e) => mexer(i, { usar: e.target.checked })}
                />
                <span>é essa</span>
              </label>
            </div>
          ))}
        </div>
        <p className={css.dica}>
          {marcadas.length > 0
            ? "São essas cores que vamos usar nos seus anúncios. Desmarca a que não for, ou toca na bolinha para trocar."
            : "Nenhuma marcada — a gente escolhe as cores do anúncio com você depois."}
        </p>
      </div>
    );
  }

  function Ditado() {
    if (!ditado) return null;
    return (
      <div className={css.ditado}>
        <p className={css.ditadoTitulo}>Seu áudio, do lado do texto</p>
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
            {/* ============================================================
                O `filter` É A ÚNICA DIFERENÇA entre esta tela e a mensagem
                do WhatsApp, e ele é de EXIBIÇÃO: a linha marcada sai daqui
                e continua no array, porque é do array que a mensagem de
                quem atende é montada. Ver `soNaMensagem`, no tipo.
                ============================================================ */}
            {LINHAS_DO_RESUMO.filter((l) => !l.soNaMensagem).map((l) => (
              <Linha
                key={l.id}
                rotulo={l.rotulo}
                valor={l.valor(respostas, nichos)}
                aoMudar={() => irPara(l.passo ?? l.id)}
                porAudio={falando.includes(l.id)}
                amostras={l.id === "cores"}
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
            <AoVivo />
            <Refinado />
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
            href={`${WHATSAPP_HUMANO}?text=${encodeURIComponent(mensagemDoAgendamento(respostas, nichos))}`}
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
        {/* A ajuda do passo do nicho é "Escolha o mais próximo" — uma
            instrução sobre a lista. Com a proposta aberta a lista não
            está mais lá, e a instrução vira ordem para fazer uma coisa
            que não tem como ser feita. */}
        {/* A ajuda do passo do nicho é "Escolha o mais próximo" — uma
            instrução sobre a lista. Com a proposta aberta, ou sem lista
            nenhuma, ela manda fazer uma coisa que não tem como ser feita. */}
        {p.ajuda &&
          proposta === null &&
          !(p.tipo === "nicho" && nichos.length === 0) && (
            <p className={css.ajuda}>{p.ajuda}</p>
          )}

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
            <AoVivo />
            <Refinado />
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
              avancar(rascunho, { local_raio: raioEscolhido });
            }}
          >
            {/* ============================================================
                A ESCOLHA VEM PRIMEIRO, E O CEP DEPOIS.

                Até a v3 o CEP abria a tela e o raio vinha abaixo. Com o
                "Brasil inteiro" isso inverteu: quem vende online ia digitar
                um CEP para só então descobrir que não precisava. A pergunta
                que MUDA a próxima vem antes.
                ============================================================ */}
            <p className={css.rotuloGrupo}>Até onde vale a pena buscar cliente?</p>
            <div className={css.escolhas}>
              {RAIOS.map((r) => (
                <button
                  key={r.valor}
                  type="button"
                  className={`${css.escolha} ${
                    raioEscolhido === r.valor ? css.escolhida : ""
                  }`}
                  onClick={() => gravar({ ...respostas, local_raio: r.valor })}
                >
                  {r.rotulo}
                  <span className={css.escolhaNota}>{r.nota}</span>
                </button>
              ))}
            </div>

            <p className={css.rotuloGrupo}>
              {oBrasilInteiro ? "CEP (se quiser)" : "De qual CEP o raio parte?"}
            </p>
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
            {oBrasilInteiro && (
              <p className={css.dica}>
                Quem atende o Brasil inteiro não precisa de CEP — não há um ponto de onde o
                raio parta. Se quiser deixar o seu, tudo bem: ele ajuda a gente a te conhecer.
              </p>
            )}
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
            {/* ============================================================
                COM PROPOSTA NA TELA, A LISTA SAI.

                Olhando a captura de 1280: os nove chips continuavam
                inteiros e a proposta nascia DEPOIS deles, no fim da
                página. Em 375 ela ficava abaixo da dobra — a pessoa
                apertava "Continuar" e parecia que nada tinha acontecido.

                Pior que a rolagem: o chip aceso dizia "Outro" enquanto a
                frase logo abaixo dizia "o seu caso é Arquiteto". A tela
                se contradizia em dois centímetros.

                A pergunta já foi feita e respondida. O que está na tela
                agora é a conferência dela, e conferência com o cardápio
                aberto do lado convida a pessoa a responder de novo.
                ============================================================ */}
            {/* ============================================================
                SEM LISTA, A TELA DIZ ISSO — não inventa chip.

                A lista vem do `GET /nichos` pelo servidor. Se ela não
                vier, `nichos` chega vazio, e aqui NÃO existe reserva:
                chips de mentira seriam palpite com cara de escolha do
                cliente (decisão do Victor, 22/08, e é a mesma razão pela
                qual `app/(fluxo)/onboarding/perguntas.ts` tem
                `opcoes: []`).

                A saída para gente continua na tela nos dois casos — é a
                única que funciona com o catálogo fora.
                ============================================================ */}
            {proposta === null && nichos.length === 0 && (
              <p className={css.dica}>
                A lista de tipos de negócio não carregou agora. Dá para seguir falando com a
                gente:{" "}
                <a
                  className={css.humanoLinha}
                  href={WHATSAPP_HUMANO}
                  target="_blank"
                  rel="noopener"
                >
                  me chama no WhatsApp
                </a>
                .
              </p>
            )}
            {proposta === null && nichos.length > 0 && (
            <div className={css.escolhas}>
              {nichos.map((n) => (
                <button
                  key={n.nicho}
                  type="button"
                  className={`${css.escolha} ${
                    respostas.nicho === n.nicho ? css.escolhida : ""
                  }`}
                  onClick={() => {
                    gravar({ ...respostas, nicho: n.nicho, nicho_outro: "" });
                    // Escolher da lista apaga qualquer proposta pendente:
                    // ela era sobre outro texto, e deixar viva faria a
                    // pergunta reaparecer sobre um nicho já decidido.
                    setProposta(null);
                    setPasso((x) => x + 1);
                  }}
                >
                  {n.rotulo}
                </button>
              ))}
              {/* ============================================================
                  "OUTRO" NÃO AVANÇA SOZINHO, ao contrário dos oito acima.

                  Escolher um nicho da lista já diz tudo o que a gente precisa
                  saber, então a tela segue. "Outro" não diz nada até a pessoa
                  escrever o que é — e por isso ele abre o campo e espera.
                  ============================================================ */}
              <button
                type="button"
                className={`${css.escolha} ${
                  respostas.nicho === NICHO_OUTRO ? css.escolhida : ""
                }`}
                onClick={() => {
                  gravar({ ...respostas, nicho: NICHO_OUTRO });
                  // Tocar em "Outro" de novo recomeça a conversa, e não
                  // devolve o palpite antigo sobre um texto que ela pode
                  // estar prestes a reescrever.
                  setProposta(null);
                  setRecado(null);
                }}
              >
                Outro — meu negócio não está aqui
              </button>
            </div>
            )}

            {/* ============================================================
                "OUTRO" VIRA CLASSIFICAÇÃO, NÃO CAMPO LIVRE SOLTO.

                Até 22/09 isto era um `input` de uma linha com placeholder
                "Ex: loja de bicicletas", mínimo de 3 letras, e o texto ia
                inteiro para uma pessoa ler depois. Funcionava, e desperdiçava
                a única vez no fluxo em que o dono conta o negócio com as
                palavras dele.

                Agora são três estados, nesta ordem:

                  1. A PERGUNTA ABERTA — com áudio, como as outras duas
                     abertas do fluxo. Quem fala conta mais, e aqui contar
                     mais é exatamente o que decide o resultado.
                  2. A PROPOSTA — "o seu caso é X. Confere?" A pessoa
                     confirma ou recusa; ela decide, não a gente.
                  3. A PESSOA — quando não dá para propor, ou quando ela
                     recusa. Sem tentar de novo com outro palpite: insistir
                     depois de um "não é isso" é discutir com o dono sobre
                     o negócio dele.
                ============================================================ */}
            {respostas.nicho === NICHO_OUTRO && proposta === null && (
              <form
                className={css.forma}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const texto = rascunho.trim();
                  // O mínimo é o do backend (`minLength: 10`). Pedir mais
                  // aqui e receber 422 lá seria a tela mentindo sobre o
                  // que basta.
                  if (texto.length < 10) {
                    setRecado(
                      "Conta um pouco mais: com uma frase curta eu não consigo entender o que você faz.",
                    );
                    return;
                  }
                  setRecado(null);
                  setClassificando(true);
                  try {
                    const r = await fetch("/exemplo/api-classificar-nicho", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        descricao: texto,
                        nomeNegocio: respostas.empresa ?? "",
                      }),
                    });
                    const dados = (await r.json()) as PropostaDeNicho;
                    gravar({ ...respostas, nicho_outro: texto });
                    setProposta(dados);
                  } catch {
                    // Rede caiu no meio. Não é hora de palpite: é hora de
                    // gente, que é para onde a recusa também vai.
                    gravar({ ...respostas, nicho_outro: texto });
                    setProposta({
                      palpite: null,
                      humano: true,
                      motivo: "não deu para conferir agora",
                    });
                  } finally {
                    setClassificando(false);
                  }
                }}
              >
                <p className={css.rotuloGrupo}>
                  Não achou o seu? Conta com detalhes o que você faz.
                </p>
                <textarea
                  className={css.campoLongo}
                  value={rascunho}
                  onChange={(e) => setRascunho(e.target.value)}
                  placeholder="Ex: conserto bicicleta e monto bike elétrica, atendo em casa e na oficina"
                  aria-label="O que você faz"
                  rows={3}
                  autoFocus
                />
                {/* As mesmas peças das outras duas perguntas abertas: o
                    microfone convidativo, o convite abaixo do campo, e o
                    áudio que sobrevive à transcrição que falha. */}
                <Convite aberta />
                <Microfone aberta />
                <AoVivo />
                <Refinado />
                <Ditado />
                <AudioSemTexto />
                {recado && <p className={css.recado}>{recado}</p>}
                <div className={css.acoes}>
                  <button
                    type="submit"
                    className={`cta ${css.botao}`}
                    disabled={classificando}
                  >
                    {classificando ? "Lendo o que você contou" : "Continuar"}
                  </button>
                </div>
              </form>
            )}

            {/* ---------- a proposta ---------- */}
            {proposta?.palpite && (
              <div className={css.forma}>
                <p className={css.rotuloGrupo}>
                  Pelo que você contou, o seu caso é{" "}
                  <strong>
                    {rotuloParaFrase(proposta.palpite.nicho, nichos) ??
                      proposta.palpite.rotulo}
                  </strong>
                  . Confere?
                </p>
                {/* ============================================================
                    A PROPOSTA DIZ DE ONDE VEIO.

                    "O seu caso é Arquiteto" sozinho é um veredito caído do
                    céu, e quem discorda não tem no que pegar. Com o termo
                    que casou, a pessoa vê o raciocínio e sabe o que corrigir.

                    Do backend não vem termo — ele leu a frase inteira —,
                    então ali a linha não aparece. Inventar uma seria pior
                    do que não ter.
                    ============================================================ */}
                {proposta.palpite.origem === "termos" && (
                  <p className={css.dica}>
                    Foi “{proposta.palpite.termo}” no que você contou que me levou até aí.
                  </p>
                )}
                <div className={css.acoes}>
                  <button
                    type="button"
                    className={`cta ${css.botao}`}
                    onClick={() => {
                      // Grava o NICHO, não mais o `NICHO_OUTRO`: a pessoa
                      // acabou de dizer que confere, e o custo por contato
                      // passa a ser o do nicho de verdade.
                      gravar({ ...respostas, nicho: proposta.palpite!.nicho });
                      setProposta(null);
                      setPasso((x) => x + 1);
                    }}
                  >
                    Confere
                  </button>
                  <button
                    type="button"
                    className={`cta ghost ${css.botao}`}
                    onClick={() =>
                      setProposta({
                        palpite: null,
                        humano: true,
                        motivo: "a pessoa recusou o palpite",
                      })
                    }
                  >
                    Não é isso, quero falar com alguém
                  </button>
                </div>
              </div>
            )}

            {/* ---------- a pessoa ---------- */}
            {proposta?.humano && (
              <div className={css.forma}>
                <p className={css.rotuloGrupo}>Então é com uma pessoa mesmo.</p>
                {/* ============================================================
                    SEM PEDIR DESCULPA, E SEM PROMETER PRAZO.

                    A lista tem oito nichos porque são oito os que a gente
                    sabe quanto custa. Não achar o seu não é falha do
                    cliente nem acidente: é o tamanho do produto hoje, e
                    dizer isso direto respeita mais do que "ops".

                    O que a pessoa escreveu FICA GRAVADO — ela não vai
                    contar duas vezes.
                    ============================================================ */}
                <p className={css.dica}>
                  O que você escreveu fica guardado, e uma pessoa lê antes de montar seu
                  anúncio. Você não vai precisar contar de novo.
                </p>
                <div className={css.acoes}>
                  <a
                    className={`cta ${css.botao}`}
                    href={WHATSAPP_HUMANO}
                    target="_blank"
                    rel="noopener"
                  >
                    Falar com a gente
                  </a>
                  <button
                    type="button"
                    className={`cta ghost ${css.botao}`}
                    onClick={() => {
                      setProposta(null);
                      setPasso((x) => x + 1);
                    }}
                  >
                    Seguir e falar depois
                  </button>
                </div>
              </div>
            )}

            {/* A linha do rodapé só faz sentido com a lista na tela: ela
                explica por que a lista é curta. Com a proposta aberta ela
                vira uma terceira oferta de falar com alguém, ao lado de
                duas que já estão ali em forma de botão. */}
            {/* Sem lista, esta linha vinha logo abaixo do recado e as duas
                ofereciam o WhatsApp — dois links iguais, empilhados. Pior,
                ela pergunta "se o seu não está aí" para quem não recebeu
                lista nenhuma para procurar. Ela existe para explicar por
                que a lista é CURTA; sem lista não há o que explicar. */}
            {proposta === null && nichos.length > 0 && (
            <p className={css.dica}>
              A lista é curta de propósito: é ela que diz quanto custa cada contato. Se o seu
              não está aí,{" "}
              <a className={css.humanoLinha} href={WHATSAPP_HUMANO} target="_blank" rel="noopener">
                fala com a gente
              </a>
              .
            </p>
            )}
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

        {/* ============================================================
            A VERBA COMECA EM ZERO, E NAO EM 900.

            O 900 era o ponto de partida do slider, e num slider isso e
            inevitavel: a alavanca precisa estar em algum lugar. Num campo
            digitado vira outra coisa — o campo abriria com um numero que a
            pessoa nao escolheu, o texto vivo ja calcularia em cima dele, e
            o "Continuar" ja estaria aceso. Ela podia seguir sem nunca ter
            decidido quanto quer investir.

            Com zero: campo vazio, sem texto vivo, e o "Continuar" so
            acende quando ela digita.
            ============================================================ */}
        {p.tipo === "verba" && (
          <Verba
            valor={Number(respostas.verba ?? 0)}
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
                onChange={async (e) => {
                  const arquivos = [...(e.target.files ?? [])];
                  if (arquivos.length === 0) return;
                  gravar({ ...respostas, material: String(arquivos.length) });
                  // ============================================================
                  // A PRIMEIRA IMAGEM É A LOGO. É o que a pergunta pede
                  // ("manda sua logo e fotos"), nessa ordem, e é o que o
                  // seletor devolve na ordem em que a pessoa escolheu.
                  //
                  // Tirar cor de uma FOTO do negócio daria a cor da parede.
                  // Se um dia a tela separar "logo" de "fotos" em dois
                  // campos, isto deixa de ser suposição.
                  // ============================================================
                  const achadas = await coresDaLogo(arquivos[0]!);
                  // ============================================================
                  // NASCEM MARCADAS, e isso é uma escolha.
                  //
                  // A pergunta é "essas são as cores da sua empresa?", e a
                  // resposta esperada é sim — a extração acertou na maioria
                  // das logos. Nascer desmarcada obrigaria todo mundo a
                  // confirmar o que já está certo.
                  //
                  // Desmarcar é um toque, e o que fica guardado é só o que
                  // sobrou marcado.
                  // ============================================================
                  const comMarca = achadas.map((c) => ({ ...c, usar: true }));
                  setCores(comMarca);
                  gravar({
                    ...respostas,
                    material: String(arquivos.length),
                    cores: comMarca.filter((c) => c.usar).map((c) => c.hex).join(","),
                  });
                }}
              />
              <span className={css.arquivoRotulo}>Escolher arquivos</span>
              <span className={css.arquivoNota}>
                {respostas.material
                  ? `${respostas.material} arquivo(s) escolhido(s)`
                  : "JPG ou PNG, a partir de 1024px no lado menor"}
              </span>
            </label>
            <Cores />
            <p className={css.dica}>
              A logo é a que a gente mais precisa. As fotos do negócio dão à IA de onde
              escolher.
            </p>
            {/* ============================================================
                A TELA DIZIA QUE O MATERIAL ERA OBRIGATÓRIO E DEIXAVA PASSAR.

                "Sem material, a gente não consegue montar o anúncio" com um
                "Continuar" aceso ao lado é a tela desmentindo a si mesma —
                e quem lê é alguém que já foi enganado por agência antes.

                Agora são dois caminhos, os dois nomeados: com arquivo, o
                principal segue; sem arquivo, a saída se chama pelo que ela
                é. É o mesmo desenho do "não tenho site", que também não é
                recusa nem culpa.
                ============================================================ */}
            <div className={css.acoes}>
              <button
                type="button"
                className={`cta ${css.botao}`}
                disabled={!respostas.material}
                onClick={() => setPasso((x) => x + 1)}
              >
                Continuar
              </button>
              {!respostas.material && (
                <button
                  type="button"
                  className={`cta ghost ${css.botao}`}
                  onClick={() => {
                    gravar({ ...respostas, material_depois: "1" });
                    setPasso((x) => x + 1);
                  }}
                >
                  Não tenho agora — mando depois
                </button>
              )}
              <button type="button" className={css.voltar} onClick={voltar}>
                Voltar
              </button>
            </div>
            {!respostas.material && (
              <p className={css.dica}>
                Sem nenhum material a montagem do anúncio não começa — mas dá para mandar pelo
                WhatsApp depois, no seu tempo.
              </p>
            )}
          </div>
        )}

        {/* ---------- conectar o Facebook ---------- */}
        {p.tipo === "conexao" && (
          <div className={css.forma}>
            {/* ============================================================
                DUAS TRILHAS, E A PERGUNTA QUE SEPARA VEM ANTES DO BOTÃO.

                Até a v3 a tela abria com "Conectar meu Facebook". Quem
                nunca anunciou lia aquilo como uma exigência — e a metade
                do público que a V2G quer atender nunca anunciou. A
                pergunta separa antes de pedir qualquer coisa.

                `ja_anuncia` guarda a resposta: "sim", "nunca" ou
                "nao_sei". As duas últimas vão para o mesmo lugar, porque
                "não sei" quase sempre quer dizer "não".
                ============================================================ */}
            <p className={css.rotuloGrupo}>Você já anuncia no Facebook ou no Instagram?</p>
            <div className={css.trilhaEscolha}>
              {[
                { valor: "sim", rotulo: "Sim, já tenho conta de anúncios" },
                { valor: "nunca", rotulo: "Nunca anunciei" },
                { valor: "nao_sei", rotulo: "Não sei" },
              ].map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  className={`${css.escolha} ${
                    respostas.ja_anuncia === o.valor ? css.escolhida : ""
                  }`}
                  onClick={() => gravar({ ...respostas, ja_anuncia: o.valor })}
                >
                  {o.rotulo}
                </button>
              ))}
            </div>

            {/* ---------- trilha 1: já anuncia ---------- */}
            {respostas.ja_anuncia === "sim" && (
              <>
                <p className={css.texto}>
                  A conexão é o que autoriza a gente a criar e publicar o anúncio na conta do
                  seu negócio. Sem ela, nada sobe.
                </p>
                {/* Na bancada o botão não conecta nada: conexão com a Meta é
                    escrita em conta real, e esta rodada não faz isso. Em
                    produção o destino é o fluxo que já existe em
                    `/conectar` — Facebook Login, `app/auth/meta/iniciar`. */}
                <button type="button" className={`cta ${css.botao}`} disabled>
                  Conectar meu Facebook
                </button>
                <p className={css.recadoCalmo}>
                  Aqui na bancada este botão não conecta nada — a conexão de verdade mora em
                  /conectar.
                </p>

                {/* ============================================================
                    O PRÉ-VOO, desenhado e não medido.

                    Em produção ele aparece DEPOIS de conectar, e cada linha
                    é uma leitura da conta na Meta. Na bancada não há
                    conexão, então ele mostra o que vai ser conferido — com
                    o traço de "ainda não conferido" em vez de um certo
                    verde que seria mentira.
                    ============================================================ */}
                <p className={css.rotuloGrupo}>Depois de conectar, a gente confere três coisas</p>
                <ul className={css.checklist}>
                  {[
                    ["Conta de anúncios", "se existe uma, e se a gente pode usar"],
                    ["Forma de pagamento", "o cartão fica na sua conta, não na nossa"],
                    ["WhatsApp no anúncio", "se o número que você deu pode receber clique"],
                  ].map(([o, q]) => (
                    <li key={o} className={css.checkItem}>
                      <span className={css.checkMarca} aria-hidden="true">
                        —
                      </span>
                      <span>
                        <strong>{o}</strong> — {q}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={css.dica}>
                  Se faltar alguma, a gente te diz qual é e resolve junto numa conversa de 30
                  minutos.
                </p>
                <div className={css.acoes}>
                  <a
                    className={`cta ghost ${css.botao}`}
                    href={`${WHATSAPP_HUMANO}?text=${encodeURIComponent(
                      "Oi! Travei na hora de conectar o Facebook e queria marcar os 30 minutos.",
                    )}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Não deu certo? Agendar 30 minutos
                  </a>
                </div>
              </>
            )}

            {/* ---------- trilha 2: nunca anunciou, ou não sabe ---------- */}
            {(respostas.ja_anuncia === "nunca" || respostas.ja_anuncia === "nao_sei") && (
              <>
                <p className={css.texto}>
                  Então não tem nada para conectar agora. A gente cria tudo junto com você, em
                  30 minutos: a conta, o pagamento e o primeiro anúncio.
                </p>
                <p className={css.dica}>
                  Você não precisa saber nada de Facebook para isso. É a nossa parte.
                </p>
                <a
                  className={`cta ${css.botao}`}
                  href={`${WHATSAPP_HUMANO}?text=${encodeURIComponent(
                    "Oi! Nunca anunciei e quero marcar os 30 minutos para criar tudo junto.",
                  )}`}
                  target="_blank"
                  rel="noopener"
                >
                  Agendar os 30 minutos
                </a>
              </>
            )}

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
 * O QUE SEPARA UMA COR DA OUTRA na linha das cores.
 *
 * Mora numa constante porque duas pessoas precisam concordar sobre ele: a
 * `valor()` que JUNTA os hexadecimais e a `Amostras` que os SEPARA de novo
 * para pintar o quadradinho. Dois literais " · " iguais hoje viram um
 * separador trocado num lugar só amanhã, e aí a tela mostra um quadrado
 * cinza sem ninguém entender por quê.
 */
const SEPARADOR_DAS_CORES = " · ";

/**
 * O RESUMO MOSTRA TUDO QUE FOI PERGUNTADO — as onze, inclusive as que
 * ficaram sem resposta, que aparecem como traço e continuam mudáveis.
 *
 * A lista mora aqui e não no JSX porque ela é a mesma que monta a mensagem
 * do WhatsApp: duas listas separadas divergem, e a pessoa que atende
 * receberia um resumo diferente do que o cliente viu na tela.
 */
const LINHAS_DO_RESUMO: {
  /**
   * IDENTIDADE DA LINHA — é a `key` do React e a marca de "(falado)".
   *
   * ============================================================
   * ELA TEM QUE SER ÚNICA, E DEIXOU DE SER EM 21/09.
   *
   * A linha das cores nasceu (commit `cea76bf`) copiando a do material,
   * e ficou com `id: "material"` também. Duas linhas com a mesma `key`
   * no `LINHAS_DO_RESUMO.map()` viram um aviso no console do navegador
   * — "Encountered two children with the same key, `material`" — e, o
   * que é pior, o React passa a reconciliar as duas como se fossem a
   * mesma: editar uma pode repintar a outra.
   *
   * O id não podia ser simplesmente trocado, porque ele também era o
   * destino do botão "Mudar", e o destino das cores É o passo do
   * material (é lá que a logo entra e as cores saem dela). Por isso as
   * duas coisas se separaram: `id` identifica, `passo` navega.
   * ============================================================
   */
  id: string;
  /**
   * PARA ONDE O "Mudar" LEVA, quando não é o próprio `id`.
   *
   * Só as cores usam: elas não são um passo do fluxo, são um pedaço do
   * passo do material. Omitido, o destino é o `id` — que é o caso das
   * outras onze linhas, em que resumo e passo têm o mesmo nome.
   */
  passo?: string;
  /**
   * SAI DA TELA, FICA NA MENSAGEM.
   *
   * ============================================================
   * ESTA LISTA TEM DOIS CONSUMIDORES, e eles não querem a mesma coisa.
   *
   * O resumo da tela é para o CLIENTE conferir o que respondeu. A
   * mensagem do WhatsApp é para QUEM ATENDE, e hoje é o único canal que
   * leva o cadastro a uma pessoa (`mensagemDoAgendamento`, abaixo).
   *
   * "Material: 3 arquivo(s)" não diz nada ao cliente — ele acabou de
   * escolher os arquivos e a contagem não o ajuda a decidir nada. Para
   * quem atende, a mesma linha diz se existe material para montar o
   * anúncio ou se vai ter que pedir. Decisão do Victor, 22/09/2026.
   *
   * Por isso a linha não é APAGADA: ela é marcada. Apagar do array
   * tiraria dos dois lugares — e tirar de quem atende foi justamente o
   * que não se quis.
   * ============================================================
   */
  soNaMensagem?: boolean;
  rotulo: string;
  /**
   * `nichos` entra aqui porque o rótulo do nicho é a ÚNICA linha do
   * resumo que não está nas respostas: elas guardam o identificador
   * (`clinica-odontologica`), e quem traduz para "Dentista" é a lista
   * viva. Antes essa tradução saía de uma cópia congelada, e um nicho
   * aposentado virava linha em branco no resumo — sem dizer por quê.
   */
  valor: (r: Respostas, nichos: NichoDaTela[]) => string | undefined;
}[] = [
  { id: "pessoa", rotulo: "Você", valor: (r) => r.pessoa },
  { id: "empresa", rotulo: "Empresa", valor: (r) => r.empresa },
  {
    id: "local",
    rotulo: "Atende",
    valor: (r) => {
      if (r.local_raio === ABRANGENCIA_BRASIL) {
        return r.local ? `O Brasil inteiro · ${r.local}` : "O Brasil inteiro";
      }
      if (!r.local) return undefined;
      return `${r.local} · até ${r.local_raio ?? "—"} km`;
    },
  },
  { id: "descricao", rotulo: "Vende", valor: (r) => r.descricao },
  { id: "instagram", rotulo: "Instagram", valor: (r) => r.instagram },
  // String vazia é a resposta "não tenho site", e ela é resposta.
  { id: "site", rotulo: "Site", valor: (r) => (r.site === "" ? "não tem" : r.site) },
  {
    id: "nicho",
    rotulo: "Tipo de negócio",
    valor: (r, nichos) => {
      if (r.nicho === NICHO_OUTRO) {
        // O que ela escreveu vale mais que a palavra "Outro".
        return r.nicho_outro ? `${r.nicho_outro} (fora da lista)` : "Fora da lista";
      }
      return nichos.find((n) => n.nicho === r.nicho)?.rotulo;
    },
  },
  { id: "whatsapp", rotulo: "WhatsApp", valor: (r) => r.whatsapp },
  { id: "verba", rotulo: "Por mês", valor: (r) => porMes(r.verba) },
  {
    id: "material",
    soNaMensagem: true,
    rotulo: "Material",
    valor: (r) =>
      r.material
        ? `${r.material} arquivo(s)`
        : r.material_depois
          ? "vai mandar depois"
          : undefined,
  },
  {
    id: "cores",
    // O "Mudar" das cores volta ao passo do material: é lá que a logo é
    // enviada, e é da logo que as cores saem. Não existe passo "cores".
    passo: "material",
    rotulo: "Cores da marca",
    valor: (r) => (r.cores ? r.cores.split(",").join(SEPARADOR_DAS_CORES) : undefined),
  },
  {
    id: "conexao",
    rotulo: "Facebook",
    valor: (r) => {
      if (r.conexao) return "conectado";
      if (r.ja_anuncia === "sim") return "já anuncia — falta conectar";
      if (r.ja_anuncia === "nunca") return "nunca anunciou — cria junto na conversa";
      if (r.ja_anuncia === "nao_sei") return "não sabe — cria junto na conversa";
      return undefined;
    },
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

export function mensagemDoAgendamento(
  respostas: Respostas,
  nichos: NichoDaTela[],
): string {
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
    const v = l.valor(respostas, nichos);
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

/** Reais inteiros, como o campo os mostra: `1.200`. Sem "R$" e sem centavo. */
const EM_REAIS = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/**
 * Os dígitos que a pessoa digitou, lidos como REAIS INTEIROS.
 *
 * ============================================================
 * DIVERGE DA `centavosDeDigitos` DE PROPÓSITO, e a diferença é o campo:
 *
 *   `lib/dia-seguinte/pergunta.ts`  campo de RECEITA. "1600" → R$ 16,00.
 *                                   Centavo importa, e o teclado é o de
 *                                   banco: cada dígito entra pela direita.
 *   aqui                            campo de VERBA. "1600" → R$ 1.600.
 *                                   Verba de anúncio não tem centavo, e
 *                                   quem digita 1600 quer mil e seiscentos.
 *
 * O que NÃO diverge é a guarda: número acima do inteiro seguro é recusado,
 * porque acima disso a aritmética começa a mentir — e mentir sobre
 * dinheiro em silêncio é o que não pode.
 * ============================================================
 */
function reaisDeDigitos(bruto: string): number | null {
  const digitos = bruto.replace(/\D/g, "");
  if (digitos === "") return null;
  const n = Number(digitos);
  if (!Number.isSafeInteger(n)) return null;
  return n;
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
  amostras = false,
}: {
  rotulo: string;
  valor?: string;
  aoMudar?: () => void;
  /** veio de áudio: a marca fica ao lado, não no lugar do valor */
  porAudio?: boolean;
  /** o valor é uma lista de `#RRGGBB`: mostra a cor, não só o código */
  amostras?: boolean;
}) {
  const vazio = valor === undefined || valor.length === 0;
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
        {vazio ? <span>—</span> : amostras ? <Amostras texto={valor} /> : <span>{valor}</span>}
        {aoMudar && (
          <button type="button" className={css.mudar} onClick={aoMudar}>
            mudar
          </button>
        )}
      </dd>
    </div>
  );
}

/** Um `#RRGGBB` e nada além disso. */
const UM_HEXADECIMAL = /^#[0-9A-Fa-f]{6}$/;

/**
 * O CÓDIGO DA COR COM A COR DO LADO.
 *
 * ============================================================
 * `#1F4B99` NÃO É UMA COR PARA QUEM LÊ. O resumo é a última tela antes de
 * a pessoa mandar tudo para a gente, e era a única do fluxo em que as
 * cores apareciam só como código — no passo do material elas já são
 * bolinhas de 56px que abrem o seletor do sistema.
 *
 * O quadrado é DECORATIVO, e por isso `aria-hidden`: quem usa leitor de
 * tela continua ouvindo o código, que é a informação. Cor sozinha nunca
 * carrega significado aqui — o texto está sempre junto.
 *
 * O `style` inline é a exceção honesta à regra dos tokens: este valor é
 * DADO DO CLIENTE, não decisão de design. Nenhum token poderia contê-lo.
 * O `UM_HEXADECIMAL` é o que garante que só um `#RRGGBB` chegue ao CSS —
 * o que não casar aparece como texto puro, e não vira `background`.
 * ============================================================
 */
function Amostras({ texto }: { texto: string }) {
  return (
    <span className={css.amostras}>
      {texto.split(SEPARADOR_DAS_CORES).map((parte, i) => (
        <span className={css.amostra} key={`${parte}-${i}`}>
          {UM_HEXADECIMAL.test(parte) && (
            <span
              className={css.amostraCor}
              style={{ background: parte }}
              aria-hidden="true"
            />
          )}
          {parte}
        </span>
      ))}
    </span>
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
  const [texto, setTexto] = useState(v > 0 ? EM_REAIS.format(v) : "");
  const abaixoDoPiso = v > 0 && v < PISO_MENSAL;
  const frases = frasesDoSlider(v, custo, PISO_MENSAL);

  return (
    <div className={css.forma}>
      {/* ============================================================
          CAMPO DIGITADO, E NÃO SLIDER — pedido do Victor em 21/09/2026.

          O slider tinha mínimo 300, máximo 5000 e passo de 50: ele decidia
          por quem responde. Quem queria pôr R$ 6.000 não conseguia, e
          quem queria R$ 1.234 ia parar em R$ 1.250 sem perceber.

          A MÁSCARA É DE REAIS INTEIROS, e aqui ela diverge de propósito da
          `centavosDeDigitos` da `/inicio`: lá o campo é de receita, onde
          centavo importa e digitar "1600" vira R$ 16,00 (teclado de
          banco). Verba de anúncio não tem centavo — digitar "1600" tem que
          dar R$ 1.600. A guarda de inteiro seguro é a mesma.
          ============================================================ */}
      <div className={css.campoDinheiro}>
        <span className={css.moeda} aria-hidden="true">
          R$
        </span>
        <input
          className={css.campoValor}
          value={texto}
          onChange={(e) => {
            const reais = reaisDeDigitos(e.target.value);
            setTexto(reais === null ? "" : EM_REAIS.format(reais));
            const novo = reais ?? 0;
            setV(novo);
            aoMudar(novo);
          }}
          placeholder="1.200"
          aria-label="Quanto investir por mês, em reais"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
        />
        <span className={css.valorNota}>por mês</span>
      </div>

      {/* O texto vivo recalcula a cada dígito — é a parte que o Victor
          pediu para manter. Com o campo vazio ele não aparece: "R$ 0 por
          mês são R$ 0 por dia" é ruído, não informação. */}
      {v > 0 && (
        <div className={css.vivo}>
          {frases.map((f) => (
            <p key={f} className={css.vivoLinha}>
              {f}
            </p>
          ))}
        </div>
      )}

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
          disabled={v <= 0 || abaixoDoPiso}
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
