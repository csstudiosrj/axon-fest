import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { carregarEvento } from "@/lib/eventos/painel";
import { infoStatus, inscricoesAbertas } from "@/lib/eventos/status";
import { maiuscula } from "@/lib/perfis";
import { Cartao, brl } from "./_ui";

export const dynamic = "force-dynamic";

const pago = (s: string | null) => !!s && s.toLowerCase() !== "pendente";

export default async function ResumoEvento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { evento, perfil, pode } = await carregarEvento(id);
  const supabase = await createClient();
  const base = `/eventos/${evento.id}`;
  const T = perfil.termos;

  const [{ data: aps }, { count: grupos }, { data: cats }, { count: jurados }, { count: criterios }, { data: pdv }] = await Promise.all([
    supabase.from("apresentacoes").select("id, valor_total, status_pagamento, apresentacao_arquivos ( status )").eq("evento_id", evento.id),
    supabase.from("inscricoes_grupo_evento").select("id", { count: "exact", head: true }).eq("evento_id", evento.id),
    supabase.from("categorias").select("id, categoria_pai_id").eq("evento_id", evento.id),
    supabase.from("evento_jurados").select("id", { count: "exact", head: true }).eq("evento_id", evento.id),
    supabase.from("criterios_avaliacao").select("id", { count: "exact", head: true }).eq("evento_id", evento.id),
    supabase.from("pdv_config").select("pix_chave").eq("produtora_id", evento.produtora_id ?? "").maybeSingle(),
  ]);

  const lista = aps ?? [];
  const recebido = lista.filter((a) => pago(a.status_pagamento)).reduce((s, a) => s + Number(a.valor_total ?? 0), 0);
  const aReceber = lista.filter((a) => !pago(a.status_pagamento)).reduce((s, a) => s + Number(a.valor_total ?? 0), 0);
  const emAnalise = lista.flatMap((a) => a.apresentacao_arquivos ?? []).filter((f) => f.status === "recebido").length;
  const comFilhas = new Set((cats ?? []).map((c) => c.categoria_pai_id).filter(Boolean));
  const folhas = (cats ?? []).filter((c) => !comFilhas.has(c.id)).length;
  const competitivo = evento.formato !== "mostra";

  // Atalho só para quem acessa aquela tela
  const checklist = [
    { ok: !!(evento.nome && evento.data_inicio && evento.local), texto: "Nome, datas e local", href: `${base}/dados`, area: "evento_dados" as const },
    { ok: folhas > 0, texto: "Categorias com taxas de inscrição", href: `${base}/categorias`, area: "evento_categorias" as const },
    ...(competitivo ? [
      { ok: (jurados ?? 0) > 0, texto: "Jurados escalados", href: `${base}/jurados`, area: "evento_jurados" as const },
      { ok: (criterios ?? 0) > 0, texto: "Critérios de avaliação", href: `/jurados/apuracao?evento=${evento.id}`, area: "apuracao" as const },
    ] : []),
    { ok: !!pdv?.pix_chave, texto: "PIX do caixa (opcional)", href: "/pdv?aba=configuracoes", area: "pdv" as const },
    { ok: evento.status !== "Em Montagem", texto: "Inscrições abertas ao público", href: `${base}/dados`, area: "evento_dados" as const },
  ].map((c) => ({ ...c, href: pode(c.area) ? c.href : null }));

  const numeros = [
    { rotulo: maiuscula(T.grupo.plural), valor: String(grupos ?? 0), href: `${base}/inscricoes`, ver: true },
    { rotulo: evento.vagas_total != null ? `${maiuscula(T.apresentacao.plural)} / vagas` : maiuscula(T.apresentacao.plural),
      valor: evento.vagas_total != null ? `${lista.length} / ${evento.vagas_total}` : String(lista.length), href: `${base}/inscricoes`, ver: true },
    { rotulo: "Recebido", valor: brl(recebido), href: `${base}/inscricoes`, ver: pode("valores") },
    { rotulo: "A receber", valor: brl(aReceber), href: `${base}/inscricoes?status=Pendente`, ver: pode("valores") },
    { rotulo: "Arquivos para conferir", valor: String(emAnalise), href: `/midias?evento=${evento.id}`, ver: pode("midias") },
  ].filter((n) => n.ver).map((n) => ({ ...n, href: n.href.includes("/inscricoes") && !pode("evento_inscricoes") ? null : n.href }));

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 gap-3 ${numeros.length >= 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
        {numeros.map((n) => {
          const corpo = (<><p className="text-xs text-gray-400">{n.rotulo}</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{n.valor}</p></>);
          return n.href
            ? <Link key={n.rotulo} href={n.href} className="rounded-xl border border-axon-border bg-axon-panel p-4 transition-colors hover:border-axon-gold/40">{corpo}</Link>
            : <div key={n.rotulo} className="rounded-xl border border-axon-border bg-axon-panel p-4">{corpo}</div>;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Cartao titulo="Preparação" descricao={`${checklist.filter((c) => c.ok).length} de ${checklist.length} itens prontos`}>
          <ul className="divide-y divide-axon-border">
            {checklist.map((c) => (
              <li key={c.texto}>
                {(() => {
                  const item = (
                    <span className="flex items-center gap-2.5">
                      {c.ok ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} className="text-gray-600" />}
                      <span className={c.ok ? "text-gray-300" : "text-white"}>{c.texto}</span>
                    </span>
                  );
                  return c.href
                    ? <Link href={c.href} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm hover:bg-white/[0.02]">{item}<ArrowRight size={14} className="text-gray-500" /></Link>
                    : <div className="px-5 py-3.5 text-sm">{item}</div>;
                })()}
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao titulo="Situação">
          <div className="space-y-3 px-5 py-4 text-sm">
            <p className="text-white">{infoStatus(evento.status).rotulo}</p>
            <p className="text-gray-400">{infoStatus(evento.status).explicacao}</p>
            {inscricoesAbertas(evento.status) && (
              <p className="text-gray-400">Divulgue o link de inscrição (botão no topo). Os {T.grupo.plural} se cadastram e já entram no portal.</p>
            )}
            {pode("evento_dados") && <Link href={`${base}/dados`} className="inline-flex items-center gap-1 text-axon-gold hover:underline">Mudar situação <ArrowRight size={13} /></Link>}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
