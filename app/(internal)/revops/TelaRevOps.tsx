import { alertasDeQualidade, ROTULOS_EVIDENCIA, ROTULOS_INTERACAO } from "@/lib/revops/contrato";
import type { OportunidadeRevOps } from "@/lib/revops/dados";
import { FormInteressado, FormInteracao } from "./Formularios";

const ETAPAS: Record<string, string> = {
  interested: "Interessado", qualification: "Qualificação", meeting: "Reunião",
  proposal: "Proposta", decision: "Decisão", purchase_reported: "Compra relatada",
  won_verified: "Venda verificada", lost: "Perdida", postponed: "Adiada",
};

const DIAGNOSTICOS: Record<string, string> = {
  not_assessed: "Instagram ainda não avaliado",
  guidance_needed: "Instagram pede orientação; compra permitida",
  adequate: "Instagram com estrutura adequada",
};

function dataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
  }).format(new Date(valor));
}

export function TelaRevOps({ oportunidades, falhaConsulta = false, referencia, somenteLeitura = false }: {
  oportunidades: OportunidadeRevOps[];
  falhaConsulta?: boolean;
  referencia: string;
  somenteLeitura?: boolean;
}) {
  const semProximoPasso = oportunidades.filter((oportunidade) => !oportunidade.proximoPasso).length;
  const inferenciasPendentes = oportunidades.flatMap((oportunidade) => oportunidade.interacoes)
    .filter((interacao) => interacao.evidencia === "inference" && interacao.revisaoHumana === "pending").length;

  const total = falhaConsulta ? "—" : String(oportunidades.length);
  const semPasso = falhaConsulta ? "—" : String(semProximoPasso);
  const inferencias = falhaConsulta ? "—" : String(inferenciasPendentes);

  return <>
    <div className="revops-abertura">
      <div>
        <h1>RevOps</h1>
        <p>Da primeira origem ao negócio no WebApp, sem transformar relato em prova.</p>
      </div>
      <p className="revops-acesso">Acesso específico · dados comerciais internos</p>
    </div>

    <section className="revops-resumo" aria-label="Qualidade dos dados">
      <div><strong>{total}</strong><span>oportunidades registradas</span></div>
      <div><strong>{semPasso}</strong><span>sem próximo passo</span></div>
      <div><strong>{inferencias}</strong><span>inferências para revisar</span></div>
      <p>Conversas geradas por anúncios de clientes não entram nestas contagens.</p>
    </section>

    {falhaConsulta && <p className="form-warning" role="status">
      Não foi possível consultar a estrutura RevOps. As contagens e os registros ficam indisponíveis até a causa ser confirmada.
    </p>}

    <div className="revops-layout">
      <aside className="revops-registro" aria-label="Registro manual">
        {falhaConsulta ? <div className="revops-formulario revops-registro-inerte">
          <div className="revops-form-head"><h2>Registro indisponível</h2></div>
          <p>A leitura administrativa falhou. Nenhuma action de escrita foi oferecida nesta resposta.</p>
        </div> : somenteLeitura ? <div className="revops-formulario revops-registro-inerte">
          <div className="revops-form-head"><h2>Prévia sem gravação</h2></div>
          <p>Esta bancada usa somente fixtures fictícias. Os formulários reais não são montados aqui.</p>
        </div> : <>
          <FormInteressado referencia={referencia} />
          <FormInteracao oportunidades={oportunidades.map(({ id, empresa }) => ({ id, empresa }))} />
        </>}
      </aside>

      <section className="revops-lista" aria-labelledby="titulo-oportunidades">
        <div className="revops-section-head">
          <h2 id="titulo-oportunidades">Oportunidades e linha do tempo</h2>
          <p>Um evento pode pertencer a mais de uma empresa sem duplicar a fonte.</p>
        </div>

        {!falhaConsulta && oportunidades.length === 0 && <div className="revops-vazio">
          <h3>Nenhum interessado registrado</h3>
          <p>A lista começa vazia de propósito. Nenhum contato real foi importado e nenhuma venda foi inferida.</p>
        </div>}

        {oportunidades.map((oportunidade) => {
          const alertas = alertasDeQualidade(oportunidade.interacoes);
          return <article className="revops-oportunidade" key={oportunidade.id}>
            <header className="revops-oportunidade-head">
              <div><h3>{oportunidade.empresa}</h3><p>{oportunidade.pessoas.join(" · ") || "Pessoa não informada"}</p></div>
              <span className="revops-etapa">{ETAPAS[oportunidade.etapa] ?? "Estado desconhecido"}</span>
            </header>

            <div className="revops-proximo">
              <span>Próximo passo</span><strong>{oportunidade.proximoPasso ?? "Não informado"}</strong>
              {oportunidade.proximoPassoEm && <small>Até {dataHora(oportunidade.proximoPassoEm)}</small>}
            </div>

            <dl className="revops-evidencia-geral">
              <div><dt>Diagnóstico</dt><dd>{DIAGNOSTICOS[oportunidade.diagnosticoInstagram] ?? "Não informado"}</dd></div>
              <div><dt>Vínculos verificados</dt><dd>
                LP {oportunidade.vinculos.lp ? "sim" : "não"} · pedido {oportunidade.vinculos.pedido ? "sim" : "não"} · negócio {oportunidade.vinculos.negocio ? "sim" : "não"}
              </dd></div>
            </dl>

            {oportunidade.desconhecido && <p className="revops-desconhecido">
              Dado faltante: {oportunidade.desconhecido.replaceAll("_", " ")}
            </p>}
            {alertas.length > 0 && <ul className="revops-alertas" aria-label="Alertas de qualidade">
              {alertas.map((alerta) => <li key={alerta}>{alerta}</li>)}
            </ul>}

            <ol className="revops-timeline">
              {oportunidade.interacoes.length === 0 && <li className="revops-sem-evento">Sem interações registradas.</li>}
              {oportunidade.interacoes.map((interacao) => <li key={interacao.id}>
                <time dateTime={interacao.ocorreuEm}>{dataHora(interacao.ocorreuEm)}</time>
                <div className="revops-evento">
                  <div className="revops-evento-topo">
                    <strong>{ROTULOS_INTERACAO[interacao.tipo]}</strong>
                    <span data-evidencia={interacao.evidencia}>{ROTULOS_EVIDENCIA[interacao.evidencia]}</span>
                  </div>
                  <p>{interacao.resumo}</p>
                  <small>{interacao.fonte.canal} · {interacao.fonte.sistema} · ref. {interacao.fonte.referencia}</small>
                  {interacao.transcricao === "pending" && <em>Transcrição pendente</em>}
                </div>
              </li>)}
            </ol>
          </article>;
        })}
      </section>
    </div>
  </>;
}
