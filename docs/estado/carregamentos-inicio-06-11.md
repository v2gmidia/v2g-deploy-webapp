# Carregamentos do Início — bloco local de 06/11/2026

## 0. Entrega e limites

Prévia aberta no Chrome: http://localhost:3000/exemplo/carregamento-inicio.
Servidor iniciado porque não havia listener em 3000; sessão 18050. Não reiniciar nem rodar build enquanto os demais chats estiverem usando esse dev.

Implementação local concluída neste recorte. **Não é aprovação de QA integral nem medição de produção.** Sem commit, push, deploy, banco, Meta ou envio real. E-mail/senha preservado; não reutilizadas as experiências de navegação/upload rejeitadas. Checkout, onboarding, Criativos, Anúncios e Mesa não foram editados.

## 1. Mapa por operação

| Tela / operação | Fato observado e tratamento | Medição | Teste / limite |
|---|---|---|---|
| Início / primeira entrada | Antes herdava o skeleton genérico de `app/(protected)/loading.tsx:3`. Agora `inicio/loading.tsx` usa `CarregandoInicio.tsx:7`, reserva cabeçalho, situação, quatro números e conteúdo. Silencioso até 1 s; skeleton estático depois disso; mensagem conhecida após 10 s. | Ensaio rápido: 210 ms. Ensaio longo: 12005 ms. Tempos reais **não medidos**. | Screenshot desktop e DOM. A reserva representa a composição executiva; o ramo após cadastro pode ter outra altura. Não foi medido CLS nem a espera anterior à resolução do layout autenticado. |
| Início / troca de período | `SeletorDePeriodo.tsx:53`: transição mantém conteúdo anterior, aviso fora do calendário fechado, trava de submissão, foco de volta ao seletor, falha local preserva datas. Aplicar o mesmo intervalo executa refresh para permitir nova consulta. | Janeiro–março: 12008 ms de espera **simulada**. | Navegador mobile + teclado: número e período anterior permanecem até concluir; aviso longo observado e novo intervalo apareceu ao terminar. Latência/erro de RSC autenticado não ensaiados. |
| Início / números indisponíveis | `TelaDoInicio.tsx:483` e `:645`: aviso passa a ter ação concreta `AtualizarInicio`; repete leitura por `router.refresh`, sem nova regra de dados. | **Não medido** em sessão real. | Tipo e renderização isolada. Não há polling nem atualização autônoma no código atual; não foram acrescentados. |
| Início / pergunta do dia | `PerguntaDoDia.tsx:248`: trava síncrona evita duplicação; try/catch/finally libera controles em rejeição de transporte, mantém valores e anuncia erro. Guardando imediato no botão, espera localizada após 1 s e texto sem spinner após 10 s. | Falha simulada 3002 ms; retry 3006 ms. Real **não medido**. | Testes de duplo envio, rejeição, erro retornado, liberação, preservação e confirmação; falha/retry no Chrome. Não foi enviada resposta real. Sem cancelamento fictício; sair não é apresentado como cancelamento da gravação. |
| Início / retorno após cadastro ou reunião | Mesma boundary de entrada. `RecepcaoDoCadastro` apenas apresenta o estado recebido e lê preferência local; `InicioAposReserva` troca passos localmente. A consulta da agenda ocorre no servidor de `inicio/page.tsx:162`. | **Não medido**. | Nenhuma animação de processamento acrescentada a uma etapa já concluída. Fluxo autenticado de retorno e regras da agenda não alterados. |

## 2. Padrão reutilizável para os demais responsáveis

Criados `components/ui/EsperaLocal.tsx` e `.module.css`.

```tsx
<EsperaLocal
  ativa={pendente}
  mensagem="Consultando os dados…"
  mensagemDemorada="A consulta está demorando. Você pode aguardar ou abrir outra área."
/>
```

- Somente apresentação: não inicia requisição, não bloqueia cliques, não controla retry/cancelamento e não infere sucesso.
- Abaixo de 1 s: região de status vazia, sem spinner. Ação deve responder imediatamente e bloquear duplicação no componente dono.
- A partir de 1 s: spinner localizado e mensagem; a partir de 10 s: mensagem longa sem spinner.
- `spinner={false}` para acompanhar skeleton, evitando dois indicadores concorrentes.
- `role=status`, `aria-live=polite`, `aria-atomic=true`; ícone oculto da árvore acessível. Movimento reduzido desliga rotação em CSS.
- O chamador deve fornecer a etapa verdadeira e uma saída suportada. Não há porcentagem ou ETA inventados.
- Timers são eliminados na desmontagem. Cada espera começa de novo, sem herdar o aviso longo da anterior.

Os demais responsáveis podem adotar o componente nos próprios arquivos. Nenhum contrato ou import deles foi modificado neste bloco.

## 3. Verificação

- `pnpm typecheck`: passou após todas as alterações funcionais.
- `pnpm conferir:inicio`: 70/70 (a linha negativa proposital do conferidor permanece).
- `node --test scripts/conferir-carregamento-inicio.mjs`: 4/4. Testa os componentes reais com relógio/hooks isolados, sem rede: limites de tempo, limpeza dos timers, duplicação, falha de transporte, preservação dos valores e resultado declarado da ação.
- Chrome: falha/retry de pergunta com valores preservados; período livre com conteúdo anterior durante espera; entrada rápida sem indicador; skeleton longo; navegação por teclado até aplicar o período; árvore acessível com nomes e região de status. Desktop sem overflow horizontal (1521/1521). Mobile inspecionado visualmente a 390 px; override restaurado.
- **Limitações:** não houve leitor de tela falado, dispositivo físico, Safari, sessão real, build completo ou medição real de latência. A emulação de reduced motion por CDP estava indisponível; somente regra CSS conferida. O skeleton foi visto na bancada com componente real; a boundary protegida não foi ensaiada com sessão autenticada.
- As ações da bancada são injetadas como funções locais; inclusive o registro de pergunta apresentada é um noop, evitando telemetria real.

### Divergências encontradas nos testes mais amplos

- `conferir-qa-interface.mjs`: 5 passaram, 2 falharam (linhas 53 e 71; expectativas da leitura de pendência/reserva). Arquivos dessa lógica não foram alterados.
- `conferir-recepcao-inicio.mjs`: 9 passaram, 4 falharam (linhas 41, 49, 57 e 63, considerando a inserção do port). Há expectativas de recepção renderizada no servidor, enquanto o componente atual começa oculto até seu efeito no navegador; também espera link literal de repetir período ausente no código lido no início deste bloco. Não afrouxadas as asserções para obter verde. Somente adicionado port para o novo botão `AtualizarInicio`, como os demais componentes cliente já isolados no teste.
- Não chamar a suíte completa de verde. A Central deve encaminhar a divergência de recepção/agenda ao responsável pelo fluxo antes da publicação.

## 4. Arquivos

- Novos: `components/ui/EsperaLocal.tsx`, `components/ui/EsperaLocal.module.css`.
- Novos no Início: `CarregandoInicio.tsx`, `CarregandoInicio.module.css`, `loading.tsx`, `error.tsx`, `AtualizarInicio.tsx`, `SeletorDePeriodo.module.css`.
- Alterados no Início: `SeletorDePeriodo.tsx`, `PerguntaDoDia.tsx`, `TelaDoInicio.tsx`.
- Bancada dev-only: `app/exemplo/carregamento-inicio/page.tsx`, `app/exemplo/_carregamento-inicio/Previa.tsx`.
- Testes: novo `scripts/conferir-carregamento-inicio.mjs`; um port adicional em `scripts/conferir-recepcao-inicio.mjs`.

Inspecionados, preservados: `app/(protected)/loading.tsx`, `components/ui/CarregamentoDeTela.module.css` e `NavegacaoCarregando.*`. O indicador global ainda parte de cliques capturados e some por timeout; não comprova término de uma operação. Sua substituição ampla não foi feita porque alcança os fluxos dos demais responsáveis. O novo padrão é opcional e as correções de Início usam seus estados reais de espera.

## 5. Evidências visuais

`C:/Users/victo/.codex/visualizations/2026/11/06/loading-inicio/`:

- `skeleton-desktop.png`: skeleton real do componente na espera simulada.
- `periodo-mobile.png`: resultado da seleção janeiro–março após 12008 ms. O aviso longo foi conferido no DOM antes da captura; a captura já mostra a conclusão, não a espera.

Bloco encerrado. Pendências de integração/autenticação, acessibilidade falada e divergências de testes estão explícitas acima.
