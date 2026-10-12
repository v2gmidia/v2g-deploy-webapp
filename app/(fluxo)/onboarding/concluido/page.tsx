import { carregarMarcaAction } from "../marca/actions";
import { Conclusao } from "./Conclusao";
import "../onboarding-editorial.css";

export default async function OnboardingConcluidoPage() {
  const estado = await carregarMarcaAction();
  return <Conclusao estado={estado} />;
}
