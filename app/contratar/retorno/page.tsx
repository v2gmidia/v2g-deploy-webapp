import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Pedido recebido | V2G", robots: { index: false, follow: false } };

export default function RetornoDoCheckout() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main className="auth-wrap" style={{ minHeight: "70vh", padding: "60px 24px" }}>
    <h1>Seu pedido está em confirmação.</h1>
    <p>O retorno do checkout não confirma o pagamento. Assim que o provedor confirmar, você poderá criar o acesso com o e-mail e o CNPJ informados na compra.</p>
    <p><Link href="/entrar?modo=cadastro">Tentar criar meu acesso</Link></p>
  </main>;
}
