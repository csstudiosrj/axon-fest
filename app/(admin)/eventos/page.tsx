"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SeletorPerfil } from "../_components/SeletorPerfil";
import { createClient } from "@/lib/supabase/client";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  Loader2,
  Trash2,
  Settings,
  X,
} from "lucide-react";

const supabase = createClient();

// ============================================================
// MAPEAMENTO DE PRESETS DINÂMICOS
// ============================================================
const PRESETS: Record<
  string,
  {
    placeholderNovo: string;
    dica: React.ReactNode;
    placeholderNome: string;
    taxaSolo: string;
    taxaDuo: string;
    taxaConjunto: string;
    explicacaoSub: string;
  }
> = {
  danca: {
    placeholderNovo: "Ex: Festival de Dança ARXUM 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> Crie categorias-pai (ex:{" "}
        <em>Ballet</em>) e, dentro delas, subcategorias por faixa etária ou gênero
        (ex: <em>Ballet Infantil Feminino</em>). As taxas de inscrição são
        definidas por categoria. Solo, Duo e Conjunto têm valores diferentes.
      </>
    ),
    placeholderNome: "Ex: Ballet Clássico, Jazz Adulto, Contemporâneo...",
    taxaSolo: "Solo (R$)",
    taxaDuo: "Duo (R$)",
    taxaConjunto: "Conjunto/pax (R$)",
    explicacaoSub:
      "Subcategoria vinculada a uma categoria-pai. Herda o estilo, mas tem faixa etária e gênero próprios.",
  },
  musica: {
    placeholderNovo: "Ex: Festival de Música ARXUM 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> Crie categorias-pai (ex: <em>MPB, Rock</em>)
        e, dentro delas, subcategorias por formato (ex: <em>Solo Vocal, Banda Instrumental</em>).
        As taxas de inscrição são definidas por categoria.
      </>
    ),
    placeholderNome: "Ex: MPB, Rock, Solo Vocal, Música Clássica...",
    taxaSolo: "Solo (R$)",
    taxaDuo: "Duo/Dupla (R$)",
    taxaConjunto: "Banda/Grupo (R$)",
    explicacaoSub:
      "Subcategoria vinculada a uma categoria-pai. Herda o estilo musical, mas tem formato e características próprias.",
  },
  teatro: {
    placeholderNovo: "Ex: Mostra de Teatro ARXUM 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> Crie categorias-pai (ex: <em>Comédia, Drama</em>)
        e, dentro delas, subcategorias (ex: <em>Cena Curta, Monólogo</em>). As taxas
        de inscrição são definidas por categoria.
      </>
    ),
    placeholderNome: "Ex: Comédia, Drama, Monólogo, Teatro Musical...",
    taxaSolo: "Monólogo (R$)",
    taxaDuo: "Cena em Dupla (R$)",
    taxaConjunto: "Elenco/Grupo (R$)",
    explicacaoSub:
      "Subcategoria vinculada a uma categoria-pai. Herda o gênero teatral, mas tem duração ou elenco específicos.",
  },
};

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  status: string;
  inscritos_count: number;
};

const STATUS_CONFIG: Record<string, { label: string; cor: string }> = {
  inscricoes_abertas: {
    label: "Inscrições Abertas",
    cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  em_andamento: {
    label: "Em Andamento",
    cor: "text-axon-gold bg-axon-gold/10 border-axon-gold/20",
  },
  encerrado: {
    label: "Encerrado",
    cor: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  },
  rascunho: {
    label: "Rascunho",
    cor: "text-gray-500 bg-white/5 border-white/10",
  },
  Publicado: {
    label: "Publicado",
    cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
};

function obterDataSegura(dataStr: string): Date {
  const apenasData = dataStr.split("T")[0];
  const [ano, mes, dia] = apenasData.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarPeriodo(
  inicio: string | null | undefined,
  fim: string | null | undefined
): string {
  if (!inicio || !fim) return "Período não informado";

  const i = obterDataSegura(inicio);
  const f = obterDataSegura(fim);

  if (isNaN(i.getTime()) || isNaN(f.getTime())) {
    return "Período inválido";
  }

  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  if (i.getFullYear() === f.getFullYear() && i.getMonth() === f.getMonth()) {
    return `${i.getDate()} a ${f.toLocaleDateString("pt-BR", opts)}`;
  }

  return `${i.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })} a ${f.toLocaleDateString("pt-BR", opts)}`;
}

export default function EventosPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [criando, setCriando] = useState(false);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [produtoraId, setProdutoraId] = useState<string | null>(null);
  const [perfilSlug, setPerfilSlug] = useState("danca");
  const [form, setForm] = useState({
    nome: "",
    data_inicio: "",
    data_fim: "",
    perfil_id: "",
  });

  const carregarEventos = useCallback(
    async (pid: string) => {
      setLoading(true);
      const { data } = await supabase
        .from("eventos")
        .select("id, nome, data_inicio, data_fim, local, status, inscritos_count")
        .eq("produtora_id", pid)
        .order("data_inicio", { ascending: false });

      setEventos(data ?? []);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userData } = await supabase
        .from("usuarios")
        .select("role, produtora_id")
        .eq("id", user.id)
        .single();

      if (!userData) return;

      if (userData.role === "super_admin") {
        setLoading(true);
        const { data } = await supabase
          .from("eventos")
          .select("id, nome, data_inicio, data_fim, local, status, inscritos_count")
          .order("data_inicio", { ascending: false });

        setEventos(data ?? []);
        setLoading(false);
        return;
      }

      if (userData.produtora_id) {
        setProdutoraId(userData.produtora_id);

        const { data: config } = await supabase
          .from("tenant_config")
          .select("perfil_id, perfis_festival:perfil_id ( slug )")
          .eq("produtora_id", userData.produtora_id)
          .maybeSingle();

        const slugConfig = (config as { perfis_festival?: { slug?: string } | null } | null)
          ?.perfis_festival?.slug;

        if (slugConfig) {
          setPerfilSlug(slugConfig);
        }
        // O tipo da produtora vira o padrão do novo evento
        const perfilPadrao = (config as { perfil_id?: string | null } | null)?.perfil_id;
        if (perfilPadrao) setForm((f) => ({ ...f, perfil_id: f.perfil_id || perfilPadrao }));

        await carregarEventos(userData.produtora_id);
      } else {
        setLoading(false);
      }
    }

    void init();
  }, [supabase, carregarEventos]);

  // Fechar modal via tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalNovo && !criando) {
        setModalNovo(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalNovo, criando]);

  async function criarEvento() {
    if (!form.nome.trim() || !form.data_inicio || !form.data_fim || !form.perfil_id) return;

    setCriando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCriando(false);
      return;
    }

    const { data: userData } = await supabase
      .from("usuarios")
      .select("produtora_id")
      .eq("id", user.id)
      .single();

    const { data, error } = await supabase
      .from("eventos")
      .insert({
        nome: form.nome,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        perfil_id: form.perfil_id,
        status: "Em Montagem",
        inscritos_count: 0,
        produtora_id: userData?.produtora_id ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      router.push(`/eventos/${data.id}`);
    } else {
      setCriando(false);
    }
  }

  async function excluirEvento(id: string) {
    setExcluindo(id);
    await supabase.from("eventos").delete().eq("id", id);
    setEventos((prev) => prev.filter((e) => e.id !== id));
    setMenuAberto(null);
    setExcluindo(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-axon-gold" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Line-up & Eventos</h1>
          <p className="text-gray-400 mt-1">
            Gerencie os festivais, categorias e a ordem de apresentação.
          </p>
        </div>

        <button
          onClick={() => setModalNovo(true)}
          className="bg-axon-gold text-black px-4 py-2 rounded-md font-semibold flex items-center gap-2 hover:bg-axon-gold/90 transition-all duration-200 active:scale-95"
        >
          <Plus size={20} />
          Novo Evento
        </button>
      </div>

      {eventos.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <CalendarDays
            size={48}
            className="mx-auto mb-4 opacity-20 text-axon-gold"
          />
          <p className="text-lg">Nenhum evento cadastrado ainda.</p>
          <p className="text-sm mt-1">
            Clique em &quot;Novo Evento&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventos.map((evento) => {
            const status = STATUS_CONFIG[evento.status] ?? {
              label: evento.status,
              cor: "text-gray-400 bg-white/5 border-white/10",
            };

            return (
              <div
                key={evento.id}
                onClick={() => router.push(`/eventos/${evento.id}`)}
                className="bg-axon-panel border border-axon-border rounded-xl p-6 flex flex-col hover:border-axon-gold/40 transition-colors group relative cursor-pointer"
              >
                <div
                  className="absolute top-6 right-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      setMenuAberto(menuAberto === evento.id ? null : evento.id)
                    }
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {menuAberto === evento.id && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuAberto(null)}
                      />

                      <div className="absolute right-0 mt-2 w-44 bg-axon-panel border border-axon-border rounded-xl shadow-2xl z-50 py-2">
                        <button
                          onClick={() => {
                            router.push(`/eventos/${evento.id}`);
                            setMenuAberto(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Settings size={15} />
                          Configurar
                        </button>

                        <div className="h-px bg-axon-border my-1" />

                        <button
                          onClick={() => void excluirEvento(evento.id)}
                          disabled={excluindo === evento.id}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                        >
                          {excluindo === evento.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mb-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.cor}`}
                  >
                    {status.label}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 pr-6">
                  {evento.nome}
                </h3>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CalendarDays size={16} className="shrink-0 text-axon-gold" />
                    <span>{formatarPeriodo(evento.data_inicio, evento.data_fim)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin size={16} className="shrink-0 text-axon-gold" />
                    <span>{evento.local || "Local não definido"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-axon-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users size={16} />
                    <span>{evento.inscritos_count ?? 0} inscritos</span>
                  </div>

                  <span className="text-xs text-gray-600 group-hover:text-axon-gold transition-colors">
                    Ver painel →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNovo && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => !criando && setModalNovo(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-md p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Novo Evento</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Você configura todos os detalhes dentro do painel do evento.
                </p>
              </div>

              {!criando && (
                <button
                  onClick={() => setModalNovo(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Nome do Festival *</label>
                <input
                  type="text"
                  placeholder={
                    PRESETS[perfilSlug]?.placeholderNovo || PRESETS.danca.placeholderNovo
                  }
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  disabled={criando}
                  className="w-full bg-axon-bg border border-axon-border rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-colors disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Data de Início *</label>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) =>
                      setForm({ ...form, data_inicio: e.target.value })
                    }
                    disabled={criando}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-axon-bg border border-axon-border rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-colors disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Data de Fim *</label>
                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) =>
                      setForm({ ...form, data_fim: e.target.value })
                    }
                    disabled={criando}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-axon-bg border border-axon-border rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Tipo do festival *</label>
                <SeletorPerfil valor={form.perfil_id} disabled={criando}
                  onChange={(perfil) => { setForm({ ...form, perfil_id: perfil.id }); setPerfilSlug(perfil.slug); }} />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              {!criando && (
                <button
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              )}

              <button
                onClick={() => void criarEvento()}
                disabled={
                  criando ||
                  !form.nome.trim() ||
                  !form.data_inicio ||
                  !form.data_fim ||
                  !form.perfil_id
                }
                className="flex items-center gap-2 bg-axon-gold text-black font-semibold px-5 py-2.5 rounded-md hover:bg-axon-gold/90 transition-all duration-200 active:scale-95 text-sm disabled:opacity-50 min-w-[140px] justify-center"
              >
                {criando ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Criar & Configurar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}