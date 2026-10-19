"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { comTetoDeEspera, EsperaEstourou } from "@/lib/criativos/espera";
import { TAMANHO_MAXIMO_REVISAO } from "@/lib/criativos/revisao";
import { apresentarVeredito } from "@/lib/criativos/veredito";
import { analisarPecaAction } from "./actions";
import { solicitarRevisaoAction } from "./revisao-actions";

type Aviso = { tom: "notice" | "warning" | "error"; texto: string; motivos?: string[] };
type Fase = "pronto" | "enviando" | "analisando";

export function PedirRevisao({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [fase, setFase] = useState<Fase>("pronto");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo || fase !== "pronto") return;
    if (arquivo.size < 1 || arquivo.size > TAMANHO_MAXIMO_REVISAO ||
      !["image/jpeg", "image/png"].includes(arquivo.type)) {
      setAviso({ tom: "error", texto: "Escolha uma imagem JPG ou PNG de até 9 MB." });
      return;
    }
    setFase("enviando");
    setAviso(null);
    let recebido = false;
    try {
      const dados = new FormData();
      dados.set("submissaoId", id);
      dados.set("businessId", businessId);
      dados.set("arquivo", arquivo);
      const resultado = await solicitarRevisaoAction(dados);
      if (!resultado.ok) {
        setAviso({ tom: "error", texto: resultado.recado });
        return;
      }
      recebido = true;
      setArquivo(null);
      setId(crypto.randomUUID());
      if (campo.current) campo.current.value = "";
      if (!resultado.analisarAgora) {
        setAviso({ tom: "notice", texto: resultado.repetido
          ? "Esta peça já estava registrada para revisão. Ela não foi publicada."
          : "Peça recebida para revisão do gestor. Ela ainda não foi publicada." });
        return;
      }

      setFase("analisando");
      setAviso({ tom: "notice", texto: "Peça recebida. A análise automática está conferindo a imagem; ela ainda não foi publicada." });
      const dadosDaAnalise = new FormData();
      dadosDaAnalise.set("businessId", businessId);
      dadosDaAnalise.set("arquivos", arquivo);
      const analise = await comTetoDeEspera(analisarPecaAction(dadosDaAnalise));
      if (!analise.ok) {
        setAviso({ tom: "warning", texto: "Peça recebida para revisão, mas a análise automática não terminou. O gestor ainda pode conferir a imagem. Ela não foi publicada." });
        return;
      }
      const apresentacao = apresentarVeredito(analise.analise.veredito);
      if (!apresentacao) {
        setAviso({
          tom: "warning",
          texto: "Peça recebida para revisão, mas a análise automática não conseguiu avaliar a imagem. O gestor vai conferir; ela não foi publicada.",
          motivos: [analise.analise.motivo, ...analise.analise.recusados].filter((motivo): motivo is string => Boolean(motivo)),
        });
        return;
      }
      setAviso({
        tom: apresentacao.estilo === "v-fraco" ? "warning" : "notice",
        texto: `Análise automática concluída: ${apresentacao.titulo}. O gestor ainda vai revisar a peça antes de qualquer publicação.`,
        motivos: analise.analise.motivos,
      });
    } catch (motivo) {
      setAviso(recebido
        ? { tom: "warning", texto: motivo instanceof EsperaEstourou
          ? "Peça recebida para revisão. A análise automática está demorando e esta tela parou de esperar. Confira a galeria antes de enviar de novo; ela não foi publicada."
          : "Peça recebida para revisão, mas a análise automática não terminou nesta tela. Confira a galeria antes de enviar de novo; ela não foi publicada." }
        : { tom: "error", texto: "A conexão foi interrompida. Confira a galeria antes de repetir o envio." });
    } finally {
      setFase("pronto");
      router.refresh();
    }
  }

  return <form onSubmit={enviar} className="auth-card">
    <h3>Enviar criativo</h3>
    <p>A imagem entra na fila do gestor. Quando a análise automática estiver disponível, ela acontece após o envio. Nenhuma dessas etapas publica o anúncio.</p>
    <label>Imagem JPG ou PNG, até 9 MB
      <input ref={campo} type="file" accept="image/jpeg,image/png" required disabled={fase !== "pronto"}
        onChange={(evento) => {
          setArquivo(evento.target.files?.[0] ?? null);
          setId(crypto.randomUUID());
          setAviso(null);
        }} />
    </label>
    <button type="submit" disabled={!arquivo || fase !== "pronto"}>{fase === "enviando" ? "Enviando criativo..." : fase === "analisando" ? "Analisando imagem..." : "Enviar criativo"}</button>
    {aviso && <div className={aviso.tom === "notice" ? "form-notice" : aviso.tom === "warning" ? "form-warning" : "form-error"} role="status">
      <p>{aviso.texto}</p>
      {aviso.motivos && aviso.motivos.length > 0 && <ul>{aviso.motivos.map((motivo, indice) => <li key={`${indice}-${motivo}`}>{motivo}</li>)}</ul>}
    </div>}
  </form>;
}
