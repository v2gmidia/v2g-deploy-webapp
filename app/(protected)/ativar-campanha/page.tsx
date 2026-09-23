import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerCarimbos } from "@/lib/campanha/carimbos";
import { tituloDaAba } from "@/lib/titulos";

export const metadata = tituloDaAba("/ativar-campanha");

/**
 * A FILA DE ATIVAÇÃO — TELA DE OPERADOR.
 *
 * ============================================================
 * POR QUE ELA EXISTE. Toda campanha que a V2G publica nasce PAUSED
 * (`lib/meta/publicar.ts`, invariante 1), e até aqui não havia caminho
 * nenhum para tirá-la de lá — nem no produto, nem no time. A única saída
 * era abrir o Gerenciador de Anúncios da Meta na mão.
 *
 * Esta é a fila: o que já subiu e está parado, esperando alguém do time
 * dizer que pode gastar.
 * ============================================================
 *
 * ============================================================
 * A LINGUAGEM AQUI É TÉCNICA, ao contrário do resto do app. Quem lê sabe
 * o que é `publish_state` e conta de anúncio. Mesma licença de
 * `/revisar-perfil` e `/saude-meta`.
 *
 * O QUE ELA NÃO FAZ: não mostra botão. Ativar e pausar moram na tela da
 * campanha, onde estão o nome do cliente, o valor por dia e o pré-voo —
 * apertar "ativar" de uma lista, sem ver de quem é nem quanto custa,
 * é exatamente o clique que não pode existir.
 * ============================================================
 */

interface NaFila {
  id: string;
  nome: string;
  cliente: string;
  estado: string;
  frase: string;
  quando: string | null;
}

export default async function FilaDeAtivacaoPage() {
  // 2ª camada (docs/arquitetura.md, Decisão 3). `notFound()` e não
  // redirect: para quem não é operador esta rota não existe.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  // `service_role` porque a RLS de `campaigns` confina cada cliente ao
  // próprio negócio — desenho certo para o cliente, e o oposto do que
  // esta tela precisa. A checagem de papel acima é o que substitui a RLS,
  // e é por isso que ela vem ANTES da criação do cliente admin.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .select(
      "id, name, business_id, publish_state, ativada_em, ativada_por, pausada_em, pausada_por, businesses(name)",
    )
    .in("publish_state", ["published", "ativa", "pausada", "ativando"])
    // ============================================================
    // ORDENA POR `created_at`, E NÃO POR `published_at`.
    //
    // `published_at` seria o campo natural — "a mais antiga no ar
    // primeiro". Mas `conferir:veiculacao` §2 proíbe tela ler
    // `published_at`, e a proibição é maior que este caso: aquele campo
    // já foi usado para AFIRMAR veiculação, e uma tela que o lê para
    // ordenar hoje é a mesma tela que amanhã o lê para escrever "no ar
    // desde". A fonte única de veiculação é `lib/veiculacao/estado.ts`,
    // e ela não tem nada a ver com ordenar fila de operador.
    //
    // `created_at` dá a mesma ordem na prática: a campanha é criada e
    // publicada na mesma cadeia, minutos depois.
    // ============================================================
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[ativar-campanha] falha ao listar ::", error.message);
  }

  const fila: NaFila[] = (data ?? []).map((linha: Record<string, unknown>) => {
    const carimbos = lerCarimbos({
      ativadaEm: (linha.ativada_em as string | null) ?? null,
      ativadaPor: (linha.ativada_por as string | null) ?? null,
      pausadaEm: (linha.pausada_em as string | null) ?? null,
      pausadaPor: (linha.pausada_por as string | null) ?? null,
    });
    const negocio = linha.businesses as { name?: string } | null;
    return {
      id: String(linha.id),
      nome: (linha.name as string | null) ?? "(campanha sem nome)",
      cliente: negocio?.name?.trim() || "(negócio sem nome)",
      estado: String(linha.publish_state ?? "?"),
      frase: carimbos.frase,
      quando: carimbos.ultimoQuando,
    };
  });

  return (
    <div className="canvas">
      <div className="page-head">
        <h1>Ativação de campanha</h1>
        <p>
          Campanhas já publicadas no Meta, onde todo objeto está <code>PAUSED</code> até alguém
          do time ativar. Ordenadas pela criação mais antiga. Ativar gasta dinheiro do
          cliente — o botão está dentro de cada uma, junto do valor e do pré-voo.
        </p>
      </div>

      {fila.length === 0 ? (
        <section className="empty-hero">
          <h3>Nenhuma campanha publicada</h3>
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
                <span>{c.nome}</span>
              </div>
              <div className="espera-estado">
                <code>{c.estado}</code>
                <span>{c.frase}</span>
                {c.quando && <span className="espera-data">{new Date(c.quando).toLocaleString("pt-BR")}</span>}
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
