# Trava Nota/Brotherhood publicada somente na QA — 17/11/2026

## 0. Dependência humana e próximo ato

- **Victor:** confirmar titular/e-mail sob controle da Nota, modalidade e início/vencimento/ciclo ainda não pago. Brotherhood é a unidade proposta; Versan já pago fica fora.
- **Central:** após essa confirmação, conferir IDs canônicos e contexto confirmado. Não selecionar comprador por nome/CNPJ/cookie ou assumir identidade de Matheus.
- **Matheus:** sessão legítima da QA quando a prova permitida estiver preparada. Não é necessário login para a negativa fechada concluída hoje.
- Esta publicação NÃO abre o piloto: modo closed nega todos, inclusive Matheus. Política real ainda não configurada. Permissão seletiva autenticada e ativação financeira dependem de bloco próprio.

## 1. Autorização e escopo

Victor autorizou revisar/publicar somente QA, manter cobranças e envios desligados e conferir bloqueio externo. Nenhuma migração, escrita no banco de negócio, cobrança, envio, anúncio, Git de escrita ou produção. Nenhum backend FastAPI ou LP publicado neste bloco.

## 2. Revisão da composição

A candidata local webapp-comercial-qa incluía também adaptações oficiais ausentes na QA. Publicar a candidata inteira substituiria outras mudanças. A composição foi reconstruída sobre as 661 fontes da QA dpl_FkxZrcfG64aDWHMd7Ni6j8KqzZyC, preservando-as e aplicando somente seis alterações e dois módulos da trava. Total publicado: 663 fontes. Scripts, SQL, fixtures, arquivos privados e .env não foram incluídos. Pacote local anterior trava-nota-brotherhood-v1 preservado.

## 3. Publicação e configuração

- Projeto isolado v2g-webapp-qa: prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn.
- Deployment dpl_6odAcruprtVU8i1fKZhFA5yk2Mns, READY; URL gerada v2g-webapp-ql3r0dxp1-v2-g.vercel.app.
- Alias https://v2g-webapp-qa.vercel.app confirmado por get_alias apontando para esse deployment e projeto.
- target production é o ambiente principal DESTE projeto QA isolado; não é o WebApp oficial.
- Única variável criada: V2G_COMMERCIAL_QA_PILOT_MODE=closed, não secreta. Nenhuma policy real criada.
- Leitura antes/depois: sete controles de financeiro/checkout/recorrência/envio false; demais IDs, targets, updatedAt e valores plain preservados. Valores secretos não lidos.
- Preparação de mensagens já existente permanece preservada e não equivale a envio.

## 4. Provas

**Composição exata local:** 77/77 testes dirigidos, zero falhas, incluindo os 16 casos do piloto; TypeScript e Next build aprovados em diretório isolado. Provedores e sessões desses testes são simulados, não usuários reais. Não somar aos 111 testes da candidata anterior: bases diferentes e conjuntos sobrepostos.

Casos incluem: sessão de outro comprador; campos de identidade/preço forjados; vínculo revogado ou negócio de outro dono; conta de outro anunciante; troca de sessão/fechamento depois da primeira leitura; caminhos legados mesmo com flags antigas ligadas; tentativa de ampliar/trocar destino na atribuição.

**Publicado:** GET /contratar HTTP 200. Chamada à action iniciarCompra com ID extraído do JavaScript público, sem cookies, sem comprador e sem valores de compra: HTTP 200 de transporte RSC com resultado de negócio erro: O pagamento está indisponível neste ambiente. Sem redirecionamento. A recusa ocorre no primeiro guard antes de Auth/admin/RPC/provedor, comprovado pela ordem do código da composição.

**Assinaturas:** árvore remota parcial: 337/663 fontes listadas, todas com UID SHA1 igual ao manifesto enviado; cinco das oito fontes alteradas estão na parte listada. Três alteradas omitidas pela árvore foram consultadas por SHA; prefixos retornados coincidem. get_deployment_file_contents truncou todos os oito retornos em base64: não declarar hash completo dos conteúdos truncados nem ausência dos omitidos. Upload das oito fontes e create_deployment foram aceitos; build remoto READY.

**Limites:** a negativa remota demonstra fechamento global de compra, não autorização seletiva de Matheus. Isolamento nominal da policy é comprovado pelos testes locais com identidades sintéticas; prova seletiva remota e compra/pagamento/caixa de entrada/acesso do novo comprador seguem pendentes. Nenhum acesso existente foi revogado ou reaprovado nesta rodada.

## 5. Evidência e registro

Pacote de evidências seguro: docs/qa/trava-nota-brotherhood-publicada-qa/resultado.json e manifesto-fontes.json. Snapshot, logs completos, pedido de publicação e negativa HTTP em pasta privada da máquina: C:/Users/victo/.codex/private-backups/v2g/2026-11-17-trava-piloto-publicacao-qa. Isso é recuperação de fonte/configuração não secreta; não foi criado backup de banco pois nenhum DDL/DML foi executado.

Planilha existente atualizada em Visão geral, Próximos passos e Novembro — execução; histórico em notas e demais células preservados. Comercial permanece Em andamento.

## 6. Retorno

Se surgir defeito novo, apresentar retorno ao deployment-base QA mantendo compras/envios false. Não promover a produção nem ativar controles por consequência desta publicação. Não remover a trava de uma policy ativa sem revisão.
