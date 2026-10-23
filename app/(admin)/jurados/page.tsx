import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { exigirAcesso } from "@/lib/auth/guards";
import { podeAtribuir } from "@/lib/auth/roles";
import { carregarJurados } from "@/lib/equipe";
import { createClient } from "@/lib/supabase/server";
import { CadastroJurados } from "./CadastroJurados";

export const dynamic = "force-dynamic";

export default async function PaginaJurados() {
  const usuario = await exigirAcesso("jurados");
  if (!usuario.produtora_id) {
    return <p className="mx-auto max-w-3xl text-sm text-gray-400">Os jurados são cadastrados por produtora. Sua conta não está ligada a uma produtora; use o Super Admin.</p>;
  }
  const jurados = await carregarJurados(usuario.produtora_id);
  const supabase = await createClient();
  const { data: vinculos } = jurados.length
    ? await supabase.from("evento_jurados").select("jurado_id, eventos ( id, nome )").in("jurado_id", jurados.map((j) => j.id))
    : { data: [] };
  const eventos: Record<string, { id: string; nome: string }[]> = {};
  for (const v of vinculos ?? []) {
    if (!v.jurado_id || !v.eventos) continue;
    (eventos[v.jurado_id] ??= []).push({ id: v.eventos.id, nome: v.eventos.nome });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Jurados</h1>
          <p className="mt-1 text-sm text-gray-400">
            Cadastro dos jurados da produtora. Para escalar um jurado num evento, abra o evento → aba Jurados.
          </p>
        </div>
        <Link href="/jurados/apuracao" className="inline-flex items-center gap-2 rounded-lg border border-axon-gold/40 px-4 py-2 text-sm font-semibold text-axon-gold hover:bg-axon-gold/10">
          <ClipboardCheck size={15} /> Apuração das notas
        </Link>
      </div>
      <CadastroJurados jurados={jurados} eventos={eventos} podeGerir={podeAtribuir(usuario.role, "jurado")} />
    </div>
  );
}
