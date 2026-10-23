import { exigirArea } from "@/lib/auth/guards";
import { ROLES_GRUPO } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import GrupoShell from "../_components/EscolaShell";

export default async function GrupoProtectedLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirArea(ROLES_GRUPO, { login: "/login", area: "/grupo" });

  let grupoNome: string | null = null;
  if (usuario.organizacao_id) {
    const supabase = await createClient();
    const { data } = await supabase.from("grupos").select("nome").eq("id", usuario.organizacao_id).maybeSingle();
    grupoNome = (data?.nome as string | undefined) ?? null;
  }

  return (
    <GrupoShell usuario={{ nome: usuario.nome, email: usuario.email }} grupoNome={grupoNome} diretor={usuario.role !== "org_membro"}>
      {children}
    </GrupoShell>
  );
}
