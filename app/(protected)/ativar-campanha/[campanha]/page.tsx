import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { conferirAntesDeAtivar } from "@/lib/campanha/ativacao";
import { lerCarimbos } from "@/lib/campanha/carimbos";
import { tituloDaAba } from "@/lib/titulos";
import { ativarAction, pausarAction } from "../actions";

export const metadata = tituloDaAba("/ativar-campanha/[campanha]");

/**
 * UMA CAMPANHA — a tela onde o dinheiro começa a sair.
 *
 * ============================================================
 * A CONFIRMAÇÃO É A TELA. Não existe modal.
 *
 * Tudo que a pessoa precisa saber antes de apertar está visível ao mesmo
 * tempo que o botão: de quem é a campanha, quanto passa a gastar por dia,
 * e o que o pré-voo disse AGORA. Um modal esconderia isso atrás de um
 * clique e transformaria "confirmar" em reflexo.
 *
 * `conferirAntesDeAtivar()` é relida a cada desenho — e de novo dentro da
 * ação, a centímetros da chamada ao Meta. O que esta tela mostra é
 * informação, nunca autorização (invariante 1 de `lib/meta/ativar.ts`).
 * ============================================================
 *
 * ============================================================
 * O BOTÃO DE ATIVAR SÓ APARECE SEM BLOQUEIO.
 *
 * Com bloqueio ele não fica cinza: ele não existe, e os motivos ocupam o
 * lugar dele. Botão apagado convida a procurar como acender; a lista de
 * motivos diz o que resolver.
 *
 * O de PAUSAR aparece sempre que há o que pausar, inclusive com bloqueio.
 * O freio nunca depende de o resto estar em ordem.
 * ============================================================
 */

interface Props {
  params: Promise<{ campanha: string }>;
}

const DINHEIRO = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Uma linha do rastro, já legível. */
interface NoRastro {
  quando: string;
  kind: string;
  falhou: boolean;
  texto: string;
}

export default async function CampanhaPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  const { campanha: campanhaId } = await params;

  const conferencia = await conferirAntesDeAtivar(campanhaId);

  if (!conferencia.ok) {
    return (
      <div className="canvas">
        <div className="page-head">
          <h1>Campanha</h1>
          <p className="form-error">{conferencia.texto}</p>
        </div>
        <Link className="cta ghost" href="/ativar-campanha">
          Voltar para a fila
        </Link>
      </div>
    );
  }

  const carimbos = lerCarimbos({
    ativadaEm: conferencia.ativadaEm,
    ativadaPor: conferencia.ativadaPor,
    pausadaEm: conferencia.pausadaEm,
    pausadaPor: conferencia.pausadaPor,
  });

  // ---------- o rastro, do próprio `decisions` ----------
  // É o mesmo registro que a ativação escreve. A tela não guarda estado
  // de resultado em lugar nenhum: recarregar mostra o que aconteceu,
  // porque o que aconteceu está no banco.
  const admin = createAdminClient();
  const { data: linhasDoRastro } = await admin
    .from("decisions")
    .select("kind, payload, status, created_at")
    .eq("campaign_id", campanhaId)
    .in("kind", ["ativacao_tentativa", "ativacao_resultado", "pausa_tentativa", "pausa_resultado"])
    .order("created_at", { ascending: false })
    .limit(12);

  const rastro: NoRastro[] = (linhasDoRastro ?? []).map((l: Record<string, unknown>) => {
    const payload = (l.payload ?? {}) as Record<string, unknown>;
    const nivel = typeof payload.nivel === "string" ? payload.nivel : null;
    const mensagem = typeof payload.mensagem === "string" ? payload.mensagem : null;
    return {
      quando: String(l.created_at),
      kind: String(l.kind),
      falhou: l.status === "failed",
      texto: mensagem ?? (nivel ? `nível ${nivel}` : "—"),
    };
  });

  const podeAtivar = conferencia.bloqueios.length === 0;
  const podePausar = carimbos.estado === "rodando" || carimbos.estado === "rodando_desde_sempre";

  return (
    <div className="canvas">
      <div className="page-head">
        <h1>{conferencia.nomeDoCliente}</h1>
        <p>
          {conferencia.nomeDaCampanha ?? "(campanha sem nome)"} · <code>{conferencia.estadoAtual}</code>
        </p>
      </div>

      {/* ---------- o que a pessoa precisa saber ANTES ---------- */}
      <section className="pendencia-bloco">
        <b>Se você ativar, começa a sair dinheiro</b>
        <p>
          <b>{DINHEIRO.format(conferencia.diarioCentavos / 100)} por dia</b>, da conta de anúncio
          de <b>{conferencia.nomeDoCliente}</b>. Sai do teto de{" "}
          {DINHEIRO.format(conferencia.mensalReais)} por mês que o cliente definiu, dividido por
          30.
        </p>
        <p>
          Página: {conferencia.preVoo.pagina?.nome ?? "não consegui ler o nome agora"} · Conta:{" "}
          {conferencia.preVoo.conta?.marcada
            ? conferencia.preVoo.conta.conta.nome
            : "nenhuma marcada"}
        </p>
      </section>

      {/* ---------- o estado, lendo os QUATRO carimbos ---------- */}
      <section className="lista-espera">
        <article className="espera-row">
          <div className="espera-quem">
            <b>{carimbos.frase}</b>
            {carimbos.ultimoAutor && carimbos.ultimoQuando && (
              <span>
                Última mudança por {carimbos.ultimoAutor} em{" "}
                {new Date(carimbos.ultimoQuando).toLocaleString("pt-BR")}
              </span>
            )}
          </div>
          <div className="espera-estado">
            {/* Os quatro campos, crus, para quem quiser conferir a leitura
                acima em vez de acreditar nela. */}
            <span>
              ativada: {conferencia.ativadaEm ? `${conferencia.ativadaEm} por ${conferencia.ativadaPor}` : "—"}
            </span>
            <span>
              pausada: {conferencia.pausadaEm ? `${conferencia.pausadaEm} por ${conferencia.pausadaPor}` : "—"}
            </span>
          </div>
        </article>
      </section>

      {/* ---------- o que impede ---------- */}
      {!podeAtivar && (
        <section className="pendencia-bloco">
          <b>Não dá para ativar agora</b>
          <ul>
            {conferencia.bloqueios.map((b, i) => (
              <li key={`${b.motivo}-${i}`}>{b.texto}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- as ações ---------- */}
      <section className="rev-acoes">
        {podeAtivar && (
          <form action={ativarAction}>
            <input type="hidden" name="campanhaId" value={conferencia.campanhaId} />
            <button type="submit" className="cta">
              Ativar campanha — {DINHEIRO.format(conferencia.diarioCentavos / 100)}/dia
            </button>
          </form>
        )}

        {podePausar && (
          <form action={pausarAction}>
            <input type="hidden" name="campanhaId" value={conferencia.campanhaId} />
            <button type="submit" className="cta ghost">
              Pausar campanha
            </button>
          </form>
        )}

        <Link className="cta ghost" href="/ativar-campanha">
          Voltar para a fila
        </Link>
      </section>

      {/* ---------- o log ---------- */}
      <section className="lista-espera">
        <h2>O que já aconteceu aqui</h2>
        {rastro.length === 0 ? (
          <p>Nenhuma ativação ou pausa registrada nesta campanha.</p>
        ) : (
          rastro.map((r, i) => (
            <article className="espera-row" key={`${r.quando}-${i}`}>
              <div className="espera-quem">
                <b>{r.kind}</b>
                <span>{r.texto}</span>
              </div>
              <div className="espera-estado">
                <span>{new Date(r.quando).toLocaleString("pt-BR")}</span>
                {r.falhou && <span className="form-error">falhou</span>}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
