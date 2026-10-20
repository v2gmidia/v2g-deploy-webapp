# Criativos — pré-voo local do briefing de geração (19/10/2026)

## §0. Depende de Victor e de integrações ainda não feitas

- Escolher o negócio piloto e confirmar materiais, oferta, identidade e uso de imagens com o provedor antes de ensaio real.
- Confirmar o ID de nicho em `GET /nichos` e preencher/revisar o primeiro documento de nicho. O modelo existente não é regra aprovada para barbearia.
- Autorizar teto de custo e provedor para qualquer geração paga. Este bloco não chama Jev nem gerador.
- A rota futura precisa conferir sessão, vínculo com o negócio, origem de cada campo e caminho privado no servidor. O módulo puro não faz autorização nem inspeciona os pixels da fachada.

## Feito neste bloco

- Criado `lib/criativos/briefing-geracao.ts`, um pré-voo puro que só devolve briefing estruturado quando há objetivo com proveniência, oferta/cores/validade de promoção confirmadas, logo autorizado da conta, foto declarada como fachada quando usada, nicho confirmado no catálogo, versões dos documentos central e de nicho e ao menos uma referência de imagem revisada com uso como inspiração permitido.
- O briefing carrega IDs/origens de referência e restrições contra inventar dados ou copiar peças de terceiros; não afirma aprovação ou publicação.
- Criado `scripts/conferir-briefing-geracao.mjs` com 8 testes sintéticos, incluindo negócio alheio, fachada, validade, nicho, origem e referências inválidas.

## Verificação e limite da prova

- `node scripts/conferir-briefing-geracao.mjs`: 8/8 em 19/10.
- `pnpm typecheck`: passou em 19/10.
- Não há ligação desse módulo com a tela, banco, n8n ou backend. Nenhuma imagem foi gerada, armazenada, enviada a provedor ou publicada. O booleano de autorização e o tipo de arquivo são declarações do chamador e precisam ser verificados contra a fonte real ao conectar a rota.

## Próximo recorte proposto

Mapear os campos reais de onboarding/marca/referências para o contrato, sem usar dados de outro negócio como fallback, e criar um teste de integração sintético do adaptador servidor. Só depois conectar a ação de geração, com limite de gasto e estado de falha explícito.
