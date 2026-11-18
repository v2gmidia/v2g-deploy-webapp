# Gerador — estrutura QA instalada; conexão privada pendente — 17/11/2026

## 0. Próxima ação humana

> RESOLVIDO em 17/11/2026: as três entradas privadas foram concluídas por Victor; instalação estrutural e conexão real validadas. Consulte [registro de conclusão](./n26-gerador-estrutura-validada-qa-17-11.md). Geração paga permanece desligada. O texto abaixo preserva o estado anterior.

Aguardando Victor informar apenas se possui a senha SQL atual do projeto **v2g-webapp-qa**. Não enviar senha/chave/token pelo chat nem redefinir a senha por consequência deste bloco. No Chrome ficou preparada a aba Easypanel, **ia → gerador-qa → Ambiente**, com somente parâmetros públicos e três valores privados vazios: `V2G_GENERATION_QA_SQL_PASSWORD`, `V2G_GENERATION_QA_SERVICE_KEY`, `V2G_GENERATION_QA_MACHINE_TOKEN`. A entrada será conduzida um campo por vez, privadamente. Serviço parado até concluir a configuração e nova conferência. A construção da imagem passou; isso não é prontidão HTTP.

## Escopo autorizado e resultado

Victor autorizou revisar, capturar backup privado, comprovar recuperação, aplicar/instalar somente QA e validar mantendo geração paga desligada. Nenhuma operação em produção, anúncio, verba, cobrança, envio comercial, workflow n8n ou Git foi executada neste bloco.

| Camada | Resultado verificado | Limite |
|---|---|---|
| Backup/recuperação | Dez tabelas, 59 linhas recuperadas localmente; 40 comparações count/hash iguais em recuperação, instalação, replay e retorno. | Auth e Meta têm somente chaves locais auxiliares de ID; não é backup integral do projeto ou dos objetos Storage. |
| Banco QA | Migração `20261117205448 qa_geracao_criativos_estrutura_off_20261117`; seis tabelas novas vazias, RLS/ACL/constraints/triggers/funções conferidos. | Nenhum job, referência ou aprovação humana inserido. |
| Preservação remota | 69 tabelas anteriores com contagem e checksum iguais antes/depois. Bucket `v2g-midia` privado. | Comparação dos dados e inventário no momento desta instalação; não prova futuras operações. |
| WebApp QA | `dpl_EikpfUKoCDMQgP9Vokdhw941pFH5`, READY, alias `https://v2g-webapp-qa.vercel.app`. Base publicada anterior mais 11 fontes revisadas; 668 arquivos. | Ponte de imagens e geração continuam OFF; sem imagem nova por IA. |
| Serviço separado | `ia/gerador-qa`, pacote enviado e imagem construída com sucesso em 17/11 às 20:57:23 UTC. Domínio observado `https://ia-gerador-qa.5hue9s.easypanel.host`, destino 8000, HTTPS preservado. | Parado; faltam três entradas privadas. Ainda sem health HTTP/TLS-SQL medido. Não alterar `backend` ou `backend-qa` para apontar ao gerador. |
| Sessão real QA | Piligrin → Criativos → Dúú: imagem existente, Cauã Carlos, aprovação e publicação ainda não confirmada preservados. Volta aos criativos da agência funcionou; uma peça observada. | Sessão existente da agência, sem nova decisão e sem sessão do Cauã. |

## Revisão e correções necessárias antes da aplicação

- Separado o canal servidor de geração: `V2G_CREATIVE_BACKEND_URL`/`V2G_CREATIVE_BACKEND_TOKEN`, sem fallback para o endpoint/token de métricas. 23 casos dirigidos aprovados (oito novos e 15 regressões afetadas).
- Snapshot real misto respeitado: requests já v1/v2; upload_intent de revisão era v1. Pacote mantém requests v1/v2 e amplia revisão v1/v2, sem reescrever dados.
- Corrigida diferença de catálogo PostgreSQL 17/18 antes do DDL: assinatura ignora `pg_constraint.contype=n`, mas continua conferindo NOT NULL por `attnotnull`.
- Serviço de **preparação estrutural** separado: sem imports do main/settings instanciados, provider, worker ou router de jobs. Não exige custo/cliente/autorização pagos fictícios para medir a estrutura. Oito testes OFF, Ruff e mypy passaram. Escreve nenhum dado; todo método HTTP fora GET/HEAD é 405 antes de Auth/handler/SQL.
- Certificado público baixado no painel QA, incluído no pacote, com TLS SQL `verify-full`. Handshake real permanece pendente das credenciais. Sem afrouxar TLS.
- Build Next.js/TypeScript da candidata passou após as duas fontes adicionais do canal. Não repetidas suítes sem mudança.

## Prova do backup e retorno

Pasta privada: `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-gerador-estrutura-qa` — fora do repositório. Entradas de recuperação em `schema-restore-scope.json`, `functions-restore-scope.json`, `data-before-rows.json` e `fingerprints-before.json`; evidência em `restore-result.json`. Nenhuma linha privada foi incluída neste documento ou pacote de deploy.

Restaurados colunas/defaults, PK/FK/CHECK, índices, policies, ACL, funções e triggers, inclusive definição/ACL real de `private.owns_business(uuid)`. Auth e meta_connections foram excluídos da captura de dados/segredos e representados localmente somente por IDs para FKs. Sem recuperação de Storage, senhas, sessões ou confirmação de e-mail. Foram 24 negativas locais SELECT/INSERT para anon/authenticated nas seis tabelas novas. Não se passou por cliente/gestor em produção ou na QA.

SQLs finais em `C:/Users/victo/v2g-deploy/webapp-criativos-qa/docs/qa/geracao-revisao-agencia-instalacao-v1`:

- Aplicação: SHA256 `841e403debbdb87e8bc3311e2f8db243c9b6ced4c75b94fa2a2891baf2f13ab7`.
- Pós-conferência: `cb79aa172180ac04cc1e771c24e32ebb6230f7780b6b2c41217452a00a5bd82e`.
- Retorno virgem: `e91c2f574187dc19b5b2d091be963c7cb6802f2a1960fb501169f8d523902ae6`.

Retorno ensaiado somente localmente; exige seis tabelas vazias e restaura os dois CHECKs anteriores exatos. Recusa estrutura usada ou revisão v2 incompatível com o CHECK antigo; não apaga registros para passar. Aplicação remota transacional e pós-conferência completas passaram; não executar retorno automaticamente.

## Publicações e segurança

WebApp publicado por pacote seletivo, sem commit/push/merge. Projeto QA `prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn`; target principal `production` pertence somente a esse projeto QA isolado. Sem alterar o projeto oficial.

Serviço separado recebeu `gerador-qa-estrutura-off.tar.gz`, SHA256 `109ec407dccf4380a62c17e92be084b881cab1129e57ceb3439acf6c64e72ca6`, 15 arquivos/24.890 bytes. Imagem construída `easypanel/ia/gerador-qa:latest`, manifest list `sha256:9afd02f3b2852936d59600781fb8a5a80cdaa0316d6c55a6502ce6d85b9540ec`. Upload iniciou construção automática antes das variáveis; serviço foi parado. Não o deixar reiniciando enquanto faltam as entradas privadas.

CA pública SHA256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`, copiada para `/app/certs/prod-ca-2021.crt`. Não entram `.env`, chaves, testes, caches ou evidências no arquivo de serviço.

Controles WebApp preservados: REVIEW=true, REQUESTS=false, AUTO_ANALYSIS=false; BACKEND/REAL_SUBMISSION/ponte gerada ausentes e fechados por default. Checkout, API de compra, dispatch comercial e e-mail de pagamento continuam false na configuração medida. Nenhum segredo foi copiado pelo agente. Machine token exclusivo será criado/colado pelo usuário, não registrado aqui.

## Continuidade e critério de encerramento

1. Victor insere privadamente as três credenciais QA, sem redefinir senha ou enviar valores ao chat; Central acompanha um campo por vez.
2. Central sobe somente `gerador-qa` e mede health real, versão, schema, bucket privado, métodos de escrita negados e HTTPS. Não confundir health de startup com auditoria contínua ou sessão humana.
3. Registrar a conclusão estrutural. Geração paga permanece desligada. Uma imagem por IA exige outro bloco, com briefing/negócio, fontes/materiais, modelo, custo e uma tentativa nominal revisados; v2 atual é barbearia, não liberar Dúú por flag.

Evidências visuais e build na pasta do pacote: `qa-duu-revisao-preservada.jpg`, `qa-servico-configuracao-sem-segredos.jpg`, `gerador-qa-build.log`. Planilha existente reconciliada em oito células de Visão geral e Novembro — execução, preservando notas, formatos e células vizinhas, com leitura de retorno conferida. Banco/WebApp instalados; pendência privada explícita. Jornada de geração permanece em andamento.
