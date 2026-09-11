# Prompts prontos para Claude Code

Substitua apenas os trechos entre colchetes quando necessário. Envie um prompt por vez e espere a etapa terminar.

## Prompt 1 — auditoria e plano, sem editar o produto

```text
Você está no repositório real do WebApp V2G. Antes de qualquer alteração, leia as instruções locais do repositório, incluindo CLAUDE.md, AGENTS.md, README, package.json e arquivos equivalentes que existirem.

Depois, leia integralmente:
- docs/v2g-wireframes/PRODUCT.md
- docs/v2g-wireframes/DESIGN.md
- docs/v2g-wireframes/mapa-produto-v2g-v1.md
- docs/v2g-wireframes/INDICE-WIREFRAMES-V2G.md

O mapa é um destino de produto, não um backlog. A implementação imediata deve seguir o fluxo essencial v0 descrito no índice. Os PNGs são referências visuais, não especificações literais de dados nem autorização para inventar funcionalidades.

Faça uma auditoria do código atual e mapeie:
1. framework, arquitetura, rotas e estrutura de layout;
2. componentes e tokens que podem ser reutilizados;
3. implementação atual de temas claro e escuro;
4. clientes de API, tipos, hooks e contratos reais do backend;
5. telas existentes relacionadas a início, anúncios/resultados, vendas, alertas/decisões e conta;
6. cada tela v0 para sua rota e seus dados reais;
7. lacunas de backend e qualquer wireframe que prometa uma ação ainda inexistente;
8. riscos de regressão e uma ordem incremental de implementação.

Regras de produto que não podem ser violadas:
- resultado não medido nunca aparece como zero;
- Meta e Google com moedas diferentes nunca são somados;
- o filtro escolhido pelo usuário muda os números, mas o nível qualitativo continua vindo dos 30 dias canônicos;
- a interface abstrai campanha mãe e duplicações técnicas de conjuntos de anúncio;
- não invente endpoints, dados, permissões ou sucesso de mutações;
- o nome válido é V2G; ignore BR Mind em referências antigas.

Crie somente o arquivo docs/v2g-wireframes/IMPLEMENTATION-PLAN.md. Não altere código do produto, não instale pacotes e não faça refatoração. O plano precisa incluir uma tabela por tela com: rota atual, rota proposta se necessária, componentes reutilizados, componentes novos, dados reais disponíveis, estados obrigatórios, lacunas de backend e critérios de aceite. Termine propondo fatias pequenas na ordem: fundação, resultados, criativos, publicação/decisões, vendas e pausa condicionada ao backend.
```

## Prompt 2 — fundação visual

```text
Leia docs/v2g-wireframes/IMPLEMENTATION-PLAN.md e os documentos de produto e design. Implemente somente a fatia “fundação visual e navegação” aprovada no plano.

Use como referências visuais principais:
- v2g-dashboard-resultados-desktop-v1.png
- v2g-dashboard-resultados-mobile-v1.png
- v2g-inicio-preparando-desktop-v1.png
- v2g-inicio-preparando-mobile-v1.png

Preserve rotas, autenticação, contratos de API e comportamento já existentes. Crie ou ajuste tokens e componentes reutilizáveis sem reconstruir o aplicativo inteiro. O tema claro é a referência desta etapa; estruture os tokens para não impedir o tema escuro existente.

Implemente a navegação responsiva, hierarquia tipográfica, cores, espaçamento, controles, foco e superfícies essenciais. Não implemente ainda todas as páginas dos PNGs.

Ao terminar, rode as verificações adequadas do repositório, incluindo lint, tipos e build quando disponíveis. Gere capturas em 1440 px e 390 px, compare com as referências e corrija diferenças importantes de hierarquia, espaçamento, contraste e comportamento responsivo. Relate arquivos alterados, validações e limitações reais.
```

## Prompt 3 — resultados

```text
Implemente somente a fatia de resultados definida em docs/v2g-wireframes/IMPLEMENTATION-PLAN.md.

Referências:
- v2g-dashboard-resultados-desktop-v1.png e mobile
- v2g-detalhe-campanha-desktop-v1.png e mobile
- v2g-campanha-no-ar-primeiros-dados-desktop-v1.png e mobile
- v2g-resultados-nao-medidos-desktop-v1.png e mobile
- v2g-dashboard-carregando-desktop-v1.png e mobile
- v2g-dashboard-falha-desktop-v1.png e mobile

Conecte somente dados e contratos reais existentes. Preserve explicitamente a diferença entre zero confirmado, ausência de medição, medição não verificada, carregamento e falha. Nunca some moedas diferentes. O filtro visual de período não altera o nível qualitativo calculado pelos 30 dias canônicos.

Implemente desktop e mobile como uma única fatia. Rode as verificações do repositório, capture 1440 px e 390 px e ajuste a tela após a comparação visual. Não avance para criativos ou publicação.
```

## Prompt 4 — criativos

```text
Implemente somente a fatia de criativos definida no plano.

Referências:
- v2g-analisar-criativo-desktop-v1.png e mobile
- v2g-gerar-criativo-desktop-v1.png e mobile
- v2g-geracao-criativo-andamento-desktop-v1.png e mobile
- v2g-geracao-criativo-falha-desktop-v1.png e mobile
- v2g-escolher-criativo-desktop-v1.png e mobile
- v2g-revisar-publicar-desktop-v1.png e mobile

O escopo atual é imagem. Use integrações reais; não invente vídeo, endpoints ou sucesso de geração. Preserve upload, progresso, falha parcial, escolha e revisão como estados distinguíveis. Uma falha em uma foto não pode apagar as fotos concluídas.

Implemente desktop e mobile, valide o código e compare capturas em 1440 px e 390 px. Não avance para publicação.
```

## Prompt 5 — publicação e decisões

```text
Implemente somente publicação e decisões conforme o plano.

Referências:
- v2g-publicacao-em-analise-desktop-v1.png e mobile
- v2g-meta-reprovou-desktop-v1.png e mobile
- v2g-falha-publicacao-desktop-v1.png e mobile
- v2g-decisao-criativo-desktop-v1.png e mobile
- v2g-decisoes-vazio-desktop-v1.png e mobile

Diferencie claramente espera pela Meta, reprovação da Meta e falha técnica da V2G. Uma decisão precisa mostrar evidência, explicação, consequência e uma ação principal. Não simule uma publicação real quando o backend não confirmar o estado.

Implemente desktop e mobile, rode as verificações e compare capturas em 1440 px e 390 px. Não implemente pausa ainda.
```

## Prompt 6 — registro de vendas

```text
Implemente somente o registro diário de vendas e sua confirmação.

Referências:
- v2g-registro-vendas-desktop-v1.png e mobile
- v2g-registro-vendas-sucesso-desktop-v1.png e mobile

Conversas medidas pela plataforma e vendas confirmadas pelo cliente são dados diferentes. Preserve a possibilidade de “não sei” e não transforme ausência de resposta em zero. Conecte apenas o contrato real existente.

Implemente desktop e mobile, valide o código e compare capturas em 1440 px e 390 px.
```

## Prompt 7 — pausa, condicionado ao backend

```text
Antes de editar, confirme no código atual se existe contrato real e testável para pausar e retomar campanha. Registre a evidência encontrada.

Se existir, implemente a confirmação e o estado pausado usando:
- v2g-confirmar-pausa-desktop-v1.png e mobile
- v2g-campanha-pausada-desktop-v1.png e mobile

Se não existir, não invente rota nem simule sucesso. Prepare somente o estado visual desabilitado ou protegido previsto no plano e documente exatamente o contrato necessário para habilitá-lo.

Rode as verificações e compare desktop e mobile.
```

## Prompt 8 — revisão final

```text
Faça uma revisão final do fluxo V2G implementado. Use Opus e trate esta tarefa como auditoria: procure regressões, divergências dos documentos e estados enganosos antes de fazer mudanças.

Revise:
- fluxo completo de navegação no desktop e mobile;
- larguras 360, 390, 768 e 1440 px;
- tema claro e compatibilidade com o tema escuro existente;
- acessibilidade por teclado, foco, contraste, rótulos e alvos de toque;
- carregamento, vazio legítimo, não medido, falha, sucesso e ação pendente;
- separação de moedas e fontes de dados;
- mutações sem confirmação real do backend;
- linguagem para donos de pequenos negócios;
- consistência dos componentes e ausência de valores inventados.

Faça apenas correções comprovadamente necessárias. Rode lint, tipos, testes relevantes e build. Gere capturas finais das principais telas em 1440 px e 390 px. Entregue uma tabela com item, evidência, correção aplicada e qualquer limitação que dependa do backend.
```

