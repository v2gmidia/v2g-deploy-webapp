import { estadoDoCliente } from "@/lib/estado/cliente";
import { Analisar } from "./Analisar";
import { AmostraDeVereditos } from "./Amostra";

/**
 * Analisar um criativo pronto — passo 6 do teste de produto.
 *
 * ============================================================
 * ESTA ROTA ERA UM `permanentRedirect("/anuncios")`, E O REDIRECT TINHA
 * MOTIVO. Ele não some: muda de lugar.
 *
 * `/campanhas` e `/criativos` viraram `/anuncios` no lote 8 porque o
 * cliente não separa a campanha do criativo. Isso continua verdadeiro
 * para a LISTA de peças — e `/campanhas` segue redirecionando.
 *
 * O que nasceu aqui é outra coisa: uma pessoa que já tem a peça pronta,
 * feita por ela ou por um designer, e quer saber se serve antes de
 * gastar com ela. É uma tarefa, não um lugar de navegação — por isso
 * **não vira item de menu** (continuam os cinco do QA-1).
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
        <h1>Essa peça presta?</h1>
        <p>
          Mande a imagem que você já tem pronta e a gente diz se ela serve para anunciar — antes
          de você gastar com ela.
        </p>
      </div>

      {!podeEnviar && (
        <p className="analise-aviso" role="status">
          A gente ainda não tem uma campanha sua em montagem, e é a ela que a peça se liga.
          Assim que ela existir, esta página passa a aceitar envio.
        </p>
      )}

      {amostra ? <AmostraDeVereditos qual={amostra} /> : <Analisar podeEnviar={podeEnviar} />}

      <p className="analise-rodape">
        A análise não publica nem altera a sua imagem. Ela continua sua, do jeito que você mandou.
      </p>
    </>
  );
}
