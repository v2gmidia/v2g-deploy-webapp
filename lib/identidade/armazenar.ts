import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAXIMO_DE_FOTOS, validar, type UsoDeIdentidade } from "./regras";

/**
 * Guardar, listar e arquivar a identidade visual do negócio.
 *
 * ============================================================
 * O UPLOAD PASSA PELO SERVIDOR, e não é acidente.
 *
 * `storage.objects` tem RLS ligada e NENHUMA política: ninguém além de
 * `service_role` escreve no bucket. Dava para criar políticas de storage e
 * subir direto do navegador, mas isso poria a regra de quem-pode-o-quê em
 * dois lugares — `creatives` e `storage.objects` — que precisariam
 * concordar para sempre.
 *
 * E tem o motivo maior: as validações de `regras.ts` só existem se alguém
 * as executar. No upload direto, a única validação seria a do navegador, e
 * validação de navegador é conveniência, não garantia.
 * ============================================================
 *
 * Ver docs/upload-identidade.md §2.
 */

/** O bucket que já existe. Não crie outro — §2 do doc explica por quê. */
const BUCKET = "v2g-midia";

/**
 * O prefixo é `identidade/{business_id}/`, e a escolha tem uma razão que
 * vai além de organizar: ela permite APAGAR ou MIGRAR TUDO DE UM NEGÓCIO
 * POR PREFIXO, numa operação só.
 *
 * Isso serve a dois caminhos já previstos. O pedido de exclusão da LGPD
 * precisa remover os arquivos de um negócio sem varrer a tabela inteira. E
 * a revisão jurídica levantou a hipótese de migrar as imagens para o GCP em
 * região brasileira — o GCP já tem as cláusulas-padrão da ANPD e o Supabase
 * provavelmente não. Nos dois casos, o recorte é o mesmo prefixo.
 */
function caminhoDe(businessId: string, nome: string): string {
  return `identidade/${businessId}/${nome}`;
}

export interface ImagemDeIdentidade {
  id: string;
  uso: UsoDeIdentidade;
  nomeDoArquivo: string | null;
  caminho: string;
  criadoEm: string;
  /** URL assinada, de vida curta. O bucket é privado. */
  url: string | null;
}

const VALIDADE_DA_URL_EM_SEGUNDOS = 60 * 60;

export async function listarIdentidade(
  businessId: string,
): Promise<{ logo: ImagemDeIdentidade | null; fotos: ImagemDeIdentidade[] }> {
  const supa = createAdminClient();

  const { data } = await supa
    .from("creatives")
    .select("id, uso, file_name, storage_path, created_at")
    .eq("business_id", businessId)
    .in("uso", ["logo", "identidade"])
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const linhas = data ?? [];
  if (linhas.length === 0) return { logo: null, fotos: [] };

  // Uma chamada só para todas as URLs. Assinar uma a uma seria uma ida ao
  // storage por imagem, e a tela abre com até onze.
  const caminhos = linhas.map((l) => l.storage_path).filter((c): c is string => Boolean(c));
  const { data: assinadas } = await supa.storage
    .from(BUCKET)
    .createSignedUrls(caminhos, VALIDADE_DA_URL_EM_SEGUNDOS);

  const porCaminho = new Map(
    (assinadas ?? []).map((a) => [a.path ?? "", a.signedUrl ?? null]),
  );

  const mapear = (l: (typeof linhas)[number]): ImagemDeIdentidade => ({
    id: l.id,
    uso: l.uso as UsoDeIdentidade,
    nomeDoArquivo: l.file_name,
    caminho: l.storage_path ?? "",
    criadoEm: l.created_at,
    url: porCaminho.get(l.storage_path ?? "") ?? null,
  });

  return {
    logo: linhas.filter((l) => l.uso === "logo").map(mapear)[0] ?? null,
    fotos: linhas.filter((l) => l.uso === "identidade").map(mapear),
  };
}

export type ResultadoDoEnvio =
  | { ok: true; id: string }
  | { ok: false; mensagem: string };

export async function guardarImagem(entrada: {
  businessId: string;
  uso: UsoDeIdentidade;
  nomeOriginal: string;
  bytes: Uint8Array;
  /** O texto EXATO do aviso que a pessoa viu antes de enviar. */
  textoDaDeclaracao: string;
}): Promise<ResultadoDoEnvio> {
  const veredito = validar(entrada.bytes, entrada.uso);
  if (!veredito.ok) return { ok: false, mensagem: veredito.mensagem };

  const supa = createAdminClient();

  if (entrada.uso === "identidade") {
    const { count } = await supa
      .from("creatives")
      .select("id", { count: "exact", head: true })
      .eq("business_id", entrada.businessId)
      .eq("uso", "identidade")
      .is("arquivado_em", null);

    if ((count ?? 0) >= MAXIMO_DE_FOTOS) {
      return {
        ok: false,
        mensagem: `Você já tem ${MAXIMO_DE_FOTOS} fotos aqui, que é o limite. Remova uma antes de mandar outra.`,
      };
    }
  }

  // O logo é um só. O antigo sai do índice único ao ser arquivado, e é isso
  // que libera o novo — por isso arquivar vem ANTES de inserir.
  //
  // O OBJETO NO STORAGE NÃO É APAGADO. Ele pode ter sido insumo de uma peça
  // que está no ar, e "de qual logo saiu este anúncio" precisa continuar
  // tendo resposta. A remoção física acontece só no fluxo de exclusão da
  // LGPD, por prefixo.
  if (entrada.uso === "logo") {
    await supa
      .from("creatives")
      .update({ arquivado_em: new Date().toISOString() })
      .eq("business_id", entrada.businessId)
      .eq("uso", "logo")
      .is("arquivado_em", null);
  }

  const nome =
    entrada.uso === "logo"
      ? `logo-${randomUUID()}.${veredito.extensao}`
      : `${randomUUID()}.${veredito.extensao}`;
  const caminho = caminhoDe(entrada.businessId, nome);

  const { error: erroUpload } = await supa.storage
    .from(BUCKET)
    .upload(caminho, entrada.bytes, {
      contentType: veredito.tipo === "png" ? "image/png" : "image/jpeg",
      upsert: false,
    });

  if (erroUpload) {
    return { ok: false, mensagem: "Não consegui guardar o arquivo. Tente de novo." };
  }

  const { data: linha, error: erroLinha } = await supa
    .from("creatives")
    .insert({
      business_id: entrada.businessId,
      uso: entrada.uso,
      type: "imagem",
      file_name: entrada.nomeOriginal.slice(0, 200),
      storage_path: caminho,
      status: "draft",
      // A LGPD pede consentimento DEMONSTRÁVEL, e "clicou em enviar" não
      // demonstra o quê. Guardar a redação vigente é o que permite
      // responder, dois anos depois, o que exatamente foi declarado.
      copy: {
        declaracao: {
          em: new Date().toISOString(),
          texto: entrada.textoDaDeclaracao,
        },
        dimensao: { largura: veredito.largura, altura: veredito.altura },
      },
    })
    .select("id")
    .single();

  if (erroLinha || !linha) {
    // Sem a linha, o objeto vira lixo invisível — ninguém sabe de quem é
    // nem por quê. Desfaz.
    await supa.storage.from(BUCKET).remove([caminho]);
    return { ok: false, mensagem: "Não consegui registrar a imagem. Tente de novo." };
  }

  return { ok: true, id: linha.id };
}

/**
 * Remover, do ponto de vista do cliente, é ARQUIVAR.
 *
 * O objeto continua no storage pelo mesmo motivo da troca de logo: pode ter
 * sido insumo de peça publicada. Some da tela, sai do índice, e a remoção
 * física fica para o fluxo de exclusão da LGPD.
 */
export async function arquivarImagem(
  businessId: string,
  imagemId: string,
): Promise<{ ok: boolean }> {
  const supa = createAdminClient();
  const { error } = await supa
    .from("creatives")
    .update({ arquivado_em: new Date().toISOString() })
    // O `business_id` no filtro não é redundante: sem ele, um id de outro
    // negócio arquivaria a imagem alheia, porque o cliente admin ignora RLS.
    .eq("business_id", businessId)
    .eq("id", imagemId)
    .in("uso", ["logo", "identidade"])
    .is("arquivado_em", null);

  return { ok: !error };
}
