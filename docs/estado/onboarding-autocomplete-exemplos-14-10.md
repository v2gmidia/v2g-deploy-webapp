# Etapa 04 — busca de atividade e exemplos, 14/10/2026

## 0. Aberto

- Publicar pelo fluxo manual do Victor e conferir no QA autenticado a busca, a opção Outros e a preservação da resposta após voltar ou trocar de negócio. O build local não prova o comportamento publicado.
- Ainda faltam as perguntas guiadas sobre serviços e público, a revisão das três contas, o envio de materiais de marca, o contexto entregue ao gestor e a agenda com reserva única e retorno visível. A etapa 04 não está concluída.
- A etapa 03 ainda exige prova no QA com um e-mail e dois CNPJs aprovados, troca em duas abas, ações antigas e perda de acesso.

## Trabalho local

- O rótulo do identificador no onboarding passou a ser “CNPJ da conta”. A consulta continua usando o CNPJ do pedido aprovado; não cria nem altera vínculo.
- O seletor de tipo de negócio passou a ser uma busca com sugestões filtradas, teclado e opção “Outros — escrever minha atividade”, que abre um campo livre. A lista local foi ampliada para mais setores. A escolha continua salva como texto, sem criar uma taxonomia de backend.
- Exemplos de descrição, comprador, necessidade e entrega agora usam o tipo de negócio já respondido quando há um exemplo específico. Nos outros tipos, o campo permanece genérico; os exemplos não são dados atribuídos ao cliente.

## Conferências

- `pnpm typecheck`: passou.
- `node --test scripts/conferir-onboarding-preservacao.mjs`: 67/67 passaram.
- `pnpm build`: passou.
- `git diff --check`: passou; houve apenas avisos de finais de linha.
- O componente novo ainda não teve inspeção visual no navegador autenticado.

Nenhum commit, push, deploy, migração, cobrança ou escrita na Meta foi feito neste bloco.
