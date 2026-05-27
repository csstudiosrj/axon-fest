"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Building2, ArrowRight, Ticket } from "lucide-react";
import { createClient } from "../../../../lib/supabase/client";


interface Festival {
  inscricao_id: string;
  evento_id: string;
  status_inscricao: string;
  evento_nome: string;
  evento_data_inicio: string;
  evento_data_fim: string;
  evento_local: string;
  evento_status: string;
  evento_cor_primaria: string | null;
  evento_banner_url: string | null;
  evento_logo_url: string | null;
  produtora_nome: string;
  produtora_logo_url: string | null;
}

const STATUS_INSCRICAO: Record<string, { label: string; className: string }> = {
  rascunho:  { label: "Rascunho",  className: "text-gray-400 bg-gray-400/10 border-gray-400/30" },
  ativo:     { label: "Ativo",     className: "text-green-400 bg-green-400/10 border-green-400/30" },
  encerrado: { label: "Encerrado", className: "text-red-400 bg-red-400/10 border-red-400/30" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-axon-border bg-axon-panel h-48" />
  );
}

function BadgeStatus({ status }: { status: string }) {
  const cfg = STATUS_INSCRICAO[status] ?? STATUS_INSCRICAO["rascunho"];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function FestivalCard({ festival, onClick }: { festival: Festival; onClick: () => void }) {
  const accent = festival.evento_cor_primaria ?? "var(--color-axon-gold, #C5A059)";

  return (
    <div
      className="relative rounded-xl border border-axon-border bg-axon-panel overflow-hidden flex flex-col cursor-pointer group transition-all duration-200 hover:border-axon-gold/40 hover:shadow-lg"
      onClick={onClick}
      style={{ borderLeftColor: accent, borderLeftWidth: "3px" }}
    >
      {festival.evento_banner_url && (
        <div className="h-24 w-full overflow-hidden">
          <img
            src={festival.evento_banner_url}
            alt={festival.evento_nome}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-200"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {festival.evento_logo_url ? (
              <img
                src={festival.evento_logo_url}
                alt={festival.evento_nome}
                className="w-8 h-8 rounded-lg object-contain shrink-0 bg-axon-bg border border-axon-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-axon-bg border border-axon-border flex items-center justify-center shrink-0">
                <Ticket size={14} className="text-axon-gold" />
              </div>
            )}
            <h3 className="text-white font-bold text-sm leading-snug truncate">
              {festival.evento_nome}
            </h3>
          </div>
          <BadgeStatus status={festival.status_inscricao} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Building2 size={12} className="shrink-0 text-gray-500" />
            <span className="truncate">{festival.produtora_nome}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CalendarDays size={12} className="shrink-0 text-gray-500" />
            <span>{formatDate(festival.evento_data_inicio)} – {formatDate(festival.evento_data_fim)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin size={12} className="shrink-0 text-gray-500" />
            <span className="truncate">{festival.evento_local}</span>
          </div>
        </div>

        <div className="mt-auto pt-2">
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-black bg-axon-gold hover:opacity-90 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Acessar festival <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-axon-panel border border-axon-border flex items-center justify-center">
        <Ticket size={28} className="text-gray-600" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-white font-bold text-base">Nenhum festival encontrado</h2>
        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
          Você ainda não está inscrito em nenhum festival. Para participar, acesse o link de
          inscrição divulgado pela produtora do festival nas redes sociais ou canais de comunicação.
        </p>
      </div>
    </div>
  );
}

export default function GrupoDashboardPage() {
  const router = useRouter();
  const [festivais, setFestivais] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setErro("Sessão inválida. Faça login novamente."); setLoading(false); return; }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("organizacao_id")
        .eq("id", user.id)
        .single();

      if (usuarioError || !usuario?.organizacao_id) {
        setErro("Sua conta não está vinculada a nenhum grupo. Entre em contato com o administrador.");
        setLoading(false);
        return;
      }

      const { data: inscricoes, error: inscricoesError } = await supabase
        .from("inscricoes_grupo_evento")
        .select(`
          id,
          evento_id,
          status,
          eventos (
            nome,
            data_inicio,
            data_fim,
            local,
            status,
            banner_url,
            logo_url,
            cor_primaria,
            produtora_id,
            produtoras (
              nome,
              logo_url
            )
          )
        `)
        .eq("grupo_id", usuario.organizacao_id);

      if (inscricoesError) { setErro("Erro ao carregar festivais."); setLoading(false); return; }

      const mapped: Festival[] = (inscricoes ?? [])
        .filter((i) => i.eventos)
        .map((i) => {
          const ev = i.eventos as any;
          const prod = ev.produtoras as any;
          return {
            inscricao_id: i.id,
            evento_id: i.evento_id,
            status_inscricao: i.status,
            evento_nome: ev.nome,
            evento_data_inicio: ev.data_inicio,
            evento_data_fim: ev.data_fim,
            evento_local: ev.local,
            evento_status: ev.status,
            evento_cor_primaria: ev.cor_primaria ?? null,
            evento_banner_url: ev.banner_url ?? null,
            evento_logo_url: ev.logo_url ?? null,
            produtora_nome: prod?.nome ?? "Produtora",
            produtora_logo_url: prod?.logo_url ?? null,
          };
        });

      setFestivais(mapped);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-white">Meus Festivais</h1>
        <p className="text-sm text-gray-400 mt-0.5">Selecione um festival para acessar o portal do grupo.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-red-400 text-sm font-medium">{erro}</p>
        </div>
      )}

      {!loading && !erro && festivais.length === 0 && <EmptyState />}

      {!loading && !erro && festivais.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {festivais.map((f) => (
            <FestivalCard
              key={f.inscricao_id}
              festival={f}
              onClick={() => router.push(`/grupo/${f.evento_id}/inicio`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}