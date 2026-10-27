# E28-06-V2-CONSUMIDOR — passagem local completa pelo WebApp — 27/10/2026

## §0. Resultado e portão

**Bloco LOCAL concluído com provedor fake e registros fictícios.** Pedido v2 salvo pela action real → aprovações persistidas relidas → API/loader/fila/worker Python → PNG privado → rota do WebApp → página real da biblioteca. Mesmo pedido/job/arquivo sobrevive a replay concorrente, reinício e nova sessão **simulada**. Outro usuário/negócio não recebe bytes.

**Não foi criada imagem por IA. Não é QA publicado nem autenticação Supabase remota.** A submissão v2 real continua explicitamente bloqueada, inclusive com flags gerais e flag real ligadas no ambiente isolado de teste. Nenhuma flag/configuração remota ou `.env` foi lida/alterada.

**Menor portão QA agora:** Central nomear o serviço isolado de geração e autorizar individualmente o manifesto/schema/configuração/publicação do WebApp e backend, com preflight/backup. Depois, conferir novo login e isolamento no ambiente gerenciado. Para UMA imagem real ainda faltam logo próprio novo, referência/revisão/aprovações exatas do pedido, provedor/teto nominal/conciliador e liberação **específica** de submissão real v2 em outro bloco. Deploy ou 202, sozinhos, não removem o veto atual.

## Arquivos e comportamento

| Arquivo | Mudança |
|---|---|
| `lib/criativos/geracao/contrato-fila.ts` | Parser estrito de `context_proof` v2: referência, logo/hash, hash das aprovações, versão/hash do catálogo. Fila/version permanecem v1; prova é opcional para legado, obrigatória no consumo de pedido v2. Campo presente malformado não passa. |
| `lib/criativos/geracao/backend-da-sessao.ts` | Tipo do retorno preserva o proof validado do backend, sem expô-lo na projeção pública do andamento. Autenticação humana/máquina continua existente. |
| `lib/criativos/geracao/prova-v2-da-sessao.ts` | Novo carregador SELECT-only da expectativa do servidor. Confere sessão/dono/negócio sob RLS antes de admin; lê contexto/marca/autorização de referência e última versão do catálogo, com hashes/revisores/validade/revogação. Relê logo vigente, proveniência/hash e cores atuais. Não grava aprovação ou executa job. |
| `lib/criativos/geracao/contexto-referencia-publica.ts` | Exporta a rotina única de hash das aprovações normalizadas, reutilizada na expectativa do consumidor e no espelho do contexto. |
| `app/(protected)/criativos/geracao-actions.ts` | V2 fake pode enfileirar apenas no modo explícito `fila_ficticia`, com fontes válidas. Consulta compara proof com expectativa do banco e autor do resultado. Submissão v2 real sempre retorna `submissao_real_pendente`; sem fontes retorna pendência. Formulário não fornece autorização/proof. |
| `lib/criativos/geracao/imagem-privada.ts` | Relê pedido e versão; v2 exige fontes vigentes, DTO de fila válido e proof correspondente antes de abrir arquivo. Mantém autoria, negócio, job/tentativa, metadata/caminho/hash, bucket privado e PNG. Falha retorna 404 sem bytes. |
| `lib/seguranca/excecoes.ts` | Justificativa da rota atualizada: v2 é conferido por posse + fontes/proof, não descrito como totalmente bloqueado. Conferidor não foi alterado. |
| `scripts/test-utils/fila-geracao-local.mjs` | Harness opt-in `pedidoV2`, com propostas SQL reais aplicadas só no PostgreSQL descartável, aprovações fictícias após criação do pedido e catálogo separado. HTTP/SDK/SQL/Python reais com Auth/Storage substituídos; rede externa não é usada. |
| `scripts/conferir-consumidor-geracao-v2-local.mjs` | Nove cenários novos de passagem e negação, incluindo página real da biblioteca renderizada a partir dos registros do ensaio. |

Não há segundo gerador/worker no WebApp. O backend continua sendo autoridade para autorização, snapshot, orçamento, execução e entrega. A leitura local de expectativa é uma conferência adicional do retorno, não uma licença para usar prova recebida do cliente.

## Provas do bloco

**9 cenários v2 validados:**

1. Action real grava payload v2 com referência; fontes persistidas atravessam loader/API/fila/worker fake e entregam PNG privado 1088 px. A página real mostra Biblioteca 1 e URL privada do mesmo pedido. Zero chamadas ao provedor real instrumentado.
2. Submissão concorrente converge; reinício do Python e sessão simulada ausente/nova conservam um request/job/arquivo/recibo fake. A biblioteca reaparece após releitura; geração OFF não apaga o card.
3. Outro negócio, outro usuário e `authored_by` incorreto não recebem bytes.
4. Proof ausente/malformado ou request/business/referência/logo/versão/hash divergentes são negados na consulta e/ou arquivo conforme a fronteira afetada.
5. Contexto revogado após gerar nega consulta/arquivo, sem usar proof antigo ou fazer HTTP novo.
6. Campo `context_proof` enviado pelo formulário é ignorado como autorização: não entra no payload e não contorna aprovação revogada; zero jobs novos.
7. Proveniência do logo removida/alterada nega o resultado anterior.
8. Modo real + flags de teste ON continuam sem POST/job para v2; fonte mock não é aceita como real.
9. Tentativa, metadata, caminho ou bytes adulterados não abrem imagem nem criam outro artefato.

Comando principal:

```text
node --test scripts/conferir-consumidor-geracao-v2-local.mjs
```

Oito cenários iniciais passaram juntos; o nono e as ampliações de tentativa/bytes foram validados por execução dirigida após a edição. **44 testes relevantes validados no total:** nove do consumidor v2, 11 do contexto/loader, quatro do protocolo, 11 do consumidor fake legado e nove da leitura real instrumentada. Não somar repetições como casos adicionais.

Na regressão dirigida, o serializer Python atual passou a exigir `snapshot` até no stub legado; a fixture foi completada com `versao_contexto:1` e os nove testes de leitura real foram reexecutados verdes. Não se relaxou o serializer, parser, isolamento ou assertion de custo. `pnpm typecheck` passou; `conferir:identidade` **6/6**; `git diff --check` sem erro de whitespace. Suíte geral não foi repetida.

## Precisão do ensaio e limites

- Banco é efêmero/PGlite; permissões/constraints/triggers das propostas são usados só nele. O scaffold de revisão existe apenas para aplicar a migration exata; este teste não comprova o fluxo de peça pronta.
- As fixtures inicialmente tentaram aprovar antes da criação do pedido e foram recusadas corretamente pelo trigger. A sequência foi corrigida: gravar pedido, depois registrar aprovações fictícias. Nenhuma proteção do banco foi removida.
- Datas/manifests do catálogo precisam da precisão canônica do contrato. O ensaio fixa explicitamente timezone SQL **UTC**, coerente com as leituras do consumidor, e normaliza microssegundos. Na passagem gerenciada, ainda é necessário verificar a coerência de timezone/serialização/hash entre SQL do backend e leitura via Supabase; não foi medida aqui.
- Nova sessão é troca dos atores/token fictícios no harness, sem browser, JWT gerenciado ou novo login real. A página é renderizada pelo componente de servidor real, sem prova visual nova de navegador.
- O arquivo é PNG produzido pelo mock do backend. `simulated=true`, custo simulado e `billed_usd=null` permanecem distintos de imagem IA/cobrança conciliada.
- Metadados de anúncios continuam no catálogo; pixels de concorrente não foram baixados/enviados. Mesmo bucket privado `v2g-midia`: logo em `identidade/{business_id}/...`, resultado em `geracao/{business_id}/{job_id}/{attempt_id}.png`.

## Situação por caminho

| Caminho | Estado agora | Falta |
|---|---|---|
| Referências públicas no app | Seletor local e intenção persistida já testados; catálogo revisado tem leitor preparado | Publicar sob autorização e conferir no QA. Sem promessa de vendas/desempenho. |
| Geração fake v2 pelo consumidor | **Passagem local demonstrada**, incluindo recarga/isolamento/biblioteca | Ensaio gerenciado autorizado; não apresentar como IA. |
| Geração real no QA | **Não executada / não comprovada** | Serviço/schema/Storage/worker/identidade publicados, aprovações exatas e autorização de uma imagem/custo; liberar submissão real v2 somente em bloco específico. |
| Produção | **Intacta** | Fora deste bloco. |

Nenhum arquivo de backend foi editado. Sem migration remota, deploy, chave, chamada paga, Meta, commit/push ou publicação. Alterações de outros chats preservadas. Checkpoint/pacote entregues para integração do Central; índice compartilhado não foi editado.
