# Cores do logo — publicação QA conferida e correção local — 10/11/2026

## 0. Próxima ação e responsável

- **Victor:** commit/push manual somente QA desta correção; a publicação atual ainda falha na recuperação. Não reenviar o logo.
- **Central, após a nova publicação:** testar uma vez a recuperação em `/onboarding/marca`, na sessão legítima Piligrin/Dúú. Conferir sugestões e preservação; não confirmar cores ou concluir marca automaticamente.
- **Cauã + Victor:** rodada operacional M3 com conta/peça existentes, decisão fundamentada e relato de bloqueios; depois decidir aceite M4. M3/M4 continuam abertos.

## Publicação e prova real

Commit `c86e3d42805881893b2d4f423fe67d77d2fed4ac`, branch QA, publicado **READY** no projeto isolado `v2g-webapp-qa`, deployment `dpl_efpgnjC7eY3nDgcei8fJptTYa5FR`. O alias `https://v2g-webapp-qa.vercel.app` aponta para essa publicação. Nenhum deploy ou alias alterado pela Central.

Na sessão autenticada Piligrin, o detalhe confirma anunciante Dúú Gomes. O logo salvo carrega com 1000 × 1000 pixels. A ação **Sugerir cores do logo salvo** aparece, mas devolve a mensagem controlada de falha, sem preencher a paleta. Não houve novo upload nem salvamento. A observação de rede no segundo clique diagnóstico não capturou solicitação de leitura; não foi uma repetição de conferência encerrada, mas investigação da falha concreta.

Evidência visual privada: `C:/Users/victo/.codex/private-backups/v2g/cores-logo-qa-publicada-20261110/recuperacao-falhou.png`. Não registrar a URL assinada do arquivo, parâmetros ou credenciais no repositório.

## Correção local e testes

A função nativa `fetch` era guardada no objeto de portas e depois chamada como método desse objeto. Isso perde o receptor global exigido pelo navegador. A correção chama `globalThis.fetch` por uma função intermediária; preserva as restrições de projeto QA, caminho exato, negócio, tamanho, tipo, cancelamento e confirmação explícita.

Novo teste modela a exigência do receptor do navegador. Antes da alteração, falhou (12/13 passaram); depois, **13/13 passaram**. Tipos e build também aprovados, com 57 páginas geradas. Não há nova alegação de suíte completa nem de sucesso na versão publicada: a correção está somente local e requer o próximo commit/push manual QA.

Código: `lib/identidade/cores-do-logo-salvo.ts`; regressão: `scripts/conferir-cores-logo-salvo.mjs`.

## Preservação

Consultas somente leitura no projeto QA `zskpijnqgkqwxksqmzmf`, antes/depois em `2026-11-11T01:08:33.774249Z` e `2026-11-11T01:15:43.540091Z` (10/11, horário de Brasília). Comparação dos mesmos fingerprints: 26 negócios, criativos Dúú/FamFire, revisões e arquivo de identidade preservados; um logo e um objeto correspondente, sem divergências; zero confirmações de publicação. Limite: comparação dos registros selecionados, não auditoria integral do banco.

Sem banco alterado, migração, anúncio, verba, produção, n8n, permissões, credenciais, commit, push ou deploy pela Central.

## Decisões novas de Victor e mensagem ao Cauã

Victor informou neste turno: **Dúú Gomes não tem site** e **não há data da arte disponível**. Ambos saem dos pedidos ao Cauã e não impedem a rodada operacional. A data histórica permanece desconhecida; nenhuma data inferida ou publicação fictícia é gravada. O fato de não ter site foi registrado aqui, sem submeter o formulário completo de marca ou presumir aprovação da paleta.

Logo, teto R$ 3 mil/mês, região estadual RJ e aprovação da peça já definidos não serão solicitados novamente. A mensagem preparada prioriza: passada operacional na própria sessão QA; decisão e próximo acompanhamento; bloqueios concretos para operar pelo aplicativo. É uma minuta para Victor, não foi enviada ao WhatsApp. A planilha e o Figma não foram alterados neste bloco.
