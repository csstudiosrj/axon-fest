import "server-only";
import type { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { emailComBotao, enviarEmail, escapeHtml } from "@/lib/email";
import { obterConfiguracoes } from "@/lib/site/configuracoes";
import { situacaoPlano } from "@/lib/planos";
import {
  hojeSP, itemInscricoes, itemVendas, limitesDoMes, mesAnterior, nomeMes, somarDias, totalItens, type ItemFatura, type PrecosFatura,
} from "./calculo";
import { criarPreferencia, mercadoPagoConfigurado } from "./mercadopago";

// Faturas do ARXUM para as produtoras: geração (mensal e por evento), link de
// pagamento no Mercado Pago, e-mails, aviso de atraso, bloqueio e baixa.

type Admin = ReturnType<typeof createAdminClient>;

interface ConfigFaturamento { inicio: string; diasVencimento: number; diasBloqueio: number }

export async function configFaturamento(admin: Admin): Promise<ConfigFaturamento> {
  const { data } = await admin.from("configuracoes_sistema").select("valor").eq("chave", "faturamento").maybeSingle();
  const v = (data?.valor ?? {}) as Partial<ConfigFaturamento>;
  return { inicio: v.inicio ?? hojeSP(), diasVencimento: v.diasVencimento ?? 5, diasBloqueio: v.diasBloqueio ?? 3 };
}

async function precosFatura(): Promise<PrecosFatura & { mensalidadePro: number | null; mesesStart: number; mesesGuarda: number }> {
  const { precos } = await obterConfiguracoes();
  return precos;
}

const dataBR = (dia: string) => new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR");
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// E-mails de cobrança: o da produtora e os de admin/financeiro ativos
async function destinatarios(admin: Admin, produtoraId: string): Promise<string[]> {
  const [{ data: p }, { data: equipe }] = await Promise.all([
    admin.from("produtoras").select("email").eq("id", produtoraId).maybeSingle(),
    admin.from("usuarios").select("email").eq("produtora_id", produtoraId).in("role", ["admin", "financeiro", "produtora_admin"]).neq("ativo", false),
  ]);
  return [...new Set([p?.email, ...(equipe ?? []).map((u) => u.email)].filter((e): e is string => !!e).map((e) => e.toLowerCase()))];
}

async function enviarParaTodos(admin: Admin, produtoraId: string, assunto: string, html: string) {
  for (const para of await destinatarios(admin, produtoraId)) {
    try { await enviarEmail({ para, assunto, html }); } catch (e) { console.error("[faturas] e-mail", para, e); }
  }
}

// Gera (ou reaproveita) o link de pagamento do Mercado Pago
export async function garantirLink(admin: Admin, faturaId: string): Promise<string | null> {
  const { data: f } = await admin.from("faturas").select("id, descricao, valor_total, status, mp_link, produtora_id, produtoras ( nome, email )").eq("id", faturaId).maybeSingle();
  if (!f || f.status !== "aberta") return null;
  if (f.mp_link) return f.mp_link;
  if (!mercadoPagoConfigurado() || Number(f.valor_total) <= 0) return null;
  const prod = Array.isArray(f.produtoras) ? f.produtoras[0] : f.produtoras;
  const pref = await criarPreferencia({
    faturaId: f.id, titulo: `ARXUM Fest · ${f.descricao}`, valor: Number(f.valor_total),
    notificacao: urlAbsoluta("/api/pagamentos/mercadopago"), retorno: urlAbsoluta("/faturas"), emailPagador: prod?.email ?? null,
  });
  await admin.from("faturas").update({ mp_preferencia_id: pref.id, mp_link: pref.init_point }).eq("id", f.id);
  return pref.init_point;
}

async function criarFatura(admin: Admin, cfg: ConfigFaturamento, hoje: string, f: {
  produtoraId: string; tipo: "mensal" | "evento"; referencia: string; eventoId?: string | null; descricao: string;
  periodoInicio: string | null; periodoFim: string | null; itens: ItemFatura[];
}): Promise<boolean> {
  const total = totalItens(f.itens);
  if (total <= 0) return false;
  const vencimento = somarDias(hoje, cfg.diasVencimento);
  const { data: nova, error } = await admin.from("faturas").insert({
    produtora_id: f.produtoraId, tipo: f.tipo, referencia: f.referencia, evento_id: f.eventoId ?? null, descricao: f.descricao,
    periodo_inicio: f.periodoInicio, periodo_fim: f.periodoFim, valor_total: total, vencimento,
  }).select("id").single();
  if (error || !nova) {
    if (error?.code !== "23505") console.error("[faturas] criar", error); // 23505: já gerada antes
    return false;
  }
  await admin.from("fatura_itens").insert(f.itens.map((i) => ({ fatura_id: nova.id, ...i })));
  const link = await garantirLink(admin, nova.id).catch((e) => { console.error("[faturas] link", e); return null; });
  await enviarParaTodos(admin, f.produtoraId, `Fatura ARXUM Fest: ${f.descricao}`, emailComBotao({
    titulo: "Nova fatura do ARXUM Fest",
    paragrafos: [
      `<strong>${escapeHtml(f.descricao)}</strong>`,
      ...f.itens.map((i) => `${escapeHtml(i.descricao)}: <strong>${brl(i.valor)}</strong>`),
      `Total: <strong>${brl(total)}</strong> · vencimento em <strong>${dataBR(vencimento)}</strong>.`,
      "Pague por Pix, boleto ou cartão pelo botão abaixo. Sem pagamento, o acesso ao painel é suspenso " + cfg.diasBloqueio + " dias após o vencimento.",
    ],
    botaoTexto: link ? "Pagar fatura" : "Ver fatura no painel",
    botaoUrl: link ?? urlAbsoluta("/faturas"),
  }));
  return true;
}

// Mensal: mês anterior a hoje (só meses a partir do início da cobrança)
async function gerarMensais(admin: Admin, cfg: ConfigFaturamento, hoje: string, precos: Awaited<ReturnType<typeof precosFatura>>) {
  const mes = mesAnterior(hoje);
  if (mes < cfg.inicio.slice(0, 7)) return 0;
  const lim = limitesDoMes(mes);
  const de = lim.primeiroDia < cfg.inicio ? new Date(`${cfg.inicio}T00:00:00-03:00`).toISOString() : lim.inicioIso;
  const { data: produtoras } = await admin.from("produtoras")
    .select("id, plano, plano_inicio, pro_ate, planos_catalogo:plano_catalogo_id ( nome, preco, periodo, codigo )")
    .eq("demonstracao", false).neq("ativo", false);
  let criadas = 0;
  for (const p of produtoras ?? []) {
    const itens: ItemFatura[] = [];
    // Mensalidade: plano Pro ativo no fim do mês (valor do plano do catálogo, se houver)
    const fim = new Date(`${lim.ultimoDia}T23:00:00-03:00`);
    const situacao = situacaoPlano({ plano: p.plano as "start" | "pro", plano_inicio: p.plano_inicio, pro_ate: p.pro_ate }, precos, fim);
    const cat = Array.isArray(p.planos_catalogo) ? p.planos_catalogo[0] : p.planos_catalogo;
    if (situacao.fase === "pro") {
      const valor = cat?.periodo === "mensal" && Number(cat.preco) > 0 ? Number(cat.preco) : precos.mensalidadePro;
      if (valor && valor > 0) itens.push({ descricao: `Plano ${cat?.nome ?? "Pro"}: mensalidade de ${nomeMes(mes)}`, quantidade: 1, base: null, valor });
    }
    // Vendas do PDV no mês: ingressos (bilheteria) e caixa sem evento
    const [{ data: vendas }, { data: produtos }] = await Promise.all([
      admin.from("pdv_vendas").select("produto_id, evento_id, total, quantidade").eq("produtora_id", p.id).gte("created_at", de).lt("created_at", lim.fimIso),
      admin.from("pdv_produtos").select("id, tipo").eq("produtora_id", p.id),
    ]);
    const tipo = new Map((produtos ?? []).map((x) => [x.id, x.tipo]));
    const ingressos = (vendas ?? []).filter((v) => v.produto_id && tipo.get(v.produto_id) === "bilheteria");
    const avulsas = (vendas ?? []).filter((v) => !(v.produto_id && tipo.get(v.produto_id) === "bilheteria") && !v.evento_id);
    const soma = (l: typeof ingressos) => l.reduce((s, v) => s + Number(v.total ?? 0), 0);
    const qtd = (l: typeof ingressos) => l.reduce((s, v) => s + Number(v.quantidade ?? 1), 0);
    const iIng = itemVendas("Ingressos vendidos na bilheteria", soma(ingressos), qtd(ingressos), precos);
    const iAv = itemVendas("Caixa sem evento", soma(avulsas), qtd(avulsas), precos);
    if (iIng) itens.push(iIng);
    if (iAv) itens.push(iAv);
    if (await criarFatura(admin, cfg, hoje, {
      produtoraId: p.id, tipo: "mensal", referencia: mes, descricao: `Fatura de ${nomeMes(mes)}`,
      periodoInicio: lim.primeiroDia < cfg.inicio ? cfg.inicio : lim.primeiroDia, periodoFim: lim.ultimoDia, itens,
    })) criadas++;
  }
  return criadas;
}

// Por evento: no dia seguinte ao fim (eventos que terminaram depois do início da cobrança)
async function gerarDeEventos(admin: Admin, cfg: ConfigFaturamento, hoje: string, precos: PrecosFatura) {
  const { data: eventos } = await admin.from("eventos")
    .select("id, nome, produtora_id, data_inicio, data_fim, status, produtoras!inner ( demonstracao )")
    .eq("produtoras.demonstracao", false).neq("status", "cancelado").not("data_inicio", "is", null);
  let criadas = 0;
  for (const ev of eventos ?? []) {
    const fim = (ev.data_fim ?? ev.data_inicio) as string;
    if (!ev.produtora_id || fim < cfg.inicio || fim >= hoje) continue;
    const { count } = await admin.from("faturas").select("id", { count: "exact", head: true }).eq("produtora_id", ev.produtora_id).eq("tipo", "evento").eq("referencia", ev.id);
    if (count) continue;
    const [{ data: aps }, { data: vendas }, { data: produtos }] = await Promise.all([
      admin.from("apresentacoes").select("valor_total, status_pagamento").eq("evento_id", ev.id),
      admin.from("pdv_vendas").select("produto_id, total, quantidade").eq("evento_id", ev.id),
      admin.from("pdv_produtos").select("id, tipo").eq("produtora_id", ev.produtora_id),
    ]);
    const tipo = new Map((produtos ?? []).map((x) => [x.id, x.tipo]));
    const itens: ItemFatura[] = [];
    const iIns = itemInscricoes((aps ?? []).filter((a) => a.status_pagamento === "Pago").map((a) => Number(a.valor_total ?? 0)), precos);
    if (iIns) itens.push(iIns);
    // Ingressos do evento entram na fatura mensal; aqui só o caixa (cantina e lojinha)
    const caixa = (vendas ?? []).filter((v) => !(v.produto_id && tipo.get(v.produto_id) === "bilheteria"));
    const iCx = itemVendas("Caixa (cantina e lojinha)", caixa.reduce((s, v) => s + Number(v.total ?? 0), 0), caixa.reduce((s, v) => s + Number(v.quantidade ?? 1), 0), precos);
    if (iCx) itens.push(iCx);
    if (await criarFatura(admin, cfg, hoje, {
      produtoraId: ev.produtora_id, tipo: "evento", referencia: ev.id, eventoId: ev.id, descricao: `Fatura do evento ${ev.nome}`,
      periodoInicio: ev.data_inicio, periodoFim: fim, itens,
    })) criadas++;
  }
  return criadas;
}

// Atrasos: aviso no dia seguinte ao vencimento; bloqueio do painel X dias após
async function processarAtrasos(admin: Admin, cfg: ConfigFaturamento, hoje: string) {
  const { data: vencidas } = await admin.from("faturas").select("id, produtora_id, descricao, valor_total, vencimento, aviso_atraso_em, mp_link")
    .eq("status", "aberta").lt("vencimento", hoje).not("produtora_id", "is", null);
  let avisos = 0, bloqueios = 0;
  const bloquear = new Set<string>();
  for (const f of vencidas ?? []) {
    if (!f.produtora_id) continue;
    if (!f.aviso_atraso_em) {
      const limite = somarDias(f.vencimento, cfg.diasBloqueio);
      await enviarParaTodos(admin, f.produtora_id, `Fatura vencida: ${f.descricao}`, emailComBotao({
        titulo: "Fatura em atraso",
        paragrafos: [
          `A fatura <strong>${escapeHtml(f.descricao)}</strong> (${brl(Number(f.valor_total))}) venceu em ${dataBR(f.vencimento)}.`,
          `Para não perder o acesso ao painel, pague até <strong>${dataBR(somarDias(limite, -1))}</strong>. A partir de ${dataBR(limite)}, o painel fica suspenso até a quitação.`,
        ],
        botaoTexto: "Pagar agora",
        botaoUrl: f.mp_link ?? urlAbsoluta("/faturas"),
      }));
      await admin.from("faturas").update({ aviso_atraso_em: new Date().toISOString() }).eq("id", f.id);
      avisos++;
    }
    if (hoje >= somarDias(f.vencimento, cfg.diasBloqueio)) bloquear.add(f.produtora_id);
  }
  for (const pid of bloquear) {
    const { data: p } = await admin.from("produtoras").select("bloqueio_financeiro, liberado_ate").eq("id", pid).maybeSingle();
    if (p?.bloqueio_financeiro || (p?.liberado_ate && p.liberado_ate >= hoje)) continue; // já bloqueada ou liberada pelo super admin
    await admin.from("produtoras").update({ bloqueio_financeiro: true }).eq("id", pid);
    await enviarParaTodos(admin, pid, "Acesso ao painel suspenso: fatura em aberto", emailComBotao({
      titulo: "Painel suspenso",
      paragrafos: [
        "O acesso ao painel do ARXUM Fest foi suspenso por falta de pagamento.",
        "A página pública dos eventos, o caixa, os jurados e os grupos continuam funcionando. Assim que o pagamento for confirmado, o painel volta na hora.",
      ],
      botaoTexto: "Ver e pagar faturas",
      botaoUrl: urlAbsoluta("/faturas"),
    }));
    bloqueios++;
  }
  return { avisos, bloqueios };
}

// Libera o painel se não sobrou fatura passada do prazo de bloqueio
export async function revisarBloqueio(admin: Admin, produtoraId: string | null) {
  if (!produtoraId) return false; // cobrança de teste do super admin
  const cfg = await configFaturamento(admin);
  const limite = somarDias(hojeSP(), -cfg.diasBloqueio);
  const { count } = await admin.from("faturas").select("id", { count: "exact", head: true })
    .eq("produtora_id", produtoraId).eq("status", "aberta").lte("vencimento", limite);
  const { data: p } = await admin.from("produtoras").select("liberado_ate").eq("id", produtoraId).maybeSingle();
  const bloquear = !!count && !(p?.liberado_ate && p.liberado_ate >= hojeSP());
  await admin.from("produtoras").update({ bloqueio_financeiro: bloquear }).eq("id", produtoraId);
  return bloquear;
}

export async function marcarPaga(admin: Admin, faturaId: string, dados: { forma: string; pagamentoId?: string | null; observacao?: string | null }) {
  const { data: f } = await admin.from("faturas").update({
    status: "paga", paga_em: new Date().toISOString(), forma_pagamento: dados.forma, mp_pagamento_id: dados.pagamentoId ?? null,
    ...(dados.observacao ? { observacao: dados.observacao } : {}),
  }).eq("id", faturaId).eq("status", "aberta").select("produtora_id").maybeSingle();
  if (f) await revisarBloqueio(admin, f.produtora_id);
  return !!f;
}

// Cobrança de teste: o super admin paga pelo link e confere a baixa automática
export async function criarCobrancaTeste(admin: Admin, valor: number) {
  const { data: f, error } = await admin.from("faturas").insert({
    produtora_id: null, tipo: "teste", referencia: `teste-${Date.now()}`, descricao: "Cobrança de teste do ARXUM",
    valor_total: valor, vencimento: somarDias(hojeSP(), 5),
  }).select("id").single();
  if (error || !f) throw new Error("Não foi possível criar a cobrança de teste.");
  try {
    return { id: f.id, link: await garantirLink(admin, f.id) };
  } catch (e) {
    await admin.from("faturas").delete().eq("id", f.id);
    throw e;
  }
}

// Rotina diária (Vercel Cron): gera, cobra e trata atrasos. Pode rodar várias vezes no dia.
export async function rotinaDiaria(admin: Admin, hoje = hojeSP()) {
  const cfg = await configFaturamento(admin);
  const precos = await precosFatura();
  const mensais = await gerarMensais(admin, cfg, hoje, precos);
  const eventos = await gerarDeEventos(admin, cfg, hoje, precos);
  const atrasos = await processarAtrasos(admin, cfg, hoje);
  return { hoje, mensais, eventos, ...atrasos };
}
