# E28-06 — peça própria V2G e campanha manual — 28/10/2026

## §0. Resultado

**Pacote local revisável pronto**, com uma candidata exata, copy/destino propostos, estado QA medido por SELECT, lacunas de identidade/vínculo e roteiro para 07/08. Não foi publicada campanha ou criada peça/execução no QA.

Entrega: [`../qa/campanha-v2g-evento-28-10/REVISAO-E-CAMINHO.md`](../qa/campanha-v2g-evento-28-10/REVISAO-E-CAMINHO.md) e manifesto JSON ao lado. A imagem original `public/criativos/v2g-clareza-feed-v1.png` foi preservada.

## O que foi conferido

- Arquivo PNG RGB, 1254 × 1254, 1.388.613 bytes; SHA-256 `c89622c2035efdc2251fd42a277e1242bee2c9c0a1c3a61495d98eab6186615a`; visual decodificado. É tecnicamente aceito no envio local da WebApp. Elegibilidade final e prévia Meta não foram testadas.
- Origem própria conforme pedido de Victor transmitido pela Central, registro Git `e5a8655`; não localizada fonte editável/licença independente do bitmap. Não se copiou mídia concorrente e não se gerou imagem nova.
- QA confirmado por listagem de projetos antes das consultas. SELECT exato encontrou o negócio candidato V2G `4406fcdb-9737-48d9-8cef-8aabb4eaf3ad`, não fictício, com proprietário, **0 gestores/0 execuções/0 revisões**. Não foi assumido como seleção autorizada apenas pelo nome.
- A mesma imagem/hash aparece no negócio fictício `0542c574-7c15-41ff-a269-22ce56ca25f2`, pedido `b58d11e5-8d7d-4ef6-9f7f-8c8d5c1df095`, `changes_requested`; catálogo confirma objeto privado registrado. Não foi baixado, movido ou reaprovado.

## Ajuste local e teste

`scripts/conferir-intencao-envio.mjs`: um cenário novo passa os bytes reais da candidata pelas actions reais de cliente/gestor com fronteiras em memória. Confere integridade, um arquivo/uma linha, estado de revisão, negativa entre negócios e aprovação fictícia limitada a publicação manual pendente. Rede externa vedada. **24/24 passaram**; são 23 cenários existentes mais um novo, sem contar repetições.

Nenhum TSX/backend/schema/configuração foi alterado por este recorte. Não se repetiu typecheck/build/suíte de geração sem mudança de aplicação. Não foi aplicada migration, feita chamada paga, enviado arquivo ao QA, escrito dado remoto, publicado Meta, dado acesso, realizado commit/push/deploy ou acessado segredo. As duas consultas QA foram somente SELECT restrito; não se leu contato/documento/onboarding privado.

## Dependências e passagem a 07/08 por checkpoint

1. Victor revisa arte, texto, destino e aprova público/período/verba; confirma business_id e responsável. Pacote não é aprovação nem ordem executável.
2. Central conduz upload/revisão QA autorizados no negócio correto; análise automática não pode disparar serviço pago sem aprovação específica. Manter a fixture antiga intacta.
3. Publicação manual somente com autorização nominal de campanha/verba e ativos confirmados.
4. 07/08 recebem o contrato pelo pacote: execução do mesmo negócio ainda inexistente; vínculo manual é posterior à execução e não prova propriedade Meta. Coleta e persistência precisam de recorte específico. A cerca atual bloqueia POST e rotas de execução que o cliente usa; não removê-la por conveniência nem desligar mocks/usar backfill legado.
5. Aprovação da revisão não cria `creatives.external_ad_id`. Cliente Anúncios hoje não mapeia criativos por anúncio. Mínimo para o evento: imagem/revisão no negócio e números reais da campanha em Anúncios, com rastreio dos IDs; não prometer ranking/resultado atribuído a esta imagem.

Fonte backend consultada em leitura: `docs/estado/e28-07-diagnostico-negocio-piloto-metricas-27-10.md`, `src/api/qa_leitura.py` e `src/metricas/contrato_de_leitura.py`. Nenhum arquivo de 07/08 foi editado e nenhuma mensagem a outro chat foi enviada. Limites temporais: evento é **28/10**, hoje; a conclusão depende dos portões acima, sem promessa de números imediatos.
