# Mesa do gestor — conferidor das portas internas (20/10/2026)

## §0. Depende de Victor e da integração

- O papel `operador` é global e serve somente à equipe interna atual. Não convidar gestores de agência com esse papel: ele abre a carteira e rotas que usam `service_role` para todos os negócios.
- Para agência, faltam modelo persistente de vínculo usuário–agência–negócio, autorização antes de cada consulta/action/arquivo, RLS e ensaio autenticado entre duas agências. A migração, convites e alterações reais exigem autorização específica.
- Confirmar no piloto quem verá cada negócio. O filtro “Minhas contas” da mesa atual não é uma fronteira de autorização.

## Fato observado

- As cinco páginas sob `/gestor` verificam `app_metadata.papel === operador` antes de criar o cliente administrativo. As duas unidades de actions possuem sete actions exportadas; cada uma nega usuário sem o papel antes de usar o cliente administrativo.
- `app/(protected)/gestor/page.tsx` lê a carteira global antes de aplicar filtro “Minhas contas”. Isso é compatível com a operação interna vigente, mas impede reaproveitar a rota para agência sem refatoração de autorização.
- A página de marca cria URLs privadas apenas após a guarda de operador. Essa guarda ainda não testa atribuição por negócio.

## Feito neste bloco

- Criado `scripts/conferir-portas-gestor-interno.mjs`. Ele inventaria exatamente cinco páginas e duas unidades de actions, falha se surgir rota/action nova não revisada, e verifica a ordem sessão → papel interno → negação → cliente administrativo. Também impede a introdução direta do papel de agência nas páginas atuais.
- É um alarme estático de regressão para o perímetro existente, não um mecanismo de autenticação nem prova de isolamento entre agências.

## Testes e limites

- `node scripts/conferir-portas-gestor-interno.mjs`: 5 páginas e 7 actions conferidas; passou.
- `node scripts/conferir-gestor.mjs`: 26/26 testes locais passaram.
- `pnpm typecheck`: passou.
- `pnpm conferir:gestor` não existe como script; o conferidor foi executado diretamente. Nenhuma consulta real, alteração de banco, convite, migração ou deploy ocorreu.

## Próximo recorte possível

Desenhar a matriz de capacidade por leitura, action e arquivo e só então ligar o contrato de escopo por agência a um carregador autorizado. Não remover a guarda interna antes desse trabalho.
