# RevOps — desenvolvimento local da noite de 19/10/2026

## 0. Limites deste trabalho

- Somente arquivos locais; nenhuma migration aplicada.
- Nenhum dado real, segredo, integração externa, mensagem, commit ou deploy.
- A migration da V0 e o acesso RevOps continuam sem verificação em produção.
- Taxonomia, SLAs e marcos ainda não aprovados permanecem como proposta ou
  pendência, sem virar regra do produto.

## 1. Modelo operacional

Foi criado `docs/revops-modelo-operacional.md` para aplicar à V2G os princípios
da aula fornecida por Victor: etapas com objetivo executável, gatilhos baseados
em evidência da contraparte, taxonomia comum, SLAs entre áreas e ritual de
revisão orientado por dados.

O documento separa decisão V2G, princípio da aula, proposta e pendência. Não
adota a alegação de redução de 90% de fricção, a venda fora do ICP, segmentos
A/B/C/D, MQL/SAL/SQL, cliente oficial ou cliente ativado como fatos definidos.

Verificação após o documento: `pnpm conferir:revops` passou **8/8**.

## 2. Alertas de qualidade por oportunidade

A consulta agora inclui `owner_profile_id`, coluna que já existia na migration,
e a tela usa um contrato puro para reunir alertas do evento e do handoff. Sem
criar novos estados ou inferir desfechos, ela pode sinalizar:

- oportunidade sem responsável;
- oportunidade sem próximo passo;
- próximo passo sem data;
- pedido sem negócio WebApp vinculado;
- inferência sem revisão humana;
- além dos alertas de evento já existentes.

As fixtures continuam fictícias. O teste novo prova que essas lacunas não são
convertidas em venda.

Verificação: `pnpm conferir:revops` passou **9/9** e `pnpm typecheck` passou.

## 3. Natureza das etapas sem reescrever o banco

O contrato local agora classifica os valores já aceitos pela migration como
`marco`, `trabalho`, `resultado` ou `espera`. A tela torna a natureza visível no
selo, por exemplo “Resultado · Venda verificada” e “Espera · Adiada”.

Isso não muda os valores persistidos nem declara a taxonomia aprovada. O objetivo
é impedir que `lost`, `won_verified` e `postponed` sejam tratados como três
passos equivalentes de avanço do vendedor. `purchase_reported` também fica
explicitamente como marco, não como venda confirmada.

Verificação: `pnpm conferir:revops` passou **10/10** e `pnpm typecheck` passou.

## 4. Evidência dos vínculos

A consulta e o contrato da tela passaram a carregar `linked_at`, `linked_by` e
`link_evidence`, campos que já existiam na migration. Quando a prova está
completa, a tela exibe data e descrição da evidência; o identificador interno do
autor continua preservado no modelo sem ser exposto como texto cru na interface.

Se um vínculo aparecer sem a prova completa esperada pela constraint, a tela
gera “Vínculo sem evidência completa”. Ela não trata a simples presença de
`lead_lp_id`, `commercial_order_id` ou `business_id` como conciliação suficiente.

As fixtures usam somente UUIDs, empresas e descrições fictícias.

Verificação: `pnpm conferir:revops` passou **11/11** e `pnpm typecheck` passou.

## 5. Resumo operacional sem conversão inventada

As contagens da tela agora vêm de uma função pura e testável: oportunidades,
oportunidades com responsável, oportunidades com próximo passo, reuniões
realizadas, compras relatadas e vendas verificadas. Interações compartilhadas
entre duas oportunidades são deduplicadas pelo ID antes da contagem; a reunião
única do caso fictício não aparece duas vezes.

A tela declara por que não mostra conversão: elegibilidade, janela e cobertura
dos dados ainda não estão definidas. Conversas geradas por anúncios dos clientes
continuam fora dessas métricas.

Verificação: `pnpm conferir:revops` passou **12/12** e `pnpm typecheck` passou.
A grade responsiva foi ajustada para seis contagens no desktop e duas colunas no
celular; a aparência ainda precisa de nova inspeção visual no navegador local.

## 6. Revisão humana das inferências

A linha do tempo passou a derivar o rótulo da combinação entre tipo de evidência
e `human_review_status`. Ela distingue inferência pendente, confirmada, rejeitada
e sem estado de revisão. Fato da fonte e relato humano continuam com seus
rótulos próprios.

Uma inferência `not_applicable` ou sem estado também gera alerta; o contrato não
silencia um registro inválido como se tivesse sido revisado. Nenhum modelo foi
chamado e nenhuma revisão foi criada automaticamente.

Verificação: `pnpm conferir:revops` passou **13/13** e `pnpm typecheck` passou.

## 7. Autor da fonte na linha do tempo

A linha do tempo agora mostra canal, sistema, referência externa e autor da
fonte. Quando o autor não existe, escreve “autor não informado”; não tenta
deduzir pessoa por nome, telefone, e-mail ou conteúdo.

Durante a revisão apareceu uma lacuna diferente: `human_review_status` não tem
`reviewed_by` nem `reviewed_at` na migration. Por isso os rótulos dizem
“marcada como confirmada/rejeitada”, sem afirmar quem revisou ou quando.

Verificação: `pnpm conferir:revops` passou **14/14** e `pnpm typecheck` passou.

## 8. Auditabilidade da revisão humana

A migration ainda não aplicada agora prepara `reviewed_by` e `reviewed_at` nas
interações. A constraint exige ambos quando uma inferência for confirmada ou
rejeitada e exige ambos vazios enquanto a revisão estiver pendente ou não for
aplicável. A consulta preserva esses campos no contrato local sem expor o UUID
do revisor na tela.

O alerta “Revisão humana sem autoria e data” impede que um estado concluído sem
trilha mínima de auditoria seja tratado silenciosamente como revisão íntegra.
Nenhuma action de revisão foi criada e nenhuma migration foi aplicada.

Verificação: `pnpm conferir:revops` passou **15/15** e `pnpm typecheck` passou.

## 9. Data da revisão na linha do tempo

Quando autoria e data estão presentes, a linha do tempo mostra a data da revisão
e informa que a autoria foi preservada no registro interno. O UUID não é
publicado. Se a trilha estiver incompleta, a tela mantém o alerta de qualidade
em vez de exibir uma confirmação parcial.

A identidade legível do revisor continua pendente de decisão sobre o contrato
de perfis; nenhum nome é inferido a partir do UUID.

Verificação: `pnpm conferir:revops` passou **16/16** e `pnpm typecheck` passou.

## 10. Inspeção visual da bancada fictícia

A rota dev-only `/exemplo/revops` respondeu 200 com o servidor local e foi
inspecionada no navegador em desktop e em viewport de 390 × 844. O resumo de
seis contagens, o aviso de métrica, as oportunidades distintas, os alertas e a
linha do tempo ficaram legíveis sem sinal visual de sobreposição ou rolagem
horizontal. A bancada continuou identificada como fictícia e sem gravação.

O navegador acessou por `127.0.0.1`, então o Next registrou um aviso de origem
cruzada apenas para o recurso de atualização automática do modo dev; a página
renderizou normalmente. Nenhuma configuração foi alterada para esconder o
aviso. O servidor local foi encerrado após a inspeção.

Verificação desta rodada: resposta HTTP 200 e inspeção visual em desktop e
viewport móvel. A rota real não foi aberta, pois depende da migration ainda não
aplicada.

## 11. Estados vazio e indisponível na bancada

A bancada dev-only agora aceita dois estados explícitos: `?estado=vazio`
renderiza a lista honestamente vazia e `?estado=falha` renderiza consulta
indisponível, contagens sem valor e registro bloqueado. Ambos usam lista vazia,
não consultam banco e mantêm `somenteLeitura`, portanto não montam actions de
escrita.

Verificação: `pnpm conferir:revops` passou **16/16**, `pnpm typecheck` passou e
os dois URLs responderam HTTP 200 com o texto esperado. O HTML de ambos não
continha o formulário real “Registrar interessado”. O servidor local foi
encerrado depois da conferência.

## 12. Build e portão da bancada de desenvolvimento

Sem servidor dev ativo, `pnpm build` concluiu com sucesso, incluindo a checagem
TypeScript e a geração das 43 páginas estáticas previstas pelo projeto. Em
seguida, `pnpm start` confirmou HTTP 404 para `/exemplo/revops`, como exige o
portão de produção.

A sentinela `SENTINELA_FIXTURE_REVOPS_DEV_ONLY` teve zero ocorrências em
`.next/server`, o pacote de produção. A pasta compartilhada `.next/dev` ainda
mantém artefatos do ensaio anterior em modo dev; isso é resíduo local esperado,
não conteúdo do bundle servido por `next start`. O servidor de produção local
foi encerrado após a verificação.

Este verde valida compilação e isolamento da bancada, não aplicação da
migration, permissões reais, dados reais ou comportamento em produção.

## 13. Encerramento para revisão

O diff completo foi revisado na última rodada. A suíte direcionada passou
novamente **16/16**, `pnpm typecheck` passou e `git diff --check` não encontrou
erro de whitespace; mostrou apenas os avisos já conhecidos de conversão futura
de LF para CRLF no Windows. O build de produção desta mesma manhã também havia
passado.

Ficaram deliberadamente não verificados: migration aplicada, RLS e grants no
Supabase real, acesso autenticado de Victor e Gabriel, leitura/escrita com dados
reais, vínculos reais com LP/pedido/negócio e ponte com Finance. Nada disso pode
ser apresentado como verde.

Próximo bloco, dependente da revisão de Victor: aprovar ou corrigir taxonomia,
marcos e migration; depois definir o mecanismo de concessão assinada de acesso
RevOps a pessoas específicas. Só uma autorização posterior pode aplicar banco,
configurar acessos ou começar contratos pós-pagamento.
