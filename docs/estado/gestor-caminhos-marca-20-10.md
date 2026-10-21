# Mesa do gestor — escopo dos links privados de marca (20/10/2026)

## §0. Depende de Victor e da integração

- A proteção desta rodada não cria papel de agência nem limita o operador interno à carteira atribuída. Gestores de agência ainda exigem vínculo persistente usuário–agência–negócio, RLS, autorização por leitura/action/arquivo e teste autenticado entre duas agências antes de qualquer convite.
- Conferir com uma sessão real as peças de marca legadas: um caminho fora do padrão `identidade/{business_id}/{arquivo}` agora deixa a página indisponível até correção documentada do registro. Não corrigir dados reais sem autorização.

## Fato observado

- Os uploads atuais de logo, variação e PDF gravam sob `identidade/{business_id}/...`, mas a página `app/(protected)/gestor/negocio/[id]/marca/page.tsx` assinava todos os `storage_path` devolvidos pela consulta administrativa sem validar que cada caminho pertencia ao negócio da URL.
- `createSignedUrls` em bucket privado compartilha o arquivo pelo prazo escolhido. A guarda de papel interno existe antes da consulta, mas não substitui a conferência da associação arquivo–negócio.

## Feito neste bloco

- Criado `lib/gestor/caminhos-marca.ts` para aceitar somente caminhos diretos no prefixo exato do negócio. Qualquer caminho ausente, de outro negócio ou ambíguo recusa o lote inteiro.
- A página da marca só chama `createSignedUrls` após validar todos os caminhos. Na falha, mostra estado indisponível e não cria link privado.
- Isto é defesa adicional para a tela interna atual, não um mecanismo de autorização de agência nem uma alteração do banco.

## Testes e limites

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/conferir-caminhos-marca-gestor.mjs`: 4/4 testes locais passaram, inclusive caminho de outro negócio e verificação estática da ordem antes da assinatura.
- `pnpm typecheck`, `node scripts/conferir-portas-gestor-interno.mjs` e `pnpm conferir:identidade` passaram.
- Sem consulta autenticada, arquivo real, migração, convite, escrita externa ou deploy. O teste não prova a configuração de Storage/RLS em produção.

## Próximo recorte possível

O portão relevante continua sendo autorização por negócio e papel de agência em cada leitura, action e arquivo, com vínculos persistentes e QA autenticado. Não abrir a mesa global atual para gestores de agência.
