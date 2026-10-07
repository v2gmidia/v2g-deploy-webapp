/** Escolha de negócio depois da autenticação e da consulta sob RLS. */
export type NegocioAcessivel = { id: string; name: string };

export type EscolhaDeNegocio =
  | { status: "sem_negocio"; negocios: [] }
  | { status: "escolha_necessaria"; negocios: NegocioAcessivel[] }
  | { status: "selecao_invalida"; negocios: NegocioAcessivel[] }
  | { status: "selecionado"; negocio: NegocioAcessivel; negocios: NegocioAcessivel[] };

/**
 * A preferência recebida por cookie ou formulário não concede acesso.
 * Se a preferência existia e perdeu validade, não cair na primeira empresa.
 */
export function escolherNegocio(
  negocios: NegocioAcessivel[],
  preferencia: string | null,
): EscolhaDeNegocio {
  if (preferencia !== null) {
    const negocio = negocios.find((item) => item.id === preferencia);
    return negocio
      ? { status: "selecionado", negocio, negocios }
      : { status: "selecao_invalida", negocios };
  }

  if (negocios.length === 0) return { status: "sem_negocio", negocios: [] };
  if (negocios.length === 1) return { status: "selecionado", negocio: negocios[0]!, negocios };
  return { status: "escolha_necessaria", negocios };
}
