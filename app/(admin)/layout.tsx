import { exigirArea } from "@/lib/auth/guards";
import { ROLES_PAINEL_ADMIN } from "@/lib/auth/roles";
import { pode } from "@/lib/auth/permissoes";
import { createAdminClient } from "@/lib/supabase/server";
import { hojeSP } from "@/lib/faturas/calculo";
import AdminShell, { type AvisoFatura } from "./_components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sessão validada no servidor (getUser) + cargo do painel da produtora
  const usuario = await exigirArea(ROLES_PAINEL_ADMIN, { login: "/login", area: "/dashboard" });

  // Faixa no topo: fatura do ARXUM em aberto (só para quem vê as faturas)
  let avisoFatura: AvisoFatura | null = null;
  if (usuario.produtora_id && pode(usuario.role, "faturas")) {
    const { data: aberta } = await createAdminClient().from("faturas").select("valor_total, vencimento")
      .eq("produtora_id", usuario.produtora_id).eq("status", "aberta").order("vencimento").limit(1).maybeSingle();
    if (aberta) avisoFatura = { valor: Number(aberta.valor_total), vencimento: aberta.vencimento, vencida: aberta.vencimento < hojeSP() };
  }

  return (
    <AdminShell
      userEmail={usuario.email}
      userName={usuario.nome || "Organizador"}
      userRole={usuario.role}
      bloqueado={usuario.bloqueio_financeiro}
      avisoFatura={avisoFatura}
    >
      {children}
    </AdminShell>
  );
}
