# Geração para o evento — integração mínima e portões

Conferência em 20/10/2026 (America/Sao_Paulo). IDs E28-06-A/B. Este documento é contrato técnico e plano de adaptação; não afirma geração integrada nem altera o plano central.

## Decisão técnica deste bloco

Reutilizar o `ClientImagem` e a factory de `backend_v2g/src/imagem`, inicialmente com o provedor OpenAI já implementado e o modelo configurado no backend (`gpt-image-2` como default do código). Não criar outro gerador no Next.js, não levar chave OpenAI ao navegador e não colocar Jev no caminho crítico. Isso reduz integração, não prova que este seja o provedor de melhor custo-benefício. Comparação de qualidade/custo continua dependendo de piloto medido.

Antes de promover ao fluxo do cliente, adaptar o chamador persistente no backend. **Não ligar o botão diretamente ao endpoint legado** `/agentes/gerar-criativo-visual`.

## Evidência do backend consultado — somente leitura

Raiz: `C:\Users\victo\OneDrive\Documentos\GitHub\backend_v2g`.

| Fato | Fonte |
|---|---|
| Factory única seleciona mock/real. | `src/imagem/factory.py:12`; `src/config.py:296` |
| Modelo default `gpt-image-2`; não foi lido o valor do ambiente. | `src/config.py:218` |
| Client usa `images/edits` com materiais em bytes e qualidade high. | `src/imagem/openai_client.py:40`, `:250`, `:254` |
| Até três tentativas internas, inclusive após falhas de transporte. Timeout não prova ausência de cobrança. | `src/imagem/openai_client.py:102`, `:261` |
| `custo_usd` sai da tabela de estimativa por tamanho, não de `usage`. | `src/imagem/openai_client.py:344` |
| Endpoint de geração recebe execução, nicho e ângulo; normalmente pede dois formatos. | `src/api/rotas.py:2839`; `src/agentes/gerar_criativo_visual/modelos.py:15` |
| `substituir` pode descartar as peças anteriores daquele ângulo. Não serve para histórico imutável de versões. | `src/agentes/gerar_criativo_visual/agente.py:88` |
| Agente converte bytes, valida dimensões e grava Storage + tabela `criativos`. Reutilizar esses passos. | `src/agentes/gerar_criativo_visual/agente.py:122` |
| Loader descobre nichos por arquivo e recusa desconhecido. | `src/knowledge/loader.py:54` |

O inventário atual de `knowledge/*.md` não contém `barbearia.md`. Há `rastreamento-veicular.md`, mas não é substituto silencioso de barbearia. Não foi criado documento de mercado ou benchmark para preencher essa lacuna.

## Caminho utilizável e responsabilidade

1. **WebApp — implementado localmente neste bloco:** formulário de objetivo/oferta/ação/promoção → confirmação da declaração → action autenticada → pedido append-only em `creative_generation_requests` → leitura da mesma sessão na aba Criativos. UUID mantém reenvios no mesmo pedido; mudança de conteúdo com o mesmo UUID não sobrescreve o original.
2. **Antes da geração — ainda falta integrar:** recarregar marca/contexto do negócio e conferir os pré-voos já existentes (`prevoo-geracao.ts`, `selecionar-marca.ts`, `documentos-geracao.ts`, `porta-geracao.ts`). O pedido guardado não é uma execução autorizada. Confirmar oferta não autoriza envio de imagens a um provedor externo.
3. **Backend — próximo recorte local:** job durável por pedido/versão com reserva transacional do custo autorizado, marca/documentos/referências versionados e decisão de execução única. Reutilizar `obter_client().gerar(PedidoCriativo(...))`, conversão e validação já existentes; não disparar novamente a geração quando apenas a gravação do arquivo falhar.
4. **Falhas:** timeout ou resposta ambígua vira estado de reconciliação; não retentar a chamada paga automaticamente. Ajustar a política de retry no chamador/client sem mudar silenciosamente o comportamento global do pipeline legado.
5. **Arquivo:** caminho privado determinístico por negócio/pedido/versão, hash dos bytes, MIME/dimensões medidas, identificador de resposta do provedor e versão imutável. Persistir primeiro a ligação comprovada; assinar URL curta somente após autorização. Uma tentativa ambígua não recebe custo zero.
6. **Consumo/custo:** preservar `usage` e estimativa separadamente, com moeda, tabela de preços e data. Cobrança conciliada não é a mesma coisa que preço estimado. Não usar a antiga constante por tamanho como prova de gasto ou limite rígido.
7. **Cliente/gestor — E28-06-C/05-A:** aprovar versão exata no app, com autor/data/conteúdo; pedido durável na fila existente. Até três refações com instrução. Geração, consentimento, aprovação da peça, revisão operacional e publicação permanecem fatos separados.
8. **Publicação — E28-06-D:** manual, registrando negócio/conta/campanha/conjunto/anúncio/peça. “No ar” exige evidência da Meta. Este bloco não publica, ativa ou pausa.

Não adicionar registro de router em `src/api/rotas.py` sem conferir a integração compartilhada com 07/08. Nenhum arquivo do backend foi alterado nesta rodada.

## Piloto proposto — ainda não autorizado

- Primeiro teste técnico: uma imagem feed quadrada, uma chamada sem retry automático, somente marca/fotos fictícias próprias; sem dados ou material privado de cliente e sem referência copiada de terceiro.
- Proposta de envelope: até US$ 2 no ensaio inteiro. É proposta de autorização, **não** um teto técnico implementado e não uma despesa já realizada. Custo/entrada precisam ser conferidos antes de chamar; se não for possível sustentar o limite, não executar.
- Esse teste isolado mede client, bytes, consumo e persistência, mas não certifica pertinência do nicho, qualidade comercial, aprovação ou publicação.
- Para o percurso de barbearia no produto, falta o documento/ângulo aprovado no catálogo e referência admissível. O time define o conteúdo; o software versiona, aplica e registra. Não substituir por `generico` em silêncio.
- Qualidade high é o comportamento atual do client. Medium/low são candidatos a comparação posterior; não houve mudança de qualidade global ou afirmação de que ela melhora/piora resultado comercial.

Pedido humano mínimo, quando chegar ao portão: autorizar material fictício + uma chamada + envelope total do piloto; autorizar separadamente eventual aplicação desta migração em QA identificado. Material real exige autorização própria por negócio/finalidade. Não confundir os US$ 5 colocados no Jev com saldo de geração OpenAI.

## Configuração e prova do recorte atual

- `V2G_CREATIVE_REQUESTS_ENABLED=true` habilita **pedido**, não geração. Não foi gravada ou ativada em nenhum ambiente. Só habilitar depois da migração em ambiente autorizado e do ensaio autenticado de isolamento.
- Migração preparada: `supabase/migrations/20261021001651_creative_generation_requests.sql`. SELECT/INSERT do dono via RLS; grant de colunas impede o cliente de definir horário/estado; sem UPDATE/DELETE. O status único atual é `awaiting_configuration`.
- O formulário é integrado à rota autenticada `/criativos`. Prévia dev-only sem escrita: `/exemplo/criativos-pedido-duravel`. A prévia não usa sessão, Storage, IA ou serviço externo.
- O pedido não contém material privado, URL assinada, consentimento por IA ou aprovação para publicar. O worker futuro terá que carregar e conferir fontes e permissões; o JSON declarado pelo cliente não é autoridade operacional.
- Sem prova real de RLS, gravação em banco, recarga/logout autenticado ou arquivo gerado neste bloco. A migração preparada e os testes offline não substituem esses aceites.

## Fontes oficiais consultadas

- [OpenAI — edição de imagens](https://developers.openai.com/api/reference/resources/images/methods/edit): entrada por imagens e resposta com uso; não foi feita chamada paga.
- [OpenAI — geração, custos e latência](https://developers.openai.com/api/docs/guides/image-generation): consumo depende de entradas, saída/tamanho e qualidade. Preferir medição ao preço legado por imagem.
- [OpenAI — preços](https://developers.openai.com/api/docs/pricing): consultar taxas da modalidade/modelo no piloto, sem congelar preço presumido neste documento.
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): grants e políticas explícitas de SELECT/INSERT. O changelog Markdown não pôde ser obtido pelo leitor web; não se inferiu estado do ambiente disso.
