/**
 * Pré-voo local da geração visual. Não autoriza o negócio, não chama provedor
 * e não publica peça. A rota que usar este contrato deverá conferir a sessão,
 * o vínculo com o negócio e a origem de cada campo antes de montá-lo.
 */

export type EstadoDoContexto =
  | "confirmado_cliente"
  | "declarado_sem_conferencia"
  | "observado_fonte_externa"
  | "inferido_para_revisao"
  | "ausente";

export interface CampoDoContexto {
  valor: string | null;
  origem: string | null;
  registradoEm: string | null;
  estado: EstadoDoContexto;
}

export interface MaterialDaMarca {
  businessId: string;
  caminhoPrivado: string;
  tipo: "logo" | "fachada" | "ambiente" | "produto";
  origem: string;
  registradoEm: string;
  autorizadoParaGeracao: boolean;
}

export interface ReferenciaDaPeca {
  id: string;
  tipo: "imagem" | "video";
  origem: string;
  /** URL pública ou identificador do arquivo autorizado; nunca prova desempenho. */
  localizadorFonte: string;
  observadaEm: string;
  condicaoDeUso: string;
  padrao: string;
  revisadaPorHumano: boolean;
  revisadaPor: string;
  usoComoInspiracaoPermitido: boolean;
}

export interface EntradaDoBriefing {
  businessId: string;
  objetivo: CampoDoContexto;
  oferta: CampoDoContexto;
  acaoDesejada: CampoDoContexto;
  promocao: boolean;
  validadeDaPromocao?: CampoDoContexto | null;
  coresConfirmadas: CampoDoContexto;
  logo: MaterialDaMarca | null;
  usarFachada: boolean;
  fachada: MaterialDaMarca | null;
  nichoId: string | null;
  nichoConfirmadoNoCatalogo: boolean;
  documentoCentralVersao: string | null;
  documentoNichoVersao: string | null;
  referencias: ReferenciaDaPeca[];
}

export type PendenciaDoBriefing =
  | "negocio_ausente"
  | "objetivo_ausente"
  | "oferta_nao_confirmada"
  | "acao_nao_confirmada"
  | "validade_nao_confirmada"
  | "cores_nao_confirmadas"
  | "logo_nao_autorizado"
  | "fachada_real_ausente"
  | "nicho_nao_confirmado"
  | "documentos_sem_versao"
  | "referencia_admissivel_ausente";

export interface BriefingVisual {
  businessId: string;
  objetivo: string;
  oferta: string;
  acaoDesejada: string;
  validadeDaPromocao: string | null;
  cores: string;
  logo: string;
  fachada: string | null;
  nichoId: string;
  documentoCentralVersao: string;
  documentoNichoVersao: string;
  referencias: {
    id: string;
    padrao: string;
    origem: string;
    localizadorFonte: string;
    observadaEm: string;
    condicaoDeUso: string;
    revisadaPor: string;
  }[];
  restricoes: readonly string[];
}

function texto(valor: string | null | undefined): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function temProveniencia(campo: CampoDoContexto): boolean {
  return Boolean(texto(campo.origem) && texto(campo.registradoEm)
    && Number.isFinite(Date.parse(campo.registradoEm!)));
}

function confirmado(campo: CampoDoContexto): boolean {
  return campo.estado === "confirmado_cliente" && Boolean(texto(campo.valor))
    && temProveniencia(campo);
}

function materialValido(
  material: MaterialDaMarca | null, businessId: string, tipo: MaterialDaMarca["tipo"],
): material is MaterialDaMarca {
  const prefixo = `identidade/${businessId}/`;
  const caminho = texto(material?.caminhoPrivado);
  const restante = caminho.startsWith(prefixo) ? caminho.slice(prefixo.length) : "";
  return Boolean(material && material.businessId === businessId
    && material.tipo === tipo && restante
    && !restante.split("/").some((parte) => !parte || parte === "." || parte === "..")
    && texto(material.origem) && Number.isFinite(Date.parse(material.registradoEm))
    && material.autorizadoParaGeracao);
}

export function prepararBriefingVisual(entrada: EntradaDoBriefing):
  | { ok: true; briefing: BriefingVisual }
  | { ok: false; pendencias: PendenciaDoBriefing[] } {
  const pendencias: PendenciaDoBriefing[] = [];
  const businessId = texto(entrada.businessId);
  if (!businessId) pendencias.push("negocio_ausente");

  // O objetivo pode ser uma declaração nova do cliente. Oferta, prazo e
  // identidade precisam da confirmação explícita antes de virarem imagem.
  if (!texto(entrada.objetivo.valor) || !temProveniencia(entrada.objetivo)
    || !["confirmado_cliente", "declarado_sem_conferencia"].includes(entrada.objetivo.estado))
    pendencias.push("objetivo_ausente");
  if (!confirmado(entrada.oferta)) pendencias.push("oferta_nao_confirmada");
  // O destino da resposta é parte da promessa da peça. Não deduzir WhatsApp,
  // Instagram, endereço ou número a partir do objetivo geral da campanha.
  if (!confirmado(entrada.acaoDesejada)) pendencias.push("acao_nao_confirmada");
  if ((entrada.promocao && !entrada.validadeDaPromocao)
    || (entrada.validadeDaPromocao && !confirmado(entrada.validadeDaPromocao)))
    pendencias.push("validade_nao_confirmada");
  if (!confirmado(entrada.coresConfirmadas)) pendencias.push("cores_nao_confirmadas");
  if (!materialValido(entrada.logo, businessId, "logo")) pendencias.push("logo_nao_autorizado");
  if (entrada.usarFachada && !materialValido(entrada.fachada, businessId, "fachada"))
    pendencias.push("fachada_real_ausente");
  if (!texto(entrada.nichoId) || !entrada.nichoConfirmadoNoCatalogo)
    pendencias.push("nicho_nao_confirmado");
  if (!texto(entrada.documentoCentralVersao) || !texto(entrada.documentoNichoVersao))
    pendencias.push("documentos_sem_versao");

  const referencias = entrada.referencias.filter((item) => item.tipo === "imagem"
    && Boolean(texto(item.id) && texto(item.origem) && texto(item.localizadorFonte)
      && texto(item.condicaoDeUso) && texto(item.padrao) && texto(item.revisadaPor))
    && Number.isFinite(Date.parse(item.observadaEm))
    && item.revisadaPorHumano && item.usoComoInspiracaoPermitido);
  if (referencias.length === 0) pendencias.push("referencia_admissivel_ausente");
  if (pendencias.length) return { ok: false, pendencias };

  return {
    ok: true,
    briefing: {
      businessId,
      objetivo: texto(entrada.objetivo.valor),
      oferta: texto(entrada.oferta.valor),
      acaoDesejada: texto(entrada.acaoDesejada.valor),
      validadeDaPromocao: entrada.validadeDaPromocao ? texto(entrada.validadeDaPromocao.valor) : null,
      cores: texto(entrada.coresConfirmadas.valor),
      logo: entrada.logo!.caminhoPrivado,
      fachada: entrada.usarFachada ? entrada.fachada!.caminhoPrivado : null,
      nichoId: texto(entrada.nichoId),
      documentoCentralVersao: texto(entrada.documentoCentralVersao),
      documentoNichoVersao: texto(entrada.documentoNichoVersao),
      referencias: referencias.map((item) => ({
        id: item.id.trim(),
        padrao: item.padrao.trim(),
        origem: item.origem.trim(),
        localizadorFonte: item.localizadorFonte.trim(),
        observadaEm: item.observadaEm,
        condicaoDeUso: item.condicaoDeUso.trim(),
        revisadaPor: item.revisadaPor.trim(),
      })),
      restricoes: [
        "Não inventar fachada, preço, prazo, depoimento ou resultado.",
        "Não inventar canal, link, endereço ou telefone para a resposta ao anúncio.",
        "Usar referências como inspiração de estrutura, nunca copiar identidade ou peça de terceiro.",
        "A imagem gerada é uma proposta, não aprovação nem anúncio publicado.",
      ],
    },
  };
}
