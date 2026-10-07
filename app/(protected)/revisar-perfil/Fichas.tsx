import { camposDaFicha, valorDaFicha, pracaOriginal, marcaOriginal,
  contasOriginais } from "@/lib/perfil/ficha-operador";
import styles from "./Fichas.module.css";

/** Renderizado apenas pelo servidor, depois da autorização da página. */
export function Fichas({ negocios }: { negocios: Record<string, unknown>[] }) {
  return (
    <section id="fichas" className={styles.fichas} aria-labelledby="titulo-fichas">
      <h2 id="titulo-fichas">Fichas dos negócios</h2>
      <p>Consulte os dados registrados, inclusive de quem já completou o cadastro.
        Esta consulta não altera dados nem inicia o processamento.</p>
      {negocios.length === 0 ? <p>Nenhum negócio real retornado nesta consulta.</p> : negocios.map((negocio) => {
        const praca = pracaOriginal(negocio);
        const marca = marcaOriginal(negocio);
        const contas = contasOriginais(negocio);
        return (
        <details key={String(negocio.id)} className={styles.ficha}>
          <summary>{valorDaFicha(negocio.name)} <span>— {String(negocio.id)}</span></summary>
          <p>Verba mensal é o valor informado pelo cliente, não o orçamento diário atual da campanha.
            Datas de procedência são exibidas como registradas, com seu fuso quando disponível.</p>
          <dl className={styles.campos}>
            <div>
              <dt>Praça — resposta original do cliente</dt>
              <dd>{praca?.texto ?? "Nenhuma resposta de praça registrada"}</dd>
              {praca && <dd className={styles.origem}>{praca.origem}
                {praca.em && <> · <time dateTime={praca.em}>{praca.em}</time></>}
              </dd>}
              <dd className={styles.origem}>A resposta original não é convertida em cidade ou alcance dos anúncios nesta consulta.</dd>
            </div>
            <div>
              <dt>Visual da marca — resposta do cliente</dt>
              <dd>{marca?.texto ?? "Nenhuma resposta visual registrada"}</dd>
              {marca && <dd className={styles.origem}>{marca.origem}
                {marca.em && <> · <time dateTime={marca.em}>{marca.em}</time></>}
              </dd>}
              {marca?.siteNaoTenho && <dd className={styles.origem}>
                Cliente declarou não ter site nesta etapa; confira o campo de site atual abaixo.
              </dd>}
              <dd className={styles.origem}>Esta descrição não é uma paleta estruturada nem prova de criativo produzido.</dd>
            </div>
            {contas.map((conta) => <div key={conta.chave}>
              <dt>{conta.rotulo} — histórico do onboarding</dt>
              <dd>{conta.texto}</dd>
              <dd className={styles.origem}>Resposta em <time dateTime={conta.em}>{conta.em}</time>
                {conta.reabertoEm && <> · pergunta reaberta em <time dateTime={conta.reabertoEm}>{conta.reabertoEm}</time></>}
              </dd>
              <dd className={styles.origem}>Confira o valor atual nos campos estruturados abaixo.</dd>
            </div>)}
            {camposDaFicha(negocio).map((item) => (
              <div key={item.campo}>
                <dt>{item.rotulo}</dt>
                <dd>{(item.campo === "city" || item.campo === "radius_km") && item.valor === "Não informado"
                  ? "Sem valor estruturado registrado; consulte a resposta de praça acima."
                  : item.valor}</dd>
                <dd className={styles.origem}>{item.origem}
                  {item.em && <> · <time dateTime={item.em}>{item.em}</time></>}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ); })}
    </section>
  );
}
