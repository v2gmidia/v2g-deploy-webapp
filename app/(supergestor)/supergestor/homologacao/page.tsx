import { carregarHomologacao } from "@/lib/gestor/carregar-homologacao";
import { DadosDaConta } from "@/components/gestor/leitura/DadosDaConta";
import styles from "@/app/(protected)/gestor/Gestor.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homologação da mesa | V2G", robots: { index: false, follow: false } };

const ESTADOS: Record<string, string> = {
  awaiting_review: "Aguardando revisão", changes_requested: "Ajustes solicitados",
  approved_for_manual_publish: "Aprovado para publicação manual",
  rejected: "Recusado",
};

/** URL explícita, sem menu público e sem ações de escrita. O recorte é do servidor. */
export default async function HomologacaoPage() {
  const dados = await carregarHomologacao();
  const filaHref = `/gestor/criativos?negocio=${encodeURIComponent(dados.recorte.businessId)}`;
  return <div className={styles.pagina}>
    <header className={styles.cabecalho}>
      <div><h1>Homologação da mesa</h1><p>Confira o percurso do gestor em um negócio de teste.</p></div>
      <a href="/supergestor">Voltar à carteira</a>
    </header>
    <p className="form-warning" role="status">Homologação QA — dados fictícios, sem campanha ou veiculação comprovada.</p>
    <section aria-labelledby="negocio-homologacao">
      <h2 id="negocio-homologacao">{dados.nome}</h2>
      <p>Negócio atribuído ao operador desta sessão. O cadastro permanece identificado como fictício.</p>
      <p>Período fixado para a leitura: {dados.recorte.desde} a {dados.recorte.ate}.</p>
      <h3>Peças enviadas</h3>
      {dados.fila === null ? <p className="form-warning">A fila não pôde ser consultada. Abra novamente para tentar.</p>
        : dados.fila.length === 0 ? <p>Nenhuma peça retornada para este negócio.</p>
          : <><p>{dados.total === null ? "Total não confirmado" : `${dados.total} peça(s) registradas`}. Mostrando até 20, da mais recente para a mais antiga.</p>
            <ul>{dados.fila.map(peca => <li key={peca.id}>{peca.original_name} — {ESTADOS[peca.status] ?? "Estado a conferir na fila"}</li>)}</ul></>}
      <p><a href={filaHref}>Abrir fila deste negócio</a></p>
      <p>As decisões acontecem na fila existente. Aprovação interna não confirma publicação.</p>
    </section>
    <DadosDaConta nome={dados.nome} resultado={dados.resultado} />
  </div>;
}
