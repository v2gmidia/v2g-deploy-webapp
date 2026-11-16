"use client";
import { useActionState, type ReactNode } from "react";
import type { AbrirClienteState } from "@/app/(protected)/agencia/actions";
import { hrefDoCliente, type ContextoAgencia, type RetornoCarteira } from "@/lib/agencia/contexto";

export type AcaoAbrirCliente = (anterior: AbrirClienteState, dados: FormData) => Promise<AbrirClienteState>;
const indisponivel: AcaoAbrirCliente = async () => ({ erro: "Atualize a carteira para abrir o cliente." });
export function AbrirCliente({ contexto, ativoId, area = "/inicio", retorno, acao, className, children, peca, fragmento }: {
  contexto: ContextoAgencia; ativoId?: string; area?: "/inicio" | "/criativos"; retorno: RetornoCarteira;
  acao?: AcaoAbrirCliente; className?: string; children: ReactNode; peca?: string; fragmento?: "agencia-enviar";
}) {
  const [estado, enviar, pendente] = useActionState(acao ?? indisponivel, {});
  if (!acao || contexto.businessId === ativoId) return <a className={className}
    href={`${hrefDoCliente(area, contexto.businessId, retorno)}${peca ? `&peca=${encodeURIComponent(peca)}` : ""}${fragmento ? `#${fragmento}` : ""}`}>{children}</a>;
  return <form action={enviar}>
    <input type="hidden" name="agencia" value={contexto.agencyBusinessId ?? contexto.businessId} />
    <input type="hidden" name="cliente" value={contexto.businessId} /><input type="hidden" name="area" value={area} />
    <input type="hidden" name="busca_carteira" value={retorno.busca} /><input type="hidden" name="pagina_carteira" value={retorno.pagina} />
    {retorno.pendentes && <input type="hidden" name="pendentes_carteira" value="1" />}
    {retorno.etapa && <input type="hidden" name="etapa_carteira" value={retorno.etapa} />}
    {retorno.filtroCliente && <input type="hidden" name="filtro_cliente_carteira" value={retorno.filtroCliente} />}
    {peca && <input type="hidden" name="peca" value={peca} />}
    {fragmento && <input type="hidden" name="ancora" value={fragmento} />}
    <button type="submit" className={className} disabled={pendente}>{pendente ? "Abrindo cliente…" : children}</button>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}
