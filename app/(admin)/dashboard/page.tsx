import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CircleDollarSign, FileAudio, Hourglass, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/auth/session";
import { GraficoSemanal, type PontoSemana } from "./GraficoSemanal";

export const dynamic = "force-dynamic";

const SEMANAS = 12;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pago = (s: string | null) => !!s && s.toLowerCase() !== "pendente";

// Segunda-feira 00:00 (Brasília) da semana de uma data
function inicioSemana(d: Date) {
  const sp = new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const dia = (sp.getDay() + 6) % 7;
  return new Date(Date.UTC(sp.getFullYear(), sp.getMonth(), sp.getDate() - dia, 3));
}

const dm = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function DashboardPage() {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  const supabase = await createClient();
  const filtrar = usuario.role !== "super_admin";
  const pid = usuario.produtora_id ?? "00000000-0000-0000-0000-000000000000";

  let qAps = supabase.from("apresentacoes").select("valor_total, status_pagamento, created_at");
  let qArq = supabase.from("apresentacao_arquivos").select("id, apresentacoes!inner ( produtora_id )", { count: "exact", head: true }).eq("status", "recebido");
  let qEv = supabase.from("eventos").select("id, nome, data_inicio, status")
    .gte("data_inicio", new Date().toISOString().slice(0, 10)).order("data_inicio").limit(4);
  if (filtrar) {
    qAps = qAps.eq("produtora_id", pid);
    qArq = qArq.eq("apresentacoes.produtora_id", pid);
    qEv = qEv.eq("produtora_id", pid);
  }
  const [{ data: aps }, { count: arquivosAnalise }, { data: proximos }] = await Promise.all([qAps, qArq, qEv]);

  const lista = aps ?? [];
  const recebido = lista.filter((a) => pago(a.status_pagamento as string | null)).reduce((s, a) => s + Number(a.valor_total ?? 0), 0);
  const aReceber = lista.filter((a) => !pago(a.status_pagamento as string | null)).reduce((s, a) => s + Number(a.valor_total ?? 0), 0);

  // Inscrições e valor inscrito por semana
  const atual = inicioSemana(new Date());
  const semanas = Array.from({ length: SEMANAS }, (_, i) => new Date(atual.getTime() - (SEMANAS - 1 - i) * 7 * 86400000));
  const qtd: PontoSemana[] = semanas.map((s) => ({
    rotulo: dm(s),
    periodo: `${dm(s)} a ${dm(new Date(s.getTime() + 6 * 86400000))}`,
    valor: 0,
  }));
  const valor: PontoSemana[] = qtd.map((p) => ({ ...p }));
  for (const a of lista) {
    const i = semanas.findIndex((s) => s.getTime() === inicioSemana(new Date(a.created_at as string)).getTime());
    if (i >= 0) {
      qtd[i].valor += 1;
      valor[i].valor += Number(a.valor_total ?? 0);
    }
  }

  const kpis = [
    { rotulo: "Inscrições", valor: String(lista.length), sub: "apresentações inscritas", icone: Users, href: "/eventos" },
    { rotulo: "Recebido", valor: brl(recebido), sub: "inscrições pagas", icone: CircleDollarSign, href: "/eventos" },
    { rotulo: "A receber", valor: brl(aReceber), sub: "pagamentos pendentes", icone: Hourglass, href: "/eventos" },
    { rotulo: "Arquivos para conferir", valor: String(arquivosAnalise ?? 0), sub: arquivosAnalise ? "enviados pelos grupos" : "nada pendente", icone: FileAudio, href: "/midias" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">Visão geral dos seus festivais.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ rotulo, valor: v, sub, icone: Icone, href }) => (
          <Link key={rotulo} href={href} className="flex flex-col gap-3 rounded-xl border border-axon-border bg-axon-panel p-5 transition-colors hover:border-axon-gold/40">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-sm">{rotulo}</span>
              <Icone size={18} className="text-axon-gold" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-white">{v}</p>
              <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GraficoSemanal titulo="Inscrições" pontos={qtd} formatar="numero" />
        <GraficoSemanal titulo="Valor inscrito" pontos={valor} formatar="moeda" />
      </div>

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h3 className="border-b border-axon-border px-5 py-3.5 text-sm font-medium text-white">Próximos eventos</h3>
        {(proximos ?? []).length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">Nenhum evento com data futura. <Link href="/eventos" className="text-axon-gold hover:underline">Criar evento</Link></p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {(proximos ?? []).map((e) => (
              <li key={e.id as string}>
                <Link href={`/eventos/${e.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-white/[0.02]">
                  <span className="flex min-w-0 items-center gap-2 text-white"><CalendarDays size={14} className="shrink-0 text-gray-500" /> <span className="truncate">{e.nome as string}</span></span>
                  <span className="shrink-0 text-xs text-gray-400">{new Date(`${e.data_inicio}T12:00:00`).toLocaleDateString("pt-BR")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
