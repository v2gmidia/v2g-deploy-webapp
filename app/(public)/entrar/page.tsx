"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CriteriosSenha } from "@/components/ui/CriteriosSenha";
import { IconeVisibilidadeSenha as IconeVisibilidade } from "@/components/ui/IconeVisibilidadeSenha";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { SITE_PUBLICO_ORIGEM } from "@/lib/site-publico";
import { forcaDaSenha } from "@/lib/auth-senha";
import { lerDocumentoContratante } from "@/lib/contratacao/documento-contratante";
import { signInAction, signUpAction, type AuthActionState } from "./actions";

const initialState: AuthActionState = {};

export default function EntrarPage() {
  return (
    <Suspense fallback={<EntradaEditorial><h1>Carregando seu acesso…</h1><p role="status">Preparando o formulário de entrada.</p></EntradaEditorial>}>
      <EntrarContent />
    </Suspense>
  );
}

function EntrarContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const adicionar = searchParams.get("adicionar") === "1";
  const mode = searchParams.get("modo") === "cadastro" ? "cadastro" : "login";
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [whatsappCadastro, setWhatsappCadastro] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaRepetida, setSenhaRepetida] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarRepeticao, setMostrarRepeticao] = useState(false);
  const cnpjInvalido = cnpj.replace(/\D/g, "").length >= 11 && !lerDocumentoContratante(cnpj);
  const forca = forcaDaSenha(senhaNova);
  const repeticaoDiferente = senhaRepetida.length > 0 && senhaNova !== senhaRepetida;
  const destino = (modo: "cadastro" | "login") => {
    const busca = new URLSearchParams({ modo });
    if (next) busca.set("next", next);
    if (adicionar) busca.set("adicionar", "1");
    return `/entrar?${busca.toString()}`;
  };

  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <EntradaEditorial>
        <nav className="entrada-modos" aria-label="Acesso à conta">
          <a href={destino("login")} aria-current={mode === "login" ? "page" : undefined}>Entrar</a>
          <a href={destino("cadastro")} aria-current={mode === "cadastro" ? "page" : undefined}>Primeiro acesso</a>
        </nav>
        {mode === "cadastro" ? (
          <>
            <h1>Vamos criar seu acesso.</h1>
            <p className="entrada-introducao">O primeiro acesso é liberado após a aprovação da compra. Use o e-mail e o CPF ou CNPJ do contratante informados no pedido.</p>

            {signUpState.error && <p className="form-error" role="alert">{signUpState.error}</p>}
            {signUpState.message && <p className="form-notice" role="status">{signUpState.message}</p>}

            <form action={signUpFormAction}>
              <input type="hidden" name="next" value={next} />
              <div className="field">
                <label htmlFor="nome">Seu nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Como você gosta de ser chamado?"
                  autoComplete="name"
                  value={nomeCadastro}
                  onChange={evento => setNomeCadastro(evento.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">Seu WhatsApp</label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 91234-5678"
                  autoComplete="tel"
                  value={whatsappCadastro}
                  onChange={evento => setWhatsappCadastro(evento.target.value)}
                  required
                />
                <p className="note">
                  É por aqui que a gente avisa quando algo precisa de você. Usamos só para
                  isso — nada de spam, nada de vender sua lista.
                </p>
              </div>
              <div className="field">
                <label htmlFor="email-cadastro">Seu melhor e-mail</label>
                <input
                  id="email-cadastro"
                  name="email"
                  type="email"
                  placeholder="voce@seunegocio.com.br"
                  autoComplete="email"
                  value={emailCadastro}
                  onChange={evento => setEmailCadastro(evento.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cnpj-cadastro">CPF ou CNPJ do contratante</label>
                <input id="cnpj-cadastro" name="cnpj" type="text" inputMode="numeric"
                  minLength={11} maxLength={18} value={cnpj}
                  onChange={evento => setCnpj(evento.target.value)}
                  placeholder="CPF ou CNPJ usado na compra" autoComplete="off"
                  aria-invalid={cnpjInvalido} aria-describedby="cnpj-ajuda" required />
                {cnpjInvalido && <p className="entrada-validacao entrada-validacao-erro" id="cnpj-ajuda" role="status">Confira os 11 dígitos do CPF ou os 14 do CNPJ.</p>}
                {!cnpjInvalido && <p className="note" id="cnpj-ajuda">Use o CPF ou CNPJ do contratante informado no pedido, com ou sem pontuação.</p>}
                <p className="note">Um login pode acessar mais de um negócio. O documento não junta os cadastros.</p>
              </div>
              <div className="field">
                <label htmlFor="senha-cadastro">Crie uma senha</label>
                <span className="entrada-campo-senha"><input
                  id="senha-cadastro" name="senha" type={mostrarSenha ? "text" : "password"}
                  placeholder="Crie sua senha" autoComplete="new-password"
                  value={senhaNova} onChange={evento => setSenhaNova(evento.target.value)}
                  aria-describedby="forca-senha criterios-senha" required
                /><button type="button" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(valor => !valor)}>
                  <IconeVisibilidade visivel={mostrarSenha} /></button></span>
                {forca !== "vazia" && <div className={`entrada-forca entrada-forca-${forca}`} id="forca-senha" role="status">
                  <span aria-hidden="true"><i /><i /><i /></span>
                  <strong>{forca === "forte" ? "Critérios atendidos" : "Confira os critérios da senha"}</strong>
                  {forca !== "forte" && <small>Inclua os itens abaixo para criar o acesso.</small>}
                </div>}
                <CriteriosSenha senha={senhaNova} id="criterios-senha" />
              </div>
              <div className="field">
                <label htmlFor="senha-confirmar-cadastro">Repita a senha</label>
                <span className="entrada-campo-senha"><input
                  id="senha-confirmar-cadastro" name="confirmarSenha"
                  type={mostrarRepeticao ? "text" : "password"}
                  placeholder="Digite a mesma senha" autoComplete="new-password"
                  value={senhaRepetida} onChange={evento => setSenhaRepetida(evento.target.value)}
                  aria-invalid={repeticaoDiferente}
                  aria-describedby={repeticaoDiferente ? "confirmacao-senha" : undefined} required
                /><button type="button" aria-label={mostrarRepeticao ? "Ocultar confirmação" : "Mostrar confirmação"}
                  aria-pressed={mostrarRepeticao} onClick={() => setMostrarRepeticao(valor => !valor)}>
                  <IconeVisibilidade visivel={mostrarRepeticao} /></button></span>
                {repeticaoDiferente && <p className="entrada-validacao entrada-validacao-erro" id="confirmacao-senha" role="status">As senhas estão diferentes.</p>}
              </div>
              <Button type="submit" disabled={signUpPending || cnpjInvalido || forca !== "forte" || senhaNova !== senhaRepetida}>
                {signUpPending ? "Criando conta…" : "Criar minha conta"}
              </Button>
            </form>

            <p className="entrada-ajuda">Ainda não contratou? <a href={`${SITE_PUBLICO_ORIGEM}/#plano`}>Conheça o plano V2G.</a></p>
          </>
        ) : (
          <>
            <h1>Bom te ver de novo.</h1>
            <p className="entrada-introducao">Entre para acompanhar seus anúncios e os próximos passos do seu negócio.</p>

            {signInState.error && <p className="form-error" role="alert">{signInState.error}</p>}

            <form action={signInFormAction}>
              <input type="hidden" name="next" value={next} />
              <div className="field">
                <label htmlFor="email-login">E-mail</label>
                <input
                  id="email-login"
                  name="email"
                  type="email"
                  placeholder="voce@seunegocio.com.br"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <div className="entrada-senha-label">
                  <label htmlFor="senha-login">Senha</label>
                  <a href="/recuperar">Esqueci minha senha</a>
                </div>
                <input
                  id="senha-login"
                  name="senha"
                  type="password"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={signInPending}>
                {signInPending ? "Entrando…" : "Entrar"}
              </Button>
            </form>

            <p className="entrada-ajuda">Já contratou e ainda não tem acesso? <a href={destino("cadastro")}>Crie sua conta.</a></p>
          </>
        )}
    </EntradaEditorial>
  );
}
