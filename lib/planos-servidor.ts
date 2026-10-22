import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { inicioDoMes, situacaoPlano, taxaCaixa, type PlanoProdutora } from "@/lib/planos";

type Admin = ReturnType<typeof createAdminClient>;

// Total vendido no caixa por produtora desde o início do mês
export async function vendasCaixaDoMes(admin: Admin, produtoraIds: string[]) {
  const totais = new Map<string, number>();
  if (!produtoraIds.length) return totais;
  const { data } = await admin.from("pdv_vendas").select("produtora_id, total")
    .in("produtora_id", produtoraIds).gte("created_at", inicioDoMes().toISOString());
  for (const v of data ?? []) totais.set(v.produtora_id as string, (totais.get(v.produtora_id as string) ?? 0) + Number(v.total ?? 0));
  return totais;
}

export async function resumoPlano(admin: Admin, produtora: PlanoProdutora & { id: string }) {
  const { precos, contato } = await obterConfiguracoes();
  const vendido = (await vendasCaixaDoMes(admin, [produtora.id])).get(produtora.id) ?? 0;
  const s = situacaoPlano(produtora, precos);
  return {
    plano: produtora.plano,
    fase: s.fase,
    ate: s.ate?.toISOString() ?? null,
    diasRestantes: s.diasRestantes,
    fimStart: s.fimStart.toISOString(),
    fimLeitura: s.fimLeitura.toISOString(),
    caixa: { vendido, ...taxaCaixa(vendido, precos), percentual: precos.caixaPercentual, isencaoAte: precos.caixaIsencaoAte },
    precos: { mesesStart: precos.mesesStart, mesesGuarda: precos.mesesGuarda, mensalidadePro: precos.mensalidadePro },
    contato: { email: contato.email, whatsappLink: contato.whatsappLink },
  };
}

export type ResumoPlano = Awaited<ReturnType<typeof resumoPlano>>;
