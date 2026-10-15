import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerMarca } from "@/lib/onboarding/marca";
import styles from "./MarcaDoNegocio.module.css";

export const dynamic = "force-dynamic";

/** As URLs privadas só são criadas depois da confirmação do papel de operador. */
export default async function MarcaDoNegocioPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const admin = createAdminClient();
  const { data: negocio, error: erroNegocio } = await admin.from("businesses")
    .select("id, name, onboarding").eq("id", id).maybeSingle();
  if (erroNegocio) throw new Error("Não foi possível consultar o negócio.");
  if (!negocio) notFound();

  const [logo, referencias] = await Promise.all([
    admin.from("creatives").select("id, file_name, storage_path, created_at")
      .eq("business_id", id).eq("uso", "logo").is("arquivado_em", null)
      .order("created_at", { ascending: false }).limit(1),
    admin.from("creatives").select("id, file_name, storage_path, type, created_at")
      .eq("business_id", id).eq("uso", "referencia")
      .in("type", ["variacao_logo", "guia_identidade_pdf"])
      .is("arquivado_em", null).order("created_at", { ascending: false }).limit(20),
  ]);
  if (logo.error || referencias.error || !logo.data || !referencias.data)
    throw new Error("Não foi possível consultar os materiais de marca.");

  const caminhos = [...logo.data, ...referencias.data]
    .map((item) => item.storage_path).filter((path): path is string => Boolean(path));
  const { data: urls, error: erroUrls } = caminhos.length
    ? await admin.storage.from("v2g-midia").createSignedUrls(caminhos, 3600)
    : { data: [], error: null };
  const porCaminho = new Map((urls ?? []).map((item) => [item.path ?? "", item.signedUrl ?? null]));
  const logoAtual = logo.data[0] ?? null;
  const imagens = referencias.data.filter((item) => item.type === "variacao_logo");
  const guia = referencias.data.find((item) => item.type === "guia_identidade_pdf") ?? null;
  const marca = lerMarca(negocio.onboarding);

  return <main className={styles.pagina}>
    <a href="/gestor">← Voltar à carteira</a>
    <header>
      <p className={styles.sobretitulo}>REFERÊNCIAS DECLARADAS PELO CLIENTE</p>
      <h1>Materiais de marca · {negocio.name}</h1>
      <p>Use estes arquivos para preparar a conversa e revisar a proposta. As cores só são confirmadas quando o cliente as aprova.</p>
    </header>
    {referencias.data.length === 20 && <p className="form-warning">A consulta atingiu o limite de 20 referências; podem existir outros arquivos.</p>}
    {erroUrls && <p className="form-warning">Os arquivos estão registrados, mas os links privados não puderam ser gerados agora.</p>}
    <section>
      <h2>Logo principal</h2>
      {logoAtual ? <div className={styles.arquivo}>
        {porCaminho.get(logoAtual.storage_path ?? "")
          ? <a href={porCaminho.get(logoAtual.storage_path ?? "")!} target="_blank" rel="noopener noreferrer">{logoAtual.file_name ?? "Abrir logo"}</a>
          : <span>{logoAtual.file_name ?? "Logo registrado"} · link indisponível</span>}
      </div> : <p>Nenhum logo principal enviado.</p>}
    </section>
    <section>
      <h2>Outras imagens</h2>
      {imagens.length ? <ul className={styles.lista}>{imagens.map((item) => <li key={item.id}>
        {porCaminho.get(item.storage_path ?? "")
          ? <a href={porCaminho.get(item.storage_path ?? "")!} target="_blank" rel="noopener noreferrer">{item.file_name ?? "Abrir imagem"}</a>
          : <span>{item.file_name ?? "Imagem registrada"} · link indisponível</span>}
      </li>)}</ul> : <p>Nenhuma imagem adicional enviada.</p>}
    </section>
    <section>
      <h2>Manual de marca</h2>
      {guia ? <p>{porCaminho.get(guia.storage_path ?? "")
        ? <a href={porCaminho.get(guia.storage_path ?? "")!} target="_blank" rel="noopener noreferrer">Abrir PDF · {guia.file_name ?? "Manual de marca"}</a>
        : `${guia.file_name ?? "PDF registrado"} · link indisponível`}</p>
        : <p>Nenhum PDF enviado.</p>}
      <p>O arquivo completo deve ser conferido pelo gestor; a leitura automática das primeiras páginas só sugere cores.</p>
    </section>
    <section>
      <h2>Cores e observações</h2>
      {marca?.coresConfirmadas.length ? <ul className={styles.cores}>{marca.coresConfirmadas.map((cor) =>
        <li key={cor}><span className={styles.amostra} style={{ backgroundColor: cor }} />{cor}</li>)}</ul>
        : <p>Cores ainda não confirmadas pelo cliente.</p>}
      {marca?.aparencia && <p>Observação do cliente: {marca.aparencia}</p>}
      {marca?.aparenciaNaoSei && <p className="form-warning">Cliente pediu para definir as cores com o gestor.</p>}
    </section>
  </main>;
}
