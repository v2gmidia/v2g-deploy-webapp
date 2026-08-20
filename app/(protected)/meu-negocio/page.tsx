import { carregarPerfilDoCliente } from "@/lib/perfil/revisao-cliente";
import { Campo } from "./Campo";

/**
 * O que a gente entendeu do seu negócio.
 *
 * A tela onde o cliente confere o próprio perfil — e o ÚNICO lugar do sistema
 * que produz a procedência `confirmado`, o nível que existe desde a 0010 e
 * que ninguém nunca teve onde exercitar.
 *
 * SEM FAIXA COBALTO, e a ausência é decisão, não esquecimento. A faixa existe
 * quando o número é o assunto da tela ou quando ela aponta para fora da tela
 * (padrao-visual.md §5). Aqui não é nenhum dos dois: são 26 campos de peso
 * parecido, e a tela é o destino, não o caminho. O enquadramento vai no
 * `.page-head`, que faz o mesmo trabalho e custa menos. Ver §9 do desenho
 * antes de acrescentar uma.
 *
 * SEM CONTADOR, em lugar nenhum — nem "6 de 26", nem barra de progresso, nem
 * `.grp-count` nos títulos. Ver §6.
 */

export const metadata = { title: "Seu negócio — V2G" };
export const dynamic = "force-dynamic";

export default async function MeuNegocioPage() {
  const perfil = await carregarPerfilDoCliente();

  // Estado vazio honesto: sem negócio não há o que conferir, e a tela diz o
  // que precisa acontecer antes.
  if (!perfil) {
    return (
      <>
        <div className="page-head">
          <h1>O que a gente entendeu do seu negócio</h1>
          <p>
            A gente ainda não sabe nada do seu negócio — isso começa no onboarding, que são
            quatro perguntas rápidas.
          </p>
        </div>
        <div className="card">
          <a className="cta" href="/onboarding" style={{ width: "max-content" }}>
            Começar agora
          </a>
        </div>
      </>
    );
  }

  const dataDaConversa = perfil.entrevistaEm
    ? new Date(perfil.entrevistaEm).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <>
      <div className="page-head">
        <h1>O que a gente entendeu do seu negócio</h1>
        <p>
          {dataDaConversa
            ? `Isso aqui a gente montou a partir da conversa que você teve com a gente em ${dataDaConversa}. `
            : "Isso aqui é o que a gente sabe do seu negócio até agora. "}
          Dá uma conferida — principalmente nos números, que são os que mexem no seu dinheiro. O
          que estiver errado, você corrige aqui mesmo, e a IA passa a usar o certo na hora.
        </p>
      </div>

      {/* A frase que impede a tela de virar cobrança. Dita uma vez, no topo,
          e nunca repetida bloco a bloco. */}
      <p className="rc-tranquilo">
        Não precisa conferir tudo hoje. O que você não mexer continua valendo do jeito que está.
      </p>

      {perfil.blocos.map((bloco) => (
        <section key={bloco.id} className="rc-bloco">
          <div className="section-title">
            <h2>{bloco.titulo}</h2>
          </div>

          {bloco.abertura && <p className="rc-abertura">{bloco.abertura}</p>}

          <div className="card rc-lista-campos">
            {bloco.campos.map((campo) => (
              <Campo key={campo.chave} campo={campo} />
            ))}
          </div>

          {/* Os números que quase ninguém sabe de cabeça. Aparecem, com o
              motivo — mas sem campo aberto: um chute aqui entraria como
              `confirmado`, o nível mais alto da escala, e viraria orçamento
              de campanha. A coleta certa é o onboarding expandido. */}
          {bloco.naoSabemos.length > 0 && (
            <div className="rc-nao-sabemos">
              <b>O que a gente ainda não sabe</b>
              {bloco.naoSabemos.map((campo) => (
                <div key={campo.chave} className="rc-pendente">
                  <span className="rc-pend-rotulo">{campo.rotulo}</span>
                  {campo.ajuda && <span className="rc-ajuda">{campo.ajuda}</span>}
                </div>
              ))}
              <p className="rc-pend-nota">
                Esses a gente levanta junto com você, com uma conta que dá para responder — quase
                ninguém sabe de cabeça, e chutar aqui sai caro. A gente te chama.
              </p>
            </div>
          )}
        </section>
      ))}

      <section className="trust support-block">
        <b className="title">Achou alguma coisa errada e não sabe como arrumar?</b>
        Fala com a gente que a gente ajusta junto. WhatsApp, resposta em até 2 horas úteis, sem
        robô e sem menu de atendimento.
        <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
          Chamar no WhatsApp &rarr;
        </a>
      </section>
    </>
  );
}
