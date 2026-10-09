import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { Marca } from "@/components/ui/Marca";
import { FormularioContratar } from "./FormularioContratar";
import "./contratar.css";

export const metadata = { title: "Contratar | V2G", robots: { index: false, follow: false } };

export default function ContratarPage() {
  // A rota não entra em produção até existir teste em sandbox e liberação explícita.
  if (process.env.NODE_ENV === "production") notFound();
  return <main className="contratar-shell">
    <header className="contratar-topo"><Marca href="/entrar" /><a href="/entrar">Já tenho acesso</a></header>
    <div className="contratar-grid">
      <section className="contratar-intro" aria-labelledby="contratar-titulo">
        <h1 id="contratar-titulo">Seus anúncios, com acompanhamento de perto.</h1>
        <p>A V2G cuida da operação de mídia. Você acompanha os próximos passos do negócio e, quando houver dados disponíveis, o desempenho dos anúncios.</p>
        <p className="contratar-proximo">Depois da compra aprovada, você cria seu acesso, preenche as informações do negócio e escolhe um horário para conversar com o gestor. A primeira campanha é publicada por ele após os preparativos.</p>
        <p className="contratar-limite">A verba de anúncios é paga à parte. Nesta fase, você precisa informar o CNPJ da empresa e vender por conversa no WhatsApp.</p>
      </section>
      <FormularioContratar referencia={randomUUID()} apiAtiva={process.env.V2G_CHECKOUT_API_ENABLED === "true"} />
    </div>
  </main>;
}
