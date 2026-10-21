# Mesa do gestor — espaço próprio, primeiro recorte (20/10/2026)

## §0. Depende de Victor e de blocos seguintes

- Acesso de gestores de agência continua **desligado**. O papel global `operador` é somente da operação interna; a carteira existente consulta dados administrativos antes do filtro visual. Conectar agências exige vínculos persistentes, isolamento das consultas/actions/arquivos e QA entre duas agências.
- Indicadores Meta por negócio, semáforo de desempenho, reuniões do calendário e medição de tempo não foram acrescentados. Não existe prova dessas fontes nesta tela.
- As ferramentas internas detalhadas ainda estão sob `/gestor/...` e conservam o casco antigo, que exige negócio selecionado. Migrar cada ferramenta para o espaço próprio será outro bloco, com seus próprios guardas e testes.

## Feito neste recorte local

- Nova rota `/supergestor` em grupo independente de `(protected)`, com marca, identidade do operador, navegação de carteira, tema, retorno ao aplicativo e saída.
- A rota faz verificação própria de sessão, acesso e `app_metadata.papel === "operador"` antes de desenhar a carteira; o `proxy.ts` também a inclui nas listas de sessão e operador. Ela não chama `negocioAtivoDaSessao()` nem depende de escolher um negócio.
- A carteira já existente é reutilizada, sem cópia das consultas. O formulário de busca e filtro envia para a rota em que a carteira está aberta. Links de entrada do operador no casco do cliente apontam para `/supergestor`.
- A rota `/gestor` antiga foi preservada para compatibilidade.

## Prova e limite

- `pnpm typecheck`: passou.
- `node scripts/conferir-gestor.mjs`: 26/26 passaram.
- `pnpm build`: passou e listou `/supergestor` como rota dinâmica.
- `GET http://localhost:3000/supergestor` sem sessão: 307 para `/entrar?next=%2Fsupergestor`.
- Não foi realizado QA visual com uma sessão real de operador, nem prova de isolamento de agência, nem deploy. A existência da rota local não conclui a etapa 05.

## Prévia visual sem login, a pedido de Victor

- `/exemplo/mesa-gestor` reutiliza o mesmo casco da mesa, mas mostra somente três negócios de demonstração. Não consulta clientes nem chama a carteira administrativa.
- A prévia responde 200 no servidor de desenvolvimento e 404 no build de produção. A rota real `/supergestor` permanece protegida; a prévia não é atalho de autenticação.
- Conferência visual no navegador em 1265px e 390px: estrutura e texto legíveis; símbolo da marca corrigido no fundo escuro. Sem sessão real, o conteúdo autenticado e suas ações continuam sem QA visual.
