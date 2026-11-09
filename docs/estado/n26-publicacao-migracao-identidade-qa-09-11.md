# Confirmação de publicação e identidade — QA — 09/11/2026

## 0. Resultado e limite da validação

Victor autorizou backup privado e aplicação exclusivamente QA da migração preparada, com prova de registro, isolamento e retorno à Piligrin. Também apontou que a captura enviada não representava a identidade visual do WebApp.

**Migração aplicada e mecanismo validado na QA.** Registro, replay, conflito e isolamento foram exercitados no banco real em uma subtransação de teste, integralmente revertida. Nenhuma publicação fictícia ficou salva e nenhuma chamada de publicação/ativação foi feita à Meta.

Na sessão real Victor/Piligrin, a peça do Dúú permanece **Peça aprovada pelo gestor**, com **Ainda sem confirmação de publicação**. O aviso anterior de consulta indisponível desapareceu. **A confirmação real de publicação continua dependente do ID do anúncio, data e conferência desta versão da imagem pelo gestor**; esses dados foram solicitados, sem presumir que “Aprovei” significava anúncio publicado.

Não foi exercitado envio positivo pela sessão autenticada do Cauã. A prova positiva remota deste bloco é a RPC transacional e a leitura sob papéis reais do banco; a leitura do cliente foi conferida na UI autenticada da Piligrin.

## Alvo, backup e migração

- Projeto confirmado: **v2g-webapp-qa**, ref `zskpijnqgkqwxksqmzmf`, ativo e saudável. Nenhuma consulta ou alteração de dados de produção.
- Objetos novos estavam ausentes antes da aplicação: tabela, índice de versão e RPC.
- Backup privado: metadados/constraints/índices/políticas/grants das dependências, revisões, gestores, contas selecionadas, dados Piligrin e impressões digitais dos dados existentes. Sem valores de credenciais.
- Pasta privada `C:/Users/victo/.codex/private-backups/v2g/migrations/creative-publication-qa-20261109/`: `antes.json`, `depois-ddl.json`, `depois-ensaio.json` e roteiro do ensaio.
- SHA-256 do backup anterior: `50fcf8a1cacd414dc9eceade2677672291351f4177dbd5e9231c5879fd96bf55`.
- SHA-256 do SQL aplicado: `612f47455cc6b7b82a60325d4bf45b7287bc53f79b0dbca2d27d49a23bb430e3`.
- Aplicação por `apply_migration`, nome `creative_publication_confirmation`, sucesso.
- Histórico **50 → 51**, versão atribuída pelo provedor **20261109223232**. O arquivo local foi renomeado de `20261109210135_...` para `20261109223232_creative_publication_confirmation.sql`, com o mesmo conteúdo/hash, e a referência do teste foi ajustada. Isso mantém o histórico local coerente e evita reaplicação do mesmo DDL por outra versão.

Comparação antes/depois confirmou colunas, constraints, políticas e grants das tabelas existentes preservados, além dos dados Piligrin/revisões/gestores/contas. Única mudança de índice nas dependências: índice de identidade da versão previsto no pacote. Impressões digitais de negócios, revisões, contas e tarefas permaneceram idênticas após o ensaio. Execuções globais **1 → 1**; Piligrin **0**, sem nova execução.

## Provas no banco real

Tabela nova com RLS ativada, RPC **SECURITY INVOKER**. ACL medida separadamente:

| Papel | SELECT | INSERT | UPDATE | DELETE | RPC |
|---|---|---|---|---|---|
| anon | não | não | não | não | não |
| authenticated | sim, limitado por RLS | não | não | não | não |
| service_role | sim | sim | não | não | sim |

Ensaio transacional com evidência explicitamente marcada **ENSAIO QA / ID FICTÍCIO**, usando a identidade da versão aprovada e revertendo todas as escritas ao fim:

- Registro sob o gestor atribuído e conta do próprio negócio: aceito.
- Replay idêntico: `already_registered`.
- Outro anúncio/dado: `conflict`, sem sobrescrita.
- Outro gestor, negócio, hash da peça ou conta: recusados.
- Data futura: recusada.
- Papel authenticated com `auth.uid()` do dono: lê a confirmação no ensaio.
- Mesmo papel com outro dono de cliente QA: zero linhas.
- Papel de cliente não executa a RPC reservada.
- Após rollback: **0 confirmações persistentes**, aprovação original intacta.

Advisors de segurança antes/depois mantiveram o mesmo conjunto legado, sem achado nos objetos novos; health sem avisos. Nenhuma configuração foi alterada para limpar avisos fora deste escopo.

## Identidade visual corrigida

A captura anterior veio de uma bancada solta, fora de `Casco`, e mostrava estilos globais legados. A prévia agora usa o mesmo **Casco editorial V2G** do produto, com sidebar, navegação, marca, temas, tipografia e tokens compartilhados. O símbolo de exemplo foi trocado para o vetor editorial; ele é apenas um arquivo de teste, sem substituir a peça do Dúú.

Na fila real, o bloco da peça e a decisão deixaram de usar cartões de autenticação aninhados. A apresentação usa separadores e hierarquia do produto; aprovação é a ação principal e ajustes/recusa são secundárias. A correção preserva regras e dados.

Desktop e viewport de teste 390×844 conferidos; largura útil/conteúdo **375/375**, sem transbordamento horizontal. Override removido. A captura do cliente QA usa a própria sessão Piligrin; capturas de formulário são identificadas como prévia local, sem fingir envio autenticado pelo Cauã.

## Validação de código e evidências

- **64/64 testes** de publicação, revisão, envio/decisão e tarefas aprovados.
- **28 verificações SQL locais** aprovadas após o alinhamento da versão da migração.
- Build inicialmente encontrou bloqueio transitório de arquivo de dependência pelo Windows; servidor local estava encerrado. Nova execução sem concorrência compilou e passou tipos; resultado final registrado na rodada.
- Evidências: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/publicacao-migracao-qa-09-11/`.

Sem produção, anúncios publicados/ativados, orçamento alterado, DNS, importação/ativação n8n ou mudança de acesso de usuários. O push das correções relacionadas mantém o destino QA autorizado no bloco anterior.
