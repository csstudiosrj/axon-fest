import { createAdminClient } from "@/lib/supabase/server";
import { mercadoPagoConfigurado, mercadoPagoTeste } from "@/lib/faturas/mercadopago";
import { configFaturamento } from "@/lib/faturas/servico";
import { hojeSP } from "@/lib/faturas/calculo";
import { Cabecalho, dataBR } from "../_ui";
import { AcoesFatura, PainelFaturamento } from "./AcoesFatura";

const FILTROS = [
  { id: "abertas", nome: "Em aberto" }, { id: "vencidas", nome: "Vencidas" }, { id: "pagas", nome: "Pagas" }, { id: "todas", nome: "Todas" },
] as const;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Faturas de todas as produtoras: gerar agora, baixa manual, cancelar e liberar painel
export default async function SuperFaturas({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro: f } = await searchParams;
  const filtro = FILTROS.some((x) => x.id === f) ? f! : "abertas";
  const admin = createAdminClient();
  const hoje = hojeSP();
  let q = admin.from("faturas").select("id, descricao, valor_total, status, vencimento, paga_em, forma_pagamento, criada_em, produtoras ( id, nome, bloqueio_financeiro )")
    .order("criada_em", { ascending: false }).limit(500);
  if (filtro === "abertas") q = q.eq("status", "aberta");
  if (filtro === "vencidas") q = q.eq("status", "aberta").lt("vencimento", hoje);
  if (filtro === "pagas") q = q.eq("status", "paga");
  const [{ data }, { data: bloqueadas }, cfg] = await Promise.all([
    q,
    admin.from("produtoras").select("id, nome").eq("bloqueio_financeiro", true),
    configFaturamento(admin),
  ]);
  const lista = data ?? [];
  const soma = (s: string) => lista.filter((x) => x.status === s).reduce((t, x) => t + Number(x.valor_total), 0);

  return (
    <>
      <Cabecalho titulo="Faturas" texto={`Cobrança das produtoras pelo Mercado Pago. Mensais todo dia 1; por evento, no dia seguinte ao fim. Vencimento em ${cfg.diasVencimento} dias, aviso no dia seguinte e painel suspenso ${cfg.diasBloqueio} dias após o vencimento. Cobrança desde ${dataBR(`${cfg.inicio}T12:00:00`)}.`} />
      <PainelFaturamento configurado={mercadoPagoConfigurado()} teste={mercadoPagoTeste()} />
      {(bloqueadas ?? []).length > 0 && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-100">
          <p className="font-medium text-white">Painel suspenso por atraso</p>
          <ul className="mt-2 space-y-1">
            {(bloqueadas ?? []).map((p) => <li key={p.id} className="flex items-center justify-between gap-3">{p.nome} <AcoesFatura id={p.id} tipo="produtora" /></li>)}
          </ul>
        </div>
      )}
      <nav className="flex gap-1 border-b border-axon-border">
        {FILTROS.map((x) => (
          <a key={x.id} href={`?filtro=${x.id}`} className={`border-b-2 px-4 py-2.5 text-sm ${filtro === x.id ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>{x.nome}</a>
        ))}
      </nav>
      <p className="text-xs text-gray-500">{lista.length} fatura(s){filtro !== "pagas" && soma("aberta") ? ` · ${brl(soma("aberta"))} em aberto` : ""}{filtro !== "abertas" && filtro !== "vencidas" && soma("paga") ? ` · ${brl(soma("paga"))} recebidos` : ""}</p>
      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-10 text-center text-sm text-gray-400">Nenhuma fatura aqui.</p>
      ) : (
        <ul className="divide-y divide-axon-border rounded-xl border border-axon-border bg-axon-panel">
          {lista.map((x) => {
            const p = Array.isArray(x.produtoras) ? x.produtoras[0] : x.produtoras;
            const vencida = x.status === "aberta" && x.vencimento < hoje;
            return (
              <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{p?.nome ?? "ARXUM"} · {x.descricao}</p>
                  <p className="text-xs text-gray-500">
                    {x.status === "paga" ? `Paga em ${dataBR(x.paga_em)} · ${x.forma_pagamento ?? ""}` : x.status === "cancelada" ? "Cancelada" : `Vence em ${dataBR(`${x.vencimento}T12:00:00`)}`}
                    {vencida && <span className="ml-2 text-red-300">vencida</span>}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-white">{brl(Number(x.valor_total))}</span>
                {x.status === "aberta" && <AcoesFatura id={x.id} tipo="fatura" />}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
