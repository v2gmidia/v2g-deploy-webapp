import type { EstadoDoCliente } from "../estado/cliente";
import { daParaAfirmar, esteveNoAr } from "../veiculacao/estado.ts";

function temHistoricoDeResultados(estado: EstadoDoCliente): boolean {
  const acumulado = estado.diaSeguinte.acumulado;
  return estado.temNumero || Boolean(acumulado && (acumulado.temDadoDaPlataforma || acumulado.investiuCentavos !== null ||
      acumulado.voltouCentavos !== null || acumulado.dias.length > 0 || acumulado.porExecucao.length > 0));
}

/** Ausência confirmada de operação dispensa resultados; leitura desconhecida não. */
export function resultadosSaoEsperados(estado: EstadoDoCliente): boolean {
  return !daParaAfirmar(estado.veiculacao) || esteveNoAr(estado.veiculacao) ||
    estado.diaSeguinte.execucao !== null || estado.campanhasNoAr.length > 0 || temHistoricoDeResultados(estado);
}

/** A recepção não substitui acompanhamento de uma operação já conhecida. */
export function cabeRecepcaoDoCadastro(estado: EstadoDoCliente): boolean {
  return !temHistoricoDeResultados(estado) && !estado.diaSeguinte.execucao && estado.campanhasNoAr.length === 0 &&
    !esteveNoAr(estado.veiculacao);
}
