# U3 — perfil e procedência: pacote local, sem aplicação

## Revisão mecânica de ordenação — 08/11/2026

A guarda somente leitura da Central recusou o pacote original antes de qualquer aplicação: PostgreSQL QA e bancada ordenavam a mesma ACL de `set_atualizado_em` de formas diferentes. Esta pasta irmã preserva o original `../u3/` selado e corrige somente a canonicalização dos metadados, com `COLLATE "C"` explícito nos ORDER BY textuais das capturas e comparações equivalentes em JavaScript.

Nenhum grant, corpo/atributo de função de negócio, delta DDL ou nome nominal de migration foi alterado. `delta.sql`, `dependencias-qa.json` e `baseline-u2.json` continuam byte a byte iguais ao original. O SQL de aplicação contém o delta original exato. Reordenar a mesma lista de ACL é aceito; conceder privilégio extra real ou adulterar grant no recibo continua recusado. O pacote original não deve ser usado no ato futuro; esta revisão exige nova conferência readonly pela Central antes da única aplicação autorizada.

Estado: **preparação local concluída e ensaiada; não aplicada no QA ou produção**. Unidade restrita aos grupos 3/4/5/7/11 da matriz N26. Os 12 arquivos selados da U1 e os 18 da U2 são somente leitura e continuam intactos. Nenhum runtime, serviço, flag, variável, instalação, manifesto principal ou conferidor do produto foi alterado.

## Delta mínimo

- Cinco tabelas: `pessoas_do_negocio`, `entrevistas`, `propostas_de_perfil`, `itens_da_proposta`, `divergencias_de_cadastro`.
- Uma coluna nullable: `creatives.pessoa_id`; FK composta pelo negócio, índice e CHECK dos quatro usos já previstos na fonte.
- Duas funções novas: `aplicar_proposta(uuid,text)` e `escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid default null)`.
- RLS, policies, índices, checks e trigger necessários às novas tabelas estão enumerados integralmente em `modelo-delta.json.after`. Os nove objetos ausentes da matriz incluem a transcrição já nullable dentro da nova tabela de entrevistas.

Fontes: migrations 0010/0012/0013/0019/0025 e contratos de `lib/agentes/campos.ts`, `lib/cadastro/procedencia.ts` e `backend_v2g/src/db/negocio.py`. Não se reaplica migration histórica inteira. Não se substitui helper existente.

Pequenos endurecimentos intencionais sobre as fontes: FKs compostas impedem entrevista/pessoa de outro negócio; deletar pessoa limpa **somente** pessoa_id do criativo; ACEITO não permite valor_final diferente do proposto; origem NULL é recusada; listas explícitas limitam a 26 pares do catálogo CAMPOS e 19 campos de negócio, cobrindo os 15 do MAPA backend; funções novas bloqueiam a linha de perfil antes de consultar procedência.

`procedencia_do_campo` foi medido no QA como STABLE **SECURITY DEFINER**, owner postgres, search_path public, corpo MD5 `7a7eacfac538a4f5a6a2869e816bf291`. A cópia local inicial do atributo foi corrigida antes do ensaio. Não há conclusão de divergência QA/fonte desse atributo. `dependencias-qa.json` mantém as definições medidas, inclusive quebras CRLF dos corpos; fixture e guardas preservam corpo/ACL dos quatro helpers. A função generalizada é chamada pela assinatura `(text,uuid,text)`, e o registrador por `(text,uuid,text,text,text,jsonb)`.

## Evidência local

`resultado-ensaio.json` registra **23 grupos aprovados**, inteiramente locais: os 21 grupos originais mais duas regressões de ordenação/grant real. O ensaio também confere os 51 arquivos selados anteriores (U1/U2 e pacote U3 original) antes e depois. Comandos, a partir da raiz do repositório:

```text
node docs/qa/reconciliacao-schema-07-11/u3-ordenacao-acl-08-11/executar-local.mjs
```

O gerador também existe (`executar-local.mjs gerar-pacote.mjs`), mas reescreve o pacote/modelo. Não regenerar um pacote selado durante a revisão; alterações exigem novo ensaio e novos hashes.

O ensaio usa PGlite já instalado em `C:/Users/victo/v2g-finance/node_modules`, sem instalar dependências. Reutiliza a fixture U2 **sem editá-la**. Dados, perfis e histórico são fictícios. Auth é uma função local de UID por configuração de sessão; Vault continua stub da bancada. As nove tabelas backend e commercial_order_units são fixtures mínimas, **não** reconstruções completas do schema QA.

As expectativas fixas para aplicação comparam somente pais reconstruídos de metadados medidos, funções U1/U2/helpers e delta U2. Proteções backend são verificadas semanticamente: RLS/ACL e serviço SELECT-only, sem MAINTAIN ou grant options. O esquema simplificado da fixture **não** é congelado como expectativa do QA. Uma coluna legítima extra no backend é aceita e preservada no ensaio.

O DO e o comparador confrontam **todos os metadados capturados PRE/PÓS fora do delta**, inclusive os nove backend e commercial_order_units; esses objetos não foram retirados da comparação. `modelo-delta.json.localFixtureOnly` é apenas referência da bancada, nunca cláusula de equivalência geral do QA.

Cobertura: aplicação/retorno com dados legados e histórico 46→47→48; canal registrando a migration antes ou depois do corpo; coerção real de 0/false/listas; resultados gravado/sem_valor/ja_igual/pulado_confirmado; procedência e registro de divergência; propostas nas três tabelas; rollback integral quando um item posterior falha; estados, allowlists, ACEITO 10/20 e confirmado; RLS/CRUD próprio e isolamento A/B; ACLs de clientes/serviço/backend; drift de pais/helpers/defaults/grant options; recusa de retorno com dados, índice, CHECK ou view posterior; preservação dos 30 arquivos selados antes/depois.

## Limites e riscos preservados

Os ensaios são sequenciais, sem duas sessões PostgreSQL independentes. Locks foram inseridos nas novas funções, mas isso **não prova concorrência global resolvida**: `confirmar_campo_do_cliente` existente continua fora do delta e pode ler procedência antes da atualização. Não se alterou essa função para fazer o teste passar.

O helper histórico `registrar_procedencia` permite que p_extra sobrescreva campos reservados. O ensaio demonstra esse limite sem modificar o helper. As novas funções não recebem extras arbitrários nem encaminham JSON do usuário para ele: geram apenas IDs fixos de proposta/item/entrevista ou execução. Resolver a vulnerabilidade geral do helper exige bloco próprio.

**Retorno DDL não desfaz escritas de perfil/procedência.** `escrever_apenas_se_livre => gravado` pode alterar businesses e procedência sem inserir qualquer divergência. Cinco tabelas novas vazias não provam que as RPCs nunca foram usadas. O ensaio confirma que o valor legado continua depois do retorno. Não há marcador adicional criado para contornar esse limite. Retorno exige autorização própria, comparação com o PÓS original e avaliação de uso; nunca automático.

Nenhuma linha real de cliente/Auth/Vault foi consultada nesta preparação. Não houve chamada de negócio, backend, Meta, cobrança, exclusão real ou homologação HTTP. Não houve DDL remoto nem prova de aplicação U3 no QA. Comparação de metadados não certifica acesso real, integração, carga, criptografia do Vault ou segurança global.

## Arquivos de operação futura

- `u3-preflight.sql` / `u3-pos.sql`: um SELECT, uma linha `receipt` JSON, somente metadados.
- `u3-aplicar.sql`: um único DO, sem BEGIN/COMMIT externos; falha antes de repetir/adaptar delta.
- `u3-verificar.sql`: transação read only, sem executar corpos das RPCs.
- `u3-retornar.sql`: um único DO, recusando dados/DDL posteriores, sem CASCADE. DROP padrão RESTRICT.
- `comparar-recibos.mjs`: verifica SQL contra modelo JS, delta exato, preservação do histórico version/name e todos os metadados fora do delta.
- `ATO.md`: backup privado e sequência futura de aplicação/retorno, dependentes de autorização nominal.
- `SHA256SUMS.txt`: sela todos os arquivos do pacote, exceto o próprio manifesto de hashes.

A U3 não libera push, produção, ativação ou unidades seguintes.
