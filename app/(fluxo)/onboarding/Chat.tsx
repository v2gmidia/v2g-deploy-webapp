"use client";

import { useEffect, useRef, useState } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { SeletorDeNicho } from "@/components/ui/SeletorDeNicho";
import type { Nicho } from "@/lib/nichos/tipos";
import { LISTA_NAO_CARREGOU } from "@/lib/nichos/gravado";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, proximaPergunta, type Pergunta } from "./perguntas";

interface ChatProps {
  inicial: Record<string, RespostaGravada>;
  /**
   * A lista viva do `GET /nichos`, buscada no servidor e passada por props.
   *
   * O TOKEN NÃO PODE VIR PARA CÁ. `X-V2G-Token` é segredo entre máquinas —
   * quem o tem age em nome de qualquer cliente. Por isso a chamada fica no
   * Server Component e este componente recebe a lista já pronta; o filtro,
   * esse sim, roda aqui.
   *
   * `null` = o backend não respondeu. NÃO existe lista de reserva: a
   * pergunta passa a ser só o campo de texto, com uma linha dizendo que a
   * lista não carregou. Ver `semLista` abaixo.
   */
  nichos: Nicho[] | null;
}

export function Chat({ inicial, nichos }: ChatProps) {
  const [respostas, setRespostas] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [cidade, setCidade] = useState("");
  const [textoAberto, setTextoAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [sacode, setSacode] = useState<"cidade" | "texto" | null>(null);

  const campoTexto = useRef<HTMLInputElement>(null);
  const campoCidade = useRef<HTMLInputElement>(null);

  const respondidas = ORDEM.filter((id) => respostas[id]);
  const atual = proximaPergunta(respondidas);
  const concluido = atual === null;

  // Numa pergunta sem chip o campo é a única resposta possível: ele nasce
  // aberto, e não atrás de um "ou digite sua resposta" que só teria uma
  // saída. `soTexto` decide isso; `textoAberto` continua sendo o
  // interruptor das perguntas que têm chip E texto.
  //
  // A pergunta de nicho COM O CATÁLOGO FORA cai na mesma regra e pelo
  // mesmo motivo: ali o texto é a única saída que existe.
  const semListaViva = (p: Pergunta) => p.seletorDeNicho === true && nichos === null;
  const campoVisivel = (p: Pergunta) =>
    p.soTexto === true || semListaViva(p) || textoAberto;

  useEffect(() => {
    if (atual && campoVisivel(atual)) campoTexto.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoAberto, atual?.id]);

  function chacoalhar(qual: "cidade" | "texto") {
    setSacode(null);
    // deixa o React remover a classe antes de recolocar, senão a
    // animação não reinicia quando o erro se repete
    requestAnimationFrame(() => setSacode(qual));
    setTimeout(() => setSacode(null), 400);
  }

  async function enviar(
    pergunta: Pergunta,
    valor: string,
    origem: "chip" | "texto",
  ) {
    if (enviando) return;

    const cidadeLimpa = cidade.trim();
    if (pergunta.pedeCidade && origem === "chip" && !cidadeLimpa) {
      chacoalhar("cidade");
      campoCidade.current?.focus();
      return;
    }
    if (!valor.trim()) {
      chacoalhar("texto");
      campoTexto.current?.focus();
      return;
    }

    setEnviando(true);
    setErro(null);

    const resultado = await salvarRespostaAction({
      qid: pergunta.id,
      texto: valor,
      origem,
      ...(pergunta.pedeCidade && origem === "chip" ? { cidade: cidadeLimpa } : {}),
    });

    setEnviando(false);

    if (!resultado.ok || !resultado.estado) {
      setErro(resultado.erro ?? "Não conseguimos salvar sua resposta.");
      return;
    }

    setRespostas(resultado.estado.respostas);
    setTexto("");
    setTextoAberto(false);
    setCidade("");
  }

  return (
    <>
      <p className="mission-tag">Sua primeira missão · passo 1 de 3</p>
      <h1 className="auth-h">Sobre o seu negócio</h1>
      <p className="auth-sub">
        Uma pergunta por vez. Responda clicando ou escrevendo do seu jeito — não existe
        resposta errada aqui.
      </p>

      {erro && <p className="form-error">{erro}</p>}

      <div className="chat">
        {PERGUNTAS.map((p) => {
          const resposta = respostas[p.id];
          const ehAtual = atual?.id === p.id;
          if (!resposta && !ehAtual) return null;

          // O seletor de nicho substitui os chips E o campo de texto desta
          // pergunta: ele já é os dois.
          const usaSeletor = p.seletorDeNicho === true && nichos !== null;

          // ============================================================
          // CATÁLOGO FORA: SÓ O TEXTO LIVRE, E A TELA DIZ POR QUÊ.
          //
          // Não existe lista de reserva. Os cinco chips fixos que havia
          // aqui até 22/08 não eram nichos — um cobria três de uma vez,
          // dois não cobriam nenhum — e gravar um deles seria palpite com
          // cara de escolha do cliente. Quando o catálogo está fora, a
          // verdade é que não sabemos o nicho, e a frase da pessoa é a
          // única fonte honesta que sobra.
          //
          // A LINHA DE CONTEXTO NÃO É ENFEITE. "Escreva do seu jeito"
          // sozinho parece que nunca houve lista — a pessoa não tem como
          // saber que está vendo um estado degradado, e conclui que o
          // produto é assim. Dizer que a lista não carregou é a diferença
          // entre uma falha nossa e uma limitação nossa.
          // ============================================================
          const semLista = p.seletorDeNicho === true && nichos === null;

          return (
            <div className="qblock" key={p.id}>
              {p.contador && <p className="qcount">{p.contador}</p>}
              <Bubble de="ai">{p.texto}</Bubble>

              {ehAtual && p.pedeCidade && (
                <div className="city-row">
                  <label className="sr-only" htmlFor="campo-cidade">
                    Sua cidade
                  </label>
                  <input
                    id="campo-cidade"
                    ref={campoCidade}
                    type="text"
                    placeholder="Sua cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={sacode === "cidade" ? "shake" : undefined}
                  />
                </div>
              )}

              {/*
                SÓ ENQUANTO É A PERGUNTA DA VEZ, ao contrário dos chips das
                outras, que ficam na tela desbotados depois de respondidas.
                A diferença é de peso: cinco chips apagados são um rastro da
                conversa; dez chips apagados mais um campo de busca são
                mobília morta entre a pergunta e a resposta. O balão do
                usuário logo abaixo já diz o que foi escolhido.
              */}
              {ehAtual && p.seletorDeNicho && nichos && (
                <SeletorDeNicho
                  nichos={nichos}
                  ocupado={enviando}
                  aoEscolher={(n) => enviar(p, n.rotulo, "chip")}
                  aoEscreverLivre={(t) => enviar(p, t, "texto")}
                  rotuloOutro={p.chipAbreTexto ?? "Outro"}
                  placeholderLivre={p.fallbackPlaceholder}
                  rotuloLivre={p.fallbackLabel}
                />
              )}

              {ehAtual && semLista && (
                <p className="nicho-sem-lista" role="status" aria-live="polite">
                  {LISTA_NAO_CARREGOU}
                </p>
              )}

              {!usaSeletor && !semLista && (p.opcoes.length > 0 || p.chipAbreTexto) && (
              <div className="chips-row">
                {p.opcoes.map((o) => (
                  <button
                    key={o.echo}
                    className="chip-opt"
                    type="button"
                    disabled={!ehAtual || enviando}
                    onClick={() => enviar(p, o.echo, "chip")}
                  >
                    {o.rotulo}
                  </button>
                ))}
                {p.chipAbreTexto && (
                  <button
                    className="chip-opt"
                    type="button"
                    disabled={!ehAtual || enviando}
                    onClick={() => setTextoAberto(true)}
                  >
                    {p.chipAbreTexto}
                  </button>
                )}
              </div>
              )}

              {ehAtual && !usaSeletor && p.fallbackPlaceholder && (
                <>
                  {!campoVisivel(p) && (
                    <button
                      className="text-fallback"
                      type="button"
                      onClick={() => setTextoAberto(true)}
                    >
                      ou digite sua resposta
                    </button>
                  )}
                  {campoVisivel(p) && (
                    <div className="fallback-field">
                      <label className="sr-only" htmlFor="campo-texto">
                        {p.fallbackLabel}
                      </label>
                      <input
                        id="campo-texto"
                        ref={campoTexto}
                        type="text"
                        placeholder={p.fallbackPlaceholder}
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            enviar(p, texto, "texto");
                          }
                        }}
                        className={sacode === "texto" ? "shake" : undefined}
                      />
                      <button
                        className="mini-send"
                        type="button"
                        disabled={enviando}
                        onClick={() => enviar(p, texto, "texto")}
                      >
                        {enviando ? "…" : "Enviar"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {resposta && <Bubble de="user">{resposta.echo}</Bubble>}
            </div>
          );
        })}

        {concluido && (
          <Bubble de="ai">
            Boa. Agora faltam três contas rápidas sobre o seu dinheiro — e se você não
            souber alguma, tudo bem, a gente resolve numa conversa.
          </Bubble>
        )}
      </div>

      {concluido && (
        <>
          {/* NÃO HÁ CONFETE AQUI, e a ausência é a decisão. O bloco 1 não
              termina o passo 1: as contas do bloco 2 são a outra metade de
              "sobre o seu negócio". Comemorar aqui daria a peça por
              encaixada com três perguntas ainda por fazer — e celebração
              antes de conquista real é justamente o que a marca não faz. */}
          <a className="cta" href="/onboarding/contas">
            Continuar para as contas
          </a>
        </>
      )}
    </>
  );
}

