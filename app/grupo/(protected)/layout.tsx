import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ROLES_GRUPO = ["org_admin", "org_membro"];

export default async function GrupoProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/grupo/login");
  }

  const { data: userData, error } = await supabase
    .from("usuarios")
    .select("role, organizacao_id")
    .eq("id", session.user.id)
    .single();

  if (error || !userData || !ROLES_GRUPO.includes(userData.role)) {
    redirect("/grupo/login");
  }

  return <>{children}</>;
}