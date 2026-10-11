# QA: posicionamento e onboarding — 11/10/2026

## 0. Pendente

- Publicar esta versão **especificamente** em `v2g-webapp-qa` e repetir o percurso em HTTPS. O projeto QA não está ligado ao Git na integração Vercel e a CLI local não está autenticada; nenhuma publicação ocorreu nesta sessão. Uma publicação pelo Git agora também não incluiria as alterações locais não commitadas.
- Percorrer o onboarding completo apenas depois de definir a prova segura do envio final: a conclusão pode disparar `POST /cadastro`/n8n, que exige autorização própria pelo `AGENTS.md`.
- A redação pública definitiva da V2G segue em elaboração no vault; as alterações abaixo são ajustes internos de precisão, não aprovação de slogan.

## Escopo e fontes

Victor autorizou expressamente reconciliar as migrações **no projeto Supabase de QA** e preparar a versão QA, sem tocar em produção. Antes da escrita foram conferidos o ledger remoto e os arquivos `0010`, `0011`, `0015`, `0017`, `0023`, `0031` e `0032`. O QA já tinha migrações comerciais próprias; a `0010` inteira não cabia nele porque falta a tabela `public.execucoes` do backend. A migração `0031` foi substituída pela função posterior `0032`; `0015`/`0016` foram substituídas pela `0023`. Não foi executado `pnpm db:migrate`.

No vault `Segundo Cérebro` foram consultados `50 - V2G/Posicionamento/Posicionamento e apresentação.md`, `50 - V2G/Acontecimentos/2026-10-07 - Revisão de posicionamento.md`, `50 - V2G/Produto/Tese e limites do produto.md` e as fontes relacionadas. O direcionamento é falar ao dono do negócio, tornar decisões e investimento em anúncios mais claros e descrever a operação humana assistida por IA. A ligação automática entre anúncio, conversa e venda e a autonomia plena da IA não estão comprovadas. A própria nota de posicionamento ainda pede validação final.

## Banco de QA

Projeto: `zskpijnqgkqwxksqmzmf`. Aplicadas **uma vez**, com preflight de ausência e resultado de sucesso:

1. `qa_0032_mesclar_respostas_por_chave` — conteúdo da `supabase/migrations/0032_mesclar_respostas_por_chave.sql`.
2. `qa_onboarding_perfil_base_11_10` — base mínima de perfil em [`../qa/qa_onboarding_perfil_base_11-10.sql`](../qa/qa_onboarding_perfil_base_11-10.sql), sem dependência de `execucoes`.
3. `qa_0011_procedencia_generalizada` — conteúdo da `0011_procedencia_generalizada.sql`.
4. `qa_0023_confirmar_campo_cliente_final` — conteúdo da `0023_cores_da_marca_na_lista_branca.sql`.
5. `qa_0017_esvaziar_campo_cliente` — conteúdo da `0017_esvaziar_campo_do_cliente.sql`.

Conferência posterior: as RPCs e colunas existem; `mesclar_blocos_onboarding` e `esvaziar_campo_do_cliente` operam como invoker para `authenticated`, e `confirmar_campo_do_cliente`, `registrar_procedencia` e `procedencia_do_campo` ficam limitadas a `service_role`. RLS de `businesses` e das duas tabelas de perfil foi conferida. Os avisos do advisor após a aplicação dizem respeito a tabelas/função anteriores, fora deste bloco.

## Prova de interface e isolamento

Com sessão autenticada local ligada ao banco de QA, em `/escolher-negocio` e `/onboarding`, gravei dados **fictícios** distintos nos dois negócios do mesmo login:

| Negócio | Nome salvo | Ramo salvo |
|---|---|---|
| `qa-auth-victor-0910-1` | `QA Empresa 1 — FICTÍCIA — Resposta A` | `Arquiteto` |
| `qa-auth-victor-0910-2` | `QA Empresa 2 — FICTÍCIA — Resposta B` | `Dentista` |

A tela confirmou cada gravação, a troca de negócio manteve as respostas separadas, e o recarregamento preservou a primeira resposta. Leitura SQL somente de verificação confirmou `businesses.name`, `niche`, `onboarding.respostas.nome/ramo` e `procedencia` separados por `business_id`. Esses pedidos de QA são **fixtures sintéticas**; não comprovam cobrança nem pagamento real. A prova cobre duas perguntas e retomada local, não o onboarding inteiro, nem o percurso HTTPS.

## Copy e verificação local

Em `app/layout.tsx`, `lib/cadastro/pendencias.ts`, `app/(fluxo)/onboarding/perguntas.ts` e `app/(protected)/inicio/TelaDoInicio.tsx`, a redação deixou de atribuir à IA decisões e início de campanha que ainda dependem da equipe. O alerta sobre alterações de verba agora descreve um risco possível, sem afirmar que toda mudança zera aprendizado. O slogan e a LP pública não foram alterados.

Passaram `pnpm typecheck`, `pnpm conferir:cadastro`, `pnpm conferir:inicio` (39/39), `git diff --check` e `pnpm build` com o dev parado. O servidor de desenvolvimento foi religado; `/inicio` exibiu a nova redação. Não houve commit, push, deploy, alteração em produção, escrita na Meta ou disparo de cadastro.

## Publicação HTTPS

A integração Vercel mostrou `v2g-webapp-qa` ainda no deployment de 09/10. O projeto não apareceu entre os vínculos Git disponíveis para o repositório. A CLI oficial foi verificada localmente, mas não havia sessão autenticada; o fluxo de autorização da conta no navegador apresentou o botão de permitir desabilitado. A tentativa foi encerrada sem criar credencial ou deployment. Portanto, não há prova de que o código e o esquema atualizados funcionem juntos no endereço HTTPS de QA.
