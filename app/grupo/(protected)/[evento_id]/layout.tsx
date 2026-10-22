import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { carregarContextoGrupo, situacaoEvento } from "@/lib/grupo/contexto";
import { maiuscula } from "@/lib/perfis";
import { Selo, periodo, tomDoEvento } from "../../_components/ui";
import { Abas } from "./Abas";

export const dynamic = "force-dynamic";

export default async function LayoutEventoGrupo({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ evento_id: string }>;
}) {
  const { evento_id } = await params;
  const { evento, perfil } = await carregarContextoGrupo(evento_id);
  const situacao = situacaoEvento(evento.status);
  const base = `/grupo/${evento.id}`;

  const abas = [
    { href: `${base}/inicio`, rotulo: "Resumo" },
    { href: `${base}/apresentacoes`, rotulo: maiuscula(perfil.termos.apresentacao.plural) },
    { href: `${base}/elenco`, rotulo: maiuscula(perfil.termos.elenco) },
    ...(evento.resultado_publicado_em ? [{ href: `${base}/resultado`, rotulo: "Resultado" }] : []),
  ];

  return (
    <div>
      <div className="border-b border-axon-border bg-axon-panel/60">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <Link href="/grupo/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white">
            <ArrowLeft size={13} /> Meus festivais
          </Link>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {evento.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={evento.logo_url} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-axon-border bg-axon-bg object-contain" />
              )}
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-white">{evento.nome}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                  {evento.produtora_nome && <span>{evento.produtora_nome}</span>}
                  <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {periodo(evento.data_inicio, evento.data_fim)}</span>
                  {evento.local && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {evento.local}</span>}
                </p>
              </div>
            </div>
            <Selo tom={tomDoEvento(evento.status)}>{situacao.rotulo}</Selo>
          </div>
          <div className="mt-5"><Abas abas={abas} /></div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
