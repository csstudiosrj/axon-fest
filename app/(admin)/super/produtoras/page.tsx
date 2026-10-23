import { createAdminClient } from "@/lib/supabase/server";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { NOME_FASE, situacaoPlano, taxaCaixa, type PlanoProdutora as Plano } from "@/lib/planos";
import { vendasCaixaDoMes } from "@/lib/planos-servidor";
import { listarProdutoras } from "@/lib/super/dados";
import { AcoesOrganizacao } from "../Acoes";
import { Busca, Cabecalho, Contagem, Exportar, dataBR } from "../_ui";
import { PlanoProdutora } from "./PlanoProdutora";

export default async function SuperProdutoras({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const admin = createAdminClient();
  const [{ linhas, total }, { data: catalogo }, { precos }, { data: planos }] = await Promise.all([
    listarProdutoras(q, admin),
    admin.from("planos_catalogo").select("id, nome, codigo").eq("tipo", "plano").order("ordem"),
    obterConfiguracoes(),
    admin.from("produtoras").select("id, plano, plano_inicio, pro_ate"),
  ]);
  const vendas = await vendasCaixaDoMes(admin, linhas.map((l) => l.id));
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  // Situação do acesso (Start, Pro, modo leitura, expirado) e taxa do caixa no mês
  const situacao = (id: string) => {
    const p = (planos ?? []).find((x) => x.id === id) as Plano | undefined;
    const s = p ? situacaoPlano(p, precos) : null;
    const vendido = vendas.get(id) ?? 0;
    return { s, vendido, caixa: taxaCaixa(vendido, precos) };
  };
  const COR = { pro: "text-emerald-300", start: "text-axon-gold", leitura: "text-orange-300", expirado: "text-red-300" } as const;

  return (
    <>
      <Cabecalho titulo="Produtoras" texto="Assinantes do ARXUM Fest: plano, equipe, eventos e situação.">
        <Exportar tipo="produtoras" q={q} />
      </Cabecalho>
      <Busca q={q} placeholder="Buscar por nome ou e-mail" />
      <Contagem mostrando={linhas.length} total={total} />
      <ul className="space-y-3">
        {linhas.map((p) => (
          <li key={p.id} className={`rounded-xl border border-axon-border bg-axon-panel px-5 py-4 ${p.ativo ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white">
                  {p.nome}
                  {p.demonstracao && <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-gray-400">demonstração</span>}
                  {!p.ativo && <span className="ml-2 rounded-full bg-red-400/10 px-2 py-0.5 text-[11px] text-red-300">bloqueada</span>}
                </p>
                <p className="text-xs text-gray-400">
                  {[p.documento, p.email, p.telefone, p.cidade].filter(Boolean).join(" · ") || "sem dados de contato"}
                </p>
                <p className="text-xs text-gray-500">{p.eventos} evento(s) · {p.equipe} pessoa(s) na equipe · desde {dataBR(p.criadoEm)}</p>
                {(() => {
                  const { s, vendido, caixa } = situacao(p.id);
                  return (
                    <p className="text-xs text-gray-400">
                      {s && <span className={COR[s.fase]}>{NOME_FASE[s.fase]}</span>}
                      {s?.ate && ` até ${dataBR(s.ate.toISOString())}`}
                      {s && s.diasRestantes !== null && s.fase !== "pro" && ` (${s.diasRestantes} dias)`}
                      {" · "}Caixa no mês: {brl(vendido)} → {caixa.isento ? "isento" : `taxa ${brl(caixa.taxa)}`}
                    </p>
                  );
                })()}
              </div>
              <AcoesOrganizacao tipo="produtora" id={p.id} nome={p.nome} ativo={p.ativo} responsavelId={p.adminId} />
            </div>
            <PlanoProdutora id={p.id} nome={p.nome} plano={p.plano} proAte={p.proAte} planoCatalogo={p.planoCatalogo}
              catalogo={(catalogo ?? []).map((c) => ({ id: c.id, nome: c.nome }))} />
          </li>
        ))}
      </ul>
    </>
  );
}
