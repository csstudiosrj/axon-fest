import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { urlAbsoluta } from "@/lib/base-path";
import { lerModelo, periodoPorExtenso } from "@/lib/certificados";
import { FolhaCertificado } from "@/app/_components/Certificado";
import { BotaoImprimir } from "@/app/_components/BotaoImprimir";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificado · ARXUM Fest", robots: { index: false } };

const um = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

// Certificado pelo código de autenticidade: serve para baixar (imprimir em PDF) e para conferir
export default async function Certificado({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo)) notFound();
  const admin = createAdminClient();
  const { data: c } = await admin.from("certificados")
    .select("codigo, emitido_em, evento_id, participantes ( nome, nome_artistico ), apresentacoes ( nome, grupos ( nome ), categorias:categoria_id ( nome ) ), eventos ( nome, data_inicio, data_fim, local, produtoras ( nome ) )")
    .eq("codigo", codigo).maybeSingle();
  if (!c) notFound();
  const { data: modelo } = await admin.from("certificado_modelos").select("titulo, texto, cor, fundo_url, assinaturas, liberado").eq("evento_id", c.evento_id).maybeSingle();
  if (!modelo?.liberado) notFound();
  const ev = um(c.eventos);
  const ap = um(c.apresentacoes);
  const p = um(c.participantes);
  const dados = {
    nome: p?.nome ?? "", coreografia: ap?.nome ?? "", categoria: um(ap?.categorias)?.nome ?? "", grupo: um(ap?.grupos)?.nome ?? "",
    evento: ev?.nome ?? "", data: periodoPorExtenso(ev?.data_inicio ?? null, ev?.data_fim ?? null), local: ev?.local ?? "", produtora: um(ev?.produtoras)?.nome ?? "",
  };

  return (
    <main className="min-h-screen bg-axon-bg px-4 py-8 print:bg-white print:p-0">
      <style>{"@media print { @page { size: A4 landscape; margin: 0; } }"}</style>
      <div className="mx-auto mb-4 flex max-w-[1123px] flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-400">Certificado autêntico · código {c.codigo}. Para salvar, clique em “Baixar PDF” e escolha “Salvar como PDF”.</p>
        <BotaoImprimir />
      </div>
      <FolhaCertificado modelo={lerModelo(modelo)} dados={dados} codigo={c.codigo} urlValidacao={urlAbsoluta(`/certificado/${c.codigo}`).replace(/^https?:\/\//, "")} />
    </main>
  );
}
