import type { CampoDoPreparo, ContextoDoCriativo } from "@/lib/criativos/contexto-do-negocio";

export function OrigemDoCampo({ campo, valor }: { campo?: CampoDoPreparo | null; valor: string }) {
  if (!campo) return null;
  return <small>{campo.valor !== valor ? "Editado para este preparo; o cadastro continua igual." : <>
    {campo.estado === "confirmado_cliente" ? "Confirmado por você na etapa da marca" : "Informado por você no cadastro; confira para este criativo"}
    {campo.em ? ` · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(campo.em))}` : ""}.
  </>}</small>;
}

export function ContextoDoNegocio({ contexto }: { contexto?: ContextoDoCriativo }) {
  if (!contexto) return null;
  return <details>
    <summary>Contexto salvo deste negócio</summary>
    <p>Respostas do seu cadastro, para você revisar. Não são comprovação de resultado nem aprovação de uso por IA. Correções aqui valem apenas para este preparo.</p>
    <dl>{contexto.apoio.map(({ rotulo, campo }) => <div key={campo.origem}>
      <dt>{rotulo}</dt><dd>{campo.valor} <OrigemDoCampo campo={campo} valor={campo.valor} /></dd>
    </div>)}</dl>
    {contexto.materiais ? <p>{contexto.materiais.logos} logo(s), {contexto.materiais.fotos} foto(s) com tipo informado e {contexto.materiais.semTipo} imagem(ns) sem tipo no cadastro. <a href="/conta">Rever materiais na Conta</a>. Nenhum arquivo é anexado ou enviado automaticamente.</p>
      : <p>Não foi possível conferir os materiais e as cores agora. <a href="/conta">Confira na Conta</a> ou preencha o que faltar neste preparo.</p>}
  </details>;
}
