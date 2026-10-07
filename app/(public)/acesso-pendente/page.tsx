import { signOutAction } from "@/app/(protected)/actions";

export default function AcessoPendentePage() {
  return (
    <div className="auth-card">
      <h1 className="auth-h">Seu acesso ainda não foi liberado</h1>
      <p className="auth-sub">
        O WebApp abre depois que a V2G aprova o pagamento. Se você já enviou
        o comprovante, aguarde a confirmação da equipe. Não é necessário
        criar outra conta nem pagar novamente.
      </p>
      <p className="note">
        Após a liberação, entre com o mesmo e-mail usado na compra. O contrato
        e a reunião serão próximos passos dentro da sua jornada.
      </p>
      <form action={signOutAction}>
        <button className="link-btn" type="submit">Sair desta conta</button>
      </form>
    </div>
  );
}
