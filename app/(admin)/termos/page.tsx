import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { idadeEm } from "@/lib/documentos";
import { Termos, type Assinatura, type DocumentoTermo } from "./Termos";

export const dynamic = "force-dynamic";

export default async function PaginaTermos({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const usuario = await getUsuarioAtual();
  if (!usuario) redirect("/login");
  if (!usuario.produtora_id) {
    return <p className="mx-auto max-w-3xl text-sm text-gray-400">Os termos são criados por produtora. Sua conta não está ligada a uma produtora; use o Super Admin.</p>;
  }
  const params = await searchParams;
  const supabase = await createClient();
  const { data: eventos } = await supabase.from("eventos").select("id, nome, slug, data_inicio")
    .eq("produtora_id", usuario.produtora_id).order("data_inicio", { ascending: false, nullsFirst: false });

  if (!eventos?.length) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-xl font-semibold text-white">Termos</h1>
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-12 text-center text-sm text-gray-400">
          Os termos são de cada evento. <Link href="/eventos" className="text-axon-gold hover:underline">Crie um evento</Link> primeiro.
        </p>
      </div>
    );
  }

  const evento = eventos.find((e) => e.id === params.evento) ?? eventos[0];
  const [{ data: docs }, { data: produtora }, { data: aps }] = await Promise.all([
    supabase.from("termos_documentos").select("id, tipo, titulo, conteudo, ativo, versao, atualizado_em").eq("evento_id", evento.id),
    supabase.from("produtoras").select("nome, documento").eq("id", usuario.produtora_id).maybeSingle(),
    supabase.from("apresentacoes")
      .select("grupos ( nome ), apresentacao_elenco ( participantes ( id, nome, data_nascimento, termo_assinado, termo_assinado_em, responsavel_nome ) )")
      .eq("evento_id", evento.id),
  ]);

  // Cada pessoa do elenco do evento, uma vez só
  const porId = new Map<string, Assinatura>();
  for (const ap of aps ?? []) {
    for (const el of ap.apresentacao_elenco ?? []) {
      const p = el.participantes;
      if (!p || porId.has(p.id)) continue;
      const idade = idadeEm(p.data_nascimento);
      porId.set(p.id, {
        id: p.id, nome: p.nome, grupo: ap.grupos?.nome ?? "—", assinado: !!p.termo_assinado,
        assinadoEm: p.termo_assinado_em, menor: idade !== null && idade < 18, responsavel: p.responsavel_nome,
      });
    }
  }
  const assinaturas = [...porId.values()].sort((a, b) => a.grupo.localeCompare(b.grupo, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <Termos
      eventos={eventos.map((e) => ({ id: e.id, nome: e.nome }))}
      evento={{ id: evento.id, nome: evento.nome, slug: evento.slug }}
      produtoraId={usuario.produtora_id}
      produtora={{ nome: produtora?.nome ?? "", documento: produtora?.documento ?? null }}
      documentos={(docs ?? []) as DocumentoTermo[]}
      assinaturas={assinaturas}
    />
  );
}
