"use client";

import { useState } from "react";
import { cancelarReservaAction, reservarHorarioAction, type EstadoAgenda } from "./agenda-actions";

const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long" });
const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

export function AgendaPropria({ inicial }: { inicial: Exclude<EstadoAgenda, { status: "legado" }> }) {
  const [estado, setEstado] = useState<EstadoAgenda>(inicial);
  const [horario, setHorario] = useState(inicial.status === "livre" ? inicial.horarios[0] ?? "" : "");
  const [ocupado, setOcupado] = useState(false);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);

  async function reservar() {
    if (!horario || ocupado) return;
    setOcupado(true);
    try { setEstado(await reservarHorarioAction(horario)); }
    catch { setEstado({ status: "erro", mensagem: "Não conseguimos conferir a reserva. Atualize antes de tentar de novo." }); }
    finally { setOcupado(false); }
  }

  async function cancelar() {
    if (ocupado) return;
    setOcupado(true);
    try {
      const proximo = await cancelarReservaAction();
      setEstado(proximo);
      if (proximo.status === "livre") setHorario(proximo.horarios[0] ?? "");
    } catch { setEstado({ status: "erro", mensagem: "Não conseguimos conferir o cancelamento. Atualize a página." }); }
    finally { setOcupado(false); setConfirmarCancelamento(false); }
  }

  if (estado.status === "erro") return <section className="pendencia-bloco" role="alert">
    <b>Agenda indisponível</b><p>{estado.mensagem}</p>
    <button className="chip-opt" type="button" onClick={() => window.location.reload()}>Atualizar agenda</button>
  </section>;
  if (estado.status === "pendente") return <section className="pendencia-bloco" role="status">
    <b>Estamos conferindo sua reserva</b>
    <p>Solicitação para {data.format(new Date(estado.inicio))}, às {hora.format(new Date(estado.inicio))}. Ainda não há confirmação do Google. Não escolha outro horário; atualize esta página para conferir.</p>
    <button className="chip-opt" type="button" onClick={() => window.location.reload()}>Conferir novamente</button>
  </section>;
  if (estado.status === "confirmada") return <section className="pendencia-bloco" role="status">
    <b>Reunião confirmada</b>
    <p>{data.format(new Date(estado.inicio))}, das {hora.format(new Date(estado.inicio))} às {hora.format(new Date(estado.fim))} (Brasília).</p>
    {estado.url && <p><a href={estado.url} target="_blank" rel="noopener noreferrer">Ver no Google Agenda</a></p>}
    <p>Você também recebe o convite no e-mail confirmado da compra. Há apenas uma reserva ativa para este negócio.</p>
    {!confirmarCancelamento ? <button className="chip-opt" type="button" onClick={() => setConfirmarCancelamento(true)}>Cancelar esta reunião</button> :
      <div role="group" aria-label="Confirmar cancelamento">
        <p>Cancelar libera o horário para outra pessoa. Quer continuar?</p>
        <button className="chip-opt" type="button" disabled={ocupado} onClick={cancelar}>{ocupado ? "Cancelando…" : "Sim, cancelar"}</button>{" "}
        <button className="chip-opt" type="button" disabled={ocupado} onClick={() => setConfirmarCancelamento(false)}>Manter reunião</button>
      </div>}
  </section>;
  if (estado.status === "legado") return null;
  return <section className="pendencia-bloco">
    <b>Escolha um horário</b>
    {estado.horarios.length ? <>
      <p>O horário será reservado no Google Agenda e aparecerá aqui depois da confirmação.</p>
      <label htmlFor="horario-reuniao">Horários livres</label>
      <select id="horario-reuniao" value={horario} onChange={(evento) => setHorario(evento.target.value)}>
        {estado.horarios.map((opcao) => <option key={opcao} value={opcao}>
          {data.format(new Date(opcao))} · {hora.format(new Date(opcao))}
        </option>)}
      </select>
      <button className="cta" type="button" disabled={ocupado || !horario} onClick={reservar}>{ocupado ? "Reservando…" : "Reservar reunião"}</button>
    </> : <p>Não há horários livres nesta janela. Fale com a equipe para combinar outra opção.</p>}
  </section>;
}
