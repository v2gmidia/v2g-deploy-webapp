"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TIPOS_DE_TAREFA } from "@/lib/gestor/tarefas";
import { assumirContaAction, concluirTarefaAction, criarTarefaAction, type EstadoTarefa } from "./actions";

export function CriarTarefa({ negocios, negocioInicial }: {
  negocios: { id: string; name: string }[]; negocioInicial: string | null;
}) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<EstadoTarefa, FormData>(criarTarefaAction, {});
  const [id, setId] = useState(() => crypto.randomUUID());
  const [prazoUtc, setPrazoUtc] = useState("");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!estado.ok) return;
    setId(crypto.randomUUID());
    setPrazoUtc("");
    form.current?.reset();
    router.refresh();
  }, [estado, router]);
  return <form ref={form} action={acao} className="auth-card">
    <h2>Nova tarefa interna</h2>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="prazoUtc" value={prazoUtc} />
    <label>Negócio
      <select name="businessId" defaultValue={negocioInicial ?? ""} required>
        <option value="" disabled>Escolha o negócio</option>
        {negocios.map((negocio) => <option key={negocio.id} value={negocio.id}>{negocio.name}</option>)}
      </select>
    </label>
    <label>Tipo
      <select name="tipo" required defaultValue="prepare_meeting">
        {Object.entries(TIPOS_DE_TAREFA).map(([valor, titulo]) => <option key={valor} value={valor}>{titulo}</option>)}
      </select>
    </label>
    <label>Título<input name="titulo" minLength={5} maxLength={160} required placeholder="Ex.: conferir acesso à conta de anúncios" /></label>
    <label>Detalhes<textarea name="descricao" maxLength={2000} rows={2} /></label>
    <label>Prazo no seu horário local (opcional)
      <input type="datetime-local" onChange={(evento) => {
        const valor = evento.target.value;
        setPrazoUtc(valor && Number.isFinite(Date.parse(valor)) ? new Date(valor).toISOString() : "");
      }} />
    </label>
    <p>Você será o responsável por esta tarefa. Concluí-la registra sua ação; não altera campanha ou serviços externos.</p>
    <button type="submit" disabled={pendente}>{pendente ? "Registrando..." : "Registrar tarefa"}</button>
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}

export function AssumirConta({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<EstadoTarefa, FormData>(assumirContaAction, {});
  useEffect(() => { if (estado.ok) router.refresh(); }, [estado, router]);
  return <form action={acao}>
    <input type="hidden" name="businessId" value={businessId} />
    <button type="submit" disabled={pendente}>Assumir conta</button>
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}

export function ConcluirTarefa({ id }: { id: string }) {
  const router = useRouter();
  const [estado, acao, pendente] = useActionState<EstadoTarefa, FormData>(concluirTarefaAction, {});
  useEffect(() => { if (estado.ok) router.refresh(); }, [estado, router]);
  return <form action={acao}>
    <input type="hidden" name="id" value={id} />
    <label>O que foi feito
      <textarea name="nota" minLength={5} maxLength={2000} rows={2} required />
    </label>
    <button type="submit" disabled={pendente}>Concluir tarefa</button>
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}
