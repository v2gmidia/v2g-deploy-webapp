# 01/02 — carregamentos e retorno dos formulários — 06/11/2026

## 0. Encerramento deste bloco

**Bloco LOCAL concluído.** Implementação, testes dirigidos e confirmação visual
local encerrados. Não certifica publicação no QA nem operação real dos serviços.
Escopo autorizado pelo Central: compra, pagamento e acesso público; sem iniciar
outra frente. Nenhum commit, push, deploy, migration, cobrança, envio de e-mail
ou alteração remota neste bloco. Trabalho concorrente preservado.

Prévia disponível em **http://127.0.0.1:4316/**, pela execução de
`node scripts/previa-loading-01-02.mjs`. Processo isolado mantido no ar ao encerrar.
Não houve build nem reinício do servidor Next compartilhado. A prévia usa os
componentes React reais, com actions, consulta financeira e Turnstile substituídos
por respostas fictícias. Não carrega .env/Auth/banco/Asaas; CSP bloqueia conexões
e envio de formulários. Não usar dados pessoais ou cartão real nessa bancada.

## 1. Telas, operações e decisões

| Tela/operação | Comportamento entregue |
|---|---|
| Entrar | Bloqueio síncrono de reenvio, botão imediato, aria-busy, espera localizada e foco no erro; e-mail preservado após falha. |
| Primeiro acesso | Mantém proteção de duplicação e acrescenta espera localizada e tratamento de falha de transporte; resultado não afirma entrega do e-mail. |
| Recuperar senha | E-mail controlado preservado, bloqueio de duplicação, espera e foco no retorno; solicitação não é apresentada como entrega. |
| Redefinir senha | Bloqueio, espera, foco no erro e confirmação controlada; mensagem longa admite que a senha possa já ter sido alterada. Controles existentes de visibilidade preservados. |
| Iniciar compra | Trava antes de capturar/enviar dados, formulário ocupado, feedback localizado e foco no erro; campos controlados preservados. Pedido iniciado não significa pagamento confirmado. |
| Pagar com Pix/cartão | Trava de envio, espera correspondente à operação e resultado ambíguo em falha de transporte; não repetir cobrança sem conferir pedido. Número/CVV limpos após captura. |
| Consultar pagamento | Falha de consulta mantém a última situação conhecida; botão de consulta com trava, polling sem sobreposição, pausa em aba oculta e limpeza no descarte. Pagamento, e-mail e criação de acesso separados. |
| Entrada, redefinição, compra e pagamento — loading de rota | Estrutura estática correspondente à tela; mensagem acessível e formas decorativas aria-hidden. Sem progresso fictício. |

Botões respondem imediatamente. Até 2 s não se acrescenta indicador temporizado;
após 2 s aparece descrição da operação, após 10 s orientação para resposta longa.
Não há spinner, percentual, estimativa, animação ou promessa de cancelamento.
No pagamento demorado, o link acompanha o mesmo pedido; não cancela nem cria outro.
Erros anteriores não ficam visíveis enquanto uma nova tentativa está pendente.
Falhas locais de transporte recebem texto seguro, preservando redirects do Next.

Não foi identificada operação contratual/fiscal visível que exigisse novo loading
neste recorte; nenhuma tela legal foi alterada. Onboarding, Início, anúncios,
criativos, Mesa, components/ui e CSS global não foram editados por este bloco.

## 2. Dados do cartão

`PagamentoFormulario.tsx` mantém número completo e CVV como inputs não controlados.
Após capturar FormData para a action, limpa imediatamente esses dois inputs.
Não adiciona PAN/CVV a estado React, armazenamento local, sessão ou logs.
O FormData permanece necessário durante o envio à action; não se afirma apagamento
forense da memória do navegador nem controle sobre o preenchimento salvo por ele.

Nome/documento do titular, validade e endereço ficam apenas no estado do componente
para evitar redigitação após erro. São dados pessoais e de cartão: não os tratamos
como públicos. Não foi adicionada persistência; recarregar/desmontar perde esse
estado. Neste bloco não foi alterado o transporte nem auditado novamente o
armazenamento do servidor/provedor. A conferência usa exclusivamente dados fictícios.

## 3. Arquivos deste recorte

- `app/(public)/entrar/EsperaFormulario.tsx`: trava síncrona, fases e foco.
- `app/(public)/entrar/acao-local.ts`: fallback seguro de transporte.
- `app/(public)/entrar/espera-local.css`: estilos locais estáticos.
- `app/(public)/entrar/CarregandoAcesso.tsx` e `loading.tsx`: estrutura de espera.
- `app/(public)/entrar/page.tsx` e `TelaEntrada.tsx`: fallback e formulários.
- `app/(public)/recuperar/page.tsx`: formulário de recuperação.
- `app/(public)/redefinir/Form.tsx` e `loading.tsx`: redefinição e espera.
- `app/contratar/FormularioContratar.tsx`: início do pedido.
- `app/contratar/pagamento/PagamentoFormulario.tsx`: pagamento e limpeza seletiva.
- `app/contratar/pagamento/EstadoPagamento.tsx`: consulta e última situação conhecida.
- `app/contratar/loading.tsx`, `pagamento/loading.tsx`, `contratar.css`: esqueletos e estilos locais.
- `scripts/conferir-loading-01-02.mjs`: seis testes novos.
- `scripts/conferir-documento-contratante.mjs`: stub de CSS na fixture de renderização, sem remover assertivas.
- `scripts/previa-loading-01-02.mjs`: bancada local isolada.
- Este checkpoint. Não representa autoria dos demais hunks concorrentes nesses arquivos.

## 4. Verificação e medições

Rodada dirigida anterior à confirmação visual: **62/62 PASS**, zero falhas,
com `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test` e os arquivos:
`conferir-loading-01-02.mjs`, `conferir-recuperacao-completa.mjs`,
`conferir-redefinicao-turnstile.mjs`, `conferir-documento-contratante.mjs`,
`conferir-cartao-3ds-integrado.mjs`, `conferir-primeiro-acesso-compra.mjs`.
Não somar esses testes às rodadas históricas como provas independentes.
Sem mudança de runtime após essa rodada: a suíte não foi repetida.
`pnpm typecheck` passou novamente no encerramento.

Os seis testes novos exercitam hooks com relógio determinístico, trava/reliberação,
fases 2/10 s, limpeza de timers, semântica/foco, exceções/redirects e contratos de
integração. Não equivalem a seis percursos externos completos.

Confirmação no navegador com componentes reais da bancada:

- Login: duplo clique gerou um único envio, botão desabilitado imediatamente;
  e-mail preservado e foco no erro. Mensagem após 2 s observada.
- Cartão em 390 × 844: envio com falha fictícia deixou PAN e CVV vazios,
  demais seis campos preenchidos e foco no alerta; botão voltou a permitir ação.
  Nova tentativa preenchendo apenas PAN/CVV terminou com contador de 1 para 2.
- Formulário de cartão e esqueleto do pagamento sem overflow horizontal em 390 px.
  Screenshot confirmou os campos em coluna e a estrutura estática de espera.
- prefers-reduced-motion=reduce confirmado durante a inspeção; sem animação
  introduzida. Overrides de viewport e mídia removidos ao finalizar.

| Medida | Resultado e limite |
|---|---|
| Simulação rápida de login | 264 ms observados; alvo fictício 250 ms. |
| Simulações longas de login | 12.006 e 12.007 ms; alvo fictício 12 s. |
| Falha fictícia de cartão nesta confirmação | 4.007 ms; alvo 4 s. |
| Nova tentativa fictícia de cartão | 259 ms; alvo 250 ms. |
| Fases 2 s e 10 s | Relógio determinístico aprovado; fase 2 s também observada no navegador. Janela 10–12 s não capturada visualmente. |
| Tempo real Auth/Asaas/e-mail/3DS/banco | **Não medido neste bloco.** |
| Tempo real do loading de rota Next/Suspense | **Não medido.** Estrutura conferida na bancada. |

Acessibilidade conferida por DOM/árvore de acessibilidade, aria-busy, status,
alerta e foco. Não houve ensaio com áudio de NVDA/VoiceOver. Os cenários financeiros
e de exceção foram testados de forma isolada; não houve transação nem nova
homologação integrada. Não reivindicamos desempenho real usando tempos simulados.

## 5. Próximo ato e parada

Entrega local pronta para revisão da Central. Homologação publicada é um bloco
separado; nenhuma ativação externa está implícita neste aceite local.
Este bloco termina aqui, sem retomar compra pública, domínio ou banco.
