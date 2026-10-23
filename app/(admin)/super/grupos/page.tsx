import { createAdminClient } from "@/lib/supabase/server";
import { listarGrupos } from "@/lib/super/dados";
import { AcoesOrganizacao } from "../Acoes";
import { Busca, Cabecalho, Contagem, Exportar, dataBR } from "../_ui";

export default async function SuperGrupos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const admin = createAdminClient();
  const { linhas, total } = await listarGrupos(q, admin);
  // Responsável (diretor) de cada grupo, para "entrar como"
  const { data: diretores } = linhas.length
    ? await admin.from("usuarios").select("id, organizacao_id").eq("role", "org_admin").in("organizacao_id", linhas.map((g) => g.id))
    : { data: [] };

  return (
    <>
      <Cabecalho titulo="Grupos" texto="Escolas, companhias e grupos. O cadastro é único e vale para os festivais de todas as produtoras.">
        <Exportar tipo="grupos" q={q} />
      </Cabecalho>
      <Busca q={q} placeholder="Buscar por nome, responsável, e-mail ou CPF/CNPJ" />
      <Contagem mostrando={linhas.length} total={total} />
      <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
        {linhas.map((g) => (
          <li key={g.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${g.ativo ? "" : "opacity-60"}`}>
            <div className="min-w-[240px] flex-1">
              <p className="text-sm font-medium text-white">{g.nome} {!g.ativo && <span className="ml-1 text-xs text-red-300">bloqueado</span>}</p>
              <p className="text-xs text-gray-400">{[g.documento, g.responsavel, g.email, g.telefone, g.cidade].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-gray-500">Chegou pela produtora <span className="text-gray-300">{g.origem}</span> · {g.festivais} festival(is) · desde {dataBR(g.criadoEm)}</p>
            </div>
            <AcoesOrganizacao tipo="grupo" id={g.id} nome={g.nome} ativo={g.ativo} responsavelId={(diretores ?? []).find((d) => d.organizacao_id === g.id)?.id ?? null} />
          </li>
        ))}
      </ul>
    </>
  );
}
