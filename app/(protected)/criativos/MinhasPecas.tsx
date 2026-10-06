/**
 * Bloco 2 da casa do criativo — o histórico das peças.
 *
 * ============================================================
 * ELE ESTÁ VAZIO POR MEDIÇÃO, E NÃO POR PREGUIÇA — 12/09/2026.
 *
 * O briefing pedia: *"GET /execucoes/{id}/criativos existe e devolve as
 * peças com url_assinada. Se der para listar, liste."*
 *
 * A rota existe e responde 200. **Ela não devolve as peças que o dono
 * mandou para análise.** Medido em produção, com o token do backend:
 *
 *   GET /execucoes/{id}/criativos
 *     e3c5944f  Suco do victor       status=gerado           criativos=0
 *     ee301c4f  Facetas Curitiba     status=estrutura_pronta criativos=2  (mock:true)
 *     98447192  V2G                  status=aguardando_fotos criativos=0
 *
 * E o porquê está no filtro, não no dado:
 *
 *   rotas.py:1333   listar(id, TipoCriativo.CRIATIVO)   <- o que o GET devolve
 *   rotas.py:1135   tipo=TipoCriativo.PRONTO            <- o que o upload grava
 *
 * São tipos diferentes. `PRONTO` é lido por um lugar só no backend inteiro
 * (`checar_compliance_visual/agente.py:78`) e **nenhuma rota GET o
 * devolve**. Então a peça que o dono acabou de analisar existe no Storage,
 * tem `url_assinada` na resposta do POST, e **não há como pedi-la de volta
 * depois**.
 *
 * Chamar a rota mesmo assim mostraria criativos GERADOS — que é outra
 * coisa, mora em `/anuncios`, e para a conta da V2G vêm zero. Um bloco
 * "Minhas peças" listando zero por chamar o endereço errado é pior que um
 * bloco vazio honesto: o vazio se explica, o errado não.
 *
 * O que falta no backend está em docs/criativos-casa-do-criativo.md §2.
 * ============================================================
 */
export function MinhasPecas() {
  return (
    <section className="casa-bloco" aria-labelledby="casa-pecas">
      <div className="casa-bloco-head">
        <h2 id="casa-pecas" className="section-title">
          Minhas peças
        </h2>
        <p>As peças que você já conferiu por aqui.</p>
      </div>

      <div className="casa-vazio" role="status">
        <span className="criativos-marca-vazia" aria-hidden="true" />
        <div className="casa-vazio-texto">
          <b>O histórico ainda não está disponível.</b>
          <p>
            Por enquanto, o resultado aparece só na resposta do envio. As peças analisadas ainda
            não ficam em uma lista para abrir depois.
          </p>
          <p className="casa-vazio-nota">
            Se você quiser guardar uma peça, salve a imagem no seu celular junto com o que a
            gente respondeu sobre ela.
          </p>
        </div>
      </div>
    </section>
  );
}
