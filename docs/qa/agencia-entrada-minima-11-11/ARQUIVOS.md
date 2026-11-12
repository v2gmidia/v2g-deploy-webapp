# Pacote mínimo — entrada de agência na QA

Destino: WebApp, branch **QA**, base `2cdeb5cb545ae519ee947bd3c978198404fd9eac`. Commit e push manuais por Victor. Nenhuma migration ou alteração de backend necessária para este pacote.

## Arquivos deste bloco

### Produto

- `lib/agencia/da-sessao.ts`
- `lib/agencia/contexto.ts`
- `lib/agencia/entrada.ts` **novo**
- `lib/agencia/resumo-da-sessao.ts`
- `app/(fluxo)/onboarding/page.tsx`
- `app/(fluxo)/onboarding/layout.tsx` **novo**
- `app/(fluxo)/onboarding/actions.ts`
- `app/(protected)/agencia/actions.ts`
- `app/(protected)/inicio/page.tsx`
- `app/(protected)/criativos/page.tsx`
- `app/(protected)/anuncios/page.tsx`
- `app/(protected)/layout.tsx`
- `components/agencia/CarteiraAgencia.tsx`
- `components/agencia/ContextoNoCasco.tsx`
- `components/agencia/InicioDoCliente.tsx`
- `components/ui/Casco.tsx`

### Testes

- `scripts/conferir-agencia-estrutura.mjs`
- `scripts/conferir-agencia-qa.mjs`
- `scripts/conferir-onboarding-preservacao.mjs`
- `scripts/conferir-historico-vazio.mjs`

### Registro

- Este manifesto.
- `docs/qa/agencia-entrada-minima-11-11/snapshot.json`: hashes dos 20 arquivos de produto/testes e resultado local. Os 16 arquivos de produto conferem exatamente com a cópia aprovada no build.
- `docs/estado/n26-agencia-entrada-minima-qa-pronta-11-11.md`.
- Linha correspondente em `docs/estado/indice.md` (arquivo já continha registros anteriores).

Os arquivos comerciais já modificados antes deste bloco — webhook, rotas OAuth, `package.json`, helpers e documentos comerciais — foram preservados. Não são requisitos novos desta entrega. Conferir a seleção no GitHub Desktop para não tratar toda a pasta de trabalho como um único pacote de agência.

## Validação executada

- `pnpm conferir`: completo, código de saída zero. O schema exigido pelo conferidor de cadastro foi obtido por GET público somente da candidata backend QA e usado localmente como `V2G_OPENAPI_LOCAL`.
- Build Next completo em cópia isolada, sem `.env` ou credenciais herdadas: código de saída zero.
- 48 testes de agência, 14 de histórico e grupo SQL com 34 provas locais aprovados. A suíte completa também cobre multiconta, preservação do onboarding e identidade visual.
- Conferência visual local dos componentes reais, com dados explicitamente fictícios: desktop, celular, abrir aplicativo, gráfico, voltar à carteira e busca. Sem transbordamento horizontal no celular (375 px úteis).

Não afirmar publicação autenticada da nova revisão na QA antes do commit/push e da conferência posterior. A rota local `/exemplo/agencia` é bancada dev-only e não substitui essa prova.

## Roteiro após o push somente na QA

1. Conferir que o alias QA `https://v2g-webapp-qa.vercel.app` está READY e aponta ao commit que Victor acabou de enviar. Esse alias vem do checkpoint anterior; reler seu destino na publicação.
2. Na sessão legítima da Piligrin da QA, abrir `/inicio`: deve mostrar a carteira. Abrir `/onboarding` sem cliente: deve voltar para a carteira e não criar respostas.
3. Buscar Dúú e clicar **Abrir aplicativo**. Conferir nome do anunciante, números, período e gráfico; abrir Criativos e Anúncios pelo menu mantendo o mesmo anunciante.
4. Voltar à carteira: busca/filtros devem ser mantidos pelos links do detalhe. Reabrir Dúú e atualizar a página; conferir retomada.
5. Conferir outro anunciante/titular autorizado para o ensaio, sem criar cliente ou campanha fictícios. Não mostrar métricas ou peças do Dúú no outro recorte; IDs não autorizados devem ser recusados.
6. Registrar resultado, commit, ambiente e limites. Encerrar o bloco. Produção permanece fora desta autorização.
