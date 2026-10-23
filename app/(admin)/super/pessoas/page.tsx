import { listarPessoas } from "@/lib/super/dados";
import { CARGOS } from "@/lib/auth/cargos";
import { AcoesConta } from "../Acoes";
import { Busca, Cabecalho, Contagem, Exportar, dataBR } from "../_ui";

const CARGOS_FILTRO = ["admin", "produtor", "financeiro", "marketing", "operador", "jurado", "org_admin", "org_membro", "super_admin"];

export default async function SuperPessoas({ searchParams }: { searchParams: Promise<{ q?: string; cargo?: string }> }) {
  const { q, cargo } = await searchParams;
  const { linhas, total } = await listarPessoas(q, CARGOS_FILTRO.includes(cargo ?? "") ? cargo : undefined);

  return (
    <>
      <Cabecalho titulo="Pessoas" texto="Todas as contas de acesso: equipes das produtoras, jurados, operadores e responsáveis por grupos.">
        <Exportar tipo="pessoas" q={q} cargo={cargo} />
      </Cabecalho>
      <Busca q={q} placeholder="Buscar por nome ou e-mail" extra={
        <select name="cargo" defaultValue={cargo ?? ""} aria-label="Cargo" className="rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white">
          <option value="">Todos os cargos</option>
          {CARGOS_FILTRO.map((c) => <option key={c} value={c}>{CARGOS[c]?.nome ?? c}</option>)}
        </select>
      } />
      <Contagem mostrando={linhas.length} total={total} />
      <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
        {linhas.map((p) => (
          <li key={p.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${p.ativo ? "" : "opacity-60"}`}>
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-medium text-white">{p.nome ?? p.email} {!p.ativo && <span className="ml-1 text-xs text-red-300">bloqueada</span>}</p>
              <p className="text-xs text-gray-400">{p.email} · <span className="text-gray-300">{p.cargoNome}</span> · {p.onde}</p>
              <p className="text-xs text-gray-500">Criada em {dataBR(p.criadoEm)} · {p.ultimoAcesso ? `último acesso ${dataBR(p.ultimoAcesso)}` : "nunca acessou"}</p>
            </div>
            {p.cargo !== "super_admin" && <AcoesConta id={p.id} nome={p.nome ?? p.email} email={p.email} ativo={p.ativo} />}
          </li>
        ))}
      </ul>
    </>
  );
}
