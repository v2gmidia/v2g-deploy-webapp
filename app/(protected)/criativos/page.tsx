import { createClient } from "@/lib/supabase/server";

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);

/**
 * Suas fotos e vídeos — porte de `tela-07-criativos-desktop.html`.
 *
 * ESTADO VAZIO COMO CAMINHO PRINCIPAL. No protótipo a galeria cheia era
 * o padrão e "quem nunca enviou nada" ficava atrás de um alternador de
 * demonstração. Invertido aqui: quem acabou de entrar não tem foto
 * nenhuma, e é esse o primeiro estado que existe de verdade.
 *
 * O ENVIO AINDA NÃO EXISTE. A tabela `creatives` já está no schema, com
 * `storage_path` esperando um arquivo — mas nenhum bucket de Storage foi
 * criado e não há rota de upload. O botão fica visível e desabilitado,
 * com o motivo escrito, em vez de abrir um seletor de arquivo que não
 * leva a lugar nenhum. O protótipo simulava o envio ("clique para
 * simular"); simular aqui seria repetir a mentira que a migração do
 * onboarding acabou de matar.
 */
export default async function CriativosPage() {
  const supabase = await createClient();

  // RLS limita ao negócio do usuário logado.
  const { data: criativos } = await supabase
    .from("creatives")
    .select("id, type, file_name, storage_path, vision_description, meta_status, created_at")
    .order("created_at", { ascending: false });

  const temCriativo = (criativos?.length ?? 0) > 0;

  return (
    <>
      <div className="page-head">
        <h1>Suas fotos e vídeos</h1>
        <p>
          Toda foto e vídeo que já usamos nos seus anúncios, num só lugar. Cada uma é prova
          guardada: o que rendeu, o que a IA pediu para ajustar e o motivo — em português de
          gente.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          {temCriativo ? (
            <section>
              <div className="section-title">
                <h2>O que a IA está olhando agora</h2>
                <span className="st-note">{criativos!.length} itens</span>
              </div>
              <div className="card">
                {criativos!.map((c) => (
                  <div className="log-row" key={c.id}>
                    {c.file_name ?? "Arquivo sem nome"}
                    {c.vision_description ? ` — ${c.vision_description}` : ""}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="empty-card">
              <div className="empty-ico">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
                  <circle cx="12" cy="13" r="3.2" />
                </svg>
              </div>

              <div className="empty-copy">
                <p className="empty-head">Sua galeria começa com a primeira foto.</p>
                <p className="empty-body">
                  Pode ser o produto pronto, a fachada da loja, um cliente satisfeito — qualquer
                  foto do dia a dia serve de ponto de partida. A IA te ajuda a melhorar o ângulo
                  depois, se precisar.
                </p>
                <button className="cta" type="button" disabled>
                  Enviar minha primeira foto
                </button>
                <p className="empty-note">
                  O envio ainda não está ligado — falta a parte que guarda o arquivo. Enquanto
                  isso, vale ir separando as fotos: a lista ao lado ajuda a escolher.
                </p>
              </div>

              <ul className="empty-list">
                <li>
                  <Tick />
                  <span>
                    <b>O produto pronto</b> — do jeito que sai do balcão, sem produção.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>A fachada da loja</b> — ajuda quem mora perto a reconhecer você na rua.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>Um vídeo curto do preparo</b> — de celular mesmo, sem produção nenhuma.
                  </span>
                </li>
              </ul>
            </section>
          )}
        </div>

        <aside className="dash-aside">
          <div className="tips-card">
            <p className="tips-title">3 coisas que ajudam sua foto a ir mais longe</p>
            <ul className="tips-list">
              <li>
                <Tick />
                Luz natural, de dia, perto de uma janela.
              </li>
              <li>
                <Tick />
                O produto ocupando o centro da imagem.
              </li>
              <li>
                <Tick />
                Sem textos ou adesivos em cima da foto — a IA adiciona o que for preciso depois.
              </li>
            </ul>
          </div>

          <section className="trust support-block">
            <b>Sua privacidade</b>
            Suas fotos são usadas só para criar os seus anúncios. Nada é compartilhado com outras
            empresas, e você pode tirar qualquer foto de circulação quando quiser.
          </section>
        </aside>
      </div>
    </>
  );
}
