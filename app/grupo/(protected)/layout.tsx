import { exigirArea } from "@/lib/auth/guards";
import { ROLES_GRUPO } from "@/lib/auth/roles";
import GrupoShell from "../_components/EscolaShell";

export default async function GrupoProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirArea(ROLES_GRUPO, { login: "/grupo/login", area: "/grupo" });

  return <GrupoShell>{children}</GrupoShell>;
}
