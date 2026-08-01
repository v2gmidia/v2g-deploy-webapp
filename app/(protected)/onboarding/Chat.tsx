"use client";

import { useEffect, useRef, useState } from "react";
import { Bubble } from "@/components/ui/Bubble";
import { salvarRespostaAction, type RespostaGravada } from "./actions";
import { ORDEM, PERGUNTAS, ULTIMA, proximaPergunta, type Pergunta } from "./perguntas";

interface ChatProps {
  inicial: Record<string, RespostaGravada>;
}

export function Chat({ inicial }: ChatProps) {
  const [respostas, setRespostas] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [cidade, setCidade] = useState("");
  const [textoAberto, setTextoAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [sacode, setSacode] = useState<"cidade" | "texto" | null>(null);

  // Só aparece quando a última resposta é dada NESTA sessão. Quem
  // reabre a página com o passo já concluído não leva confete de novo.
  const [comemorou, setComemorou] = useState(false);

  const campoTexto = useRef<HTMLInputElement>(null);
  const campoCidade = useRef<HTMLInputElement>(null);

  const respondidas = ORDEM.filter((id) => respostas[id]);
  const atual = proximaPergunta(respondidas);
  const concluido = atual === null;

  useEffect(() => {
    if (textoAberto) campoTexto.current?.focus();
  }, [textoAberto, atual?.id]);

  useEffect(() => {
    if (!comemorou) return;
    const t = setTimeout(() => setComemorou(false), 3400);
    return () => clearTimeout(t);
  }, [comemorou]);

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
    if (pergunta.id === ULTIMA) setComemorou(true);
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

              {ehAtual && p.fallbackPlaceholder && (
                <>
                  {!textoAberto && (
                    <button
                      className="text-fallback"
                      type="button"
                      onClick={() => setTextoAberto(true)}
                    >
                      ou digite sua resposta
                    </button>
                  )}
                  {textoAberto && (
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

        {concluido && <Bubble de="ai">Perfeito. Já sei o essencial sobre o seu negócio.</Bubble>}
      </div>

      {concluido && (
        <>
          {/* O passo 2 (visual da marca) depende de upload de arquivo e o
              passo 3 de conexão com o Meta e geração de criativo — nada
              disso existe ainda. O botão fica visível e desabilitado em vez
              de levar a uma tela que não está pronta. */}
          <p className="form-notice">
            Seu passo 1 está salvo. O passo 2 (o visual da sua marca) ainda não está
            disponível — assim que estiver, é daqui que ele continua.
          </p>
          <button className="cta" type="button" disabled>
            Continuar para o visual da marca
          </button>
        </>
      )}

      {comemorou && (
        <div className="toast show" role="status" aria-live="polite">
          <span className="pip" />
          <span>1 de 3 concluído — primeira peça no lugar.</span>
        </div>
      )}
    </>
  );
}

