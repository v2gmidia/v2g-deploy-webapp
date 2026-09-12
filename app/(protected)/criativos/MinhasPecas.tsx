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
        <span className="casa-vazio-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 16l5-4 3 2.5 3-2.5 7 5.5" />
            <circle cx="8" cy="9.5" r="1.4" />
          </svg>
        </span>
        <div className="casa-vazio-texto">
          <b>Nenhuma peça guardada ainda</b>
          <p>
            Quando você manda uma imagem para conferir, a gente responde na hora — mas ainda não
            guarda a peça numa lista para você abrir depois. Por enquanto, o resultado aparece só
            na resposta do envio.
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
