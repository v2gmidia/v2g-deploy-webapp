# Início — trabalho noturno autorizado — 09/11/2026

## 0. Entrega local concluída — publicação QA pendente

> RESOLVIDO em 09/11/2026: Victor fez commit/push do WebApp QA; a Central publicou o backend somente no serviço QA por pacote fechado autorizado. Início real Dúú com números e gráfico; 7/7 gastos diários conferidos com a Meta. Ver [publicação e prova posterior](./n26-inicio-qa-publicacao-conferencia-09-11.md). Depois de nova autorização, backend registrado no Git em **646ab18**; Cauã confirmou Ver números, peça e teto mensal. Peça recebida na QA para revisão; decisão/retorno ainda pendentes. Ver [registro e rodada da peça](./n26-duu-piloto-registro-git-09-11.md). O restante da §0 preserva o plano anterior ao ato.

**Números, gráfico e mensagens do Início implementados, revisados e testados localmente. Pacotes prontos para revisão e commit/push manuais destinados à QA. Nenhuma publicação foi realizada.**

| Passo autorizado | Resultado desta rodada | Próxima prova |
|---|---|---|
| 1. Números do Início | Fonte autenticada comum a Anúncios; conta/período/cobertura preservados | Comparar Início e Anúncios publicados no mesmo recorte |
| 2. Gráfico diário | Backend entrega pontos reais da consulta; UI mostra barras, zeros medidos e lacunas | Publicar backend somente no serviço QA e conferir dias Dúú contra Meta |
| 3. Mensagens | Cadastro separado de campanhas e resultados; falha não vira preparação | Repetir na sessão nominal após publicação |
| 4. Testes e QA | Suíte WebApp, build e suíte backend aprovados localmente; desktop/mobile conferidos | Commit/push manual e ato de publicação do backend exclusivamente QA |
| 5. Piloto Cauã | Frente pausada com dependência concreta | Peça original aprovada + aceite na sessão própria do Cauã |

Prévia local fictícia: `http://127.0.0.1:3001/exemplo/inicio-meta`. **Os valores da bancada são inventados para teste e não são resultados do Dúú.** A nova versão ainda não está no alias QA. Nenhum total foi repartido para fabricar dias.

### Pacotes para Victor

- **WebApp:** pasta atual `C:/Users/victo/v2g-deploy/webapp`, branch **QA**, base `fe5384de889dd222cfcee0d69677a6685b076caa`. Alterações anteriores/documentos preservados. Commit e push somente nessa branch, pelo fluxo manual habitual.
- **Backend:** pasta separada `C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g-qa-inicio`, branch **codex/qa-inicio-serie-diaria**, base congelada **fae0877**. Inclui somente série, contrato, testes e correção da ponte legada. Ver `docs/estado/n26-inicio-serie-diaria-local-09-11.md` nessa pasta. **Não commitar/pushar a main do backend por consequência.**
- **Publicação backend:** serviço **ia/backend-qa**, SHA futuro do candidato revisado. Esse é um serviço, não uma branch. O painel não foi alterado para seguir o novo branch. Publicação/configuração nominal somente QA ainda precisa ser conduzida após o commit manual; não foi executada neste bloco.
- **Ordem prática:** revisar ambos os pacotes → commit/push manuais dos candidatos destinados à QA → publicar o backend candidato só no serviço QA → conferir o alias QA do WebApp → comparar o mesmo recorte/conta nos dois consumidores e na Meta → completar peça/revisão com Cauã. Sem ato em produção.

Com backend antigo, o Início novo conserva totais e informa que a distribuição diária não está disponível; o gráfico real só pode aparecer após o backend QA fornecer a série. Não anunciar que push apenas do WebApp conclui a homologação do gráfico.

Victor autorizou implementar os cinco passos do Início e piloto, distribuir trabalho, testar e deixar o pacote para commit/push manual somente QA. Solicitou avanço em blocos de 30 minutos e pausa de frentes repetitivas. O agente não fará commit, push ou deploy; conferência da nova versão publicada depende da ação manual de Victor. Produção está fora do bloco.

Início da coordenação: **09/11/2026 00:53 BRT**. As verificações abaixo encerram a implementação local; os atos manuais e humanos restantes ficam nomeados, sem repetição automática.

**Primeiro marco de 30 minutos, 01:24 BRT:** implementação, revisão e verificações locais concluídas; sem bloqueante de código restante no snapshot. As frentes de publicação e peça ficam paradas nos atos humanos descritos na §0, sem novos ciclos de testes por passagem de tempo.

| Frente | Responsável | Critério de saída |
|---|---|---|
| Backend / valores por dia | Chat 07/08 | Série derivada da mesma consulta Meta, sem nova escrita ou dado inventado; contrato e testes |
| WebApp / números, gráfico e mensagens | Chat 05/06 | Fonte autenticada comum a Anúncios, período/conta corretos, cadastro separado de campanha |
| Revisão independente | Agente revisao_inicio | Casos adversariais e diff estável revisados |
| Integração, suíte, build, inspeção visual e entrega | Central | Evidências e pacote de commit delimitado, sem publicação |
| Peça e aceite gestor | Cauã | Arquivo/post original aprovado e sessão própria para concluir fluxo |

## Limites e estado de entrada

- WebApp: branch **QA**, base `fe5384de889dd222cfcee0d69677a6685b076caa`. Cinco documentos/índice locais de registros anteriores preservados; nenhuma mudança de código no início da rodada.
- Backend: checkout principal **main**, base `70c1b4e74ecff5003d40dc5312a483152472a388`. O serviço **ia/backend-qa** é um nome Easypanel, não uma branch Git. Fonte QA previamente conferida em `fae0877bdc44fc2ea89dc855f6473b6167cd6fe0`; preparar o delta diário isolado, sem publicar o HEAD posterior por consequência.
- Porta local 3000 pertence ao contêiner **wa-akg-app**, não a um dev-server Next; deve permanecer intacta. A prova visual do WebApp usará outra porta.
- A imagem de etapas enviada pelo usuário é histórica: U5/U6 já foram aplicadas e verificadas na QA nos registros anteriores. Não reexecutar essas unidades.

## Critérios obrigatórios do bloco

1. Totais do Início vêm do mesmo inventário Meta autenticado de Anúncios. Somar somente entidades do nível campanha; nunca campanha, conjunto e anúncio entre si.
2. Série diária real, ordenada e validada; ausência não é zero. Não ligar pontos separados por dias desconhecidos como se houvesse medição contínua.
3. Resposta antiga sem série conserva os totais válidos e informa gráfico indisponível. Valores diários não podem ser inferidos pela divisão do total do período.
4. Negócio, conta, período, moeda, fuso e cobertura preservados. Recortes acima do limite de 31 dias precisam de aviso explícito, sem simular medição de janela longa.
5. Campanha existente e pendência de cadastro coexistem. Erro de consulta não demonstra campanha inexistente ou em preparação.
6. Dados de vendas, conversas WhatsApp e retorno não medidos permanecem desconhecidos; não há concessão para ativar, pausar ou mudar verba de anúncios.
7. Testes locais e bancada fictícia não substituem a conferência publicada na QA nem o aceite na sessão própria do gestor.

## Frente externa parada com causa concreta

Na consulta ao grupo correto **03 | Operação — Gestores**, a mensagem de **00:02** continuava entregue, sem resposta posterior visível. Nenhuma cobrança repetida foi enviada. A peça original aprovada e o aceite da sessão própria do Cauã seguem pendentes. Não haverá upload de captura da prévia como se fosse o original nem decisão pela identidade dele.

## Fechamento

### Verificações concluídas

- **WebApp:** `pnpm conferir` completo exit0; `pnpm build` exit0. Novo comando `pnpm conferir:inicio-meta` integrado à suíte: **40 testes PASS**, incluindo as guardas de imports da bancada. Regressões de Anúncios/retorno e fronteira cliente: **112 PASS**; conferência adicional de Início/carregamento/recepção: **55 PASS**. Grupos se sobrepõem; não somar como testes únicos.
- **Backend no candidato isolado:** Ruff PASS; mypy PASS, **176 fontes**; suíte unitária final **3025 PASS, 9 SKIP, zero falhas/erros**. Skips: três agentes sem prompt por serem determinísticos e seis testes dependentes de imagens pagas ausentes do checkout. Série diária focada: **62 PASS**. Ponte legada ajustada: **16 cenários internos PASS**.
- **Interoperabilidade:** JSON fictício completo produzido pelo serviço backend real com fonte de teste passou no parser/adaptador TS real, incluindo duas campanhas, campos null, zeros, lacunas e sem soma dos filhos.
- **Revisão independente:** corrigidos e reproduzidos os casos de fallback de outra conta, divergência entre pontos e total com lacunas, overflow de uma métrica apagando gasto válido e calendário com valores anteriores. Nenhum bloqueante restante no snapshot revisado.
- **Visual local:** computador e celular 390px, sem rolagem horizontal da página (conteúdo375 ≤ viewport390); rolagem fica no gráfico/tabela. Medição+cadastro, backend sem série, lacunas/null/zero, retenção após falha da mesma conta e limpeza antes de confirmar conta conferidos. Tema visual medido: escuro/Do aparelho; não se declara homologação completa de todos os temas.
- **Portão da bancada:** sentinela `V2G_INICIO_META_FICTICIO_0911` não encontrada em `.next/server`; `/exemplo/inicio-meta` em `next start` retornou **404**. Depois do ensaio, servidor do build encerrado e prévia dev reaberta em3001. O serviço Docker da3000 permaneceu intacto.
- **Preservação:** backend principal/main voltou ao estado de entrada, sem as alterações desta rodada; pacote permanece na worktree QA. WebApp continua na QA. Nenhum arquivo de migration, banco remoto ou credencial foi alterado. Commit/push/deploy não foram executados.

### Arquivos principais

WebApp: `app/(protected)/inicio/{page,TelaDoInicio,ResumoMetaDoInicio}.tsx`, CSS Module do resumo; `lib/inicio/{resumo-meta,serie-meta,periodo}.ts`; extensão compatível de `lib/anuncios/contrato-meta.ts`; bancada dev-only; conferidores/fixtures de recepção; `package.json` integra a regressão nova. O restante de Anúncios continua funcionalmente aprovado; não houve redesign dessa tela.

Backend QA: `src/meta/leitura_anuncios.py`, `docs/contratos/e28-meta-ads-read-v1.md`, `tests/unit/test_anuncios_meta_sem_execucao.py`, `scripts/verificar_conexao_leitura_webapp.mjs`, `tests/unit/test_conexao_leitura_webapp.py` e checkpoint próprio. A ponte antiga referia uma UI de gestor já substituída; foi adaptada para a porta e parser legados reais, sem fingir prova de SSR/flag.

### Evidências locais

Pasta `C:/Users/victo/.codex/visualizations/2026/11/06/01a1b160-1ffe-7760-89c9-a03b8fec171c/inicio-noturno-09-11/`: logs `webapp-conferir-final.log`, `webapp-build.log`, `webapp-inicio-comando.log`, `webapp-inicio-dirigidos.log`, `webapp-regressao-anuncios.log`; `backend-unit-final.xml`; `n26-inicio-interop-resultado.json`; capturas `inicio-meta-grafico-ficticio.png`, `inicio-meta-mobile-resumo-ficticio.png`, `inicio-meta-mobile-grafico-ficticio.png`; DOM da retenção. Captura full-page apresentou timeout e não foi usada como prova; capturas de viewport e leitura DOM confirmaram os estados.

### Parada com destino claro

Implementação local encerrada. A publicação QA depende do commit/push manual de Victor e do ato exclusivo no serviço QA do backend. Piloto da peça depende da resposta/material e sessão de Cauã. Essas frentes ficam paradas; não existe monitoramento em loop, cron ou publicação automática criada para esta rodada. A imagem histórica U1–U4 não foi usada para repetir U5/U6 ou autorizar produção.

### Planilha e integridade da entrega

Mesma planilha operacional atualizada: **Visão geral!F11, A12, C12:G12, A23** e **Novembro — execução!H3:L3, L5**. Releitura do controle: **14/14 textos conferidos**, histórico/formato preservados e **32 vizinhas intactas**. Início ficou **pronto local para QA, não publicado**; Anúncios cliente real segue aprovado e Cauã fica pendente com causa concreta.

Manifesto com caminhos e SHA-256 dos candidatos em `inicio-noturno-09-11/pacotes-qa-manifesto.json`, na pasta de evidências acima: **24 arquivos WebApp** (incluindo registros anteriores preservados) e **6 arquivos backend QA**. Não contém `.env`, credenciais, dependências ou imagem privada de cliente. O Git não foi preparado, commitado ou enviado pela Central.
