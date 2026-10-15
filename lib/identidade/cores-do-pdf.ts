import { coresDeImageData, type CorDaLogo } from "./cores-da-logo.ts";
import { TETO_DO_NAVEGADOR_BYTES } from "@/lib/criativos/limites.mjs";

/** Lê no navegador algumas páginas do guia. O PDF não sai do dispositivo nesta análise. */
export async function coresDoPdf(arquivo: File): Promise<CorDaLogo[]> {
  if (arquivo.size > TETO_DO_NAVEGADOR_BYTES || arquivo.size < 5) return [];
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker-6.4.299.min.mjs";
    const standardFontDataUrl = "/pdfjs-standard-fonts/";
    const tarefa = pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), standardFontDataUrl });
    const pdf = await tarefa.promise;
    const propostas: CorDaLogo[] = [];
    try {
      for (let numero = 1; numero <= Math.min(pdf.numPages, 5); numero++) {
        const pagina = await pdf.getPage(numero);
        const base = pagina.getViewport({ scale: 1 });
        const viewport = pagina.getViewport({ scale: Math.min(1, 360 / Math.max(base.width, base.height)) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const contexto = canvas.getContext("2d", { willReadFrequently: true });
        if (!contexto) continue;
        await pagina.render({ canvas, canvasContext: contexto, viewport }).promise;
        propostas.push(...coresDeImageData(contexto.getImageData(0, 0, canvas.width, canvas.height), 6));
        // Muitos manuais trazem códigos hexadecimais como texto, não como grandes áreas coloridas.
        const texto = await pagina.getTextContent();
        const conteudo = texto.items.map((item) => "str" in item ? item.str : "").join(" ");
        for (const achado of conteudo.matchAll(/(?:^|[^0-9a-fA-F])#([0-9a-fA-F]{6})(?![0-9a-fA-F])/g))
          propostas.push({ hex: `#${achado[1]!.toUpperCase()}`, peso: 1 });
      }
    } finally {
      await tarefa.destroy();
    }
    return propostas;
  } catch (erro) {
    console.warn("[marca] falha na leitura local do PDF:", erro instanceof Error ? erro.name : "desconhecida");
    return [];
  }
}
