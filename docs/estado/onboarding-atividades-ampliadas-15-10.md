# Onboarding: sugestões de atividades ampliadas — 15/10/2026

## 0. Dependências de Victor

- Publicar a versão pelo fluxo habitual e percorrer o autocomplete autenticado no QA. Esta alteração local não prova o comportamento no navegador publicado.

## Estado deste bloco

- A lista local de tipos de negócio em `lib/onboarding/atividades.ts` passou a incluir mais opções de saúde, alimentação, comércio, serviços, educação, construção e eventos. A opção **Outros** permanece para atividades ausentes.
- Termos comuns como `marmita`, `eletricista`, `encanador`, `tatuador`, `conserto de celular` e `ar condicionado` agora encontram sugestões correspondentes. As sugestões são ajuda de preenchimento; não classificam automaticamente o cliente em um nicho da operação nem autorizam anúncios.
- Nenhuma resposta salva, dado de QA ou configuração externa foi alterada.

## Verificação

- `pnpm conferir:onboarding-preservacao`: 72 testes passaram, incluindo busca de atividades, salvamento e isolamento por negócio. Os avisos de falha no início da saída são simulações esperadas pelos testes.
- `git diff --check -- lib/onboarding/atividades.ts`: sem erro de espaço. O Git informou apenas que poderá normalizar LF para CRLF no Windows.

## Limite

O ensaio visual do autocomplete e a publicação autenticada no QA continuam pendentes. A ampliação da lista não resolve, por si, a validação de cada atividade para publicidade na Meta.
