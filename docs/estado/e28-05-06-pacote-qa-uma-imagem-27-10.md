# 05/06 — Preparação do pacote QA de uma imagem (noite 26→27/10)

## §0. Portão

Pacote revisável criado em [geracao-webapp-v2-piloto-uma-imagem-27-10.md](../qa/geracao-webapp-v2-piloto-uma-imagem-27-10.md). **Não liberado para aplicar.** Backend 07/08 ainda finalizava o contrato ao conferir o estado. Não foi comprovada uma imagem real gerada pelo agente.

## Feito

- Mapeados migration WebApp e SHA-256, dependências de schema, flags/transportes sem ler valores secretos ou alterar configuração.
- Definidos material próprio novo, proveniência vigente, referência específica candidata, provedor contratual, quantidade de uma imagem e lacunas de autorização/teto nominal.
- Roteiro de aceite cobre novo login, negócio A/B, seleção/hash do pedido, aprovações persistidas, submit sem provedor, polling sem geração, worker controlado, arquivo privado, biblioteca e conciliação de custo.
- Confirmada incompatibilidade concreta: o backend passou a exigir `autorizado_por`, três UUIDs de revisores e `aprovacoes_sha256` em `EvidenciasContextoV2`. O montador WebApp anterior não os fornece. Registro revisado local também não equivale aos novos manifests de aprovação persistida. O teste continuou acusando o problema; veto v2 permanece.

## Prova desta rodada

- Pedido, sessão, intenção de envio e migration efêmera: **44/44 testes passaram**.
- Compatibilidade do manifesto contra o checkout atual de 07/08: **0/1, falhou pelos cinco campos novos**. Isso supera a compatibilidade offline verde medida no bloco anterior; não se reescreveu seu histórico.
- A declaração da rota, concluída antes deste pacote, passou identidade 6/6 e tipos. Não se repetiu suíte geral nem teste visual sem mudança de interface.

## Falta e responsabilidade

1. **07/08:** fechar contrato/fonte persistida e pacote de runtime/worker QA isolado, com proveniência do 03/04 e aprovações verdadeiras. A factory atual declara `laboratorio-local`, não basta ligar flags no WebApp.
2. **05/06, próximo bloco após o contrato final:** alinhar o montador ou eliminar duplicação, conferir provas de v2 na leitura/arquivo e ensaiar integração local; não retirar o veto por aceitação sintática.
3. **Victor, somente no portão revisável do piloto:** autorizar negócio/material exato, envio do logo ao destino, conteúdo aprovado e teto nominal de uma imagem. Nenhum consentimento ou gasto foi inferido.

Nenhum arquivo do backend foi editado. Sem QA/produção, migration remota, credencial, flag, chamada paga, commit/push/deploy ou publicação. Mudanças de outros chats preservadas; índice compartilhado fica com o Central.
