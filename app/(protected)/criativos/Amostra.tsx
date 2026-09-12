import { apresentarVeredito } from "@/lib/criativos/veredito";

/**
 * Os cinco estados do resultado, lado a lado — SÓ DESENVOLVIMENTO.
 *
 * ============================================================
 * POR QUE ISTO EXISTE E NÃO É TESTE.
 *
 * Os três vereditos, o desconhecido e o `null` são cinco desenhos, e
 * nenhuma conta real produz mais de um por vez. Ver os cinco exige cinco
 * imagens diferentes, cinco chamadas pagas ao modelo e sorte — ou uma
 * fixture.
 *
 * Ela é alcançada pelos mesmos dois trincos da `/inicio`:
 * `NODE_ENV !== "production"` (dobrado para literal no build, preview da
 * Vercel incluído) e `V2G_FIXTURE_ANALISE`, que não existe em ambiente
 * nenhum da Vercel e mora em `.env.development.local` — arquivo que o
 * `next build` não abre.
 *
 * **Os textos aqui não são inventados:** os vereditos e as apresentações
 * saem de `lib/criativos/veredito.ts`, os mesmos que a tela usa. Os
 * `motivos` são os do formato do contrato (até 3, escritos para o dono).
 * ============================================================
 */
const CASOS: { rotulo: string; veredito: string | null; motivos: string[]; recusados: string[]; motivo: string | null }[] = [
  {
    rotulo: "veredito: presta",
    veredito: "presta",
    motivos: [
      "A oferta aparece logo de cara, no maior texto da imagem.",
      "O produto ocupa a maior parte do quadro.",
    ],
    recusados: [],
    motivo: null,
  },
  {
    rotulo: "veredito: presta_com_ajuste",
    veredito: "presta_com_ajuste",
    motivos: [
      "O texto do canto inferior fica pequeno no celular.",
      "O botão do WhatsApp está muito perto da borda.",
    ],
    recusados: [],
    motivo: null,
  },
  {
    rotulo: "veredito: nao_presta",
    veredito: "nao_presta",
    motivos: [
      "Não dá para saber o que está sendo vendido só olhando a imagem.",
      "O texto ocupa quase metade do quadro e some no celular.",
      "Não há nada dizendo o que a pessoa deve fazer.",
    ],
    recusados: [],
    motivo: null,
  },
  {
    rotulo: "veredito desconhecido (valor novo no backend)",
    veredito: "precisa_de_revisao_humana",
    motivos: ["A imagem tem uma pessoa identificável, e isso pede conferência de quem revisa."],
    recusados: [],
    motivo: null,
  },
  {
    rotulo: "veredito: null (nenhum arquivo aceito)",
    veredito: null,
    motivos: [],
    recusados: ["cartaz-loja.png"],
    motivo: "A imagem tem menos de 1024 pixels no lado menor. Mande a original, sem reduzir.",
  },
  {
    rotulo: "motivos vazio, com veredito",
    veredito: "presta",
    motivos: [],
    recusados: [],
    motivo: null,
  },
];

export function AmostraDeVereditos({ qual }: { qual: string }) {
  const casos = qual === "todos" ? CASOS : CASOS.filter((c) => c.veredito === qual);
  const lista = casos.length > 0 ? casos : CASOS;

  return (
    <section className="analise">
      <p className="analise-aviso">
        <b>Amostra de desenvolvimento.</b> Os {lista.length} desenhos do resultado, lado a lado.
        Nenhuma imagem foi enviada e nenhuma chamada foi feita.
      </p>

      {lista.map((c) => {
        const a = apresentarVeredito(c.veredito);
        return (
          <div className="analise-saida" key={c.rotulo}>
            <p className="analise-arquivo-nome">{c.rotulo}</p>

            {a === null ? (
              <div className="analise-cartao v-neutro">
                <b className="analise-titulo">Essa imagem não deu para usar</b>
                {c.motivo && <p className="analise-apoio">{c.motivo}</p>}
                {c.recusados.length > 0 && (
                  <ul className="analise-motivos">
                    {c.recusados.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className={`analise-cartao ${a.estilo}`}>
                <span className="analise-selo">{a.selo}</span>
                <b className="analise-titulo">{a.titulo}</b>
                <p className="analise-apoio">{a.apoio}</p>
                {c.motivos.length > 0 && (
                  <ul className="analise-motivos">
                    {c.motivos.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
