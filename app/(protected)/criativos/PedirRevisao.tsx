"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { TAMANHO_MAXIMO_REVISAO } from "@/lib/criativos/revisao";
import { solicitarRevisaoAction } from "./revisao-actions";

export function PedirRevisao({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!arquivo || enviando) return;
    if (arquivo.size < 1 || arquivo.size > TAMANHO_MAXIMO_REVISAO ||
      !["image/jpeg", "image/png"].includes(arquivo.type)) {
      setAviso({ ok: false, texto: "Escolha uma imagem JPG ou PNG de até 9 MB." });
      return;
    }
    setEnviando(true);
    setAviso(null);
    try {
      const dados = new FormData();
      dados.set("submissaoId", id);
      dados.set("businessId", businessId);
      dados.set("arquivo", arquivo);
      const resultado = await solicitarRevisaoAction(dados);
      if (!resultado.ok) {
        setAviso({ ok: false, texto: resultado.recado });
        return;
      }
      setAviso({ ok: true, texto: resultado.repetido
        ? "Esta peça já estava registrada para revisão."
        : "Peça recebida para revisão humana. A campanha ainda não foi publicada." });
      setArquivo(null);
      setId(crypto.randomUUID());
      if (campo.current) campo.current.value = "";
      router.refresh();
    } catch {
      setAviso({ ok: false, texto: "A conexão foi interrompida. Confira a lista abaixo antes de repetir o envio." });
    } finally {
      setEnviando(false);
    }
  }

  return <form onSubmit={enviar} className="auth-card">
    <h3>Enviar peça para revisão</h3>
    <p>O gestor vai avaliar a imagem. Aprovação interna não significa que a campanha está no ar.</p>
    <label>Imagem JPG ou PNG, até 9 MB
      <input ref={campo} type="file" accept="image/jpeg,image/png" required disabled={enviando}
        onChange={(evento) => {
          setArquivo(evento.target.files?.[0] ?? null);
          setId(crypto.randomUUID());
          setAviso(null);
        }} />
    </label>
    <button type="submit" disabled={!arquivo || enviando}>{enviando ? "Enviando..." : "Pedir revisão"}</button>
    {aviso && <p className={aviso.ok ? "form-notice" : "form-error"} role="status">{aviso.texto}</p>}
  </form>;
}
