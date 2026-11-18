# Gerador — instalação estrutural validada somente QA — 17/11/2026

## 0. Estado e próxima prova

**Bloco estrutural concluído. Sem credencial pendente nesta instalação.** Victor informou que salvou privadamente senha SQL, chave de servidor Storage QA e token exclusivo; o serviço foi iniciado e validado. A autorização posterior para copiar/colar credenciais existentes não precisou ser usada para ler seus valores. A Central alterou apenas dois parâmetros públicos de conexão do mesmo banco QA, preservando as três entradas privadas.

Geração paga, escrita HTTP e worker permanecem desligados. Não houve criação de briefing, job, autorização de custo, aprovação humana, catálogo, artefato, anúncio ou cobrança. Nenhuma mudança em produção, Meta/verba, n8n, páginas legais ou Git.

Próxima unidade: preparar uma primeira imagem controlada na QA com negócio/briefing, marca e materiais/fontes, revisão legítima e limite de custo definidos. Não executar por consequência desta instalação. O contrato v2 atual atende barbearia; Dúú não passa a ser compatível por alterar flag. Prova positiva de geração/revisão real permanece separada da instalação OFF.

## Resultado atual verificado

| Camada | Evidência | Limite |
|---|---|---|
| HTTPS e runtime | GET `/saude` retornou 200 no domínio `https://ia-gerador-qa.5hue9s.easypanel.host`, versão `2c6e495baba7`. | Health mede dependências no startup; não consulta novamente a cada chamada. |
| Banco e Storage | Health `schema=true`, `bucket_privado=true`; inicialização real passou pelas leituras SQL e Storage QA, com `verify-full`, CA explícita e conexão SQL read-only. | Health não substitui auditoria integral RLS/ACL. A conferência completa da migração permanece no checkpoint anterior. |
| Bloqueio de escrita | POST/PUT/PATCH/DELETE/OPTIONS em geração → 405; POST worker/tick e rota inexistente → 405. Sete negativas HTTP sem corpo, token ou identidade fictícia. | Nenhum caminho de geração está montado. |
| Autenticação e exposição | GET de geração sem token e com token inválido → 401; GET openapi.json → 404. | GET de job com token válido foi provado somente offline; o token privado não foi lido para repetir essa prova remotamente. |
| Estado OFF | `generation_paid_enabled=false`, `write_http_enabled=false`, `worker_enabled=false`. | `auth_humano_validado=false` e `pedido_nominal_configurado=false`; não simular identidades para obter um verde. |
| Preservação | 69 tabelas anteriores com count/checksum iguais antes/depois das tentativas e da inicialização. Seis tabelas novas continuam vazias. Configuração Vercel QA idêntica à anterior. | Não é backup integral de Auth/Meta/Storage; ver limites da recuperação anterior. |
| WebApp | Publicação QA anterior `dpl_EikpfUKoCDMQgP9Vokdhw941pFH5` preservada; Piligrin/Dúú e volta à carteira já conferidos no bloco anterior. | Não repetida navegação encerrada sem nova mudança de WebApp. |

Foram dez negativas HTTP exigidas pelo contrato. Uma sondagem extra HEAD `/saude` retornou 405/Allow GET: a rota FastAPI registra somente GET. A expectativa inicial HEAD=200 era do verificador, não do contrato; foi registrada como observação, sem alterar fonte nem repetir a bateria para forçar verde.

## Falha encontrada, correção e implantação

1. A primeira inicialização real foi recusada. O serviço foi parado, sem deixar reinícios em loop. Não se abriu o editor de segredos para investigar.
2. Defeito concreto no pacote: o adaptador transforma listas Python em `Jsonb`, mas a consulta de readiness tentava usar `$1::text[]`. Corrigido somente o runtime para `ANY(ARRAY(SELECT jsonb_array_elements_text($1::jsonb)))`; o adaptador geral permaneceu intacto. A mesma consulta corrigida foi conferida por leitura no PostgreSQL QA, retornando dez tabelas/colunas/ACL esperadas.
3. Acrescentado diagnóstico por etapa/categorias fixas e SQLSTATE enumerado, sem mensagens externas, valores, SQL ou traceback original. Dez testes estruturais offline passaram: oito existentes e duas novas provas de adaptação/ausência de vazamento de segredo sintético. Ruff e mypy passaram. Os testes anteriores não foram enfraquecidos.
4. Pacote v2 tem quinze arquivos; somente `geracao_qa_estrutura.py` mudou. V1 preservada. Upload/construção somente em **ia/gerador-qa**, sem migração ou nova publicação de WebApp.
5. O diagnóstico v2 separou uma falha na conexão SQL direta, sem SQLSTATE. O Storage já havia passado. Não foi possível atribuir essa falha exclusivamente a IPv6, DNS ou credencial pela informação disponível; não registrar uma causa presumida como fato.
6. O painel Supabase do próprio projeto QA apresentou o **Session pooler** como alternativa IPv4. Alterados somente `V2G_GENERATION_QA_SQL_HOST=aws-1-ca-central-1.pooler.supabase.com` e `V2G_GENERATION_QA_SQL_USER=postgres.zskpijnqgkqwxksqmzmf`; porta 5432, banco, senha, chave Storage, token, CA e verify-full preservados. Sem mudar pool size, SSL enforcement, permissões ou senha do banco.
7. Reimplantação/inicialização concluídas; health 200 na versão v2 e negativas passaram. O sucesso confirma a conexão escolhida, sem provar a causa exata da falha no endereço direto.

## Artefatos e identificação

- Pacote: `C:/Users/victo/v2g-deploy/webapp-criativos-qa/docs/qa/geracao-revisao-agencia-v1/backend-pacote-http-estrutura-off/gerador-qa-estrutura-off-v2.tar.gz`.
- Pacote SHA256: `ef5d57d8ff5ee04a2f2b48121406d174f448f315ad59c0628f4bc48150ec0ad1`.
- Runtime SHA256: `2c6e495baba7e04d497f8bef7f81a555d7b025cb169e26590021a8300dbe0172`.
- Imagem v2 construída com sucesso em 17/11/2026 às 21:39:10 UTC, manifest list `sha256:915277b1afd4425e2bb7a91c48b35a1d0911bbe7f7125a7c65048d937fb6290a`. Configuração pública de conexão aplicada depois, sem mudança adicional de código.
- Migração mantida: `20261117205448 qa_geracao_criativos_estrutura_off_20261117`.
- Evidências na candidata, `docs/qa/geracao-revisao-agencia-instalacao-v1/`: `http-estrutura-off-validado.json`, `gerador-qa-build-v2.log`, `qa-gerador-saude-validada.jpg`.
- Recuperação anterior privada: `C:/Users/victo/.codex/private-backups/v2g/2026-11-17-gerador-estrutura-qa/restore-result.json` — dez tabelas/59 linhas; 40 comparações e 24 negativas locais.

O helper local gerou o token somente por clique do Victor, no navegador, sem enviar ao servidor ou mostrar o valor. Após a confirmação e a prova final, aba e servidor local foram encerrados. Nenhum valor de credencial consta nos artefatos.

## Operação e continuidade

Serviço estrutural fica ativo para health, isolado do backend de métricas. Se houver falha nova, interromper somente gerador-qa, inspecionar categorias sanitizadas e preservar o restante; não reabrir geração ou afrouxar TLS. SQL read-only e ausência de provider/worker/router de geração são invariantes deste runtime; não se converte em gerador pago por flag.

Responsáveis: Central pelo próximo pacote; Victor pelas escolhas de cliente/materiais/custo que ainda faltarem; Cauã pela revisão em sessão própria quando houver imagem real. A instalação não depende de criar a Notta ou entrar como Matheus.

Planilha existente reconciliada com estrutura concluída, pendência de credenciais resolvida e primeira imagem ainda pendente. Estado da frente inteira de geração permanece Em andamento.
