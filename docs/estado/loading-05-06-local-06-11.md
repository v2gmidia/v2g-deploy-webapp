# 05/06 — carregamento de Criativos e Anúncios · 06/11/2026

## 0. Entrega e limites

Bloco LOCAL autorizado por Victor via Central: feedback de espera em
`/criativos` e `/anuncios`. Encerrado após implementação e inspeção móvel.
Não requer nova decisão para fechar este recorte. Consolidação do padrão
compartilhado continua com UI/UX; publicação e ensaio autenticado continuam
com seus portões próprios.

Sem alteração em checkout, onboarding, Início, Mesa, `components/ui`, CSS
global, backend ou configuração externa. Nenhum build, commit, push, deploy,
migration, envio externo ou chamada paga. Trabalho concorrente preservado.
O dev compartilhado não foi iniciado, parado nem reiniciado.

## 1. Mapa por tela e operação

| Tela/operação | Indicador e razão | Duração medida | Teste e limite |
|---|---|---|---|
| Criativos: entrada | Novo `loading.tsx` com biblioteca, prévias e preparo do envio. Sem contagens, vereditos ou controles falsos. Skeleton estático. | Entrada autenticada: **não medida**. | Inspeção desktop/móvel da composição real na bancada, sem banco. Não comprova tempo do servidor nem ausência de salto em todos os dados. |
| Imagem pronta: conferir e enviar | Botão bloqueado imediatamente; trava síncrona contra dois submits. Texto local após 1 s e orientação adicional após 10 s. Nenhum percentual de bytes inventado. | Upload fictício: **2.505 ms**. | Dois submits imediatos → uma chamada. Erro de conexão mantém UUID e arquivo para conferir o mesmo envio. Storage real não exercitado. |
| Imagem pronta: análise posterior | Só diz arquivo recebido após a action confirmar persistência. Depois informa espera da análise; não confunde análise com revisão/aprovação/publicação. Foco na mensagem final. | Análise fictícia: **2.505 ms**. | Uma análise após um upload; DOM confirmou foco na mensagem final e saída de `aria-busy`. Análise paga não executada. |
| Analisar imagem separadamente | Trava antes da validação assíncrona. Feedback após 1 s; após 10 s admite ausência de percentual/previsão. Timeout encerra espera, não a Server Action; retry bloqueado enquanto a chamada original não resolver. | Análise fictícia longa observada: **11.504 ms**; latência real **não medida**. | Teste determinístico de seleção concorrente, timeout e liberação após resposta original. Componente é remontado por negócio na página real para descartar resposta antiga. |
| Guardar pedido de criação | `useActionState` e campos travados preservados; status local após 1 s / ressalva após 10 s. Guardar intenção não afirma gerar imagem. | Persistência real: **não medida**. | Tipos e revisão do fluxo; nenhuma escrita de pedido real. |
| Geração e retomada | Mostra etapas retornadas (`queued`, `running`, `storage_pending` etc.). Atualização lenta mantém estado anterior. Falha transitória mantém último estado confirmado com ressalva; troca de negócio oculta estado anterior. | Consulta fictícia rápida: **156 ms**; falha: **2.506 ms**; retry: **152 ms**. | Browser móvel: 3 consultas, zero submissões/gerações/publicações. Unitário: resposta antiga de A não reaparece em B. Cancelamento continua somente na fila fictícia que já o suporta; não foi ampliado para geração real. |
| Galeria e miniaturas | Área estável enquanto imagem carrega; texto após 1 s. Falha da prévia não apaga o registro, a contagem ou a distinção entre erro e vazio. Abas locais continuam imediatas, sem indicador artificial. | Resposta de miniatura configurada em **2.500 ms**; tempo efetivo **não medido**. | Bloqueio de imagem apenas no navegador local → “Prévia indisponível”, Biblioteca 1. Remontagem com rede liberada recuperou imagem, sem novo pedido. |
| Anúncios: entrada | Skeleton anterior preservado, título atualizado e quatro métricas por ficha em vez de seis. | Entrada autenticada: **não medida**. | DOM: duas fichas estruturais com quatro métricas cada, sem números fictícios. Não é promessa de quantidade de campanhas. |
| Anúncios: conta/período/refresh | Navegação em transition conserva resposta anterior. Aviso após 1 s; após 10 s explicita que conta/período/números ainda são os anteriores. Mesma URL usa refresh. Datas do formulário são preservadas mesmo quando implícitas na URL. | Consulta fictícia longa: **30.002 ms**. | Browser: leitura anterior permaneceu durante espera; clique adicional não duplicou consulta. Teste dirigido: período inválido não navega, conta e datas são preservadas. Router substituído: não comprova ciclo RSC autenticado real. |

Nenhum valor medido em tempo fictício acima é SLA ou medição de Meta,
Jev, geração, banco, upload ou rede de um cliente. Bytes enviados,
arquivo guardado, análise concluída, peça aprovada, anúncio publicado e
resultado consultado continuam fatos separados.

## 2. Arquivos do recorte

- `app/(protected)/criativos/useEsperaLocal.ts`: limiares 1 s / 10 s, limpeza e reinício por operação; sem animação ou estimativa.
- `PedirRevisao.tsx`: trava de submit, feedback de espera e foco final.
- `Analisar.tsx` e a chave em `criativos/page.tsx`: trava de validação/análise e retry após timeout; isolamento do ciclo por negócio.
- `AndamentoDaImagem.tsx`: último estado conhecido com ressalva, etapa running explícita e descarte de resposta de outro ciclo.
- `PedidoDeImagem.tsx`: status da gravação de intenção separado da geração.
- `GaleriaCriativos.tsx` e `galeria-carregamento.module.css`: carregamento/falha por URL da miniatura.
- `criativos/loading.tsx` e `loading.module.css`: skeleton da entrada.
- `anuncios/AtualizacaoDaConsulta.tsx`, ligação na página e atributo no formulário de `AnunciosMeta.tsx`: atualização local dos filtros sem apagar a leitura anterior.
- `anuncios/loading.tsx`: título e quatro métricas; sem troca do skeleton legado.
- Dois adaptadores de testes existentes atualizados para as novas fronteiras de UI/CSS. A fixture de biblioteca também explicita contexto ausente; não testa extração de marca.

O diff acumulado de `AnunciosMeta.tsx`, `anuncios/page.tsx` e do teste Meta
contém mudanças anteriores de outras frentes. O delta deste bloco é apenas o
atributo de formulário, o wrapper de atualização e a fronteira de teste;
não atribuir todo o diff a este carregamento.

## 3. Provas locais

**119 testes distintos PASS:** 114 de regressão dirigidos (Meta, percurso de
criativo pronto e biblioteca independente da geração) e 5 novos de timers,
concorrência, retry, descarte de resposta antiga e filtros.

```text
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test docs/qa/loading-05-06-06-11/conferir.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-anuncios-meta.mjs scripts/conferir-anuncios-meta-integracao.mjs scripts/conferir-percurso-criativo-pronto.mjs scripts/conferir-biblioteca-geracao-off.mjs
pnpm typecheck
```

`typecheck`: PASS na versão final. `git diff --check`: PASS no recorte
inspecionado; somente avisos LF/CRLF. Não foi rodada suíte completa ou build.
Os testes novos executam componentes/hooks reais com relógio, React hooks e
portas controlados; os de integração substituem Auth/DB/HTTP. Não são QA.

Browser: Chrome, viewport desktop 1280 e móvel 390; largura útil móvel 375,
scrollWidth 375, sem overflow observado. Árvore de acessibilidade, feedback
por texto, foco final e controles bloqueados inspecionados. Skeleton de
Anúncios: `animation-name: none` em movimento reduzido e quatro métricas por
ficha. Novos indicadores de status são estáticos. Não foi feito ensaio com
NVDA/VoiceOver ou percurso autenticado completo por teclado.

Evidências em `docs/qa/loading-05-06-06-11/`: screenshots desktop/móvel,
árvores de acessibilidade, teste dirigido e bancada reproduzível. Um pedido
de screenshot de página inteira expirou; a captura de viewport funcionou.
Overrides temporários de viewport, bloqueio de imagem e movimento reduzido
foram removidos antes da entrega.

## 4. Revisão visual e próximos limites

Bancada aberta: **http://127.0.0.1:3196**. Usa componentes reais com dados
fictícios e actions/router substituídos. CSP bloqueia conexões externas.
Não abre a sessão do aplicativo, não chama n8n/Meta/Jev/geradores e não grava
Storage/banco. O bundle derivado é ignorado pelo Git.

Para reproduzir: `node docs/qa/loading-05-06-06-11/servir.mjs`. Processo de
revisão local separado do Next. Há seletores de tela, tempo fictício e falha.

**Falta:** revisar visualmente com Central/UI/UX, consolidar eventual padrão
compartilhado e conferir a transição RSC/latências/foco no aplicativo
autenticado quando seu ensaio estiver liberado. Sem prova de produção ou
desempenho de serviços reais. Bloco encerrado; não iniciar outro recorte.
