import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MessageSquareQuote, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { carregarContextoGrupo } from "@/lib/grupo/contexto";
import { maiuscula } from "@/lib/perfis";
import { Cartao, Selo, Vazio } from "../../../_components/ui";

export const dynamic = "force-dynamic";

const formatarNota = (n: number | null) => (n == null ? "—" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }));

export default async function ResultadoGrupo({ params }: { params: Promise<{ evento_id: string }> }) {
  const { evento_id } = await params;
  const { evento, perfil, grupo } = await carregarContextoGrupo(evento_id);
  if (!evento.resultado_publicado_em) notFound();
  const T = perfil.termos;

  const supabase = await createClient();
  const { data: minhas } = await supabase.from("apresentacoes").select("id, nome").eq("evento_id", evento.id).eq("grupo_id", grupo.id);
  const ids = (minhas ?? []).map((a) => a.id as string);

  const [{ data: resultados }, { data: comentarios }] = await Promise.all([
    ids.length
      ? supabase.from("resultados_publicados").select("apresentacao_id, grupo_titulo, posicao, nota, ordem_grupo").eq("evento_id", evento.id).in("apresentacao_id", ids)
      : Promise.resolve({ data: [] as { apresentacao_id: string; grupo_titulo: string; posicao: number | null; nota: number | null; ordem_grupo: number }[] }),
    evento.liberar_comentarios && ids.length
      ? supabase.from("comentarios_jurados_grupo").select("apresentacao_id, jurado_numero, comentario").eq("evento_id", evento.id).order("jurado_numero")
      : Promise.resolve({ data: [] as { apresentacao_id: string; jurado_numero: number; comentario: string }[] }),
  ]);

  const resultadoDe = new Map((resultados ?? []).map((r) => [r.apresentacao_id as string, r]));
  const lista = (minhas ?? [])
    .map((a) => ({ id: a.id as string, nome: a.nome as string, r: resultadoDe.get(a.id as string) }))
    .sort((a, b) => (a.r?.ordem_grupo ?? 999) - (b.r?.ordem_grupo ?? 999) || (a.r?.posicao ?? 999) - (b.r?.posicao ?? 999));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Resultado</h2>
          <p className="mt-1 text-sm text-gray-400">
            Publicado em {new Date(evento.resultado_publicado_em).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}.
            {evento.liberar_comentarios ? " Os jurados aparecem numerados, sem identificação." : ""}
          </p>
        </div>
        {evento.slug && (
          <Link href={`/e/${evento.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-axon-gold hover:underline">
            Classificação completa <ExternalLink size={13} />
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <Cartao><Vazio icone={<Trophy size={22} />} titulo={`O grupo não teve ${T.apresentacao.plural} neste festival`} texto="Não há resultado a exibir." /></Cartao>
      ) : (
        lista.map(({ id, nome, r }) => {
          const meus = (comentarios ?? []).filter((c) => c.apresentacao_id === id);
          return (
            <Cartao key={id}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">{nome}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">{r?.grupo_titulo ?? `${maiuscula(T.apresentacao.singular)} sem classificação`}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r?.posicao ? (
                    <Selo tom={r.posicao <= 3 ? "ouro" : "neutro"}><Trophy size={11} /> {r.posicao}º lugar</Selo>
                  ) : (
                    <Selo>Sem colocação</Selo>
                  )}
                  <span className="text-sm font-semibold text-white">{formatarNota(r?.nota ?? null)}</span>
                </div>
              </div>
              {evento.liberar_comentarios && (
                <div className="border-t border-axon-border px-5 py-4">
                  {meus.length === 0 ? (
                    <p className="text-xs text-gray-500">Nenhum comentário dos jurados.</p>
                  ) : (
                    <ul className="space-y-3">
                      {meus.map((c) => (
                        <li key={`${c.jurado_numero}`} className="flex gap-3">
                          <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-axon-gold" />
                          <div>
                            <p className="text-xs text-gray-500">Jurado {c.jurado_numero}</p>
                            <p className="whitespace-pre-line text-sm text-gray-200">{c.comentario}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Cartao>
          );
        })
      )}
    </div>
  );
}
