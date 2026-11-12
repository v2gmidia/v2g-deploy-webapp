# Agência — pacote mínimo implementado e testado para a QA

## 0. Entrega e próximo ato

11/11/2026. Victor autorizou implementar somente na QA a entrada da agência sem onboarding, carteira e acesso ao aplicativo do Dúú, preservando dados e identidade visual, com testes de isolamento e preparo para commit/push. Depois pediu o mapa dos passos até a entrega pronta e testada.

**Implementação local encerrada e pronta para commit/push manual na branch QA.** Suíte completa e build aprovados. Ainda não foi publicado este código na QA. O próximo ato é Victor selecionar o pacote no GitHub Desktop e enviar somente para QA; depois conferir a revisão publicada pela sessão legítima da Piligrin.

Arquivos e roteiro exatos: [`../qa/agencia-entrada-minima-11-11/ARQUIVOS.md`](../qa/agencia-entrada-minima-11-11/ARQUIVOS.md).

## 1. O que foi entregue

| Passo | Resultado deste bloco | Prova e limite |
|---|---|---|
| Separar agência e anunciante no contexto | Agência possui nome, raiz administrativa e carteira, mesmo sem anunciante próprio selecionado | Teste com raiz sem onboarding, verba ou campanha própria. Relações continuam explícitas e do titular |
| Entrada sem onboarding | Entrada administrativa retorna à carteira; raiz exclusivamente administrativa não recebe respostas do questionário | Página, layout e action reais exercitados offline; não cria negócio/resposta nem dispara cadastro nesse caminho |
| Abrir o aplicativo do Dúú | Botão **Abrir aplicativo**, seleção explícita e navegação entre Início, Criativos e Anúncios mantendo cliente | Action real confere agência, cliente, titular e elegibilidade antes de mudar só a preferência; links conservam contexto e retorno |
| Separar a visão geral dos resultados | Carteira não consulta uma operação de anúncios da própria agência | Anúncios sem cliente orienta escolher na carteira, antes de consultar estado, Meta ou consolidado |
| Preservar visual e dados | Mesmos componentes, CSS e tokens; nenhuma linha remota movida ou reatribuída | Build, conferidores de identidade e inspeção desktop/mobile. Sem alteração de folhas de estilo ou migrations |
| Testar isolamento | Outro titular, ID forjado, vínculo revogado, seleção inválida e resposta cruzada não autorizam leitura/abertura | Testes reais com fronteiras offline e 34 provas SQL em banco descartável local; não simula identidade na QA publicada |

## 2. Compatibilidade e limites deliberados

- O registro histórico da QA ainda contém a ponte Piligrin/Dúú. Foi preservado integralmente: não houve separação física, reatribuição de peças ou cópia de dados para uma nova linha. A leitura por relação continua identificando os dados operacionais como Dúú.
- Na ponte histórica, a edição explícita do cadastro do Dúú usa `?cliente=<id conferido>`; a entrada genérica da agência não pede esse questionário. Para raiz independente, as respostas permanecem no anunciante selecionado.
- Não cria cadastro público de novas agências, convites, nova assinatura, pagamento, permissão de operador ou acesso financeiro. A elegibilidade existente é mantida.
- O portão continua exigindo flag do piloto e hostname exato do Supabase QA; não foi estendido a produção.
- FamFire não foi implantada nem teve dados preenchidos neste bloco. Os testes fictícios preexistentes com dois anunciantes foram preservados para verificar isolamento.

## 3. Validação concluída

1. `pnpm conferir`: execução completa com exit code **0**. Inclui typecheck, identidade, multiconta, onboarding, comercial, 48 testes de agência e 14 de histórico. O OpenAPI necessário veio somente do backend QA por GET público, salvo localmente; nenhuma chamada de cadastro/disparo foi feita para obtê-lo.
2. `pnpm conferir:agencia-sql` equivalente via `node --test scripts/conferir-agencia-estrutura-sql.mjs`: grupo aprovado, **34 provas SQL locais**, preservação, grants, RLS, isolamento e retorno. Não acessa banco remoto.
3. Build Next completo: **0**, revisão local copiada para `C:/Users/victo/AppData/Local/Temp/v2g-commercial-build-j0zyiw`. Sem cópia de `.env`, sem credenciais herdadas e sem concorrer com `.next` do checkout compartilhado.
4. Navegador local: componentes reais em `/exemplo/agencia`, bancada marcada como fictícia e sem gravação. Conferidos carteira → aplicativo → gráfico → volta → busca, desktop/mobile. No celular: largura útil e largura do documento iguais a **375 px**. Isso prova apresentação/interação local, não números reais novos nem sessão publicada.
5. Revisão dos diffs e `git diff --check`: sem erros de whitespace. Alterações comerciais anteriores preservadas; não compõem mudança nova de escopo.

Correções durante a validação: assinatura da página ajustada ao contrato de props do Next e fronteiras dos testes atualizadas para a separação de contexto. O teste do histórico mantém a negativa de divergência, agora solicitando explicitamente o detalhe do cliente. A suíte foi executada por inteiro após esses ajustes e encerrou sem falhas.

Logs completos, OpenAPI QA e metadados do build preservados em `C:/Users/victo/.codex/private-backups/v2g/agencia-entrada-qa-20261111/`. O `snapshot.json` do pacote registra os hashes dos 20 arquivos de produto/testes; os 16 arquivos de produto foram comparados e coincidem com o build aprovado. Nenhum valor de credencial foi incluído nesse registro.

## 4. Caminho restante até este pacote estar no ar

| Ordem | Responsável | Ação | Conclusão verificável |
|---|---|---|---|
| 1 | Victor | Commit e push do pacote na QA | Novo SHA e branch QA, sem promover a produção |
| 2 | Central | Conferir publicação QA | Alias QA READY na revisão exata |
| 3 | Central + sessão legítima Piligrin | Executar roteiro do manifesto | Carteira sem questionário; Dúú com números/gráfico/criativos/anúncios; volta e isolamento registrados |
| 4 | Victor | Conferir a experiência entregue | Aceite ou defeito concreto com tela e comportamento |
| 5 | Bloco posterior especificamente autorizado | Preparar eventual promoção produtiva e implantação dos dados necessários | Pacote revisto com estado produtivo atual; não é consequência automática do push QA |

Nenhum commit, push, merge, deploy, migration remota, cobrança, anúncio, mudança de verba, credencial, permissão ou produção foi executado. Prévia local encerrada e porta temporária liberada.
