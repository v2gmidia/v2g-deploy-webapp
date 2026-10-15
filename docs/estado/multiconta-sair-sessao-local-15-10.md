# Multiconta: Sair encerra somente a sessão atual — 15/10/2026

## 0. Pendente

- Conferir o botão Sair no QA autenticado em dois aparelhos ou perfis separados depois da publicação habitual. O ajuste local não comprova esse comportamento em produção.

## Fato e correção

- `app/(protected)/actions.ts` chamava `supabase.auth.signOut()` sem opções. A versão instalada de `@supabase/auth-js` documenta e implementa `scope: 'global'` como padrão: ela revoga as sessões de todos os aparelhos.
- A tela de Conta informa que Sair fecha a sessão **neste aparelho**. A ação compartilhada pelo menu, pela Conta, pela tela de acesso pendente e por Adicionar negócio agora chama `signOut({ scope: "local" })`.
- O cookie da preferência de negócio continua sendo apagado após a saída. A ação de redefinição de senha não foi alterada; ela tem outro propósito.

## Verificação

- `pnpm typecheck`: passou.
- Não houve execução autenticada, alteração no banco, commit ou publicação.
