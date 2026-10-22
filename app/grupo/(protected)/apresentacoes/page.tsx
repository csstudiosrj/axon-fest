"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadFiles } from "@/utils/uploadthing";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Music4,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Users,
  Wand2,
  X,
} from "lucide-react";

type TenantConfig = {
  id: string;
  grupo_id: string;
  perfil_id: string | null;
  nome_organizacao: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  termo_inscricao: string | null;
  termo_participante: string | null;
  termo_grupo: string | null;
  termo_apresentacao: string | null;
  termo_evento: string | null;
};

type TenantEstiloAtivo = {
  estilo_id: string;
  grupo_id: string;
};

type Estilo = {
  id: string;
  nome: string;
  descricao: string | null;
  perfil_id: string;
  slug: string;
  ordem: number;
};

type Participante = {
  id: string;
  nome: string;
  grupo_id: string | null;
};

type Categoria = {
  id: string;
  evento_id: string | null;
  nome: string;
  valor_solo: number | null;
  valor_duo: number | null;
  valor_conjunto: number | null;
  genero: string | null;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  faixa_etaria_label: string | null;
  categoria_pai_id: string | null;
  estilo_id: string | null;
  permite_solo: boolean | null;
  permite_duo: boolean | null;
  permite_conjunto: boolean | null;
  min_participantes: number | null;
  max_participantes: number | null;
  tempo_apresentacao_min: number | null;
  tempo_apresentacao_max: number | null;
  observacoes: string | null;
  cor_identificacao: string | null;
};

type UploadState = {
  nome: string;
  url: string;
};

type Toast = {
  id: number;
  tipo: "sucesso" | "erro" | "aviso";
  mensagem: string;
};

type FormState = {
  nome: string;
  tipo: string;
  categoria_id: string;
  estilo_id: string;
  quantidade_participantes: string;
  observacoes: string;
  participantes_ids: string[];
  coreografos: string[];
  diretores: string[];
  compositores: string[];
};

type Labels = {
  evento: string;
  inscricao: string;
  participanteSingular: string;
  participantePlural: string;
  grupo: string;
  apresentacao: string;
};

const supabase = createClient();
let toastId = 0;

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function ToastContainer({ toasts, remover }: { toasts: Toast[]; remover: (id: number) => void }) {
  const cores: Record<Toast["tipo"], string> = {
    sucesso: "border-emerald-500/40 bg-[#1a1413]",
    erro: "border-red-500/40 bg-[#1a1413]",
    aviso: "border-yellow-500/40 bg-[#1a1413]",
  };

  return (
    <div className="fixed bottom-6 right-6 z-[120] flex pointer-events-none flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl",
            cores[toast.tipo]
          )}
        >
          {toast.tipo === "sucesso" ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : toast.tipo === "erro" ? (
            <AlertTriangle size={16} className="text-red-400" />
          ) : (
            <AlertTriangle size={16} className="text-yellow-400" />
          )}
          <span className="text-sm font-medium text-white">{toast.mensagem}</span>
          <button onClick={() => remover(toast.id)} className="ml-2 text-gray-600 transition-colors hover:text-white">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
      {children}
      {required ? <span className="ml-1 text-[#C5A059]">*</span> : null}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#2e2825] bg-[#0d0807] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-[#C5A059] focus:outline-none",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#2e2825] bg-[#0d0807] px-4 py-3 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-[#C5A059] focus:outline-none",
        props.className
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#2e2825] bg-[#0d0807] px-4 py-2.5 text-sm text-white transition-colors focus:border-[#C5A059] focus:outline-none",
        props.className
      )}
    />
  );
}

function ListEditor({
  titulo,
  items,
  onChange,
  placeholder,
}: {
  titulo: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const setItem = (i: number, value: string) => {
    const copy = [...items];
    copy[i] = value;
    onChange(copy);
  };

  const addItem = () => onChange([...items, ""]);

  const removeItem = (i: number) => onChange(items.length === 1 ? [""] : items.filter((_, idx) => idx !== i));

  return (
    <div className="flex h-full flex-col space-y-3 rounded-xl border border-[#2e2825] bg-[#0d0807] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{titulo}</p>
          <p className="text-xs text-gray-500">Pode adicionar vários nomes.</p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2e2825] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-[#3d3531] hover:text-white"
        >
          <Plus size={13} />
          Adicionar
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div key={`${titulo}-${index}`} className="flex items-center gap-2">
            <Input value={item} onChange={(e) => setItem(index, e.target.value)} placeholder={`${placeholder} ${index + 1}`} />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2e2825] text-gray-500 transition-colors hover:border-red-500/30 hover:text-red-400"
              aria-label={`Remover ${titulo}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

async function uploadViaUploadThing(
  file: File,
  endpoint: "musicUploader" | "mapaDeLuzUploader"
) {
  const [first] = await uploadFiles(endpoint, { files: [file] });
  if (!first) throw new Error("Falha ao enviar arquivo.");

  return { nome: first.name ?? file.name, url: first.ufsUrl } as UploadState;
}

export default function ApresentacoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [organizacaoId, setOrganizacaoId] = useState<string | null>(null);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [estilos, setEstilos] = useState<Estilo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasVazias, setCategoriasVazias] = useState(false);
  const [arquivoAudio, setArquivoAudio] = useState<UploadState | null>(null);
  const [arquivoMapaLuz, setArquivoMapaLuz] = useState<UploadState | null>(null);

  const [form, setForm] = useState<FormState>({
    nome: "",
    tipo: "",
    categoria_id: "",
    estilo_id: "",
    quantidade_participantes: "",
    observacoes: "",
    participantes_ids: [],
    coreografos: [""],
    diretores: [""],
    compositores: [""],
  });

  const addToast = useCallback((tipo: Toast["tipo"], mensagem: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, tipo, mensagem }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const labels: Labels = useMemo(
    () => ({
      evento: config?.termo_evento?.trim() || "Festival",
      inscricao: config?.termo_inscricao?.trim() || "Inscrição",
      participanteSingular: config?.termo_participante?.trim() || "Participante",
      participantePlural: `${config?.termo_participante?.trim() || "Participante"}s`,
      grupo: config?.termo_grupo?.trim() || "Grupo",
      apresentacao: config?.termo_apresentacao?.trim() || "Apresentação",
    }),
    [config]
  );

  const categoriaSelecionada = useMemo(
    () => categorias.find((c) => c.id === form.categoria_id) ?? null,
    [categorias, form.categoria_id]
  );

  const participantesSelecionados = useMemo(
    () => participantes.filter((p) => form.participantes_ids.includes(p.id)),
    [participantes, form.participantes_ids]
  );

  const valorSelecionado = categoriaSelecionada
    ? form.tipo === "solo"
      ? categoriaSelecionada.valor_solo
      : form.tipo === "duo"
        ? categoriaSelecionada.valor_duo
        : categoriaSelecionada.valor_conjunto
    : null;

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Usuário não autenticado.");

        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("id, grupo_id")
          .eq("id", user.id)
          .single();

        if (usuarioError || !usuario) throw new Error("Usuário não encontrado.");
        if (!usuario.grupo_id) throw new Error("Organização não identificada.");

        setOrganizacaoId(usuario.grupo_id);

        const [cfg, estilosAtivosRes, participantesRes, categoriasRes] = await Promise.all([
          supabase.from("tenant_config").select("*").eq("grupo_id", usuario.grupo_id).single(),
          supabase
            .from("tenant_estilos_ativos")
            .select("estilo_id, grupo_id")
            .eq("grupo_id", usuario.grupo_id),
          supabase
            .from("participantes")
            .select("id,nome,grupo_id")
            .eq("grupo_id", usuario.grupo_id)
            .order("nome", { ascending: true }),
          supabase.from("categorias").select("*").order("nome", { ascending: true }),
        ]);

        if (cfg.error && cfg.error.code !== "PGRST116") throw cfg.error;
        if (cfg.data) setConfig(cfg.data as TenantConfig);

        const estilosIds = (estilosAtivosRes.data as TenantEstiloAtivo[] | null)?.map((item) => item.estilo_id) ?? [];

        if (estilosIds.length > 0) {
          const { data: estilosData, error: estilosError } = await supabase
            .from("estilos")
            .select("id,nome,descricao,perfil_id,slug,ordem")
            .in("id", estilosIds)
            .order("ordem", { ascending: true });

          if (estilosError) throw estilosError;
          if (estilosData) setEstilos(estilosData as Estilo[]);
        } else {
          setEstilos([]);
        }

        if (participantesRes.error) throw participantesRes.error;
        if (categoriasRes.error) throw categoriasRes.error;

        if (participantesRes.data) setParticipantes(participantesRes.data as Participante[]);
        if (categoriasRes.data) {
          setCategorias(categoriasRes.data as Categoria[]);
          setCategoriasVazias(categoriasRes.data.length === 0);
        }
      } catch (e) {
        addToast("erro", e instanceof Error ? e.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [addToast]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function toggleParticipante(id: string) {
    setForm((p) => ({
      ...p,
      participantes_ids: p.participantes_ids.includes(id)
        ? p.participantes_ids.filter((x) => x !== id)
        : [...p.participantes_ids, id],
    }));
  }

  async function handleAudio(file: File) {
    try {
      setUploadingAudio(true);
      setArquivoAudio(await uploadViaUploadThing(file, "musicUploader"));
      addToast("sucesso", "Áudio enviado.");
    } catch (e) {
      addToast("erro", e instanceof Error ? e.message : "Erro ao enviar áudio.");
    } finally {
      setUploadingAudio(false);
    }
  }

  async function handleLight(file: File) {
    try {
      setUploadingLight(true);
      setArquivoMapaLuz(await uploadViaUploadThing(file, "mapaDeLuzUploader"));
      addToast("sucesso", "Mapa de luz enviado.");
    } catch (e) {
      addToast("erro", e instanceof Error ? e.message : "Erro ao enviar mapa de luz.");
    } finally {
      setUploadingLight(false);
    }
  }

  function validate() {
    if (!form.nome.trim()) return `Informe o nome da ${labels.apresentacao.toLowerCase()}.`;
    if (!form.categoria_id) return "Selecione uma categoria.";
    if (!form.tipo) return "Selecione o tipo.";
    if (form.participantes_ids.length === 0) return `Selecione ao menos um ${labels.participanteSingular.toLowerCase()}.`;
    if (!arquivoAudio?.url) return "O envio da música é obrigatório.";
    return null;
  }

  async function save() {
    const error = validate();
    if (error) return addToast("aviso", error);
    if (!organizacaoId) return addToast("erro", "Organização não identificada.");

    setSaving(true);
    try {
      const { data: apresentacao, error: insertError } = await supabase
        .from("apresentacoes")
        .insert({
          nome: form.nome.trim(),
          grupo_id: organizacaoId,
          categoria_id: form.categoria_id,
          tipo: form.tipo,
          quantidade_participantes: form.participantes_ids.length || null,
          valor_total: valorSelecionado,
          arquivo_audio: arquivoAudio?.url ?? null,
          arquivo_mapa_luz: arquivoMapaLuz?.url ?? null,
          observacoes: form.observacoes.trim() || null,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError || !apresentacao) throw insertError ?? new Error("Falha ao salvar apresentação.");

      const elencoRows = form.participantes_ids.map((participanteId) => ({
        apresentacao_id: apresentacao.id,
        participante_id: participanteId,
      }));

      if (elencoRows.length) {
        const { error: elencoError } = await supabase.from("apresentacao_elenco").insert(elencoRows);
        if (elencoError) throw elencoError;
      }

      addToast("sucesso", `${labels.apresentacao} salva com sucesso.`);
      setForm({
        nome: "",
        tipo: "",
        categoria_id: "",
        estilo_id: "",
        quantidade_participantes: "",
        observacoes: "",
        participantes_ids: [],
        coreografos: [""],
        diretores: [""],
        compositores: [""],
      });
      setArquivoAudio(null);
      setArquivoMapaLuz(null);
    } catch (e) {
      addToast("erro", e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-72 animate-pulse rounded-lg bg-[#2e2825]/60" />
        <div className="h-[640px] animate-pulse rounded-2xl border border-[#2e2825] bg-[#1a1413]" />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} remover={removeToast} />
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#2e2825] bg-[#1a1413] px-3 py-1 text-xs text-[#C5A059]">
              <Sparkles size={14} />
              Nova {labels.apresentacao}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Cadastro de {labels.apresentacao}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
              Cadastre a {labels.apresentacao.toLowerCase()}, vincule {labels.participantePlural.toLowerCase()},
              envie a música obrigatória e, se quiser, anexe o mapa de luz.
            </p>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C5A059] px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#d4b06a] disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Salvando..." : `Salvar ${labels.apresentacao}`}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-2xl border border-[#2e2825] bg-[#1a1413] p-6 md:p-8">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Dados principais</h2>
              <p className="text-sm text-gray-500">
                Os campos abaixo definem a identificação da apresentação.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <FieldLabel required>Nome da {labels.apresentacao}</FieldLabel>
                <Input
                  value={form.nome}
                  onChange={(e) => setField("nome", e.target.value)}
                  placeholder={`Ex: ${labels.apresentacao} 01`}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>Tipo</FieldLabel>
                <Select value={form.tipo} onChange={(e) => setField("tipo", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="solo">Solo</option>
                  <option value="duo">Duo</option>
                  <option value="conjunto">Conjunto</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel required>Categoria</FieldLabel>
                <Select value={form.categoria_id} onChange={(e) => setField("categoria_id", e.target.value)}>
                  <option value="">Selecione</option>
                  {categoriasVazias ? (
                    <option value="" disabled>
                      Nenhuma categoria cadastrada para este evento
                    </option>
                  ) : (
                    categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))
                  )}
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Estilo</FieldLabel>
                <Select value={form.estilo_id} onChange={(e) => setField("estilo_id", e.target.value)}>
                  <option value="">Selecione</option>
                  {estilos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Quantidade de participantes</FieldLabel>
                <Input
                  value={form.quantidade_participantes}
                  onChange={(e) => setField("quantidade_participantes", e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <FieldLabel>Observações</FieldLabel>
                <TextArea
                  rows={4}
                  value={form.observacoes}
                  onChange={(e) => setField("observacoes", e.target.value)}
                  placeholder="Informações adicionais"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Ficha criativa</h2>
                <p className="text-sm text-gray-500">Vários nomes por função.</p>
              </div>

              <div className="flex flex-col gap-4">
                <ListEditor
                  titulo="Coreógrafos"
                  items={form.coreografos}
                  onChange={(v) => setField("coreografos", v)}
                  placeholder="Nome do coreógrafo"
                />
                <ListEditor
                  titulo="Diretores"
                  items={form.diretores}
                  onChange={(v) => setField("diretores", v)}
                  placeholder="Nome do diretor"
                />
                <ListEditor
                  titulo="Compositores"
                  items={form.compositores}
                  onChange={(v) => setField("compositores", v)}
                  placeholder="Nome do compositor"
                />
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-[#2e2825] bg-[#1a1413] p-6">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Users size={16} className="text-[#C5A059]" />
                  {labels.participantePlural}
                </h2>
                <p className="text-sm text-gray-500">
                  Selecione quem participa desta {labels.apresentacao.toLowerCase()}.
                </p>
              </div>

              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {participantes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#2e2825] px-4 py-6 text-center text-sm text-gray-500">
                    Nenhum participante encontrado.
                  </div>
                ) : (
                  participantes.map((p) => {
                    const active = form.participantes_ids.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipante(p.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                          active
                            ? "border-[#C5A059]/35 bg-[#C5A059]/8"
                            : "border-[#2e2825] bg-[#0d0807] hover:border-[#3e3835]"
                        )}
                      >
                        <p className="text-sm font-medium text-white">{p.nome}</p>
                        {active ? <CheckCircle2 size={16} className="text-[#C5A059]" /> : <Plus size={15} className="text-gray-600" />}
                      </button>
                    );
                  })
                )}
              </div>

              {participantesSelecionados.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-[#2e2825] bg-[#0d0807] p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                    Elenco selecionado
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {participantesSelecionados.map((participante) => (
                      <span
                        key={participante.id}
                        className="inline-flex items-center rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-3 py-1 text-xs font-medium text-[#E7C98A]"
                      >
                        {participante.nome}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="space-y-4 rounded-2xl border border-[#2e2825] bg-[#1a1413] p-6">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Music4 size={16} className="text-[#C5A059]" />
                  Mídia e anexos
                </h2>
                <p className="text-sm text-gray-500">
                  Música obrigatória e mapa de luz opcional.
                </p>
              </div>

              <UploadBox
                titulo="Música"
                obrigatorio
                descricao="Envie o arquivo principal de áudio."
                arquivo={arquivoAudio}
                aceitos="audio/*,.mp3,.wav,.m4a"
                onUpload={handleAudio}
                onRemove={() => setArquivoAudio(null)}
                carregando={uploadingAudio}
              />

              <UploadBox
                titulo="Mapa de luz"
                descricao="Opcional. PDF ou imagem técnica."
                arquivo={arquivoMapaLuz}
                aceitos=".pdf,image/*"
                onUpload={handleLight}
                onRemove={() => setArquivoMapaLuz(null)}
                carregando={uploadingLight}
              />
            </section>

            <section className="space-y-4 rounded-2xl border border-[#2e2825] bg-[#1a1413] p-6">
              <div className="space-y-1">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Wand2 size={16} className="text-[#C5A059]" />
                  Resumo
                </h2>
                <p className="text-sm text-gray-500">Prévia do que será salvo.</p>
              </div>

              <div className="space-y-3 rounded-xl border border-[#2e2825] bg-[#0d0807] p-4 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-[#2e2825] pb-3">
                  <span className="text-gray-500">{labels.apresentacao}</span>
                  <span className="text-right font-medium text-white">
                    {form.nome.trim() || "Não informado"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Elenco</span>
                  <span className="font-medium text-white">{form.participantes_ids.length} selecionado(s)</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Áudio</span>
                  <span className={cn("font-medium", arquivoAudio ? "text-emerald-300" : "text-yellow-300")}>
                    {arquivoAudio ? "Enviado" : "Pendente"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Mapa de luz</span>
                  <span className="font-medium text-white">
                    {arquivoMapaLuz ? "Anexado" : "Não enviado"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-medium text-[#C5A059]">
                    {typeof valorSelecionado === "number"
                      ? valorSelecionado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                      : "Aguardando categoria"}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}

function UploadBox({
  titulo,
  obrigatorio,
  descricao,
  arquivo,
  aceitos,
  onUpload,
  onRemove,
  carregando,
}: {
  titulo: string;
  obrigatorio?: boolean;
  descricao: string;
  arquivo: UploadState | null;
  aceitos: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  carregando: boolean;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-3 rounded-xl border border-[#2e2825] bg-[#0d0807] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {titulo}
            {obrigatorio ? <span className="ml-1 text-[#C5A059]">*</span> : null}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{descricao}</p>
        </div>
        {arquivo ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2e2825] text-gray-500 transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>

      {arquivo ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 size={15} />
            <span className="text-sm font-medium">{arquivo.nome}</span>
          </div>
          {arquivo.url ? (
            <a
              href={arquivo.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs text-[#C5A059] transition-colors hover:text-white"
            >
              Abrir arquivo enviado
            </a>
          ) : null}
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#3a332f] px-5 py-8 text-center transition-colors hover:border-[#C5A059]/40 hover:bg-[#1a1413]">
          {carregando ? <Loader2 size={22} className="animate-spin text-[#C5A059]" /> : <Upload size={22} className="text-[#C5A059]" />}
          <div>
            <p className="text-sm font-medium text-white">
              {carregando ? "Enviando arquivo..." : "Clique para selecionar"}
            </p>
            <p className="mt-1 text-xs text-gray-500">Tipos aceitos: {aceitos}</p>
          </div>
          <input type="file" accept={aceitos} className="hidden" disabled={carregando} onChange={handleChange} />
        </label>
      )}
    </div>
  );
}