import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";

/**
 * Faixa persistente de reconexão.
 *
 * Aparece no topo das telas de app quando a conexão com o Meta não está
 * mais válida. NÃO é toast: é estado do sistema e precisa continuar
 * visível até ser resolvido. E sempre com botão — aviso sem caminho de
 * volta é só reclamação.
 *
 * A consequência vem antes do motivo técnico: o cliente precisa saber o
 * que parou de funcionar, não qual subcódigo o Meta devolveu.
 */
const TEXTO: Record<string, { titulo: string; motivo: string }> = {
  expired: {
    titulo: "Sua conta de anúncios desconectou.",
    motivo:
      "A autorização do Instagram expirou — isso acontece a cada 60 dias. Enquanto isso, suas campanhas não recebem ajustes automáticos.",
  },
  revoked: {
    titulo: "Sua conta de anúncios desconectou.",
    motivo:
      "A autorização do Instagram foi desfeita. Enquanto isso, suas campanhas não recebem ajustes automáticos.",
  },
  expiring: {
    titulo: "Sua conexão com o Instagram vence em breve.",
    motivo:
      "Reconectar agora leva menos de um minuto e evita que suas campanhas parem de receber ajustes.",
  },
};

export async function FaixaReconectar() {
  const supabase = await createClient();
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return null;
  const { data: conexao, error } = await supabase
    .from("meta_connections")
    .select("status")
    .eq("business_id", ativo.negocio.id)
    .maybeSingle();
  if (error) return <p className="form-warning">Não conseguimos conferir sua conexão. <a href="/conta#conexoes">Ver conexões</a></p>;
  if (!conexao) return null;

  const texto = TEXTO[conexao.status];
  if (!texto) return null;

  const urgente = conexao.status !== "expiring";

  return (
    <div
      className="faixa-reconectar"
      role="status"
      style={
        urgente
          ? undefined
          : { background: "var(--warn-soft)", borderColor: "var(--warn)" }
      }
    >
      <div>
        <b style={urgente ? undefined : { color: "var(--warn)" }}>{texto.titulo}</b>
        <span>{texto.motivo}</span>
      </div>
      <a className="cta" href="/conta#conexoes">
        Conferir conexão
      </a>
    </div>
  );
}
