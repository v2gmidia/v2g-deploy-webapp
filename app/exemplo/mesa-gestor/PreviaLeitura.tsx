import "server-only";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import { DadosDaConta } from "@/components/gestor/leitura/DadosDaConta";
import { lerPorExecucaoDaCarteira, VERSAO_DO_ADAPTADOR } from "@/lib/gestor/contrato-metricas";
import type { ResultadoDaLeituraDaCarteira } from "@/lib/backend/metricas-da-carteira";
import styles from "./previa-leitura.module.css";

const CENARIOS = [
  ["sucesso_com_dados", "Dados observados"],
  ["sem_dados", "Sem dados"],
  ["zero_real", "Zero observado"],
  ["parcial_desatualizado", "Parcial ou desatualizado"],
  ["metricas_origem_heterogenea", "Origem inconsistente"],
  ["contrato_ausente", "Contrato ausente"],
] as const;

/** Só na bancada DEV. Lê a fixture canônica, sem copiar nem chamar o adaptador de rede. */
export async function PreviaLeitura({ cenario }: { cenario?: string }) {
  if (process.env.NODE_ENV === "production") notFound();
  const escolhido = CENARIOS.some(([id]) => id === cenario) ? cenario! : CENARIOS[0][0];
  let resultado: ResultadoDaLeituraDaCarteira;
  try {
    const caminho = resolve(process.cwd(), "../../OneDrive/Documentos/GitHub/backend_v2g/tests/fixtures/e28_07_contrato_handoff.json");
    const fixture = JSON.parse(await readFile(caminho, "utf8"));
    if (fixture.versao !== VERSAO_DO_ADAPTADOR) throw new Error("versao");
    const businessId = fixture.cenarios.vinculo_manual.business_id;
    const contrato = fixture.cenarios[escolhido === "contrato_ausente" ? "sucesso_com_dados" : escolhido].contrato;
    const campanhas = lerPorExecucaoDaCarteira({ business_id: businessId, desde: contrato.desde, ate: contrato.ate,
      por_execucao: [{ id_execucao: fixture.cenarios.vinculo_manual.requisicao.id_execucao,
        ...(escolhido === "contrato_ausente" ? {} : { contrato_de_leitura: contrato }) }] },
    { businessId, desde: contrato.desde, ate: contrato.ate });
    resultado = campanhas ? { ok: true, versao: fixture.versao, businessId, campanhas }
      : { ok: false, motivo: "resposta_invalida", mensagem: "Contrato indisponível." };
  } catch {
    resultado = { ok: false, motivo: "indisponivel", mensagem: "A fixture canônica local não está disponível ou não é compatível. Nenhum dado substituto foi criado." };
  }
  return <div className={styles.pagina}>
    <header><h1>Prévia da leitura de números</h1>
      <p className="form-warning">Dados fictícios da fixture canônica. Sem consulta externa, sessão real ou prova de integração.</p>
      <a href="/exemplo/mesa-gestor">Voltar à demonstração da mesa</a></header>
    <form method="get" className={styles.filtros}>
      <input type="hidden" name="leitura" value="contrato" />
      <label>Cenário fictício<select name="cenario" defaultValue={escolhido}>
        {CENARIOS.map(([id, rotulo]) => <option key={id} value={id}>{rotulo}</option>)}
      </select></label><button type="submit">Mostrar cenário</button>
    </form>
    <DadosDaConta resultado={resultado} nome="Negócio fictício" />
  </div>;
}
