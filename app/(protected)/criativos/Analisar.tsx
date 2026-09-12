"use client";

import { useEffect, useRef, useState } from "react";
import type { AnaliseDaPeca } from "@/lib/backend";
import { ACEITOS_NO_INPUT, conferirArquivo, type Recusa } from "@/lib/criativos/envio";
import { TETO_DA_ESPERA_MS } from "@/lib/criativos/limites.mjs";
import { apresentarVeredito } from "@/lib/criativos/veredito";
import { analisarPecaAction, type ResultadoDaAnalise } from "./actions";

/**
 * Analisar uma peça pronta — o passo 6 do teste de produto.
 *
 * ============================================================
 * A RECUSA ACONTECE NO NAVEGADOR, ANTES DE QUALQUER UPLOAD.
 *
 * Quem sobe foto pelo celular manda arquivo de 8 MB no 4G. Recusar
 * depois do upload faz a pessoa esperar para ler que não serve — e
 * tentar de novo, com o mesmo arquivo, porque ela não entendeu.
 *
 * `conferirArquivo` já existe e tem 48 conferências em
 * `conferir:envio`: vídeo, WEBP, formato, extensão que não bate, lado
 * menor que 1024 e arquivo vazio. Nada disso é reimplementado aqui.
 * ============================================================
 */
/**
 * A ÚLTIMA PORTA: a promessa que não resolve NEM rejeita.
 *
 * ============================================================
 * NÃO DÁ PARA ABORTAR UMA SERVER ACTION, E ISSO PRECISA ESTAR DITO.
 *
 * O `fetch` de uma Server Action é montado pelo React, não por nós —
 * não há como passar um `signal`. O que este teto faz é parar de
 * ESPERAR, não parar o trabalho: o servidor segue até o fim, e a
 * análise que estava em curso é concluída e descartada.
 *
 * É a escolha certa mesmo assim. O caso que ele cobre é a conexão que
 * some sem fechar — no celular, trocar de Wi-Fi para 4G faz exatamente
 * isso — e aí a promessa fica pendente para sempre. Sem este teto, o
 * `finally` de cima nunca roda.
 *
 * `AbortSignal.timeout` em vez de `setTimeout`: ele já limpa o relógio
 * sozinho quando a corrida termina, e não deixa timer pendurado.
 * ============================================================
 */
class EsperaEstourou extends Error {}

function comTetoDeEspera<T>(promessa: Promise<T>): Promise<T> {
  const sinal = AbortSignal.timeout(TETO_DA_ESPERA_MS);
  return Promise.race([
    promessa,
    new Promise<never>((_, rejeitar) => {
      sinal.addEventListener("abort", () => rejeitar(new EsperaEstourou()), { once: true });
    }),
  ]);
}

type Fase =
  | { nome: "parado" }
  | { nome: "recusado"; recusa: Recusa }
  | { nome: "analisando" }
  | { nome: "pronto"; resultado: ResultadoDaAnalise };

export function Analisar({ podeEnviar }: { podeEnviar: boolean }) {
  const [fase, setFase] = useState<Fase>({ nome: "parado" });
  const [nomeDoArquivo, setNomeDoArquivo] = useState<string | null>(null);
  const [aceito, setAceito] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [demorando, setDemorando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  /**
   * A MINIATURA DO QUE SUBIU.
   *
   * Existe para responder a pergunta que a pessoa faz sozinha enquanto
   * espera: "subiu a foto certa?". Sem ela, o único sinal do arquivo é o
   * nome — e no celular o nome é `IMG_20260912_0032.jpg`, que não
   * responde nada.
   *
   * A URL é criada aqui e REVOGADA pela função de limpeza deste mesmo
   * efeito. Ficar preso ao arquivo escolhido (e não criar a URL dentro
   * do `onChange`) é o que garante que trocar de imagem, recomeçar ou
   * sair da tela não deixem `blob:` pendurado na memória do navegador.
   */
  useEffect(() => {
    if (!aceito) {
      setPrevia(null);
      return;
    }
    const url = URL.createObjectURL(aceito);
    setPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [aceito]);

  /**
   * A SEGUNDA LINHA, DEPOIS DE ~20 SEGUNDOS.
   *
   * Não é prazo e não é contagem: é o reconhecimento de que a espera
   * passou do normal, que é o momento em que a pessoa começa a achar
   * que travou. Medido em produção: a análise leva ~8s, então 20s já é
   * fora da curva.
   *
   * Não diz quantos minutos faltam porque **ninguém sabe** — o backend
   * não devolve estimativa. Número aqui seria invenção, da mesma
   * família das "48 horas" que já saíram do produto.
   */
  useEffect(() => {
    if (fase.nome !== "analisando") {
      setDemorando(false);
      return;
    }
    const relogio = setTimeout(() => setDemorando(true), 20_000);
    return () => clearTimeout(relogio);
  }, [fase.nome]);

  async function escolheu(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setNomeDoArquivo(arquivo.name);

    const recusa = await conferirArquivo(arquivo);
    if (recusa) {
      // O campo é limpo: deixar o nome do arquivo recusado ali sugere
      // que ele ainda vai ser enviado. A miniatura sai junto, pelo mesmo
      // motivo: imagem na tela é sinal de que ela foi aceita.
      if (campo.current) campo.current.value = "";
      setAceito(null);
      setFase({ nome: "recusado", recusa });
      return;
    }

    setAceito(arquivo);

    // ============================================================
    // NENHUM CAMINHO DAQUI SAI MANTENDO "analisando". É O CONSERTO.
    //
    // O defeito de 12/09 era esta função sem `try`: o `await` rejeitava,
    // a linha seguinte não rodava, e a tela girava para sempre dizendo
    // "dá para esperar aqui".
    //
    // O gatilho foi o teto de 1 MB do Next, que já está fechado na
    // camada de cima — **mas o defeito não era o teto.** Era não haver
    // caminho de erro: perda de rede no meio do upload, aba suspensa
    // pelo iOS, 500 do próprio framework, tudo rejeitava igual.
    //
    // Por isso o terminal está no `finally`, e não no `catch`: `finally`
    // roda nos três desfechos, e é a única forma de a garantia não
    // depender de alguém ter previsto a falha certa.
    // ============================================================
    setFase({ nome: "analisando" });

    let resultado: ResultadoDaAnalise = {
      ok: false,
      recado:
        "A gente não conseguiu terminar de olhar sua imagem agora. Tente de novo em um instante.",
    };

    try {
      const dados = new FormData();
      dados.append("arquivos", arquivo);
      resultado = await comTetoDeEspera(analisarPecaAction(dados));
    } catch (motivo) {
      // O que o dono lê depende do que dá para fazer a respeito, e há
      // dois casos com saídas diferentes. Nenhum deles usa a palavra
      // "erro": ela mandou a foto do próprio negócio e não errou nada.
      resultado = {
        ok: false,
        recado:
          motivo instanceof EsperaEstourou
            ? "A análise está demorando mais do que o normal e a gente parou de esperar. Sua imagem não foi publicada nem alterada — tente de novo."
            : "A gente não conseguiu terminar de olhar sua imagem agora. Se ela for muito grande, mande em tamanho menor; se não, tente de novo em um instante.",
      };
    } finally {
      setFase({ nome: "pronto", resultado });
    }
  }

  function recomecar() {
    if (campo.current) campo.current.value = "";
    setNomeDoArquivo(null);
    setAceito(null);
    setFase({ nome: "parado" });
  }

  return (
    <section className="analise">
      {fase.nome !== "pronto" && (
        <div className="analise-envio">
          <label className="analise-alvo" htmlFor="analise-arquivo">
            <span className="analise-icone" aria-hidden="true">
              {/* moldura de foto, traço simples — sem robô, sem cérebro */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5-5-5 5-2-2-3 3" />
              </svg>
            </span>
            <b>Escolha a imagem do seu anúncio</b>
            <span>JPG ou PNG, do tamanho original — sem reduzir para mandar.</span>
          </label>
          <input
            ref={campo}
            id="analise-arquivo"
            className="sr-only"
            type="file"
            accept={ACEITOS_NO_INPUT}
            disabled={!podeEnviar || fase.nome === "analisando"}
            onChange={escolheu}
          />

          {fase.nome === "recusado" && (
            <p className="analise-recusa" role="status">
              <b>{fase.recusa.arquivo}</b>
              {fase.recusa.texto}
            </p>
          )}

          {/* ============================================================
              A ESPERA, SEM PROMESSA DE PRAZO.

              Não diz "alguns segundos", não diz "quase lá" e não tem
              barra que anda sozinha. Nenhum dos três é medido, e barra
              falsa é a promessa mais cara: quando ela chega no fim e
              nada acontece, a pessoa acha que travou.

              O QUE MUDOU EM 12/09, e por quê. Medido em produção, no
              celular: durante os ~8s a tela não dava sinal de vida e
              parecia travada. Havia um ponto pulsando, mas 10px mudando
              de opacidade ao lado de uma frase não é lido como
              atividade — o olho está no texto. Três coisas entraram:
              o anel que gira (movimento contínuo, e movimento que NÃO
              sugere fração cumprida), a miniatura do arquivo, e a
              segunda linha depois de ~20s.

              Continua sem porcentagem e sem barra que preenche: o
              backend não devolve progresso, e número inventado aqui é
              a mesma família do "48 horas" que saiu do produto.
              ============================================================ */}
          {fase.nome === "analisando" && (
            <div className="analise-andamento">
              {previa && (
                <img
                  className="analise-previa"
                  src={previa}
                  alt="A imagem que você mandou para análise"
                />
              )}
              <span className="analise-girando" aria-hidden="true" />
              <div className="analise-dizeres" role="status">
                <p className="analise-espera">
                  Olhando sua imagem. Dá para esperar aqui — quando terminar, aparece nesta tela.
                </p>
                {demorando && (
                  <p className="analise-demora">
                    Às vezes demora um pouco mais. Pode deixar esta tela aberta.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {fase.nome === "pronto" && <Resultado resultado={fase.resultado} aoRecomecar={recomecar} nome={nomeDoArquivo} />}
    </section>
  );
}

function Resultado({
  resultado,
  aoRecomecar,
  nome,
}: {
  resultado: ResultadoDaAnalise;
  aoRecomecar: () => void;
  nome: string | null;
}) {
  if (!resultado.ok) {
    return (
      <div className="analise-saida">
        <p className="analise-recado" role="status">
          {resultado.recado}
        </p>
        <button type="button" className="cta ghost" onClick={aoRecomecar}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const { veredito, motivos, recusados, motivo } = resultado.analise;
  const apresentacao = apresentarVeredito(veredito);

  // ============================================================
  // `veredito: null` NÃO É UM VEREDITO NEUTRO — é a ausência de um.
  //
  // Ele quer dizer que nenhum arquivo foi aceito, então não houve o que
  // julgar. A tela mostra o que veio em `recusados` e o `motivo`, e
  // **não fala em veredito** — nem para dizer que não tem.
  //
  // Escrever "não conseguimos avaliar" aqui seria transformar uma
  // recusa de arquivo numa falha de análise, e são coisas diferentes:
  // a primeira a pessoa resolve trocando a foto.
  // ============================================================
  if (apresentacao === null) {
    return (
      <div className="analise-saida">
        <div className="analise-cartao v-neutro">
          <b className="analise-titulo">Essa imagem não deu para usar</b>
          {motivo && <p className="analise-apoio">{motivo}</p>}
          {recusados.length > 0 && (
            <ul className="analise-motivos">
              {recusados.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="cta" onClick={aoRecomecar}>
          Escolher outra imagem
        </button>
      </div>
    );
  }

  return (
    <div className="analise-saida">
      <div className={`analise-cartao ${apresentacao.estilo}`}>
        <span className="analise-selo">{apresentacao.selo}</span>
        <b className="analise-titulo">{apresentacao.titulo}</b>
        <p className="analise-apoio">{apresentacao.apoio}</p>

        {/* OS MOTIVOS VÃO COMO VIERAM. O backend os escreve para o dono;
            reescrever aqui seria a tradução local que o `nivel_frase` já
            pagou uma vez. Lista vazia: o veredito aparece sozinho. */}
        {motivos.length > 0 && (
          <ul className="analise-motivos">
            {motivos.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>

      {nome && <p className="analise-arquivo-nome">{nome}</p>}

      <button type="button" className="cta ghost" onClick={aoRecomecar}>
        Analisar outra imagem
      </button>
    </div>
  );
}
