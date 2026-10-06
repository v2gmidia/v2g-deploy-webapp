# Figma: entrada e conversão v2 — leitura e entrega local

Leitura do [quadro “V2G — fluxo do app v2 | 01 Entrada e conversão”](https://www.figma.com/board/HENfICJLQ8SToXzDU1LB9N/), em 05/10/2026. O quadro é desenho de fluxo, não confirmação de implantação ou de decisões comerciais. Nenhuma escrita no Figma, LP, banco, backend, calendário ou Meta foi feita nesta leitura.

## O que o quadro mostra e o que existe

| Passagem no quadro | Estado local conferido | Encaminhamento |
|---|---|---|
| Visitante → LP → pré-cadastro → lead → confirmação (`1:3` a `1:32`; detalhamento `5:486` a `5:563`) | A LP separada oferece pré-cadastro, consentimento e contato comercial em até três dias úteis (`C:/Users/victo/v2g-deploy/lp/index.html:226-230`). | Manter LP como entrada pública atual. Validar integração real do lead e critérios comerciais antes de vinculá-lo a uma conta do app. |
| Perfil elegível → rota de entrada (`1:35` a `1:56`) | O próprio quadro marca compra direta, fechamento assistido ou ambos como “a decidir”. O app permite criar conta por e-mail/senha (`app/(public)/entrar/actions.ts`) sem prova de compra ou vínculo com lead. | Escolher a rota comercial, oferta, preço, contrato e fonte de confirmação de pagamento antes de liberar checkout ou afirmar que a conta é de cliente pagante. |
| Conta → retomar onboarding → negócio, contas, marca → rever respostas (`2:104` a `2:137`) | O app guarda respostas por bloco em `businesses.onboarding`, com colunas confirmadas quando cabível. A conclusão anterior conferia contas e marca, mas não exigia as quatro respostas básicas. | Esta entrega passou a conferir as quatro respostas no servidor, mostrar o resumo das já dadas e permitir corrigir pergunta anterior no bloco 1. Respostas antigas de ramo/praça continuam aceitas pela migração de chaves. |
| Conclusão → escolha de horário → reunião → publicação manual (`2:140` a `2:170`) | Há `agendamento_pendente` persistido, sem origem de horários nem reserva. A publicação da primeira campanha é ato do gestor. O quadro põe “cadastro e vínculo com execução” antes da agenda; a decisão vigente retém esse disparo até depois da reunião. | Seguir o contrato de `docs/estado/onboarding-reuniao-05-10.md`; não apresentar slot, reunião, pagamento ou anúncio como confirmado sem evidência do respectivo sistema. |
| Operação posterior, fila e novas peças (`3:236` a `4:425`) | A ficha do gestor está consultável; a fila única, o pedido de criativo posterior e a confirmação de publicação ainda não foram implantados como jornada integral. | Blocos próprios depois da agenda e do checklist da reunião, com vínculo de negócio e estado de veiculação comprovado. |

O quadro também contém variantes antigas (`12:624` a `15:974`) que mencionam checkout existente, contato em 30 minutos, áudio obrigatório e “gestor marca como no ar”. Elas divergem da rota principal mais recente no próprio quadro, da LP atual e de `docs/decisoes.md:65-66`. Não foram usadas como contrato de implementação.

## Recorte implementado nesta passagem

- `lib/onboarding/bloco-um.ts` lê o documento sem apagar chaves antigas, verifica nome, ramo, descrição e praça, e mantém descrição com o mínimo de 10 caracteres do contrato já usado na pergunta.
- A ação de marca recusa a conclusão quando falta resposta básica ou uma das contas. Uma conclusão antiga não mascara a pendência na retomada. A marca continua aceitando “não sei” explicitamente e não preenche campo ausente com valor inventado.
- O cliente vê no visual da marca as respostas básicas guardadas e o caminho para corrigir cada bloco. No bloco 1, “Corrigir resposta” reabre só a pergunta escolhida; salvar conserva as demais respostas e blocos. A página de conclusão devolve o cliente ao primeiro bloco pendente.
- Os textos iniciais agora descrevem o trabalho do gestor e deixam de atribuir à IA a escrita da primeira peça ou uma decisão automática de verba.
- A conclusão persistida continua significando **questionário respondido, agenda pendente**. A ficha do gestor e o portão que retém o disparo automático do cadastro permanecem intactos.

## Próximos contratos que faltam

1. **Lead → conta:** chave de correlação entre lead da LP, pagador e `businesses.id`; consentimento e origem; quem qualifica e autoriza criar/liberar a conta. O plano de identidade está em `docs/mapa-identidade-dados-1p-proposta.md`.
2. **Compra:** preço e oferta aprovados, contrato, provedor, webhook verificado, idempotência e reconciliação. O quadro não resolve a escolha entre compra direta e atendimento assistido.
3. **Agenda:** fonte de horários, gestor, duração, fuso, confirmação do provedor, remarcação/cancelamento e canal de aviso. `docs/estado/onboarding-reuniao-05-10.md` detalha o contrato proposto; Google Calendar segue preferência.
4. **Reunião → execução:** checklist de acessos e primeiro criativo, vínculo `business_id`, escolha de uma porta de cadastro no backend e conciliação de timeout antes de liberar o pipeline. Publicação inicial segue manual.

## Verificação desta passagem

`node scripts/conferir-onboarding-preservacao.mjs`: 23/23, inclusive retomada, legado, resposta ausente, falhas de gravação e repetição. `pnpm typecheck`, `pnpm conferir`, `pnpm build` e `git diff --check`: saída 0. Não havia servidor `next dev` concorrente ao build. Navegação autenticada em interface, Supabase/RLS real, LP publicada, calendário, pagamento e campanha não foram verificados. O build confirmou as rotas, não a experiência logada.
