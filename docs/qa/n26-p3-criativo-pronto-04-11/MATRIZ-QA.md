# N26-P3 — percurso autenticado do criativo pronto

**Estado em 04/11/2026:** roteiro preparado, **NÃO EXECUTADO no QA atual**. Local: 70 testes dirigidos verdes. Histórico: 17 verificações HTTPS em 21/10, preservadas no checkpoint original; não equivalem ao aceite desta versão.

## Versão e autorização antes do teste

- QA observado por metadados: `https://v2g-webapp-qa.vercel.app`, deployment `dpl_2XUw4sXQyG7jVxudZsvRVonaWqYC`, READY, commit `959e78ea4e528ed2caaed182d7b281b1ba26dc6f`. **Não contém as correções N26-P3 não commitadas.**
- Release candidata: HEAD acima + arquivos/hashes registrados em `docs/estado/n26-p3-criativo-pronto-fila-caua-04-11.md`. SHA do futuro release/deployment: **PENDENTE**. Push não comprova publicação. Conferir alias + commit + presença das correções antes de rodar.
- Donos: Central/Victor autorizam ambiente/recursos; 05/06 executa; Cauã usa sua identidade própria. Não compartilhar senha, cookie, token, `.env` ou URL assinada.
- Registrar `V2G_CREATIVE_REVIEW_ENABLED` (precisa estar ON para o percurso), `V2G_MANAGER_WORK_ENABLED` (ON para testar a tarefa auxiliar). Estado remoto **não inspecionado nesta rodada**. Nenhuma mudança de flag está autorizada por este documento.
- `V2G_CREATIVE_AUTO_ANALYSIS_ENABLED`, geração e provedores pagos devem ficar desligados no ensaio. Não há chamada ao backend Meta neste percurso.
- Confirmar schema já existente: `creative_review_requests`, `upload_intent`, `manager_accounts`, `manager_tasks`, bucket `creative-review` privado e RLS/ACL adequados. Falta de schema bloqueia; não aplicar lote de migrations por este roteiro.
- Preencher inventário aprovado de **dois negócios A/B**, donos, um operador atribuído a A e outro não atribuído a A. IDs atuais: **PENDENTES**. Preferir fixtures novas marcadas fictícias; criação/atribuição/grant e limpeza precisam de autorização nominal. Não reutilizar IDs sintéticos de outubro, já removidos.
- Usar imagem pública própria de teste, aprovada para o ensaio; registrar tamanho, MIME e SHA-256. Não enviar material privado do cliente. Até um pedido/arquivo por negócio (replay usa o mesmo pedido); sem Meta/publicação.

## Percurso e evidência a registrar

| Passo | Sessão / ação | Aceite e evidência redigida | Resultado QA |
| --- | --- | --- | --- |
| 1 | Cliente A entra, escolhe o negócio A e abre `/criativos` → “Já tenho um criativo” | Negócio ativo e versão publicados identificados. Não usar `/exemplo`. | Pendente |
| 2 | Seleciona JPG/PNG próprio, objetivo WhatsApp ou Instagram, prazo se aplicável; confere e confirma | Upload aceito; guardar `request_id`, `business_id`, hash/tamanho/MIME, objetivo e data. Não salvar payload de autenticação. | Pendente |
| 3 | Conferência técnica somente leitura autorizada | Uma linha, um objeto em `creative-review/<business_id>/<request_id>`; `submitted_by` é o cliente; status `awaiting_review`; bucket privado; bytes recuperados pelo acesso permitido têm o SHA esperado. Sem URL pública. | Pendente |
| 4 | Repetição do mesmo envio pela ação de retomada, se oferecida; recarga da galeria | Não cria segunda linha/objeto. Pedido, imagem e estado sobrevivem. Se a UI não oferece replay após sucesso, não forjar nova chamada para este passo; registrar limite da evidência. | Pendente |
| 5 | Cauã entra com sua conta, abre `/supergestor` e usa o link de revisão; rota específica `/gestor/criativos?negocio=<A>&peca=<pedido>` | Mesmo pedido/negócio/arquivo na fila; imagem privada acessível ao atribuído. Fixture fictícia pode não aparecer na carteira principal: abrir a rota específica, sem reclassificá-la como real. | Pendente |
| 6 | Operador não atribuído a A abre o mesmo endereço | Negação ou item ausente; não recebe imagem de A nem registra decisão. Controle de action direta somente no ensaio técnico autorizado; os testes locais já cobrem ON/OFF. | Pendente |
| 7 | Cauã solicita ajuste com nota inequívoca | `changes_requested`, `review_note`, `reviewed_by`, `reviewed_at` na mesma linha e mesmo hash. Tarefa auxiliar passa a concluída; falha parcial não apaga decisão. Não significa campanha publicada. | Pendente |
| 8 | Cliente A sai, entra novamente e seleciona A | Galeria mostra mesma imagem/pedido e “Ajustes solicitados pelo gestor”, com a nota. Screenshot sem dado privado e IDs cruzados com passo 3. | Pendente |
| 9 | Cliente B entra e seleciona B; usa sua própria peça se autorizada | Não vê a peça/nota/imagem de A. Pedido de B, se criado, conserva seu próprio estado. RLS e Storage reais conferidos com autorização; não usar privilégio administrativo para fingir leitura do cliente. | Pendente |
| 10 | Cauã tenta decidir novamente o pedido de A | Segunda decisão recusada; primeira nota/autor/horário/hash preservados. | Pendente |
| 11 | Conferir sessão nova de Cauã e do cliente, sem reutilizar URL assinada antiga | Estado persistido reaparece; não se limita ao estado local do formulário. Ausência ou erro não aparece como sucesso. | Pendente |

Estados `approved_for_manual_publish` e `rejected` também têm cobertura local. Para certificá-los por HTTPS, autorizar previamente os pedidos adicionais; não mudar uma decisão concluída nem exceder o inventário acima. Aprovar internamente deve continuar mostrando **publicação manual pendente**, sem “no ar”.

## Encerramento e limites

- Registrar commit/deployment realmente exercitados, data BRT, ator/papel, negócio, pedido, caminho lógico e hash; sem segredos/links assinados nos documentos. Capturas são complementares à conferência técnica, não substituem identidade/arquivo.
- Falhas artificiais de Storage, arquivo corrompido, atribuição divergente e opção de tarefas OFF ficam locais. Não corromper dados/arquivos ou alterar configuração remota para simular erro.
- URLs antigas têm validade temporária; teste de isolamento usa nova página/sessão, sem transferir um link já autorizado a outro ator. Expiração/revogação imediata não foram implementadas neste bloco.
- Limpeza só dos IDs/objetos inventariados e autorizados; nunca por prefixo nem cascata presumida. Antes de excluir usuários sintéticos, encerrar/revogar sessões conforme roteiro aprovado.
- **Aceite:** marcar N26-03 validado em QA apenas com evidência completa de 1–11, limites documentados e controle negativo A/B. Produção e cliente real têm seus próprios portões.
