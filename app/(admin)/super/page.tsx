import Link from "next/link";
import { Building2, CalendarDays, CircleDollarSign, UserRound, Users, UsersRound } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { taxaCaixa } from "@/lib/planos";
import { vendasCaixaDoMes } from "@/lib/planos-servidor";
import { Demonstracao, FormularioGrupo } from "./PainelSuper";
import { Cabecalho, dataBR } from "./_ui";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Visão geral do ARXUM Fest: números de todo o sistema, cadastros recentes,
// demonstração e dados institucionais
export default async function VisaoGeral() {
  const admin = createAdminClient();
  const contar = (tabela: "produtoras" | "eventos" | "grupos" | "participantes" | "usuarios" | "apresentacoes") =>
    admin.from(tabela).select("id", { count: "exact", head: true });
  const [produtoras, eventos, grupos, participantes, pessoas, apresentacoes, { data: config }, { data: demo }, { data: todas }, { data: recentes }, { precos }] = await Promise.all([
    contar("produtoras"), contar("eventos"), contar("grupos"), contar("participantes"), contar("usuarios"), contar("apresentacoes"),
    admin.from("configuracoes_sistema").select("chave, valor"),
    admin.from("produtoras").select("id, nome, created_at").eq("demonstracao", true).maybeSingle(),
    admin.from("produtoras").select("id"),
    admin.from("produtoras").select("id, nome, email, created_at, demonstracao").order("created_at", { ascending: false }).limit(8),
    obterConfiguracoes(),
  ]);
  const vendas = await vendasCaixaDoMes(admin, (todas ?? []).map((p) => p.id));
  const taxasMes = [...vendas.values()].reduce((s, v) => s + taxaCaixa(v, precos).taxa, 0);
  const valores = Object.fromEntries((config ?? []).map((c) => [c.chave, c.valor as Record<string, unknown>]));

  const numeros = [
    { rotulo: "Produtoras", valor: produtoras.count ?? 0, href: "/super/produtoras", icone: Building2 },
    { rotulo: "Eventos", valor: eventos.count ?? 0, href: "/super/produtoras", icone: CalendarDays },
    { rotulo: "Grupos", valor: grupos.count ?? 0, href: "/super/grupos", icone: UsersRound },
    { rotulo: "Participantes", valor: participantes.count ?? 0, href: "/super/participantes", icone: Users },
    { rotulo: "Contas de acesso", valor: pessoas.count ?? 0, href: "/super/pessoas", icone: UserRound },
    { rotulo: "Apresentações inscritas", valor: apresentacoes.count ?? 0, href: "/super/grupos", icone: CalendarDays },
  ];

  return (
    <>
      <Cabecalho titulo="Visão geral" texto="Todo o ARXUM Fest: produtoras, grupos, participantes e contas de acesso." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {numeros.map(({ rotulo, valor, href, icone: Icone }) => (
          <Link key={rotulo} href={href} className="rounded-xl border border-axon-border bg-axon-panel p-4 hover:border-axon-gold/40">
            <Icone size={16} className="text-axon-gold" />
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{valor.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-gray-400">{rotulo}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-axon-border bg-axon-panel">
          <h3 className="border-b border-axon-border px-5 py-3.5 text-sm font-semibold text-white">Produtoras mais recentes</h3>
          <ul className="divide-y divide-axon-border">
            {(recentes ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 truncate text-white">{p.nome}{p.demonstracao && <span className="ml-2 text-xs text-gray-500">demonstração</span>}</span>
                <span className="shrink-0 text-xs text-gray-400">{dataBR(p.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-axon-border bg-axon-panel p-5">
          <CircleDollarSign size={18} className="text-axon-gold" />
          <p className="mt-2 text-2xl font-semibold text-white">{brl(taxasMes)}</p>
          <p className="text-sm text-gray-400">Taxas de caixa do mês (todas as produtoras)</p>
          <Link href="/super/planos" className="mt-3 inline-block text-xs text-axon-gold hover:underline">Planos e taxas →</Link>
        </section>
      </div>

      <Demonstracao existente={demo as { id: string; nome: string; created_at: string } | null} />
      <FormularioGrupo chave="contato" inicial={valores.contato ?? {}} />
      <FormularioGrupo chave="empresa" inicial={valores.empresa ?? {}} />
    </>
  );
}
