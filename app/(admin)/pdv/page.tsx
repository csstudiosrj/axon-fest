import Link from "next/link";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { exigirAcesso } from "@/lib/auth/guards";
import { Produtos, type ProdutoPainel } from "./_componentes/Produtos";
import { Vendas, type LinhaVenda } from "./_componentes/Vendas";
import { ConfigPdv } from "./_componentes/ConfigPdv";

export const dynamic = "force-dynamic";

const ABAS = [
  { id: "produtos", nome: "Produtos" },
  { id: "vendas", nome: "Vendas" },
  { id: "configuracoes", nome: "PIX e PIN" },
] as const;

const GESTORES = ["admin", "financeiro", "produtora_admin", "assistente", "super_admin"];

// Data AAAA-MM-DD no horário de Brasília
const diaSP = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

// Período padrão do relatório: últimos 30 dias
function periodoPadrao() {
  const agora = Date.now();
  return { hoje: diaSP(new Date(agora)), inicio: diaSP(new Date(agora - 29 * 86400000)) };
}

export default async function PdvPage({ searchParams }: { searchParams: Promise<{ aba?: string; evento?: string; de?: string; ate?: string }> }) {
  const params = await searchParams;
  const usuario = await exigirAcesso("pdv");
  const aba = ABAS.some((a) => a.id === params.aba) ? (params.aba as (typeof ABAS)[number]["id"]) : "produtos";

  if (!usuario.produtora_id) {
    return <p className="mx-auto max-w-3xl text-sm text-gray-400">O PDV é configurado por produtora. Sua conta não está ligada a uma produtora.</p>;
  }
  const pid = usuario.produtora_id;
  const podeEditar = GESTORES.includes(usuario.role);
  const supabase = await createClient();

  const { hoje, inicio } = periodoPadrao();
  const de = /^\d{4}-\d{2}-\d{2}$/.test(params.de ?? "") ? params.de! : inicio;
  const ate = /^\d{4}-\d{2}-\d{2}$/.test(params.ate ?? "") ? params.ate! : hoje;
  const evento = params.evento ?? "";

  const [{ data: produtos }, { data: eventos }] = await Promise.all([
    supabase.from("pdv_produtos").select("id, nome, preco, categoria, tipo, ativo, ordem, descricao").eq("produtora_id", pid)
      .order("tipo").order("ordem", { nullsFirst: false }).order("nome"),
    supabase.from("eventos").select("id, nome, data_inicio, status").eq("produtora_id", pid).order("data_inicio", { ascending: false, nullsFirst: false }),
  ]);
  const idsEventos = (eventos ?? []).map((e) => e.id);
  const { data: vitrine } = idsEventos.length
    ? await supabase.from("evento_produtos").select("evento_id, produto_id, ativo_evento").in("evento_id", idsEventos)
    : { data: [] };

  const linhasProdutos: ProdutoPainel[] = (produtos ?? []).map((p) => ({
    id: p.id, nome: p.nome, preco: Number(p.preco), categoria: p.categoria ?? "", tipo: p.tipo as ProdutoPainel["tipo"],
    ativo: p.ativo, ordem: p.ordem, descricao: p.descricao,
    vitrine: (vitrine ?? []).filter((v) => v.produto_id === p.id && v.ativo_evento).map((v) => v.evento_id),
  }));

  let vendas: LinhaVenda[] = [];
  if (aba === "vendas") {
    let q = supabase.from("pdv_vendas")
      .select("id, venda_id, produto_nome, quantidade, preco_unitario, total, forma_pagamento, operador_nome, evento_id, created_at")
      .eq("produtora_id", pid)
      .gte("created_at", new Date(`${de}T00:00:00-03:00`).toISOString())
      .lt("created_at", new Date(new Date(`${ate}T00:00:00-03:00`).getTime() + 86400000).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);
    if (evento === "avulsa") q = q.is("evento_id", null);
    else if (evento) q = q.eq("evento_id", evento);
    const { data } = await q;
    vendas = (data ?? []).map((v) => ({
      id: v.id, venda_id: v.venda_id ?? v.id, produto_nome: v.produto_nome ?? "—", quantidade: v.quantidade,
      total: Number(v.total), forma: v.forma_pagamento, operador: v.operador_nome ?? "—", evento_id: v.evento_id, created_at: v.created_at,
    }));
  }

  let pix = { chave: "", nome: "", cidade: "", pinDefinido: false };
  if (aba === "configuracoes") {
    const { data } = await createAdminClient().from("pdv_config").select("pix_chave, pix_nome, pix_cidade, pin_admin").eq("produtora_id", pid).maybeSingle();
    pix = { chave: data?.pix_chave ?? "", nome: data?.pix_nome ?? "", cidade: data?.pix_cidade ?? "", pinDefinido: !!data?.pin_admin };
  }

  const listaEventos = (eventos ?? []).map((e) => ({ id: e.id, nome: e.nome }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">PDV & Bilheteria</h1>
          <p className="mt-1 text-sm text-gray-400">Produtos do caixa e da bilheteria, vendas e pagamento por PIX. O caixa funciona no celular, mesmo sem internet.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/caixa" className="rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:text-white">Abrir caixa</Link>
          <Link href="/bilheteria" className="rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:text-white">Abrir bilheteria</Link>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-axon-border">
        {ABAS.map((a) => (
          <Link key={a.id} href={`/pdv?aba=${a.id}`}
            className={`border-b-2 px-4 py-2.5 text-sm ${aba === a.id ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
            {a.nome}
          </Link>
        ))}
      </nav>

      {aba === "produtos" && <Produtos produtos={linhasProdutos} eventos={listaEventos} produtoraId={pid} podeEditar={podeEditar} />}
      {aba === "vendas" && <Vendas vendas={vendas} eventos={listaEventos} filtros={{ evento, de, ate }} />}
      {aba === "configuracoes" && <ConfigPdv inicial={pix} podeEditar={podeEditar} />}
    </div>
  );
}
