# Publicação e QA — 16/11/2026

Autorização: commit, push e publicação dos dois serviços, seguidos de QA com dados reais.

- Backend: commit `21bc9af`, enviado para `origin/main`, implantado em `ia/backend` no Easypanel. Saúde pública confirmou `ok: true`, produção e versão `0ac3cbf7c92a`.
- WebApp: commits `cfcc508` e `4e32f0d`, enviados para `origin/main`. Último deploy Vercel `dpl_3eo8aY8zeboh8tDQLANyaTc5gpAq` READY, produção, aliases sem erro incluindo `app.v2gmidia.com.br` e `v2g-deploy-webapp.vercel.app`.
- Último ajuste: escala mínima de R$ 1,00 no gráfico totalmente zerado, evitando marcas de centavos repetidas. Typecheck e 56 verificações de Início Meta passaram.

## Conferência autenticada em produção

Negócio V2G, conta de anúncios terminada em 9726.

| Período | Investido | Impressões | Conversas | Resultado |
|---|---:|---:|---:|---|
| 1–16/11/2026 | R$ 26,49 | 1.493 | 1 | 2–15/11 zerados com confirmação de ausência de veiculação; somente 16/11 em atualização |
| 1–15/11/2026 | R$ 26,49 | 1.493 | 1 | Sem aviso de atualização ou medições parciais |
| 2–15/11/2026 | R$ 0,00 | 0 | 0 | Sem aviso de atualização; escala final 0,00 / 0,50 / 1,00 |

- Teclado e toque/click selecionaram um dia zerado com data, R$ 0,00 e “Sem veiculação”.
- Celular em 390 × 844: largura e scrollWidth da página ambos 390; sem transbordamento horizontal da página. Dimensões restauradas após o teste.
- Console do navegador: nenhum erro capturado. Consulta dos logs error/fatal do último deploy nos 15 minutos anteriores: nenhum registro retornado. Essa é uma janela pontual, não uma garantia sobre todas as rotas/contas.
- Tracked worktree limpo e HEAD sincronizado com origin/main ao concluir.
- Nenhuma alteração de campanhas, orçamento, banco ou credenciais.

Evidências locais: `publicacao-cobertura-final.png`, `publicacao-cobertura-mobile.png`.
