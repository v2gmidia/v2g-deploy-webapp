/** Conversão local: o servidor continua recebendo e validando apenas PNG/JPEG. */
export type ImagemPreparada = { ok: true; arquivo: File } | { ok: false; erro: string };

const LIMITE_FINAL = 4 * 1024 * 1024;
const LIMITE_ORIGINAL = 15 * 1024 * 1024;
const MAX_PIXELS = 24_000_000;
const TIPOS_CONVERSIVEIS = new Set([
  "image/jpeg", "image/webp", "image/avif", "image/heic", "image/heif",
]);

/** Usa o decodificador do navegador; se ele não conhecer HEIC/AVIF, orienta exportar PNG/JPG. */
export async function prepararImagemDaMarca(arquivo: File, destino: "logo" | "variacao"): Promise<ImagemPreparada> {
  if (!arquivo.size) return { ok: false, erro: "Escolha uma imagem antes de enviar." };
  const formatoDireto = arquivo.type === "image/png" || (destino === "variacao" && arquivo.type === "image/jpeg");
  if (!formatoDireto && !TIPOS_CONVERSIVEIS.has(arquivo.type))
    return { ok: false, erro: `${arquivo.name}: formato não reconhecido. Envie PNG, JPG, WebP ou AVIF; HEIC depende do navegador.` };
  if (arquivo.size > LIMITE_ORIGINAL)
    return { ok: false, erro: `${arquivo.name} ultrapassa 15 MB. Exporte uma versão menor antes de enviar.` };
  if (formatoDireto && arquivo.size <= LIMITE_FINAL) return { ok: true, arquivo };
  if (typeof createImageBitmap !== "function")
    return { ok: false, erro: "Este navegador não consegue converter a imagem. Exporte em PNG ou JPG." };

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(arquivo);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > MAX_PIXELS)
      return { ok: false, erro: `${arquivo.name} tem resolução grande demais. Exporte uma versão menor.` };
    if (Math.min(bitmap.width, bitmap.height) < 512)
      return { ok: false, erro: `${arquivo.name} precisa ter pelo menos 512 pixels de cada lado.` };
    const canvas = document.createElement("canvas");
    const contexto = canvas.getContext("2d");
    if (!contexto) return { ok: false, erro: "Não foi possível converter esta imagem. Exporte em PNG ou JPG." };
    let blob: Blob | null = null;
    let escala = 1;
    let extensao = "png";
    for (let tentativa = 0; tentativa < 8; tentativa += 1) {
      canvas.width = Math.round(bitmap.width * escala);
      canvas.height = Math.round(bitmap.height * escala);
      contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob && blob.size <= LIMITE_FINAL) break;
      // Apenas uma foto que já era JPEG vira JPEG novamente. Um PNG, WebP ou
      // AVIF pode ter transparência, que se perderia nessa conversão.
      if (destino === "variacao" && arquivo.type === "image/jpeg") {
        const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
        if (jpeg && jpeg.size <= LIMITE_FINAL) {
          blob = jpeg;
          extensao = "jpg";
          break;
        }
      }
      escala *= 0.8;
      if (Math.min(bitmap.width * escala, bitmap.height * escala) < 512) break;
    }
    if (!blob || blob.size > LIMITE_FINAL)
      return { ok: false, erro: `${arquivo.name} ficou maior que 4 MB após o ajuste. Exporte uma versão menor.` };
    const base = arquivo.name.replace(/\.[^.]+$/, "").slice(0, 150) || "marca";
    return { ok: true, arquivo: new File([blob], `${base}.${extensao}`, { type: blob.type }) };
  } catch {
    return { ok: false, erro: `${arquivo.name} não abriu neste navegador. Exporte em PNG ou JPG.` };
  } finally {
    bitmap?.close?.();
  }
}
