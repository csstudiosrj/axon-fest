import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/session";
import { inicioDe, pode } from "@/lib/auth/permissoes";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { configFaturamento } from "@/lib/faturas/servico";
import { mercadoPagoTeste } from "@/lib/faturas/mercadopago";
import { Faturas, type FaturaLinha } from "./Faturas";

export const dynamic = "force-dynamic";

// Faturas do ARXUM para a produtora. Também é a única tela aberta com o painel suspenso.
export default async function PaginaFaturas({ searchParams }: { searchParams: Promise<{ status?: string; collection_status?: string }> }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.role === "super_admin") redirect("/super/faturas");
  const podeVer = pode(usuario.role, "faturas");
  if (!podeVer && !usuario.bloqueio_financeiro) redirect(inicioDe(usuario.role, usuario.setor_pdv));
  const params = await searchParams;

  if (!podeVer) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-red-400/30 bg-red-400/10 p-6 text-sm text-red-100">
        <h1 className="text-lg font-semibold text-white">Painel suspenso</h1>
        <p className="mt-2">O acesso ao painel está suspenso por uma fatura do ARXUM em atraso. Peça ao admin ou ao financeiro da produtora para regularizar: assim que o pagamento for confirmado, o painel volta na hora.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data }, cfg] = await Promise.all([
    supabase.from("faturas").select("id, descricao, tipo, valor_total, status, vencimento, criada_em, paga_em, forma_pagamento, periodo_inicio, periodo_fim, fatura_itens ( descricao, valor )")
      .eq("produtora_id", usuario.produtora_id ?? "").order("criada_em", { ascending: false }),
    configFaturamento(createAdminClient()),
  ]);
  const faturas: FaturaLinha[] = (data ?? []).map((f) => ({
    id: f.id, descricao: f.descricao, valor: Number(f.valor_total), status: f.status as FaturaLinha["status"], vencimento: f.vencimento,
    criadaEm: f.criada_em, pagaEm: f.paga_em, forma: f.forma_pagamento, periodo: [f.periodo_inicio, f.periodo_fim],
    itens: (f.fatura_itens ?? []).map((i) => ({ descricao: i.descricao, valor: Number(i.valor) })),
  }));
  const retorno = params.collection_status ?? params.status ?? null;
  return <Faturas faturas={faturas} bloqueado={usuario.bloqueio_financeiro} diasBloqueio={cfg.diasBloqueio} retorno={retorno} modoTeste={mercadoPagoTeste()} />;
}
