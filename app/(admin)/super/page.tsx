import { exigirArea } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { PainelSuper } from "./PainelSuper";

// Painel do dono do SaaS: valores comerciais, dados da empresa e demonstração
export default async function SuperAdminPage() {
  await exigirArea(["super_admin"], { login: "/login", area: "/super" });

  const admin = createAdminClient();
  const [{ data: config }, { data: demo }] = await Promise.all([
    admin.from("configuracoes_sistema").select("chave, valor"),
    admin.from("produtoras").select("id, nome, created_at").eq("demonstracao", true).maybeSingle(),
  ]);

  return (
    <PainelSuper
      configuracoes={Object.fromEntries((config ?? []).map((c) => [c.chave as string, c.valor as Record<string, unknown>]))}
      demonstracao={demo as { id: string; nome: string; created_at: string } | null}
    />
  );
}
