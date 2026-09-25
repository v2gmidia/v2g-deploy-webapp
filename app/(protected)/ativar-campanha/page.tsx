import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tituloDaAba } from "@/lib/titulos";

export const metadata = tituloDaAba("/ativar-campanha");

/**
 * A FILA DE ATIVAÇÃO — TELA DE OPERADOR.
 *
 * ============================================================
 * POR QUE ELA EXISTE. Toda campanha que a V2G sobe nasce `PAUSED` — a
 * invariante 1 de `lib/meta/publicar.ts` e a seção 10 item 1 do CLAUDE.md
 * do backend. Até aqui não havia caminho nenhum para tirá-la de lá, nem
 * no produto nem no time: a única saída era abrir o Gerenciador de
 * Anúncios da Meta na mão.
 * ============================================================
 *
 * ============================================================
 * A FONTE É `execucoes`, E NÃO `campaigns` — 24/09/2026.
 *
 * Medido em 23/09 contra produção: `campaigns` tem **zero linhas**, e
 * nenhum código de nenhum dos dois repositórios insere ali. Uma fila lida
 * de lá estaria permanentemente vazia, e vazia com a mesma aparência de
 * "não há nada para fazer".
 *
 * A campanha real mora em `execucoes.campanha_meta`, gravada pelo backend
 * quando `POST /campanhas` responde. **A presença desse campo é o critério
 * da fila**: existe objeto na plataforma, logo existe o que ligar.
 * ============================================================
 *
 * ============================================================
 * A LINGUAGEM AQUI É TÉCNICA, ao contrário do resto do app. Quem lê sabe
 * o que é id de campanha e conta de anúncio. Mesma licença de
 * `/revisar-perfil` e `/saude-meta`.
 *
 * O QUE ELA NÃO FAZ: não mostra botão. Ativar e pausar moram na tela da
 * campanha, onde estão o nome do cliente, o valor por dia e o pré-voo —
 * apertar "ativar" de uma lista, sem ver de quem é nem quanto custa, é
 * exatamente o clique que não pode existir.
 *
 * E ela não afirma nada sobre veiculação. O que aparece é o que o coletor
 * LEU na plataforma, cru e com a hora ao lado. Quem escreve frase sobre
 * estar no ar é `lib/veiculacao/estado.ts`, e só ele.
 * ============================================================
 */

interface NaFila {
  /** `execucoes.id` — o `id_execucao` que a rota do backend recebe */
  id: string;
  cliente: string;
  /** o nome que o backend registrou, quando o negócio não resolve */
  nomeNaExecucao: string | null;
  temDono: boolean;
  idCampanha: string;
  statusNaPlataforma: string | null;
  statusLidoEm: string | null;
  statusDoPipeline: string;
}

export default async function FilaDeAtivacaoPage() {
  // 2ª camada (docs/arquitetura.md, Decisão 3). `notFound()` e não
  // redirect: para quem não é operador esta rota não existe.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  // `service_role` porque `execucoes` tem RLS ligada e ZERO políticas
  // (postura declarada na `0022:100-104` do backend: negar tudo enquanto
  // quem lê e escreve é o backend). Sob RLS o operador não veria linha
  // nenhuma. A checagem de papel acima é o que substitui a RLS, e é por
  // isso que ela vem ANTES da criação do cliente admin.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("execucoes")
    .select(
      "id, business_id, nome_negocio, status, campanha_meta, status_na_plataforma, status_lido_em",
    )
    .not("campanha_meta", "is", null)
    // A criação mais antiga primeiro: é a que está esperando há mais
    // tempo. `criado_em` e não `publicada_em` — aquele campo é sobre
    // veiculação, e fila de operador não tem nada a ver com isso.
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("[ativar-campanha] falha ao listar ::", error.message);
  }

  const linhas = (data ?? []) as Record<string, unknown>[];

  // ============================================================
  // OS NOMES VÊM NUMA SEGUNDA CONSULTA, ESCOPADA PELOS ids DA PRIMEIRA.
  //
  // Nada aqui aceita id de fora: a lista de negócios é exatamente a dos
  // `business_id` que as linhas acima trouxeram. E é consulta separada em
  // vez de `businesses(name)` aninhado de propósito — o aninhamento
  // depende de o PostgREST reconhecer a relação, e `execucoes` veio de
  // outra cadeia de migrations (`supabase/objetos.ts:188-215`).
  // ============================================================
  const idsDeNegocio = [
    ...new Set(linhas.map((l) => l.business_id).filter((v): v is string => typeof v === "string")),
  ];
  const nomePorNegocio = new Map<string, string>();
  if (idsDeNegocio.length > 0) {
    const { data: negocios } = await admin
      .from("businesses")
      .select("id, name")
      .in("id", idsDeNegocio);
    for (const n of (negocios ?? []) as Record<string, unknown>[]) {
      const nome = typeof n.name === "string" ? n.name.trim() : "";
      if (typeof n.id === "string") nomePorNegocio.set(n.id, nome || "(negócio sem nome)");
    }
  }

  const fila: NaFila[] = linhas.map((linha) => {
    const meta = (linha.campanha_meta ?? null) as Record<string, unknown> | null;
    const negocioId = typeof linha.business_id === "string" ? linha.business_id : null;
    const nomeNaExecucao =
      typeof linha.nome_negocio === "string" && linha.nome_negocio.trim() !== ""
        ? linha.nome_negocio.trim()
        : null;
    return {
      id: String(linha.id),
      cliente: (negocioId && nomePorNegocio.get(negocioId)) || nomeNaExecucao || "—",
      nomeNaExecucao,
      temDono: negocioId !== null,
      idCampanha: typeof meta?.id_campanha === "string" ? meta.id_campanha : "—",
      statusNaPlataforma:
        typeof linha.status_na_plataforma === "string" ? linha.status_na_plataforma : null,
      statusLidoEm: typeof linha.status_lido_em === "string" ? linha.status_lido_em : null,
      statusDoPipeline: typeof linha.status === "string" ? linha.status : "—",
    };
  });

  return (
    <div className="canvas">
      <div className="page-head">
        <h1>Ativação de campanha</h1>
        <p>
          Execuções que já subiram campanha para o Meta, onde todo objeto nasce <code>PAUSED</code>{" "}
          até alguém do time ligar. Ordenadas pela criação mais antiga. Ativar gasta dinheiro do
          cliente — o botão está dentro de cada uma, junto do valor e do pré-voo.
        </p>
      </div>

      {fila.length === 0 ? (
        <section className="empty-hero">
          <h3>Nenhuma campanha subida</h3>
          <p>
            Nada chegou ao Meta ainda. Se isso parece errado, confira o console do servidor — a
            falha de consulta é registrada lá, e uma lista vazia por erro de leitura tem a mesma
            aparência de uma lista vazia de verdade.
          </p>
        </section>
      ) : (
        <section className="lista-espera">
          {fila.map((c) => (
            <article className="espera-row" key={c.id}>
              <div className="espera-quem">
                <b>{c.cliente}</b>
                <span>
                  campanha <code>{c.idCampanha}</code>
                </span>
                {!c.temDono && (
                  <span className="form-error">
                    sem negócio ligado — não dá para ativar daqui
                  </span>
                )}
              </div>
              <div className="espera-estado">
                <code>{c.statusDoPipeline}</code>
                {/* O que o COLETOR leu, cru. Não é afirmação desta tela:
                    é o último valor que o backend observou na plataforma,
                    com a hora ao lado para quem precisa saber se é velho. */}
                <span>
                  plataforma:{" "}
                  {c.statusNaPlataforma ? <code>{c.statusNaPlataforma}</code> : "— ainda não lido"}
                </span>
                {c.statusLidoEm && (
                  <span className="espera-data">
                    lido em {new Date(c.statusLidoEm).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              <Link className="cta ghost" href={`/ativar-campanha/${c.id}`}>
                Abrir
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
