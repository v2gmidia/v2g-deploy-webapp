# N26 — 03/04 — loading do onboarding — LOCAL — 06/11/2026

## Veredito

O onboarding agora usa feedback proporcional à duração sem apagar respostas,
arquivos ou o horário escolhido. Esta prova é **LOCAL**; QA e produção não
foram consultados nem alterados.

## Inventário e tratamento

| Tela/operação | Indicador e razão | Duração |
|---|---|---|
| entrada em /onboarding | skeleton fiel já existente, preservado | não medida |
| salvar resposta | trava imediata contra duplicação; indicador após 600 ms; aviso específico após 8 s | simulada nos limiares; rede real não medida |
| conectar/finalizar voz | texto localizado por etapa; falha mantém o texto e oferece retry efetivo | timeout de conexão conhecido em 10 s; provedor não medido |
| salvar/reabrir conta | campos preservados; feedback localizado após 600 ms; após 8 s pede para não repetir | simulada nos limiares; banco não medido |
| preparar/enviar logo | seleção preservada; upload identificado separadamente | simulada nos limiares; Storage não medido |
| preparar/enviar variações | seleção preservada; upload identificado separadamente | simulada nos limiares; Storage não medido |
| analisar cores | estado já separado do upload: só começa depois que o arquivo foi salvo | navegador real não medido |
| persistir marca | campos preservados; confirmação separada de upload e análise | simulada nos limiares; banco não medido |
| solicitar horário | horário continua marcado; solicitação não vira confirmação; estado pendente continua explícito | simulada nos limiares; Google não medido |
| cancelar horário | estado próprio, clique duplicado bloqueado e retry por atualização em falha | simulada nos limiares; Google não medido |

GuiaDaMarca e AnexosDaConversa permanecem fora da composição montada atual.
O primeiro recebeu o mesmo feedback de upload para não voltar sem tratamento
quando for ligado; o segundo já diferenciava preparo, envio, sucesso e
resultado incerto e não foi alterado.

## Arquivos

- app/(fluxo)/onboarding/tempo-da-operacao.ts;
- app/(fluxo)/onboarding/Chat.tsx;
- app/(fluxo)/onboarding/RespostaPorVoz.tsx;
- app/(fluxo)/onboarding/ChatConversa.module.css;
- app/(fluxo)/onboarding/contas/Contas.tsx;
- app/(fluxo)/onboarding/marca/{Marca,LogoDaMarca,VariacoesDaMarca,GuiaDaMarca}.tsx;
- app/(fluxo)/onboarding/concluido/{AgendaPropria.tsx,AgendaPropria.module.css};
- scripts/conferir-onboarding-loading.mjs;
- este checkpoint.

## Provas locais

- pnpm typecheck --pretty false: passou;
- node --test scripts/conferir-onboarding-loading.mjs: 6/6 — rápido/lento,
  falha/retry, clique duplo, celular, skeleton e reduced motion;
- pnpm conferir:onboarding-voz: 6/6;
- pnpm conferir:onboarding-preservacao: 77/77;
- agenda, agenda externa, horários e conciliação: 28/28;
- detector Impeccable dirigido: nenhum achado novo do bloco; manteve avisos
  anteriores do CSS legado da conversa;
- git diff --check -- app/(fluxo)/onboarding: passou.

## Revisão visual

Um dev compartilhado já estava ativo na porta 3000. Ele foi reutilizado sem
reinício. A bancada de resposta foi conferida no desktop e em viewport
390 × 844:

http://localhost:3000/exemplo/envio-onboarding

Foram observados o estado antes de 1 s, o aviso após 8 s, a trava de controles,
o balão pendente e a preservação do texto após falha. A marca foi conferida em
390 × 844 em:

http://localhost:3000/exemplo/onboarding-marca

Não houve overflow horizontal ou erro/aviso no console nas duas bancadas.
Upload real, microfone real e chamada ao Google continuam não medidos, pois as
bancadas não devem escrever em Storage, provedor de voz ou agenda externa.

## Limites

- Não foi criada porcentagem fictícia: upload, análise local, persistência e
  Google não expõem progresso granular confiável.
- Cancelar só existe onde a operação já é efetiva; resposta e upload incertos
  pedem conferência antes de repetir.
- Nenhuma escrita externa, migration, commit, push, deploy ou mudança em
  Início, compra, Criativos/Anúncios, Mesa, components/ui ou CSS global.
