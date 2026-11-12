# Push da QA conferido — anexos corrigidos e publicação produtiva pendente

## 0. Resultado e próxima ação

12/11/2026, conferência às 20:03 UTC / 17:03 de Brasília. O push informado por Victor chegou à **branch QA**, commit `1a11974536d935dc059c04db7ad9b3e07877939c`. O diff remoto contém somente documentação, anexos de revisão, relatórios e pesquisa; não altera arquivos ativos do aplicativo. As candidatas WebApp/backend de produção continuam com os arquivos preparados sem commit.

O build remoto falhou porque duas cópias TypeScript dos anexos foram incluídas na compilação da QA. **Erro de empacotamento introduzido pela Central, corrigido localmente neste bloco**: os dois anexos agora terminam em `.ts.txt`, com conteúdo/hash preservados, e o selador passa a gerar esse formato. A QA corrigida passou typecheck e build isolado completo. A candidata produtiva, incluindo o complemento de acesso, também passou build isolado completo.

**Próxima ação de Victor: novo commit/push da correção de anexos na pasta atual `C:/Users/victo/v2g-deploy/webapp`, branch QA.** Esse envio corrige o build da QA. O código produtivo está em duas pastas diferentes, identificadas abaixo; aquele push de documentação não o publicou. A Central não fez commit, push, merge, deploy ou alteração de banco/controles financeiros neste bloco.

## 1. Estado publicado comprovado

| Destino | Evidência | Estado |
|---|---|---|
| QA: tentativa do push novo | `dpl_63ErAHFbaS6HMn11o6NUYbdmL3qy`, commit `1a11974536d935dc059c04db7ad9b3e07877939c`, branch QA | ERROR: falha de tipo no anexo da revisão |
| Preview QA no projeto produtivo | `dpl_CxzYxHyRDiVPvJAQeUg1o6cVkbjS`, mesmo commit, branch QA, sem target produtivo | ERROR; não é publicação do domínio produtivo |
| QA que continua atendendo o alias | `dpl_9ePJCBtj6Fc1P4MSbYUeGKEMdrWR`, commit `916d8df0b5c05956c890bc7432ed5fa26c576930` | READY em `v2g-webapp-qa.vercel.app` |
| WebApp de produção | `dpl_A2GgHjfNbRGGcNwNXwdS412xC7aW`, main `13f8943471b391bd22e9dd8362f5748653ad9c5b` | READY, continua atendendo `app.v2gmidia.com.br` |
| Backend público | `https://api.v2gmidia.com.br/openapi.json`, HTTP 200, info.version 0.1.0 | Não expõe `/negocios/{business_id}/meta/campanhas`; isso não identifica sozinho qual commit está instalado |

Fontes: comparação GitHub de `916d8df…` para `1a11974…`, estados Vercel e eventos do build. A mensagem do commit cita a aplicação no banco; não prova publicação de código. O banco produtivo aplicado nos blocos anteriores não foi revertido por essa falha de build.

## 2. Correção mínima e validação

Falha remota e local reproduzida em:

- `docs/producao/piligrin-acessos-12-11/webapp/app/(fluxo)/conectar/escolher/actions.ts`: import do helper que existe na candidata produtiva, não no código ativo da QA.
- `docs/producao/piligrin-acessos-12-11/webapp/lib/contratacao/conta-acesso-contratado.ts`: import relativo de dependência fora do conjunto de anexos.

Esses dois arquivos são cópias documentais, não implementação da QA. Foram renomeados para `.ts.txt`; os hashes continuam iguais aos arquivos selados no manifesto. `selar-complemento.mjs` agora gera anexos TypeScript como texto, preservando os nomes reais dos arquivos no patch de implantação. Nenhuma alteração em `tsconfig`, permissões, dependências, regras financeiras ou código ativo da QA foi necessária. Não executar o selador antigo, que recria a falha.

Verificação `pnpm exec tsc --noEmit --incremental false` na QA passou após a correção. Dois builds completos Next.js 16.2.12/Turbopack passaram em cópias temporárias:

| Fonte | Cópia isolada | Resultado |
|---|---|---|
| QA corrigida | `C:/Users/victo/AppData/Local/Temp/v2g-post-push-qa-MOdjIE` | compilação, TypeScript e 57 páginas estáticas concluídos, exit 0 |
| WebApp candidato combinado | `C:/Users/victo/AppData/Local/Temp/v2g-post-push-producao-candidata-m7gnQx` | compilação, TypeScript e 54 páginas estáticas concluídos, exit 0 |

Limites: builds sem arquivos `.env` e com ambiente de processo restrito a variáveis de sistema não credenciais. A raiz de resolução Turbopack foi ajustada **somente nas cópias temporárias** para alcançar a pasta compartilhada de dependências. As primeiras tentativas do instrumento esbarraram nessa junction e em bloqueio temporário de arquivo; o build final não herdou credenciais e concluiu. As pastas `.next` dos projetos em uso não foram utilizadas. Prova local não significa deploy remoto corrigido: ele depende do novo commit/push de Victor.

Logs privados: `C:/Users/victo/.codex/private-backups/v2g/post-push-qa-build-20261112.log`, `post-push-candidata-build-20261112.log` e `post-push-verificacao-20261112/evidencias.json`.

## 3. Onde está o código para publicar depois

| Trabalho | Pasta local | Branch e estado |
|---|---|---|
| Correção atual do build da QA | `C:/Users/victo/v2g-deploy/webapp` | `QA`; correção documental local, aguardando commit/push |
| WebApp produtivo: agência, Dúú e complemento de conexão | `C:/Users/victo/v2g-deploy/webapp-piligrin-producao` | `codex/piligrin-agencia-producao`; alterações preparadas sem commit |
| Backend produtivo: leitura de campanhas/dias sem execução histórica | `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-piligrin-producao` | `codex/piligrin-leitura-producao`; alterações preparadas sem commit |

`docs/producao/piligrin-acessos-12-11/pacote-combinado-conferido.json` combina o manifesto-base e o complemento: **69 arquivos WebApp e 12 backend conferiram com os hashes esperados**. As validações anteriores do backend são preservadas porque os seus arquivos não mudaram; não foram repetidas sem alteração de código. O build novo cobre a combinação atual do WebApp, que antes tinha somente typecheck para o complemento.

Commit/push nas branches candidatas apenas registra/envia as branches; não equivale a merge na main, publicação produtiva do backend ou liberação de controles. A passagem a produção deve manter o pacote delimitado, sem promover a QA inteira, com o bloco de publicação autorizado. A Central não deve tentar compensar o push na pasta errada publicando automaticamente.

## 4. Até o acesso completo

Depois do código efetivamente publicado e dos controles aprovados: registrar evidência verdadeira da contratação da Piligrin, colher aceite específico na sessão do titular e conectar no Dúú os ativos Meta já compartilhados. Só então conferir carteira → Dúú → números/gráfico/criativos → volta. Sem criar nova cobrança, publicação de anúncio, permissões fictícias ou sessão de gestor forjada. O complemento do banco já está aplicado e não deve ser repetido.
