"use client";
import { useActionState } from "react";
import type { ReferenciaDePreco as ReferenciaSalva } from "@/lib/onboarding/referencia-preco";
import { salvarReferenciaPrecoAction, type EstadoReferenciaPreco } from "./referencia-actions";
const inicial: EstadoReferenciaPreco = {};
export function ReferenciaDePreco({ businessId, atual }: { businessId: string; atual: ReferenciaSalva | null }) {
  const [estado, action, pendente] = useActionState(salvarReferenciaPrecoAction, inicial);
  const decimal = (valor?: number) => valor === undefined ? "" : String(valor).replace(".", ",");
  return <form action={action} className="referencia-form" aria-busy={pendente}>
    <input type="hidden" name="businessId" value={businessId} />
    <div aria-live="polite" aria-atomic="true">
      {estado.erro ? <p className="form-error" role="alert">{estado.erro}</p> : null}
      {estado.ok ? <p className="form-notice">{estado.ok}</p> : null}
      {estado.aviso ? <p className="form-warning">{estado.aviso}</p> : null}
    </div>
    <fieldset disabled={pendente}><legend className="sr-only">Referência opcional de preço</legend>
      <div className="referencia-valores">
        <label htmlFor="referencia-min">Preço em reais<input id="referencia-min" name="minimo" inputMode="decimal" defaultValue={decimal(atual?.valor_min)} placeholder="Ex.: 69,00" aria-describedby="referencia-ajuda" maxLength={24} /></label>
        <label htmlFor="referencia-max">Até, se for uma faixa <span>(opcional)</span><input id="referencia-max" name="maximo" inputMode="decimal" defaultValue={decimal(atual?.valor_max)} placeholder="Ex.: 70,00" aria-describedby="referencia-ajuda" maxLength={24} /></label>
      </div>
      <p id="referencia-ajuda" className="hint">Pode informar um valor ou uma faixa. Deixar os valores vazios mantém o que já foi salvo.</p>
      <label htmlFor="referencia-unidade">Esse preço é de quê?<input id="referencia-unidade" name="unidade" defaultValue={atual?.unidade ?? ""} placeholder="Ex.: fardo, produto ou serviço" maxLength={120} /></label>
      <label htmlFor="referencia-certeza">Como devemos tratar esse preço?<select id="referencia-certeza" name="certeza" defaultValue={atual?.certeza ?? ""}>
        <option value="">Selecione quando informar um preço</option><option value="confirmado">Confirmado</option><option value="aproximado">Aproximado</option><option value="nao_confirmado">Ainda precisa de confirmação</option>
      </select></label>
      <button className="cta" type="submit">{pendente ? "Salvando…" : "Salvar referência"}</button>
    </fieldset>
    <p className="hint">A fonte e a data ficam registradas com a referência. Não calculamos o preço de cada unidade nem o valor médio dos pedidos.</p>
    <a className="referencia-continuar" href={pendente ? undefined : "/onboarding/marca"}
      aria-disabled={pendente || undefined} tabIndex={pendente ? -1 : undefined}>
      {atual ? "Continuar para os materiais" : "Continuar sem informar preço"}
    </a>
  </form>;
}
