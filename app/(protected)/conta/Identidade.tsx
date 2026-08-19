"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import type { ImagemDeIdentidade } from "@/lib/identidade/armazenar";
import { MAXIMO_DE_FOTOS } from "@/lib/identidade/regras";
import {
  enviarImagemAction,
  removerImagemAction,
  type IdentidadeState,
} from "./identidade-actions";
import { TEXTO_DA_DECLARACAO } from "./declaracao";

const inicial: IdentidadeState = {};

interface Props {
  logo: ImagemDeIdentidade | null;
  fotos: ImagemDeIdentidade[];
}

export function Identidade({ logo, fotos }: Props) {
  return (
    <>
      {/* O AVISO VEM ANTES DO SELETOR, e não depois nem em link. Depois do
          upload é tarde: o arquivo já está no nosso servidor, e o problema
          deixa de ser evitar e passa a ser apagar. */}
      <div className="id-aviso">
        <b>Sobre foto com gente</b>
        <p>{TEXTO_DA_DECLARACAO}</p>
        <p className="id-saida">
          Tem uma foto boa com alguém da sua equipe?{" "}
          <a
            href="https://wa.me/5521980351531?text=Oi!%20Tenho%20uma%20foto%20com%20algu%C3%A9m%20da%20minha%20equipe%20e%20queria%20usar%20no%20an%C3%BAncio."
            target="_blank"
            rel="noopener"
          >
            Fala com a gente
          </a>{" "}
          que a gente resolve junto com você.
        </p>
      </div>

      <BlocoDoLogo logo={logo} />
      <BlocoDasFotos fotos={fotos} />
    </>
  );
}

/**
 * CADA FORMULÁRIO TEM O PRÓPRIO ESTADO, e não é organização: é o que faz a
 * mensagem nascer ao lado do botão que a gerou.
 *
 * A primeira versão tinha um `useActionState` para a seção inteira e
 * imprimia o recado no topo. Quem clicava em "Enviar foto" lá embaixo,
 * depois de dez miniaturas, recebia a recusa fora do campo de visão — e
 * recusa que não é vista vira "cliquei e não aconteceu nada", que é o
 * pior dos dois mundos: o erro existiu e a pessoa não soube.
 */
function BlocoDoLogo({ logo }: { logo: ImagemDeIdentidade | null }) {
  const [envio, enviar, enviando] = useActionState(enviarImagemAction, inicial);
  const [remocao, remover] = useActionState(removerImagemAction, inicial);

  return (
    <div className="id-bloco">
      <div className="id-cabeca">
        <b>Logo</b>
        <span className="hint">PNG, fundo transparente, a partir de 512 pixels</span>
      </div>

      {logo ? (
        <div className="id-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.url ?? ""} alt="Logo do seu negócio" />
          <div className="id-logo-lado">
            <span className="hint">{logo.nomeDoArquivo}</span>
            <form action={remover}>
              <input type="hidden" name="id" value={logo.id} />
              <button type="submit" className="btn-linha fraco">
                remover
              </button>
            </form>
            <Recado estado={remocao} />
          </div>
        </div>
      ) : (
        // Estado vazio honesto: diz que não há logo. Não desenha um
        // genérico nem uma moldura que finge conteúdo.
        <p className="id-vazio">Você ainda não mandou seu logo.</p>
      )}

      <form action={enviar} className="id-form">
        <input type="hidden" name="uso" value="logo" />
        <input
          type="file"
          name="arquivo"
          accept="image/png"
          className="id-arquivo"
          aria-label="Escolher logo"
        />
        <Button type="submit" disabled={enviando}>
          {logo ? "Substituir logo" : "Enviar logo"}
        </Button>
      </form>

      <Recado estado={envio} />

      {logo && (
        <p className="hint">
          Ao substituir, o logo novo passa a valer nas próximas peças. As que já foram ao ar
          continuam como estão.
        </p>
      )}
    </div>
  );
}

function BlocoDasFotos({ fotos }: { fotos: ImagemDeIdentidade[] }) {
  const [envio, enviar, enviando] = useActionState(enviarImagemAction, inicial);
  const [remocao, remover] = useActionState(removerImagemAction, inicial);

  return (
    <div className="id-bloco">
      <div className="id-cabeca">
        <b>Fachada e ambiente</b>
        <span className="hint">
          JPG ou PNG, a partir de 1080 pixels · {fotos.length} de {MAXIMO_DE_FOTOS}
        </span>
      </div>

      {fotos.length > 0 ? (
        <>
          <ul className="id-galeria">
            {fotos.map((f) => (
              <li key={f.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url ?? ""} alt={f.nomeDoArquivo ?? "Foto do seu negócio"} />
                <form action={remover}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="btn-linha fraco">
                    remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <Recado estado={remocao} />
        </>
      ) : (
        <p className="id-vazio">
          Nenhuma foto ainda. A fachada, o ambiente e o produto ajudam o anúncio a parecer o seu
          negócio, e não um genérico.
        </p>
      )}

      {fotos.length < MAXIMO_DE_FOTOS && (
        <>
          <form action={enviar} className="id-form">
            <input type="hidden" name="uso" value="identidade" />
            <input
              type="file"
              name="arquivo"
              accept="image/jpeg,image/png"
              className="id-arquivo"
              aria-label="Escolher foto"
            />
            <Button type="submit" disabled={enviando}>
              Enviar foto
            </Button>
          </form>
          <Recado estado={envio} />
        </>
      )}
    </div>
  );
}

/**
 * `role="status"` e não `role="alert"`: alert interrompe o leitor de tela
 * na hora, e isso é para coisa que não pode esperar. Aqui a pessoa acabou
 * de clicar e está esperando resposta — status anuncia sem atropelar.
 */
function Recado({ estado }: { estado: IdentidadeState }) {
  const texto = estado.erro ?? estado.ok;
  if (!texto) return null;
  return (
    <p className={estado.erro ? "id-recado erro" : "id-recado"} role="status">
      {texto}
    </p>
  );
}
