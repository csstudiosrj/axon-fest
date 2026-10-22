import { exigirArea } from "@/lib/auth/guards";
import { ROLES_OPERADOR } from "@/lib/auth/roles";
import OperadorGate from "./_components/OperadorGate";

// Caixa/bilheteria (mobile): exige login com cargo de operador (ou gestão da
// produtora) e, em seguida, o PIN do PDV da produtora, validado no servidor.
export default async function OperadorLayout({ children }: { children: React.ReactNode }) {
  await exigirArea(ROLES_OPERADOR, { login: "/login", area: "/caixa" });

  return <OperadorGate>{children}</OperadorGate>;
}
