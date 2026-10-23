import { listarParticipantes } from "@/lib/super/dados";
import { Busca, Cabecalho, Contagem, Exportar, dataBR } from "../_ui";

export default async function SuperParticipantes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { linhas, total } = await listarParticipantes(q);

  return (
    <>
      <Cabecalho titulo="Participantes" texto="Cadastro único de cada pessoa (por CPF), com a produtora e o grupo por onde chegou ao ARXUM Fest.">
        <Exportar tipo="participantes" q={q} />
      </Cabecalho>
      <Busca q={q} placeholder="Buscar por nome, e-mail ou CPF" />
      <Contagem mostrando={linhas.length} total={total} />
      <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
        {linhas.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-[240px] flex-1">
              <p className="text-sm font-medium text-white">{p.nome}</p>
              <p className="text-xs text-gray-400">{[p.cpf, p.idade !== null ? `${p.idade} anos` : null, p.email].filter(Boolean).join(" · ")}</p>
              <p className="text-xs text-gray-500">
                Chegou pelo grupo <span className="text-gray-300">{p.origemGrupo}</span> da produtora <span className="text-gray-300">{p.origemProdutora}</span> · {p.grupos} grupo(s) · desde {dataBR(p.criadoEm)}
              </p>
            </div>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${p.termo ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-300"}`}>{p.termo ? "Termo assinado" : "Termo pendente"}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
