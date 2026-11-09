# Prévia e confirmação de publicação — pacote QA — 09/11/2026

## 0. Escopo e estado

Victor autorizou implementar prévia na fila do Cauã, separar aprovação de publicação, testar e fazer **commit/push somente QA**, inclusive registrar o backend pendente. Essa autorização específica substitui, para este lote, a rotina de commit manual do AGENTS.md.

Implementação pronta e conferida localmente. **A migração nova não foi aplicada a banco remoto.** O push do WebApp atualiza exclusivamente o projeto QA; até aplicar a migração `20261109210135_creative_publication_confirmation.sql` nesse ambiente, a prévia e o rótulo de aprovação funcionam, mas a confirmação persistente fica indisponível e o formulário não é oferecido. Falha de consulta nunca vira “publicado” nem “sem publicação”.

Próximo bloco de banco, se autorizado: capturar backup privado, revisar/aplicar somente essa migração na QA, conferir RLS/ACL/RPC e fazer prova autenticada de gravação/retomada em dados de teste. Não confirmar publicação real do Dúú sem anúncio identificado e conferência da versão da imagem.

## Comportamento final

- Fila do gestor mostra prévia da imagem privada e mantém o link para tamanho original. Assinatura só depois de conferir carteira, negócio e caminho exato. Falha ou expiração da imagem tem recado de recuperação; imagem em cache não fica presa em “Carregando”.
- Aprovação existente mantém o mesmo estado persistido e passa a aparecer como **Peça aprovada pelo gestor**. Botão: **Aprovar peça**. Nenhuma aprovação histórica foi convertida em publicação.
- **Confirmar publicação** é ação separada, disponível apenas em peça aprovada, sob o gestor atribuído e com conta ativa do próprio negócio. Exige conta, ID de anúncio, dia real não futuro, descrição da conferência e confirmação explícita da versão da imagem.
- Registro vincula solicitacão, negócio, SHA-256 da peça, conta, anúncio, dia declarado, autor e momento da confirmação. Fonte explícita: `manager_declaration`. É declaração do gestor, sem leitura ou escrita na Meta.
- Cliente vê aprovação e publicação separadamente. Um registro íntegro mostra **Confirmada pelo gestor**, vínculo informado com o anúncio e ressalva de que não confirma entrega atual. A leitura rejeita registro com outro negócio/pedido/hash/fonte ou dados inválidos.
- Formulário bloqueia envio duplicado enquanto aguarda, preserva todo o rascunho em erro e explica retorno incerto. Teste visual detectou e corrigiu o reset nativo que apagava seleção/checkbox após retorno de falha.

## Persistência preparada

Migração gerada pelo comando local `supabase migration new` (CLI 2.122.1). Cria `creative_publication_confirmations`, RLS de leitura do dono e RPC `confirmar_publicacao_criativo`, **SECURITY INVOKER**, executável somente por `service_role` depois da autorização da sessão no servidor. Referência composta impede associar outra versão/negócio à peça.

A RPC bloqueia a revisão durante a operação, repete a conferência de aprovação, gestor e conta em uma transação. Repetição idêntica retorna o registro existente; outro anúncio/dado retorna conflito e preserva o anterior. `authenticated` e `anon` não escrevem nem executam a RPC. `service_role` tem SELECT/INSERT na tabela nova, sem UPDATE/DELETE. Nada altera o estado da revisão, campanhas ou verbas.

Documentação consultada: [funções de banco e permissões](https://supabase.com/docs/guides/database/functions). A implantação remota da migração não faz parte deste pacote de código/push.

## Validação

- Build final do WebApp aprovado, incluindo TypeScript.
- **64/64 testes**: publicação (6), revisão (11), intenção/envio/decisão (42), tarefas do gestor (5).
- **28 verificações SQL** em Postgres efêmero (PGlite): RLS, isolamento entre donos, ACL individual, RPC invoker, gestor/conta/hash, pendência, datas inválidas/futuras, idempotência e conflito sem sobrescrita. Nenhum banco remoto usado.
- Percurso visual local `/exemplo/revisao-publicacao`: prévia carregada, campos, validação obrigatória, simulação de retorno incerto com rascunho completo preservado e sucesso simulado. A bancada usa somente dados fictícios e não chama banco/Meta.
- Responsivo: viewport de teste 390×844, largura útil/conteúdo **375/375**, sem transbordamento horizontal. Override removido depois.
- Capturas em `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/criativo-revisao-publicacao-qa-09-11/`. Captura de página inteira falhou no navegador; provas foram salvas pelo capturador normal de viewport. Sem inventar prova autenticada da nova RPC na QA remota.

## Backend pendente registrado

Os **31/31 hashes** da candidata foram confrontados com o snapshot selado anterior, sem divergências. Não houve nova alteração de produto no backend neste lote.

- Ruff do escopo oficial `src tests`: aprovado.
- Mypy: aprovado, **178 arquivos**.
- Unitários: **3066 aprovados, 10 pulados**; oito avisos de depreciação HTTP 422.
- Um comando inicial Ruff na raiz inteira encontrou 11 avisos em `produto-site`, fora do alvo oficial do Makefile e dos 31 arquivos. Não foram alterados para ampliar este lote.
- Commit backend **18d503b**, mensagem **Atualiza onboarding operacional na QA**.
- Push concluído em `origin/codex/qa-inicio-serie-diaria`, antes em `646ab18`.

O serviço backend QA continua com o pacote publicado anteriormente; o push registra o código, sem reimplantar o serviço. Git normaliza fins de linha conforme os atributos do repositório; os hashes comparados foram os arquivos da candidata antes do stage.

Nenhuma alteração em produção, importação/ativação de n8n, aplicação de migração remota, publicação/ativação Meta, DNS ou permissões de usuários.
