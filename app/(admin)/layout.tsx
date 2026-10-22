import { exigirArea } from "@/lib/auth/guards";
import { ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";
import AdminShell from "./_components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sessão validada no servidor (getUser) + cargo do painel da produtora
  const usuario = await exigirArea(ROLES_PAINEL_ADMIN, { login: "/login", area: "/dashboard" });

  return (
    <AdminShell
      userEmail={usuario.email}
      userName={usuario.nome || "Organizador"}
      userRole={usuario.role}
    >
      {children}
    </AdminShell>
  );
}
