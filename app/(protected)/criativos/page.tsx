import { estadoDoCliente } from "@/lib/estado/cliente";
import { Analisar } from "./Analisar";
import { AmostraDeVereditos } from "./Amostra";
import { MinhasPecas } from "./MinhasPecas";
import { CriarPeca } from "./CriarPeca";

/**
 * A CASA DO CRIATIVO — três blocos numa página. Pilar 3 e 4 do produto.
 *
 * ============================================================
 * ELA VIROU ITEM DE BARRA EM 12/09/2026, E O DOCSTRING ANTERIOR DIZIA O
 * CONTRÁRIO. A frase que saiu daqui era esta:
 *
 *   "É uma tarefa, não um lugar de navegação — por isso não vira item
 *    de menu (continuam os cinco do QA-1)."
 *
 * Estava certa enquanto a página era UMA tarefa: mandar a peça e ler o
 * veredito. Deixou de ser hoje — ela passou a hospedar três coisas, e a
 * terceira é recorrente. **Continuam cinco itens**: `/vendas` saiu da
 * barra no lugar dela, e o motivo está em `docs/decisoes.md` e no
 * comentário da `(protected)/layout.tsx`.
 *
 * `/campanhas` segue redirecionando para `/anuncios`, e `/vendas` segue
 * no ar. Nenhuma URL quebrou.
 *
 * ============================================================
 * OS TRÊS BLOCOS, E POR QUE NESTA ORDEM
 *
 *   1. Tenho uma peça pronta   FUNCIONA hoje — passo 6 do teste
 *   2. Minhas peças            vazio POR MEDIÇÃO — ver MinhasPecas.tsx
 *   3. Criar uma peça nova     estrutura, sem backend — ver CriarPeca.tsx
 *
 * O que funciona vem primeiro. É o inverso da ordem natural de um
 * produto (criar, ver, conferir) e é de propósito: ordenar pelo fluxo
 * ideal poria o bloco que não faz nada no topo, e quem abre a página
 * pela barra cairia primeiro no que não existe.
 * ============================================================
 */
export default async function CriativosPage() {
  const estado = await estadoDoCliente(new Date());

  // ============================================================
  // SEM EXECUÇÃO A TELA NÃO QUEBRA — ela explica.
  //
  // `estadoDoCliente()` devolve `execucao: null` para quem ainda não
  // disparou o pipeline, e é o caso da maioria das contas hoje. A peça
  // se liga a uma execução: sem ela, não há onde gravar.
  //
  // O formulário aparece DESABILITADO em vez de sumir, de propósito: a
  // pessoa que chegou aqui veio procurar isto, e uma tela sem nada faz
  // ela achar que errou o caminho.
  // ============================================================
  const podeEnviar = estado.diaSeguinte.execucao !== null;

  // O portão das fixtures — os mesmos dois trincos da `/inicio`. Só
  // decide o que esta tela DESENHA; não muda o que o backend responde.
  const amostra =
    process.env.NODE_ENV !== "production" ? (process.env.V2G_FIXTURE_ANALISE ?? null) : null;

  return (
    <>
      <div className="page-head">
        <h1>Criativos</h1>
        <p>
          O anúncio que as pessoas veem. Aqui você confere uma peça que já tem e vê as suas
          peças.
        </p>
      </div>

      {/* Índice dos blocos. Em 390px a página fica alta, e sem ele o dono
          rola sem saber quantos blocos existem — e o terceiro, que é o
          que ele mais quer, é o último. Âncora e não rota: nenhuma URL
          nova, e o alvo tem 44px de altura mínima. */}
      <nav className="casa-indice" aria-label="Blocos desta página">
        <a href="#casa-analise">Tenho uma peça pronta</a>
        <a href="#casa-pecas">Minhas peças</a>
        <a href="#casa-criar">Criar uma peça nova</a>
      </nav>

      <section className="casa-bloco" aria-labelledby="casa-analise">
        <div className="casa-bloco-head">
          <h2 id="casa-analise" className="section-title">
            Tenho uma peça pronta
          </h2>
          <p>
            Mande a imagem que você já tem e a gente diz se ela serve para anunciar — antes de
            você gastar com ela.
          </p>
        </div>

        {!podeEnviar && (
          <p className="analise-aviso" role="status">
            A gente ainda não tem uma campanha sua em montagem, e é a ela que a peça se liga.
            Assim que ela existir, esta página passa a aceitar envio.
          </p>
        )}

        {/* A lógica da análise não mudou nem uma linha: o mesmo
            `<Analisar>`, a mesma action, o mesmo `podeEnviar`. Só mudou o
            lugar dela dentro da página. */}
        {amostra ? <AmostraDeVereditos qual={amostra} /> : <Analisar podeEnviar={podeEnviar} />}

        <p className="analise-rodape">
          A análise não publica nem altera a sua imagem. Ela continua sua, do jeito que você
          mandou.
        </p>
      </section>

      <MinhasPecas />
      <CriarPeca />
    </>
  );
}
