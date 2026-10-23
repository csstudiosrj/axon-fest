import { createAdminClient } from "@/lib/supabase/server";
import { Cabecalho } from "../_ui";

// O que o super admin fez: bloqueios, trocas de e-mail, acessos como outro usuário, planos…
export default async function SuperRegistro() {
  const admin = createAdminClient();
  const { data } = await admin.from("registro_super").select("id, acao, alvo_tipo, alvo_nome, detalhes, criado_em, usuarios:ator_id ( nome, email )")
    .order("criado_em", { ascending: false }).limit(300);
  return (
    <>
      <Cabecalho titulo="Registro de ações" texto="Últimas 300 ações feitas no Super Admin." />
      {(data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-10 text-center text-sm text-gray-400">Nenhuma ação registrada ainda.</p>
      ) : (
        <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
          {(data ?? []).map((r) => {
            const ator = Array.isArray(r.usuarios) ? r.usuarios[0] : r.usuarios;
            const det = r.detalhes as Record<string, unknown> | null;
            return (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3 text-sm">
                <span className="w-36 shrink-0 text-xs tabular-nums text-gray-500">{new Date(r.criado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</span>
                <span className="text-white">{r.acao}</span>
                {r.alvo_nome && <span className="text-gray-300">· {r.alvo_nome}</span>}
                {det?.de !== undefined && <span className="text-xs text-gray-500">({String(det.de)} → {String(det.para)})</span>}
                <span className="ml-auto text-xs text-gray-500">{ator?.nome ?? ator?.email ?? "—"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
