import { createClient } from "@/lib/supabase/server";

/**
 * `/exclusao-de-dados/<codigo>` — o estado de um pedido de exclusão.
 *
 * ============================================================
 * A META EXIGE UMA URL CONSULTÁVEL, E ESTA PÁGINA É O QUE FAZ O CÓDIGO
 * DE CONFIRMAÇÃO SIGNIFICAR ALGUMA COISA.
 *
 * Sem ela o `confirmation_code` seria um número bonito devolvido por um
 * endpoint que ninguém consegue auditar. Com ela, quem pediu vê a
 * CONTAGEM do que saiu — e se saiu zero, lê zero.
 * ============================================================
 *
 * ============================================================
 * PÚBLICA, E POR ISSO NÃO MOSTRA DADO DE NINGUÉM.
 *
 * Quem abre não tem sessão: o código chega pela tela do Facebook. A
 * leitura passa por `status_da_exclusao()`, que devolve estado e
 * contagens e **nunca** o `meta_user_id` ou os `business_ids` — um código
 * vazado não pode entregar junto a identidade de quem pediu.
 *
 * Por isso usa o cliente NORMAL, não o admin: a função é `security
 * definer` com grant para `anon`, então ela é o recorte, e nenhuma
 * chave-mestra passa por aqui.
 * ============================================================
 *
 * O TEXTO DIZ O QUE FICOU, e é a parte que interessa mais que a lista do
 * que saiu. Uma página que só celebrasse "dados excluídos" deixaria a
 * pessoa achando que a conta some junto — e ela não some. Ver
 * `docs/exclusao-de-dados-meta.md`.
 */

interface Estado {
  solicitado_em: string;
  concluido_em: string | null;
  o_que_foi_apagado: Record<string, unknown>;
  teve_erro: boolean;
}

/** Plural sem malabarismo: só os casos que esta página usa. */
function linhaDeContagem(n: number, um: string, muitos: string): string | null {
  if (!n) return null;
  return `${n} ${n === 1 ? um : muitos}`;
}

export default async function EstadoDaExclusao({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("status_da_exclusao", { p_codigo: codigo });

  const estado: Estado | null =
    !error && Array.isArray(data) && data.length > 0 ? (data[0] as Estado) : null;

  if (!estado) {
    return (
      <section className="auth-card">
        <h1>Não encontramos esse pedido</h1>
        <p>
          O código não confere com nenhum pedido de exclusão nosso. Confira se ele foi copiado
          por inteiro. Se você acha que deveria existir, fale com a gente que a gente procura.
        </p>
      </section>
    );
  }

  const r = estado.o_que_foi_apagado ?? {};
  const numero = (chave: string) => {
    const v = r[chave];
    return typeof v === "number" ? v : 0;
  };

  const itens = [
    numero("conexoes") > 0 ? "a conexão com o Facebook e o Instagram" : null,
    linhaDeContagem(numero("segredos"), "chave de acesso", "chaves de acesso"),
    linhaDeContagem(numero("contas"), "conta de anúncio", "contas de anúncio"),
    linhaDeContagem(numero("metricas"), "dia de números do Facebook", "dias de números do Facebook"),
    linhaDeContagem(numero("campanhas"), "campanha", "campanhas"),
    linhaDeContagem(numero("criativos"), "anúncio", "anúncios"),
  ].filter((x): x is string => x !== null);

  return (
    <section className="auth-card">
      <h1>Seu pedido de exclusão</h1>

      <p className="hint">
        Código <code>{codigo}</code> · pedido em{" "}
        {new Date(estado.solicitado_em).toLocaleDateString("pt-BR")}
      </p>

      {estado.teve_erro ? (
        <>
          <p>
            <b>Não conseguimos concluir.</b> Seu pedido está registrado e a gente já está
            sabendo. Fale com a gente com esse código em mãos que a gente termina na hora.
          </p>
        </>
      ) : estado.concluido_em ? (
        <>
          <p>
            <b>Feito.</b> Apagamos tudo que tínhamos vindo do Facebook e do Instagram, em{" "}
            {new Date(estado.concluido_em).toLocaleDateString("pt-BR")}. Não dá para desfazer.
          </p>

          {itens.length > 0 ? (
            <>
              <p>O que saiu:</p>
              <ul className="excl-lista">
                {itens.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </>
          ) : (
            /* ZERO É RESPOSTA, e aparece. É o contrário do endpoint que
               devolve 200 e não faz nada: se não havia o que apagar, a
               página diz isso em vez de fingir trabalho. */
            <p>
              Não havia nada guardado do Facebook para esse acesso — nenhuma conexão nossa
              usava ele. Não é erro: é que não havia o que apagar.
            </p>
          )}

          {/* A PARTE QUE MAIS IMPORTA, e por isso não é rodapé. */}
          <p>
            <b>O que continua aqui:</b> o cadastro do seu negócio, o que você respondeu nas
            perguntas, as fotos e a logo que você enviou, e seu login. Nada disso veio do
            Facebook — foi você que escreveu ou enviou.
          </p>
          <p>
            Se você quer apagar isso também, é só pedir: mande uma mensagem com esse código
            que a gente apaga a conta inteira e te manda a confirmação.
          </p>
        </>
      ) : (
        <p>
          Recebemos seu pedido e ele está sendo processado. Volte a esta página em alguns
          minutos.
        </p>
      )}
    </section>
  );
}
