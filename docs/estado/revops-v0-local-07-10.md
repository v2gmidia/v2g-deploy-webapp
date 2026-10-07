# RevOps V0 — implementação local de 07/10/2026

## 0. Depende de decisão humana

- Revisar a migration antes de aplicar no Supabase compartilhado.
- Definir retenção de interessados, referências, conversas e transcrições.
- Definir quem além de Victor e Gabriel poderá receber a autorização assinada `revops`.
- Em bloco posterior e explicitamente autorizado, configurar `app_metadata.autorizacoes = ["revops"]` nas contas escolhidas.
- Definir a ponte canônica com o Finance, que usa banco e IDs próprios.

## 1. O que foi implementado

- Contrato ponta a ponta em `docs/revops-v0.md`.
- Migration aditiva com pessoa, empresa prospectiva, oportunidade, fonte, interação e associações N:N.
- Fonte idempotente por `(source_system, source_external_id)` e uma interação por fonte.
- Ligações opcionais e verificáveis com `leads_lp`, `commercial_orders` e `businesses`.
- Acesso fechado por autorização específica em `app_metadata`, além do proxy, layout/página e actions.
- Rota interna `/revops`, ausente do menu do cliente, com lista, linha do tempo, evidência, próximo passo, vazio honesto e formulários mínimos.
- Fixtures/testes exclusivamente fictícios. Nenhum dado real foi copiado ou importado.

## 2. Decisões tomadas neste bloco

- Uma interação pode pertencer a duas oportunidades; isso representa um grupo/reunião compartilhado sem fundir as empresas.
- O formulário de interessado cria uma pessoa e uma empresa novas mesmo que os textos coincidam com registros anteriores. Conciliação será sempre explícita.
- Reunião realizada exige um estado de transcrição; `pending` aparece como “Transcrição pendente”.
- O diagnóstico `guidance_needed` não bloqueia compra.
- `source_fact`, `human_report` e `inference` são estados diferentes; inferência começa pendente de revisão humana.

## 3. O que não foi feito

- Migration não aplicada; tabelas/RPCs não existem em produção por consequência deste arquivo local.
- Nenhuma autorização foi concedida a Victor, Gabriel ou operador.
- Nenhuma importação de LP, WhatsApp, Instagram, Meet, pedido, negócio ou Finance.
- Nenhuma chamada a Jev/modelo, Meta, Asaas, Google, Vercel, Easypanel ou backend.
- Nenhum commit, push, merge ou deploy.

## 4. Verificação

- `pnpm conferir:revops`: **7/7 passaram** com fixtures fictícias. Cobriu o portão específico, dez conversas sem venda, estados comerciais separados, transcrição pendente, alerta de venda relatada, Instagram sem veto, idempotência/empresas separadas no contrato SQL e bancada sem actions de escrita.
- `pnpm typecheck`: **passou**.
- `pnpm conferir:identidade`: **6/6 passaram**; a action RevOps foi declarada no registro de exceções e continua exigindo autorização específica antes de ler os identificadores do formulário.
- `pnpm conferir:portao`: **8/8 passaram**; a bancada fictícia continua restrita ao desenvolvimento.
- detector visual do Impeccable: **zero achados** depois do ajuste para a escala tipográfica já documentada.
- revisão visual da bancada fictícia: desktop `1440 × 1100` e celular `390 × 844`; no celular, `document.scrollWidth = 390`, sem rolagem horizontal. A bancada montou o cabeçalho real com seletor de tema, não montou formulários reais e priorizou oportunidades antes do registro no celular.
- `pnpm build`: **passou** e incluiu a rota dinâmica `/revops` antes da revisão visual final. Depois dos ajustes de bancada inerte/estado de falha, `typecheck`, `conferir:revops`, `conferir:portao` e o detector visual passaram novamente; o build não foi repetido porque havia um servidor `next dev` ativo na pasta, e os dois compartilham `.next`.
- `pnpm conferir`: avançou por typecheck e pelos conferidores anteriores até parar, como esperado, em `conferir:migrations`. A única falha foi a ausência das sete tabelas e duas RPCs novas no schema vivo.

### NÃO VERIFICADO em produção

- Criação real das sete tabelas e duas RPCs, grants, RLS, constraints e idempotência concorrente. A migration não foi aplicada.
- Leitura e gravação da tela `/revops` contra dados reais. Além de a migration não existir no banco, nenhuma conta recebeu a claim `revops`.
- Vínculos reais com `leads_lp`, `commercial_orders` e `businesses`.
- Continuidade posterior com pagamento, onboarding, campanha, CS e Finance; neste bloco ela existe apenas como contrato documentado.
