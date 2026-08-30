import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  COLUNAS_DO_CADASTRO,
  montarCadastro,
  type NegocioParaCadastro,
  type Pendencia,
} from "@/lib/cadastro/montar";
import { DIAS_ATE_TROCAR_DE_DONO } from "@/lib/cadastro/pendencias";

/**
 * Quem está esperando — TELA DE OPERADOR.
 *
 * POR QUE ELA EXISTE. O caminho "não sei → entrevista" não tem gatilho sem
 * ela. O cliente marca a pendência, ela fica no banco, e a resolução
 * depende de alguém da V2G ligar — mas até aqui a rota `/revisar-perfil`
 * só tinha `[proposta]`: dava para revisar uma proposta se você soubesse o
 * UUID, e nada listava. A pendência morria no banco esperando adivinhação.
 *
 * ORDENADA POR IDADE, MAIS VELHA PRIMEIRO, e isso é possível justamente
 * aqui: temos `updated_at` e o `em` do jsonb. Do outro lado não dá — o
 * `backend-integracao.md` §6.5 mediu que a fila do backend não traz campo
 * de tempo nenhum, e por isso o `/saude-meta` não consegue ordenar por
 * espera. Onde dá, faz-se.
 *
 * A LINGUAGEM AQUI É TÉCNICA, ao contrário do resto do app: quem lê sabe o
 * que é procedência e nome de coluna. Mesma licença de `/saude-meta` e da
 * tela de proposta.
 *
 * ESTA TELA NÃO USA `resumirPendencias`. Aquele módulo escreve para o
 * cliente — "a gente te liga pra fechar isso" não é o que o operador
 * precisa ler. O que as duas audiências compartilham é o `montarCadastro`,
 * que é o dado.
 */

export const metadata = { title: "Quem está esperando — V2G" };
export const dynamic = "force-dynamic";

interface Espera {
  id: string;
  nome: string;
  pendencias: Pendencia[];
  /** dias desde o "não sei" mais antigo; nulo quando não há "não sei" */
  diasEsperando: number | null;
}

function diasDesde(iso: string | undefined, agora: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.floor((agora - t) / 86_400_000) : null;
}

export default async function QuemEstaEsperandoPage() {
  // 2ª camada (docs/arquitetura.md, Decisão 3). `notFound()` e não
  // redirect: para quem não é operador esta rota não existe.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  // `service_role` porque a RLS de `businesses` confina cada usuário ao
  // próprio negócio — que é o desenho certo para o cliente e o oposto do
  // que esta tela precisa. A checagem de papel acima é o que substitui a
  // RLS aqui, e é por isso que ela vem ANTES da criação do cliente admin.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select(COLUNAS_DO_CADASTRO + ", dados_ficticios, updated_at")
    .eq("dados_ficticios", false)
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("[revisar-perfil] falha ao listar ::", error.message);
  }

  const agora = Date.now();
  const esperas: Espera[] = (data ?? [])
    .map((linha) => {
      // O `select` é montado por concatenação, então o PostgREST não
      // consegue inferir a forma da linha. O cast acontece UMA vez, aqui,
      // e `montarCadastro` valida o conteúdo campo a campo logo em
      // seguida — é ele quem decide o que está preenchido, não o tipo.
      const negocio = linha as unknown as NegocioParaCadastro;
      const r = montarCadastro(negocio);
      if (r.completo) return null;
      const naoSei = r.pendencias
        .map((p) => (p.motivo === "nao_sei" ? diasDesde(p.desde, agora) : null))
        .filter((d): d is number => d !== null);
      return {
        id: negocio.id,
        nome: negocio.name ?? "(sem nome)",
        pendencias: r.pendencias,
        diasEsperando: naoSei.length > 0 ? Math.max(...naoSei) : null,
      };
    })
    .filter((e): e is Espera => e !== null)
    // Mais velha primeiro. Quem nunca disse "não sei" não está esperando
    // por nós — vai para o fim, e é ordenação, não descarte: ele continua
    // travado, só que a bola está com ele.
    .sort((a, b) => (b.diasEsperando ?? -1) - (a.diasEsperando ?? -1));

  const atrasadas = esperas.filter(
    (e) => e.diasEsperando !== null && e.diasEsperando >= DIAS_ATE_TROCAR_DE_DONO,
  );

  return (
    <div className="canvas">
      <div className="page-head">
        <h1>Quem está esperando</h1>
        <p>
          Negócios com cadastro incompleto. Ordenados pela espera mais longa — o topo é quem
          disse &quot;não sei&quot; há mais tempo e ainda não recebeu ligação.
        </p>
      </div>

      {atrasadas.length > 0 && (
        <section className="pendencia-bloco">
          <b>
            {atrasadas.length === 1
              ? "1 negócio passou dos"
              : `${atrasadas.length} negócios passaram dos`}{" "}
            {DIAS_ATE_TROCAR_DE_DONO} dias
          </b>
          <p>
            A partir daí o bloco do <code>/inicio</code> deles para de cobrar e passa a admitir
            que a dívida é nossa. O prazo é de {DIAS_ATE_TROCAR_DE_DONO} dias, e não 7, porque o
            direito de arrependimento do art. 49 do CDC vence no 7 — avisar no dia 7 seria dar a
            informação quando ela já não é acionável.
          </p>
        </section>
      )}

      {esperas.length === 0 ? (
        <section className="empty-hero">
          <h3>Ninguém esperando</h3>
          <p>
            Todo negócio real tem os seis campos do <code>POST /cadastro</code>. Se isso parece
            bom demais, confira que a lista não está vazia por erro de leitura — o console do
            servidor registra falha de consulta.
          </p>
        </section>
      ) : (
        <section className="lista-espera">
          {esperas.map((e) => (
            <article className="espera-row" key={e.id}>
              <div className="espera-quem">
                <b>{e.nome}</b>
                <span className="espera-id">{e.id}</span>
              </div>

              <div className="espera-tempo">
                {e.diasEsperando === null ? (
                  <span className="espera-neutro">bola com o cliente</span>
                ) : (
                  <span
                    className={
                      e.diasEsperando >= DIAS_ATE_TROCAR_DE_DONO ? "espera-tarde" : "espera-ok"
                    }
                  >
                    {e.diasEsperando === 0 ? "hoje" : `${e.diasEsperando} d`}
                  </span>
                )}
              </div>

              <ul className="espera-campos">
                {e.pendencias.map((p) => (
                  <li key={p.campo}>
                    <code>{p.campo}</code> <span className="espera-motivo">{p.motivo}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
