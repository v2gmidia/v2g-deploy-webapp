# N26 — U5 preparada e revisada, sem aplicação — 08/11/2026

## 0. Resultado e parada

**U5 preparada, revisada, testada localmente e selada; não aplicada.** Victor autorizou avançar para a U5 na mesma mensagem que pediu reorganizar a planilha. A Central avançou a preparação local, seguindo a separação dos blocos anteriores: aplicação/backup de ato continuam separados. O 01/02 montou, 07/08 revisou fontes e correções, 05/06 revisou consumidores, e a Central executou o aceite final independente.

- [Pacote U5](../qa/reconciliacao-schema-07-11/u5/README.md): **30 arquivos selados**, além de `SHA256SUMS.txt`.
- Suíte completa repetida pela Central: **30 grupos aprovados**, `ok=true`, `remoteDDL=false`.
- Ensaio próprio da Central: ciclo SQL completo e negativos adicionais aprovados em banco descartável.
- **127 hashes conferidos**: 97 anteriores U1–U4 e 30 U5; todos iguais aos manifestos.
- Guarda anterior do pacote conferida no QA **somente em leitura**, em **08/11/2026 22:12:18 -03:00** / 09/11/2026 01:12:18 UTC. Passou com a base de **48 pares version/name e sem U5**.

Não houve backup real de aplicação U5, DDL remoto, chamadas remotas de negócio, leitura de linhas Auth/clientes/Vault, produção, alteração de runtime/flags/configuração/serviços, cobrança, emissão fiscal, envio, geração, Meta, commit, push ou deploy por este bloco. **Parada antes de aplicar U5 e antes da U6.** A captura de preparação é metadado de referência, não backup do instante anterior a uma escrita futura.

A [reorganização da planilha](./n26-visao-geral-piloto-08-11.md) foi concluída na mesma rodada e tem registro próprio. A primeira aba apresenta a jornada e os marcos do piloto já escolhido Dúú/Piligrin; U5/U6 são suporte em paralelo, sem exigir nova compra do piloto já vinculado ou virar bloqueio universal da operação assistida.

## 1. Escopo exato e dependências

U5 reúne os grupos 13/16/17/18, as 14 ausências do plano original e seus suportes necessários:

1. Competência fiscal: `fiscal_obligations`, vínculo nullable `fiscal_documents.obligation_id`, FK composta obrigação/pedido e índices. Documento antigo não recebe competência nem estado autorizado por inferência.
2. Evidência manual: `commercial_manual_evidence` e RPCs registrar/revisar. Conferência documental não confirma pagamento, cria pedido, concede propriedade ou libera acesso.
3. CPF/CNPJ: validador e helper de trigger; tipo gerado STORED em pedidos/agenda/evidência; substituições exatas de checks/índices e dos trechos aprovados em quatro funções comerciais reais. Referência repetida continua idempotente; nova referência não funde negócios por contato/documento.
4. Acesso histórico: `historical_contract_access`, eventos e RPCs emitir/aceitar/revogar. A alteração do handler Auth preserva o trigger existente e a criação de perfil; o marcador editável apenas nega claim automático nesse fluxo.

São **quatro tabelas novas, sete funções novas e cinco funções existentes com corpo alterado**; três colunas adicionadas a tabelas existentes, além da coluna gerada da nova tabela documental. As fontes integrais são as quatro migrations enumeradas no README. Não se prepara replay da pasta nem se altera LP para aceitar CPF.

O snapshot de `baseline-u4.json` foi comparado pela Central com o PÓS privado U4 aceito: os objetos são integralmente iguais e `sourceSha256` corresponde ao arquivo privado de origem `4e4f3cdf596b417ea637a85478a91f30922009d06b5ddfd294411e77bfd03dab`. O derivado contém apenas `sourceSha256` e `snapshot`; seu próprio hash é diferente, como esperado.

O montador fez uma consulta principal de catálogo QA e uma complementação estrita de `commercial_events`, dependência de duas RPCs. As queries e resultados estão preservados na pasta U5. Estruturas de Auth, fiscal, agenda, carteira, eventos, unidades dos pedidos e definições antigas foram medidas, sem linhas de aplicação. A fixture reproduz essas dependências; tabelas backend não usadas pelos corpos continuam mínimas, sem congelar o stub como schema QA completo.

## 2. Proteções e revisão

Guardas comparam estado anterior/final inteiro, incluindo corpos, assinatura/defaults, owner, SECURITY DEFINER/INVOKER, search_path, ACL, grants por coluna, constraints, índices, attgenerated/expressão, comentários e vínculo/hash do handler Auth. A frase do handler e o marcador `cpf_cnpj_v0` deixaram de servir como aceite isolado. O histórico compara todos os 48 pares anteriores, não só a contagem.

ACL fiscal nova explícita: comprador authenticated SELECT sob RLS e serviço SELECT+INSERT, sem UPDATE/DELETE/TRUNCATE/MAINTAIN/grant option. Evidência mantém INSERT/UPDATE apenas nas colunas previstas e sem DELETE/reidentificação. As RPCs documentais são invoker de serviço; emissão/revogação históricas são definer serviço-only com papel/carteira repetidos no banco. Aceite histórico é definer concedido a authenticated com identidade confirmada e ID explícito; não permite enumerar convites. A sequência de auditoria é fechada à escrita direta de cliente/serviço.

O 07/08 identificou a lacuna de defaults; a Central isolou a perda de precisão bigint. Ambas foram corrigidas pelo montador e reconferidas na revisão:

- `protectedDetails` existia no modelo mas não na guarda comum. Agora DO e comparador conferem também os defaults dos argumentos protegidos. Alterar só o default antigo, sem mudar corpo/identity/ACL, é recusado antes do DDL.
- A sequência emitia bigint numérico em JSON. A primeira versão final do SQL foi recusada corretamente: o modelo JavaScript arredondava `9223372036854775807` para `9223372036854776000`. Atributos start/increment/min/max/cache passaram a texto, preservando cada dígito. O SQL real distingue máximos separados por uma unidade mesmo quando Number do JS seria igual.

A Central isolou o segundo problema em motor descartável; consultas instrumentadas de diagnóstico nunca foram usadas como prova de aceite ou enviadas ao QA. Não se afrouxou a guarda para conseguir verde. O código de diagnóstico provisório foi removido; permanece o ensaio independente com os negativos reais.

A revisão final 07/08 confirmou essas duas correções nos geradores/comparador e nos SQLs gerados, sem outro impeditivo concreto no recorte examinado. Não houve auditoria ou correção de frentes alheias.

## 3. Validação da Central

Suíte completa final:

```text
node docs/qa/reconciliacao-schema-07-11/u5/executar-local.mjs
```

**Exit 0, 30 grupos PASS, zero DDL remoto.** `resultado-ensaio.json` é determinístico e registra os grupos e hashes dos consumidores conferidos antes/depois. Inclui positivos/negativos fiscais, documento legado, CPF/CNPJ, isolamento, carteira, replay, emissão/aceite/revogação, Auth, RLS/ACL, atomicidade, adulteração de histórico/defaults/índices/geração e retorno com uso/dependências posteriores. As 97 bases anteriores permaneceram íntegras.

O [ensaio independente](../qa/reconciliacao-schema-07-11/u5-central-08-11/ensaio-independente.mjs) da Central executou PRE/aplicar/verificar/retornar completos: histórico fictício 48 → 49 → 50, 48 pares antigos preservados e metadados restaurados. Demonstrou default antigo divergente recusado no PRE e DO, bigint exato/negativo de uma unidade, privilégios efetivos fiscais/RPCs e view posterior impedindo retorno sem perda do dependente. O script precisou de ROLLBACK após uma guarda negativa em BEGIN READ ONLY, ajuste da própria bancada; isso não alterou o pacote. Uma tentativa inicial pelo ambiente Node REPL não inicializou o motor e não conta como teste SQL; as provas válidas foram executadas pelo Node CLI local.

A Central executou ainda, separadamente, três conferidores SQL existentes: **22 testes PASS**. O 05/06 reportou **37 testes de consumidores PASS**, com relatório [próprio](./n26-u5-consumidores-05-06-08-11.md). Esses números são complementares, **não somados aos 30 grupos do pacote**. Não se rodou suíte global, build/.next, Auth/HTTP real ou concorrência multissessão.

A guarda `u5-conferir-pre.sql` foi executada uma vez pela Central no QA `zskpijnqgkqwxksqmzmf`, em transação somente leitura, sem locks de aplicação, RPC ou dado real. Retornou sem erro; o hash final confere com o arquivo enviado. Evidência em [pre-qa-somente-leitura.json](../qa/reconciliacao-schema-07-11/u5-central-08-11/pre-qa-somente-leitura.json). Isso comprova compatibilidade da guarda com o catálogo medido naquele instante, **não aplicação U5 nem homologação funcional**. O [resultado Central](../qa/reconciliacao-schema-07-11/u5-central-08-11/resultado-central.json) consolida a distinção.

## 4. Selos finais

- `u5-aplicar.sql`: `9871d53564356e1f3a0613e1f204ae0539a439810af69fc00ebc91352ca0ac83`.
- `u5-retornar.sql`: `8ade1e953ad3f58822b615e30cf95b1087fad058d46e81b11c1a29fea01c893d`.
- `u5-conferir-pre.sql`: `fc63cfaf2b48723f23a416621d59eab316a35a995033f64eda26e1ec07bea380`.
- `SHA256SUMS.txt`: `0a6ec90565b695c1e9cf9b080da23ff5950f898939111244138db291e940267b`.

A Central conferiu todos os 127 arquivos selados após o fechamento. Os pacotes e checkpoints históricos não foram reescritos. Não regenerar U5 durante revisão ou aplicação; qualquer mudança exige novo ensaio/revisão e novos hashes. O ato futuro está em `u5/ATO.md`, não executado.

O controle existente atualizou somente `Visão geral!A23` e `Novembro — execução!H2,J2,L2` com o fechamento da U5. Reportou releitura dos quatro textos, notas/formato preservados e vizinhos intactos: preparação local concluída, U5 não aplicada e U6 pendente.

## 5. Limites e próximo ato

Checksum não comprova identidade/cadastro/titularidade; competência não emite nota. Evidência manual não é autorização financeira. O acesso histórico não depende apenas de e-mail/documento: exige concessão explícita, aceite e propriedade do negócio. A autorização no servidor e na RPC tem limites distintos documentados no README.

Permanece o defeito pré-existente P2 da página histórica que ignora `error` de sessão: o teste sintético usuário+erro chegou ao resumo administrativo; a action de aceite recusa erro e nenhuma concessão foi demonstrada por essa prova. Correção/ensaio da UI ficam em bloco próprio antes de homologar ou ativar esse percurso. Não foi introduzida nem corrigida regra de runtime nesta preparação.

A flag histórica controla a aplicação; não revoga por si só EXECUTE da RPC autenticada depois de futura aplicação. Valores remotos de flags não foram medidos ou alterados. Não se certifica OFF universal no SQL, HTTP/JWT real, concorrência, fluxo produtivo ou implantação.

Retorno exige autorização própria e estado atual compatível: tabelas novas vazias, obligation_id sem uso, ausência de CPF e duplicatas incompatíveis, sem DDL posterior dependente. Não usa CASCADE nem apaga dados para satisfazer a guarda. Restaura definições, não dados, vínculos de propriedade ou efeitos externos. Uma concessão utilizada, mesmo revogada, mantém auditoria e impede esse retorno.

**Próximo ato técnico possível: backup privado atual e aplicação somente U5 no QA, sob autorização nominal própria. Não executado neste bloco. Parada antes da U6.** Os marcos do piloto na planilha continuam orientados pelos bloqueios operacionais reais, sem confundir esta preparação com produto completo funcionando.
