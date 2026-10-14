import "server-only";

import { randomUUID } from "node:crypto";
import type { IntervaloOcupado } from "./regras";

const API = "https://www.googleapis.com/calendar/v3";

export function agendaGoogleConfigurada(): boolean {
  return process.env.V2G_AGENDA_PROPRIA_ENABLED === "true"
    && !!process.env.GOOGLE_CALENDAR_CLIENT_ID
    && !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET
    && !!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
    && !!process.env.GOOGLE_CALENDAR_ID;
}

export function calendarIdConfigurado(): string | null {
  return agendaGoogleConfigurada() ? process.env.GOOGLE_CALENDAR_ID! : null;
}

async function accessToken(): Promise<string> {
  if (!agendaGoogleConfigurada()) throw new Error("agenda_nao_configurada");
  const corpo = new URLSearchParams({
    client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });
  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!resposta.ok) throw new Error("falha_autorizacao_google");
  const dados: unknown = await resposta.json();
  if (!dados || typeof dados !== "object" || !("access_token" in dados)
    || typeof dados.access_token !== "string") throw new Error("token_google_ausente");
  return dados.access_token;
}

async function chamarGoogle(caminho: string, init: RequestInit): Promise<Response> {
  const token = await accessToken();
  return fetch(`${API}${caminho}`, {
    ...init, cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
}

export async function ocupacoesGoogle(inicio: Date, fim: Date): Promise<IntervaloOcupado[]> {
  const calendarId = calendarIdConfigurado();
  if (!calendarId) throw new Error("agenda_nao_configurada");
  const resposta = await chamarGoogle("/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: inicio.toISOString(), timeMax: fim.toISOString(),
      timeZone: "America/Sao_Paulo", items: [{ id: calendarId }] }),
  });
  if (!resposta.ok) throw new Error("falha_disponibilidade_google");
  const dados: unknown = await resposta.json();
  if (!dados || typeof dados !== "object" || !("calendars" in dados))
    throw new Error("resposta_disponibilidade_invalida");
  const calendarios = dados.calendars as Record<string, { errors?: unknown[]; busy?: { start: string; end: string }[] }>;
  const calendario = calendarios[calendarId];
  if (!calendario || calendario.errors?.length || !Array.isArray(calendario.busy))
    throw new Error("calendario_indisponivel");
  return calendario.busy.map((item) => ({ inicio: new Date(item.start), fim: new Date(item.end) }));
}

export interface EventoGoogleCriado {
  id: string;
  etag: string;
  htmlLink: string | null;
}

export async function criarEventoGoogle(entrada: {
  eventId: string;
  inicio: string;
  fim: string;
  email: string;
  nome: string;
  cnpj: string;
  businessId: string;
}): Promise<EventoGoogleCriado> {
  const calendarId = calendarIdConfigurado();
  if (!calendarId) throw new Error("agenda_nao_configurada");
  const params = new URLSearchParams({ sendUpdates: "all", conferenceDataVersion: "1" });
  const resposta = await chamarGoogle(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    method: "POST",
    body: JSON.stringify({
      id: entrada.eventId,
      summary: `Reunião inicial V2G (${entrada.nome})`,
      description: `Negócio atendido: CNPJ ${entrada.cnpj}. Reunião inicial V2G de 25 minutos.`,
      start: { dateTime: entrada.inicio, timeZone: "America/Sao_Paulo" },
      end: { dateTime: entrada.fim, timeZone: "America/Sao_Paulo" },
      attendees: [{ email: entrada.email }],
      guestsCanInviteOthers: false,
      conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      extendedProperties: { private: { v2gBusinessId: entrada.businessId } },
    }),
  });
  if (!resposta.ok) throw new Error("falha_criacao_google");
  const dados: unknown = await resposta.json();
  if (!dados || typeof dados !== "object" || !("id" in dados) || !("etag" in dados)
    || typeof dados.id !== "string" || typeof dados.etag !== "string")
    throw new Error("evento_google_sem_identificador");
  return { id: dados.id, etag: dados.etag,
    htmlLink: "htmlLink" in dados && typeof dados.htmlLink === "string" ? dados.htmlLink : null };
}

export async function lerEventoGoogle(eventId: string): Promise<{
  id: string; etag: string | null; status: string; businessId: string | null; htmlLink: string | null;
} | null> {
  const calendarId = calendarIdConfigurado();
  if (!calendarId) throw new Error("agenda_nao_configurada");
  const resposta = await chamarGoogle(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: "GET" });
  if (resposta.status === 404 || resposta.status === 410) return null;
  if (!resposta.ok) throw new Error("falha_leitura_evento_google");
  const dados: unknown = await resposta.json();
  if (!dados || typeof dados !== "object" || !("id" in dados) || dados.id !== eventId)
    throw new Error("evento_google_invalido");
  const privado = "extendedProperties" in dados && dados.extendedProperties && typeof dados.extendedProperties === "object"
    && "private" in dados.extendedProperties && dados.extendedProperties.private && typeof dados.extendedProperties.private === "object"
    ? dados.extendedProperties.private : null;
  return {
    id: eventId,
    etag: "etag" in dados && typeof dados.etag === "string" ? dados.etag : null,
    status: "status" in dados && typeof dados.status === "string" ? dados.status : "unknown",
    businessId: privado && "v2gBusinessId" in privado && typeof privado.v2gBusinessId === "string" ? privado.v2gBusinessId : null,
    htmlLink: "htmlLink" in dados && typeof dados.htmlLink === "string" ? dados.htmlLink : null,
  };
}

export async function apagarEventoGoogle(eventId: string): Promise<boolean> {
  const calendarId = calendarIdConfigurado();
  if (!calendarId) return false;
  const resposta = await chamarGoogle(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: "DELETE" });
  return resposta.ok || resposta.status === 404 || resposta.status === 410;
}
