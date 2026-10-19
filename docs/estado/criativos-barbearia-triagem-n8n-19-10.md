# Criativos — primeira triagem de barbearia no n8n (19/10/2026)

## §0. Depende de decisão ou fonte externa

- O catálogo técnico do backend ainda não confirmou um ID de nicho para esta classificação; `servico_barbearia` é etiqueta do piloto, não ID do `GET /nichos`.
- Falta uma fonte admissível para obter imagens de anúncios comerciais brasileiros em lote. A pesquisa pública da Biblioteca pode ser conferida na interface, mas a API oficial não oferece uma varredura geral desse conjunto. A coleta automática e a exaustividade de “todos os criativos” **não foram implementadas**.
- Nenhuma imagem de terceiro foi guardada ou enviada à TypeSafe. Falta validar o direito/condição de uso e o transporte da imagem para o ensaio visual. O saldo de US$ 5 informado por Victor não foi verificado; nenhum crédito Jev foi gasto neste bloco.

## Feito

- Busca pública manual na Biblioteca de Anúncios da Meta, Brasil, anúncios ativos, filtro Imagens, termo `barbearia`, em 19/10/2026. A interface indicou **aproximadamente 530 resultados**, não um total exato nem uma contagem de anúncios elegíveis. O conjunto visto continha falsos positivos de imóvel, tatuagem e cadeiras para barbeiros.
- Criada a Data Table `V2G_06_referencias_barbearia_piloto` no projeto pessoal do n8n, ID `Gfuhjqz350YXbuo0`, para metadados públicos e estado de triagem. Foram registrados **10 IDs observados** na primeira página: seis candidatos a anúncio de serviço de barbearia e quatro fora do escopo. URLs diretas seguem o padrão validado com o anúncio `700155112131034`; as demais não foram abertas individualmente. Só esse primeiro criativo teve imagem conferida visualmente. Nenhum arquivo de imagem foi copiado.
- Atualizado o fluxo [V2G | 06 | Jev e contexto - piloto seguro](https://ia-n8n.5hue9s.easypanel.host/workflow/3kfUlXxPnKRDMB60), ainda **inativo**, para ler a tabela, manter apenas `servico_barbearia` com status `candidato`, eliminar IDs repetidos e passar pelos portões de imagem, direitos, nicho e teto. Não há HTTP Jev, webhook, agendamento ou escrita na Meta.

## Prova e limite

- SDK do n8n validou o fluxo com 12 nós sem aviso. Teste manual da execução `13` terminou com status `success`: 10 registros lidos → 6 mantidos e 4 descartados → 6 IDs únicos → 6 bloqueados antes do Jev. O ramo “Pronto para integração Jev” não executou.
- Isso prova a triagem inicial **do conjunto registrado**, não a varredura completa, a análise de imagem, a qualidade dos anúncios, o custo por imagem ou o resultado comercial deles.
- Não houve commit, push, deploy, migration, alteração em Supabase, configuração externa de Meta, publicação ou chamada paga.

## Próximo bloco proposto, não executado

Com fonte e condição de uso verificáveis para imagens individuais, testar a extração de uma peça de barbearia, enviar somente essa peça ao Jev com limite de custo, registrar resposta/uso/custo e comparar com rotulagem humana. Ampliar volume apenas após essa prova.
