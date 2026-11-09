# N26 — Início / distinção das falhas na bancada — 09/11/2026

**Ajuste restrito à fixture dev-only e seu teste. Snapshot estável para confirmação visual da Central.** Nenhuma guarda ou componente de produto foi relaxado.

- `app/exemplo/_inicio_meta/Previa.tsx`: “Falha após leitura” agora devolve a conta fictícia `act_10001` na lista autorizada e em `contaSelecionada`, simulando outage da fonte depois da confirmação da conta. Permite exercitar a retenção legítima da última leitura nesse mesmo escopo.
- Novo cenário “Falha antes de confirmar a conta”: lista vazia e seleção null; continua sem fallback, mesmo que haja memória anterior.
- `scripts/conferir-inicio-meta.mjs`: executa a fixture real com cenário trocado por hook isolado, extrai suas props e chama a guarda real de retenção; comprova positivo após conta confirmada e negativo antes dela. Não usa asserção textual sobre o código da fixture.

Comando: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-reporter=spec scripts/conferir-inicio-meta.mjs scripts/conferir-inicio-meta-client-boundary.mjs`.

**40/40 PASS**, zero falhas/skips. Os 157 testes/typecheck do batch anterior permanecem sua evidência histórica; não foram declarados como nova suíte integral nesta rodada. A guarda produção/sentinela e o wrapper servidor permanecem preservados.

Não executei build/dev, alterei a porta 3001, fiz reload em abas da Central ou consultei QA/Meta. A confirmação visual do cenário ajustado cabe à Central no servidor já ativo. Nenhum backend, dado real, configuração, Git ou deploy foi alterado.
