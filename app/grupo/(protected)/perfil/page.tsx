import { createClient } from "@/lib/supabase/server";
import { exigirUsuarioGrupo } from "@/lib/grupo/contexto";
import { DadosGrupo } from "./DadosGrupo";

export const dynamic = "force-dynamic";

export default async function PaginaDadosGrupo() {
  const usuario = await exigirUsuarioGrupo();
  const supabase = await createClient();
  const { data: grupo } = await supabase
    .from("grupos")
    .select("id, nome, responsavel, telefone, email, email_contato, cidade, estado, cep, logradouro, numero, complemento, bairro, documento, tipo_documento")
    .eq("id", usuario.organizacao_id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Dados do grupo</h1>
        <p className="mt-1 text-sm text-gray-400">Aparecem para a produção dos festivais em que o grupo se inscreve.</p>
      </div>
      {grupo ? (
        <DadosGrupo grupo={grupo as Parameters<typeof DadosGrupo>[0]["grupo"]} podeEditar={usuario.role !== "org_membro"} />
      ) : (
        <p className="text-sm text-red-300">Grupo não encontrado.</p>
      )}
    </div>
  );
}
