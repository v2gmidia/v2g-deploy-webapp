import { estadoDaTriagem, sugestaoDeterministica } from "../lib/jev/triagem.ts";

let falhas = 0;

function conferir(condicao: boolean, mensagem: string) {
  if (condicao) return;
  falhas += 1;
  console.error(`falhou: ${mensagem}`);
}

const vencida = estadoDaTriagem([
  { campo: "ticket_medio", motivo: "nao_sei", caminho: "/onboarding/contas", diasEsperando: 5 },
]);
const aguardandoCliente = estadoDaTriagem([
  { campo: "descricao_livre", motivo: "nao_perguntado", caminho: "/onboarding", diasEsperando: null },
]);

const sugestaoVencida = sugestaoDeterministica(vencida);
conferir(sugestaoVencida.prioridade === "alta", "pendência vencida vira alta");
conferir(sugestaoVencida.motivo === "prazo_operacional", "pendência vencida registra prazo");
conferir(sugestaoVencida.exigeRevisaoHumana, "nenhuma sugestão dispensa revisão humana");

const sugestaoAguardandoCliente = sugestaoDeterministica(aguardandoCliente);
conferir(sugestaoAguardandoCliente.prioridade === "baixa", "sem espera conhecida fica na fila normal");
conferir(sugestaoAguardandoCliente.exigeRevisaoHumana, "fallback mantém revisão humana");

if (falhas > 0) process.exitCode = 1;
else console.log("jev: 5/5");
