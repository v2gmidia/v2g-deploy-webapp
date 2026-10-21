# Criativos — seleção local da marca para geração (20/10/2026)

## §0. Depende de Victor e da integração

- Aprovar negócio piloto e condições de uso de logo/fotos pelo provedor de geração. O texto atual do upload fala de autorização de pessoas retratadas; não registra autorização específica para processamento por IA externa.
- Registrar e conferir no servidor, para cada imagem, quem autorizou a finalidade `geracao_imagem`, quando e se houve revogação. Uma lista enviada pelo navegador não serve de prova.
- Criar carregador autenticado por negócio selecionado e buscar `creatives` com `business_id`, `uso`, `storage_path`, `created_at`, `arquivado_em` e `copy` explicitamente no `select`. Não usar `service_role` antes de resolver o negócio pela sessão.
- Testar isolamento, autorização e revogação com sessões reais antes de enviar qualquer arquivo privado ao gerador. Nenhum desses passos foi executado neste bloco.

## Fato observado

- `lib/identidade/armazenar.ts` guarda logo e fotos no bucket privado, com caminho `identidade/{business_id}/...`; a foto nova tem tipo declarado em `creatives.copy.identidade.tipoFoto`. Fotos anteriores sem tipo continuam desconhecidas.
- `app/(protected)/conta/declaracao.ts` registra aviso sobre pessoas presentes na foto. Esse aceite não deve ser tratado como autorização de envio a provedor de IA.

## Feito neste bloco

- Criado `lib/criativos/selecionar-marca.ts`: seleciona por IDs explícitos um logo ativo e, quando solicitada, uma foto declarada como fachada. Exige negócio e prefixo de caminho coerentes, registro não arquivado, data válida e autorização específica da mesma imagem/negócio/finalidade, não revogada. A saída usa o contrato `MaterialDaMarca` do pré-voo.
- Foto antiga sem tipo, ambiente marcado como fachada, material de outro negócio, caminho cruzado, ID duplicado ou autorização ausente/revogada falham fechados. Não escolhe automaticamente a foto mais recente.
- Trata-se de função pura que recebe linhas e autorizações supostamente verificadas; não lê banco, não confere sessão e não concede permissão por si.

## Verificação e limite

- `node scripts/conferir-selecao-marca.mjs`: 12/12 casos sintéticos passaram.
- `pnpm typecheck`: passou.
- Nenhuma imagem privada foi lida ou enviada; sem chamada paga, alteração de banco, migração, n8n, Meta ou deploy. Não há prova de tela autenticada ou consentimento real.

## Próximo recorte possível

Mapear a action autenticada que carregará as linhas e a autorização, ou avançar o formulário de objetivo/oferta sem acionar provedor. Reexaminar código e estado antes de escolher.
