"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONVITE_ABAIXO_DO_CAMPO,
  CONVITE_NO_MICROFONE,
  NICHOS_DA_BANCADA,
  PASSOS,
  RAIOS,
  TOTAL,
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

type Respostas = Record<string, string>;

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
};

export function Onboarding({
  passoInicial = 0,
  transcricaoLigada,
  motivoSemTranscricao,
  comExemplo = false,
  nichoDeExemplo = null,
}: {
  passoInicial?: number;
  /** a `OPENAI_API_KEY` existe neste ambiente? Decidido no servidor. */
  transcricaoLigada: boolean;
  motivoSemTranscricao: string;
  /** preenche as respostas anteriores — só para capturar tela */
  comExemplo?: boolean;
  /** troca o tipo de negócio do dado de exemplo — só para capturar tela */
  nichoDeExemplo?: string | null;
}) {
  const [passo, setPasso] = useState(passoInicial);
  const [respostas, setRespostas] = useState<Respostas>(
    comExemplo ? { ...EXEMPLO, ...(nichoDeExemplo ? { nicho: nichoDeExemplo } : {}) } : {},
  );
  const [rascunho, setRascunho] = useState("");
  const [recado, setRecado] = useState<string | null>(null);
  const [ditado, setDitado] = useState<Ditado | null>(null);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [entrando, setEntrando] = useState(true);

  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const campo = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const atual: Passo | null = passo < TOTAL ? PASSOS[passo]! : null;
  const fim = atual === null;

  // ---- recuperar o que já foi respondido antes -------------------------
  useEffect(() => {
    if (comExemplo) return;
    try {
      const bruto = window.localStorage.getItem(CHAVE_LOCAL);
      if (bruto) setRespostas(JSON.parse(bruto) as Respostas);
    } catch {
      // localStorage bloqueado (janela anônima, cookie desligado): a tela
      // funciona igual, só não lembra quando ele voltar.
    }
  }, [comExemplo]);

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
    // Foco no campo a cada pergunta nova: quem responde de teclado não
    // deveria ter que clicar antes de digitar.
    const t = setTimeout(() => campo.current?.focus(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo]);

  const custo = useMemo(() => custoDoNicho(respostas.nicho ?? null), [respostas.nicho]);

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
    gravar({ ...respostas, ...extras, [atual.id]: veredito.valor });
    setPasso((p) => p + 1);
  }

  function voltar() {
    setPasso((p) => Math.max(0, p - 1));
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
        const audio = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        await transcrever(audio);
      };
      gravador.current = rec;
      rec.start();
      setGravando(true);
    } catch {
      setRecado("Não consegui abrir seu microfone. Pode escrever pelo teclado.");
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
        setRecado(dados.motivo ?? "Não consegui transcrever agora. Pode escrever pelo teclado.");
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
            <Linha rotulo="Você" valor={respostas.pessoa} />
            <Linha rotulo="Empresa" valor={respostas.empresa} />
            <Linha
              rotulo="Atende"
              valor={
                respostas.local
                  ? `${respostas.local} · até ${respostas.local_raio ?? "—"} km`
                  : undefined
              }
            />
            <Linha rotulo="Vende" valor={respostas.descricao} />
            <Linha rotulo="Instagram" valor={respostas.instagram} />
            <Linha rotulo="Site" valor={respostas.site || "não tem"} />
            <Linha
              rotulo="Tipo de negócio"
              valor={
                NICHOS_DA_BANCADA.find((n) => n.nicho === respostas.nicho)?.rotulo ?? undefined
              }
            />
            <Linha rotulo="WhatsApp" valor={respostas.whatsapp} />
            <Linha rotulo="Por mês" valor={porMes(respostas.verba)} />
            <Linha
              rotulo="Material"
              valor={respostas.material ? `${respostas.material} arquivo(s)` : undefined}
            />
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
            href={`${WHATSAPP_HUMANO}?text=${encodeURIComponent(
              `Oi! Acabei de preencher o cadastro da ${respostas.empresa ?? "minha empresa"} e quero marcar os 30 minutos.` +
                (respostas.correcao
                  ? `

Uma correção no que eu preenchi: ${respostas.correcao.slice(0, 700)}`
                  : ""),
            )}`}
            target="_blank"
            rel="noopener"
          >
            Agendar os 30 minutos
          </a>
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
function porMes(bruto?: string): string | undefined {
  const n = Number(bruto);
  if (!bruto || !Number.isFinite(n)) return undefined;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <div className={css.resumoLinha}>
      <dt className={css.resumoRotulo}>{rotulo}</dt>
      <dd className={css.resumoValor}>{valor && valor.length > 0 ? valor : "—"}</dd>
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
