"use client";

import { useState, type ReactNode } from "react";
import { TelaDeConta } from "@/app/(protected)/conta/TelaDeConta";

export function ContaClean({ preferencias }: { preferencias: ReactNode }) {
  const [nome, setNome] = useState("Cliente de exemplo");
  const [rascunho, setRascunho] = useState(nome);
  const [aviso, setAviso] = useState("");
  const [conectada, setConectada] = useState(true);
  const [acesso, setAcesso] = useState("");
  const [plano, setPlano] = useState("");
  return <TelaDeConta previa secoes={[
    { id: "perfil", titulo: "Seu perfil", resumo: nome, detalhe: "cliente@example.com", acao: "Editar perfil", avatar: nome.charAt(0).toUpperCase(),
      conteudo: <form className="form-card" onSubmit={e => { e.preventDefault(); if (!rascunho.trim()) { setAviso("Informe seu nome."); return; } setNome(rascunho.trim()); setAviso("Perfil salvo apenas nesta prévia."); }}>
        <div className="field-row"><div className="field"><label htmlFor="previa-nome">Seu nome</label><input id="previa-nome" value={rascunho} required maxLength={100} onChange={e => setRascunho(e.target.value)} /></div>
        <div className="field"><label htmlFor="previa-whatsapp">WhatsApp</label><input id="previa-whatsapp" type="tel" placeholder="DDD e número" /></div></div>
        {aviso && <p className="form-notice" role="status">{aviso}</p>}<button type="submit" className="cta ghost">Salvar perfil</button>
      </form> },
    { id: "negocio", titulo: "Seu negócio", resumo: "Meu negócio", detalhe: "Cadastro e identidade visual", acao: "Ver dados", conteudo: <>
      <p>Os dados e a identidade visual deste negócio aparecem aqui.</p><p className="hint">Nesta prévia, nenhum cadastro real é consultado ou alterado.</p>
      <details><summary>Atualizações do negócio</summary><p>Os retornos sobre seu cadastro ficam nesta seção.</p></details>
    </> },
    { id: "conexoes", titulo: "Conexões", resumo: "Facebook e Instagram", detalhe: "Conta de anúncios e perfis vinculados", acao: conectada ? "Conectado" : "Reconectar", conteudo: <>
      <p>Conta de exemplo · Meu negócio · @negocio.exemplo</p>
      {!conectada && <p className="form-warning">A conexão precisa ser refeita. Esta pendência aparece junto da ação para resolver.</p>}
      <p className="hint">Conexão ilustrativa. Nenhuma conta externa é alterada.</p>
      <button className="cta ghost" type="button" onClick={() => setConectada(!conectada)}>{conectada ? "Testar conexão interrompida" : "Reconectar nesta prévia"}</button>
    </> },
    { id: "plano", titulo: "Plano e contrato", resumo: "Gestão de anúncios", detalhe: "Contratação, pagamentos e documentos", acao: "Ver detalhes", conteudo: <>
      <p>1 conta · exemplo</p><p>Nenhum pagamento ou contrato real nesta prévia.</p>
      <button className="cta ghost" type="button" onClick={() => setPlano("Na conta autenticada, esta ação abre o atendimento. Nenhuma mensagem foi enviada.")}>Falar sobre meu plano</button>
      {plano && <p className="form-notice" role="status">{plano}</p>}
    </> },
    { id: "preferencias", titulo: "Preferências", resumo: "Aparência", detalhe: "Claro, escuro ou do aparelho", acao: "Escolher tema", conteudo: preferencias },
    { id: "acesso", titulo: "Acesso", resumo: "E-mail e senha", detalhe: "cliente@example.com", acao: "Gerenciar", conteudo: <>
      <p>A recuperação da senha acontece pelo e-mail de acesso.</p><button className="cta ghost" type="button" onClick={() => setAcesso("Recuperação simulada. Nenhum e-mail foi enviado e sua senha não foi alterada.")}>Testar recuperação de senha</button>
      {acesso && <p className="form-notice" role="status">{acesso}</p>}
    </> },
  ]} saida={<Saida />} />;
}
function Saida() {
  const [aviso, setAviso] = useState(false);
  return <div><button type="button" className="cta ghost" onClick={() => setAviso(true)}>Sair da conta</button>{aviso && <p className="form-notice" role="status">Saída simulada. Sua sessão real continua aberta.</p>}</div>;
}
