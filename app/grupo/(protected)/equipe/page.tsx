import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { exigirUsuarioGrupo } from "@/lib/grupo/contexto";
import { EquipeGrupo, type PessoaGrupo } from "./EquipeGrupo";

export const dynamic = "force-dynamic";

export default async function PaginaEquipeGrupo() {
  const usuario = await exigirUsuarioGrupo();
  if (usuario.role === "org_membro") redirect("/grupo/dashboard");
  const admin = createAdminClient();
  const { data } = await admin.from("usuarios").select("id, nome, email, role, ativo")
    .eq("organizacao_id", usuario.organizacao_id).in("role", ["org_admin", "org_membro"]).order("nome");
  const contas = await Promise.all((data ?? []).map((u) => admin.auth.admin.getUserById(u.id).then((r) => r.data.user).catch(() => null)));
  const pessoas: PessoaGrupo[] = (data ?? []).map((u, i) => ({
    id: u.id, nome: u.nome, email: u.email, diretor: u.role === "org_admin", ativo: u.ativo, pendente: !contas[i]?.last_sign_in_at,
  }));
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Equipe do grupo</h2>
        <p className="mt-1 text-sm text-gray-400">Coreógrafos(as) cadastram as próprias coreografias, o elenco delas e enviam as músicas. Não veem valores nem as coreografias dos outros.</p>
      </div>
      <EquipeGrupo pessoas={pessoas} euId={usuario.id} />
    </div>
  );
}
