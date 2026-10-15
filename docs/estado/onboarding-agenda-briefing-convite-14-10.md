# Etapa 04 — contexto no convite da reunião, 14/10/2026

## 0. Aberto

- A agenda própria ainda está desativada. Falta ensaio no QA com evento real: conferir no Google e no e-mail do convidado se o resumo aparece de forma legível, se o convite é enviado uma vez e se a ficha do gestor permanece a fonte atual após correções no onboarding.
- O convite contém declarações do cliente e é visível a ele. Avaliação interna do gestor não deve ser incluída nesse texto.

## Achado e ajuste local

- A carteira já mostrava respostas e lacunas, mas o evento criado na agenda própria continha só o CNPJ. O gestor que abria a reunião pelo calendário não tinha o contexto pedido por Victor.
- O evento preparado agora resume tipo de negócio, produtos e serviços, comprador, necessidade, entrega, diferencial e exemplos declarados. Lista somente lacunas que o cliente marcou explicitamente para a reunião.
- A resposta histórica sobre qual anúncio fazer primeiro não vira decisão no convite. O texto é reduzido e normalizado; informa que representa o momento da reserva e orienta a conferir a ficha atual no WebApp.
- A ação lê o onboarding do mesmo negócio autorizado sob RLS antes de montar o convite.

## Conferências

- 12/12 testes locais de conciliação e descrição passaram, inclusive resposta antiga ignorada, lacuna explícita e ausência de inferência quando não há resposta.
- `pnpm typecheck` passou; `git diff --check` passou com avisos de fim de linha.

Nenhum convite foi criado ou enviado. Sem commit, push, deploy, migração ou escrita na Meta.
