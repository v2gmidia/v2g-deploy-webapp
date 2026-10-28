import { Casco } from "@/components/ui/Casco";
import { TelaDoInicio } from "@/app/(protected)/inicio/TelaDoInicio";
import { exemploDoInicio } from "@/lib/exemplo";
import { intervaloDoInicio } from "@/lib/inicio/periodo";

export function PreviaRecepcao({ caso }: { caso: string }) {
  const estado = exemploDoInicio(new Date("2026-10-27T15:00:00Z"), caso === "operacao" ? "pausado" : "chegada");
  if (caso !== "operacao") estado.diaSeguinte = { execucao: null, acumulado: null };
  if (caso === "metricas") estado.veiculacao = "nao_sabemos";
  return <Casco nome="Pessoa fictícia" nomeNegocio="Negócio de exemplo" rotuloDaConta="Negócio de exemplo" inicial="N" rotaAtiva="/inicio">
    <p className="previa-local-nota">Prévia local com dados fictícios · <a href="?caso=pendente">Sem confirmação</a> · <a href="?caso=confirmada">Reunião confirmada</a> · <a href="?caso=agenda">Falha de agenda</a> · <a href="?caso=metricas">Falha de resultados</a> · <a href="?caso=operacao">Com histórico</a></p>
    <TelaDoInicio estado={estado} ultimaDecisao={null} diaDaPergunta="2026-10-26" atrasados={[]} faixa={null}
      intervalo={intervaloDoInicio({}, "2026-10-27")}
      acumuladoDoPeriodo={caso === "metricas" || caso === "operacao" ? null : undefined}
      recepcaoOnboarding={{
        reserva: caso === "confirmada" ? { starts_at: "2026-10-30T17:00:00Z", ends_at: "2026-10-30T17:30:00Z" } : null,
        falhaReuniao: caso === "agenda",
      }} />
  </Casco>;
}
