# Dúú / Piligrin — cadastro operacional validado na QA — 09/11/2026

## 0. Resultado e pendências

**Pedido atendido:** publicação QA conferida, região estadual salva pelo aplicativo e cadastro operacional 9/9 validado pelo backend autenticado. Aprovação de Cauã e retorno na biblioteca do cliente conferidos. Produção não foi alterada.

Permanecem separados do cadastro operacional:

- Materiais/visual da marca ainda precisam de confirmação; Início mostra essa pendência corretamente, sem pedir novamente as nove respostas.
- A fila do gestor oferece link para abrir imagem, sem miniatura embutida. Isso explica o relato de Cauã de que viu só o nome; não é prova de perda do arquivo.
- Aprovar a peça não confirma publicação na Meta. A peça está sem vínculo a anúncio no aplicativo. A proposta de Victor na conversa — aprovação significar que o gestor já subiu — ainda exige um registro explícito de publicação, identificação do anúncio e conferência; não foi implementada como simples troca de rótulo.
- Backend publicado anteriormente por pacote: os **31 arquivos continuam sem commit** em `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, branch `codex/qa-inicio-serie-diaria`. Nenhum commit/push executado pelo agente.

## Publicação WebApp

- Branch local e remota: `QA`, commit **6a2eae7d7fb2d5c8d32e3d3334264671a962351a**.
- Projeto isolado: **v2g-webapp-qa**.
- Deployment: **dpl_6ujLyf5Dmez34H51jR843LUyBWkV**, estado **READY**.
- Endereço imutável: `https://v2g-webapp-li4zpztdz-v2-g.vercel.app`.
- `https://v2g-webapp-qa.vercel.app` foi reconferido apontando para esse deployment após o build. No início da rodada o build ainda estava em andamento e o alias servia a versão anterior; nenhuma ação de publicação adicional foi executada.

## Validação autenticada pelo aplicativo

Sessão **Victor**, negócio **Piligrin** (`9cb85308-02cc-4ce7-bacf-15be77f9ba5e`), anunciante **Dúú Gomes**. Backup privado do estado anterior capturado antes das gravações.

1. Retomadas as seis respostas anteriores.
2. Na pergunta 7, botão **Escrever do meu jeito** abriu o campo e foi salvo **Todo o estado do Rio de Janeiro**, origem `texto`.
3. Pergunta 8: **WhatsApp**, coerente com o objetivo confirmado da peça e o percurso existente.
4. Pergunta 9: **Já existe uma campanha para acompanhar**, sem criar campanha.
5. Interface confirmou **9 de 9 respostas**; recarregamento preservou o encerramento e as respostas.

Retorno autenticado registrado em `onboarding.respostas._cadastro_operacional`, às **17:55:41 BRT**:

```json
{
  "estado": "conferido_sem_execucao",
  "versao_contrato": "cadastro_operacional.v2",
  "id_execucao": null,
  "pipeline_disparado": false,
  "persistido_no_backend": false
}
```

O WebApp persistiu a conferência no JSON do negócio; o backend validou sem persistir ou iniciar execução. Diagnóstico econômico ficou explicitamente indisponível, com ROAS/CAC/CPL/meta/lucro estimados nulos. Pendências por ação não viraram autorização para preparar/publicar campanha.

## Preservação antes/depois

Comparação direta em QA: **15 campos selecionados preservados**, incluindo identidade da Piligrin, localização canônica nula, teto **3000**, ticket/custo/lucro nulos, procedência do teto, `cadastro_estado` nulo e contagem de execuções **0 → 0**. As **8 entradas anteriores** de respostas/contrato/oferta foram preservadas integralmente.

Preço de referência permanece **69–70 BRL/fardo, aproximado**, sem conversão em ticket médio. O estado inteiro fica no texto do anunciante; não se atribuiu município, CEP ou raio à agência.

## Início após cadastro

Sessão Piligrin, conta `act_1165478988908157`, período **01–07/11/2026**, coleta exibida **09/11/2026 17:56:39 BRT**:

- **R$ 281,80**, **26.129 impressões**, **466 cliques**; cobertura parcial **1/10 campanhas**.
- Gráfico e tabela com os sete dias disponíveis.
- Gastos por dia: **45,14; 29,37; 56,56; 66,87; 28,76; 29,18; 25,92**.
- Teto **R$ 3.000,00** mantido.
- Pendência atual: **Ainda falta conferir o visual da marca**.

As leituras continuam iguais à referência já validada; esta rodada não repetiu a comparação independente na BM.

## Cauã / revisão da peça

Lida a conversa **🎯 03 | Operação — Gestores**, na sessão existente do WhatsApp, sem enviar mensagem. As últimas respostas disponíveis correspondem aos anexos de Victor:

- **17:39:** Cauã escreveu **Aprovei**.
- **17:40:** respondeu **So o nome** à pergunta sobre a imagem.
- **17:41:** respondeu **Deve ser** à hipótese de aprovar depois de subir para o ar; isso não identifica anúncio nem confirma publicação dessa versão do arquivo.

Consulta de QA confirmou a peça **0b22f424-f70b-457f-845e-c37bb50ddb5f**, arquivo **WhatsApp Image 2026-11-09 at 10.23.29.jpeg**, status **approved_for_manual_publish**, decisão às **17:39:18 BRT**. Autor da decisão coincide exatamente com o gestor atribuído; tarefa de revisão **done**, concluída pelo mesmo perfil às **17:39:19 BRT**.

Na biblioteca da sessão Piligrin: miniatura da peça presente, **Biblioteca 1 / Em revisão 0**, rótulo **Aprovado pelo gestor; publicação manual pendente**, **Sem anúncio**, associação ainda ausente. Assim, a devolução da decisão ao cliente está comprovada; publicação e medição desta peça específica ainda não.

Fato no código: `app/(protected)/gestor/criativos/page.tsx` produz um link assinado **Abrir imagem**; não renderiza miniatura na fila. `lib/criativos/revisao.ts` define o rótulo de aprovação e `gestor/criativos/actions.ts` registra decisão separada de publicação. Nenhuma dessas regras foi alterada neste bloco de validação.

## Evidências e escopo

Pasta de evidências: `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/onboarding-validado-qa-09-11/` — deployment selecionado, captura 9/9, retorno da peça ao cliente e Início/tabela diária. Backups completos antes/depois estão na pasta privada do pacote QA.

Não houve alteração de código de produto, migrations, Meta, orçamento de campanha, n8n, DNS, permissões ou produção. Apenas preenchimento autorizado no aplicativo QA, leituras e registros locais. A prova principal deste bloco é o percurso real com persistência/retomada e retorno autenticado; não foi repetida a suíte local já aprovada na preparação.
