import { carregarMarcaAction } from "../marca/actions";
import { Conclusao } from "./Conclusao";

export default async function OnboardingConcluidoPage() {
  const estado = await carregarMarcaAction();
  return <Conclusao estado={estado} />;
}
