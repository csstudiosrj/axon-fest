import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { limparHtml } from "@/lib/termos-html";
import { BotaoImprimir } from "@/app/_components/BotaoImprimir";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comprovante de assinatura · ARXUM Fest", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cpfOculto = (c: string) => `***.${c.slice(3, 6)}.${c.slice(6, 9)}-**`;

// Comprovante da assinatura eletrônica: o texto assinado e o registro (quem, quando, de onde)
export default async function Comprovante({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const admin = createAdminClient();
  const { data: a } = await admin.from("assinaturas_documentos")
    .select("id, versao, assinante_nome, assinante_cpf, assinante_papel, parentesco, conteudo_hash, ip, assinado_em, termos_documentos ( titulo, conteudo, versao, arquivo_url ), participantes ( nome ), eventos ( nome, produtoras ( nome ) )")
    .eq("id", id).maybeSingle();
  if (!a) notFound();
  const um = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] ?? null : v);
  const doc = um(a.termos_documentos);
  const ev = um(a.eventos);
  const quando = new Date(a.assinado_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "long", timeStyle: "medium" });
  const mesmaVersao = doc?.versao === a.versao;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-gray-900 print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-gray-500">ARXUM Fest · comprovante de assinatura eletrônica</p>
          <BotaoImprimir />
        </div>
        <header className="border-b pb-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">{ev?.nome} · {um(ev?.produtoras ?? null)?.nome}</p>
          <h1 className="mt-1 text-2xl font-bold">{doc?.titulo ?? "Documento"}</h1>
        </header>
        {mesmaVersao && doc?.conteudo ? (
          <article className="text-sm leading-relaxed [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: limparHtml(doc.conteudo) }} />
        ) : (
          <p className="text-sm text-gray-600">O documento foi atualizado depois desta assinatura (versão assinada: {a.versao}). O registro abaixo continua válido para a versão assinada, identificada pelo código de integridade.</p>
        )}
        <section className="rounded-lg border border-gray-300 p-4 text-sm">
          <h2 className="mb-2 font-semibold">Registro da assinatura eletrônica</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[180px_1fr]">
            <dt className="text-gray-500">Participante</dt><dd>{um(a.participantes)?.nome}</dd>
            <dt className="text-gray-500">Assinado por</dt><dd>{a.assinante_nome}{a.assinante_papel === "responsavel" ? ` (responsável legal${a.parentesco ? ` · ${a.parentesco}` : ""})` : ""}</dd>
            <dt className="text-gray-500">CPF</dt><dd>{cpfOculto(a.assinante_cpf)}</dd>
            <dt className="text-gray-500">Data e hora</dt><dd>{quando} (horário de Brasília)</dd>
            <dt className="text-gray-500">IP</dt><dd>{a.ip ?? "—"}</dd>
            <dt className="text-gray-500">Versão do documento</dt><dd>{a.versao}</dd>
            <dt className="text-gray-500">Código de integridade</dt><dd className="break-all font-mono text-xs">{a.conteudo_hash}</dd>
            <dt className="text-gray-500">Comprovante</dt><dd className="font-mono text-xs">{a.id}</dd>
          </dl>
          <p className="mt-3 text-xs text-gray-500">Assinatura eletrônica simples nos termos da Lei nº 14.063/2020 e da MP nº 2.200-2/2001 (art. 10, § 2º), registrada pela plataforma ARXUM Fest.</p>
        </section>
      </div>
    </main>
  );
}
