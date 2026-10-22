"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SeletorPerfil } from "../../_components/SeletorPerfil";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  Settings,
  ListTree,
  CalendarDays,
  GripVertical,
  Plus,
  Trash2,
  Save,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  Users,
  CreditCard,
  Star,
  ShoppingCart,
  Pencil,
  LayoutDashboard,
  Info,
  AlertCircle,
  Search,
  Ticket,
  Coffee,
  MapPin,
  Trophy,
  Globe,
} from "lucide-react";

const supabase = createClient();

const PRESETS: Record<
  string,
  {
    placeholderNovo: string;
    dica: React.ReactNode;
    placeholderNomePrincipal: string;
    placeholderNomeSubcategoria: string;
    taxaSolo: string;
    taxaDuo: string;
    taxaConjunto: string;
    explicacaoPrincipal: string;
    explicacaoSub: string;
  }
> = {
  default: {
    placeholderNovo: "Ex: Festival 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> As Categorias Principais funcionam como
        rótulos de agrupamento para organizar suas subcategorias. Elas não
        cobram taxas de inscrição diretamente.
      </>
    ),
    placeholderNomePrincipal:
      "Ex: Categoria Geral, Bloco Principal, Módulo Geral...",
    placeholderNomeSubcategoria:
      "Ex: Nível Iniciante, Divisão A, Subcategoria 1...",
    taxaSolo: "Solo R$",
    taxaDuo: "Duo R$",
    taxaConjunto: "Conjunto R$",
    explicacaoPrincipal:
      "Categoria Principal usada para organizar o evento. Ela funciona como agrupadora e não cobra taxa diretamente.",
    explicacaoSub:
      "Subcategoria vinculada a uma Categoria Principal. É aqui que você define gênero, faixa etária e taxas.",
  },
  danca: {
    placeholderNovo: "Ex: Festival 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> As Categorias Principais funcionam como
        rótulos de agrupamento para organizar suas subcategorias. Elas não
        cobram taxas de inscrição diretamente.
      </>
    ),
    placeholderNomePrincipal:
      "Ex: Categoria Geral, Bloco Principal, Módulo Geral...",
    placeholderNomeSubcategoria:
      "Ex: Nível Iniciante, Divisão A, Subcategoria 1...",
    taxaSolo: "Solo R$",
    taxaDuo: "Duo R$",
    taxaConjunto: "Conjunto R$",
    explicacaoPrincipal:
      "Categoria Principal usada para organizar o evento. Ela funciona como agrupadora e não cobra taxa diretamente.",
    explicacaoSub:
      "Subcategoria vinculada a uma Categoria Principal. É aqui que você define gênero, faixa etária e taxas.",
  },
  musica: {
    placeholderNovo: "Ex: Festival 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> As Categorias Principais funcionam como
        rótulos de agrupamento para organizar suas subcategorias. Elas não
        cobram taxas de inscrição diretamente.
      </>
    ),
    placeholderNomePrincipal:
      "Ex: Categoria Geral, Bloco Principal, Módulo Geral...",
    placeholderNomeSubcategoria:
      "Ex: Nível Iniciante, Divisão A, Subcategoria 1...",
    taxaSolo: "Solo R$",
    taxaDuo: "Duo R$",
    taxaConjunto: "Conjunto R$",
    explicacaoPrincipal:
      "Categoria Principal usada para organizar o evento. Ela funciona como agrupadora e não cobra taxa diretamente.",
    explicacaoSub:
      "Subcategoria vinculada a uma Categoria Principal. É aqui que você define gênero, faixa etária e taxas.",
  },
  teatro: {
    placeholderNovo: "Ex: Festival 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> As Categorias Principais funcionam como
        rótulos de agrupamento para organizar suas subcategorias. Elas não
        cobram taxas de inscrição diretamente.
      </>
    ),
    placeholderNomePrincipal:
      "Ex: Categoria Geral, Bloco Principal, Módulo Geral...",
    placeholderNomeSubcategoria:
      "Ex: Nível Iniciante, Divisão A, Subcategoria 1...",
    taxaSolo: "Solo R$",
    taxaDuo: "Duo R$",
    taxaConjunto: "Conjunto R$",
    explicacaoPrincipal:
      "Categoria Principal usada para organizar o evento. Ela funciona como agrupadora e não cobra taxa diretamente.",
    explicacaoSub:
      "Subcategoria vinculada a uma Categoria Principal. É aqui que você define gênero, faixa etária e taxas.",
  },
  multidisciplinar: {
    placeholderNovo: "Ex: Festival 2026",
    dica: (
      <>
        <strong>Como funciona:</strong> As Categorias Principais funcionam como
        rótulos de agrupamento para organizar suas subcategorias. Elas não
        cobram taxas de inscrição diretamente.
      </>
    ),
    placeholderNomePrincipal:
      "Ex: Categoria Geral, Bloco Principal, Módulo Geral...",
    placeholderNomeSubcategoria:
      "Ex: Nível Iniciante, Divisão A, Subcategoria 1...",
    taxaSolo: "Solo R$",
    taxaDuo: "Duo R$",
    taxaConjunto: "Conjunto R$",
    explicacaoPrincipal:
      "Categoria Principal usada para organizar o evento. Ela funciona como agrupadora e não cobra taxa diretamente.",
    explicacaoSub:
      "Subcategoria vinculada a uma Categoria Principal. É aqui que você define gênero, faixa etária e taxas.",
  },
};

type EventoStatus =
  | "Em Montagem"
  | "inscricoes_abertas"
  | "inscricoes_prorrogadas"
  | "adiado"
  | "cancelado";

type EventoFormato = "competitivo" | "mostra" | "misto";

type TipoPremiacao =
  | "sem_premiacao"
  | "apenas_trofeus_e_medalhas"
  | "com_premiacao_dinheiro";

type Evento = {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  local: string;
  status: EventoStatus;
  descricao: string | null;
  produtora_id: string | null;
  formato: EventoFormato | null;
  tipo_premiacao: TipoPremiacao | null;
  perfil_id?: string | null;
  multilocal: boolean | null;
  logo_url: string | null;
  banner_url: string | null;
};

type Categoria = {
  id: string;
  nome: string;
  valor_solo: number;
  valor_duo: number;
  valor_conjunto: number;
  genero: string;
  faixa_etaria_min: number | null;
  faixa_etaria_max: number | null;
  faixa_etaria_label: string | null;
  categoria_pai_id: string | null;
  subcategorias?: Categoria[];
};

type Apresentacao = {
  id: string;
  nome: string;
  tipo: string | null;
  ordem_apresentacao: number | null;
  status_pagamento?: string | null;
  elenco?: { participante_id: string; nome: string }[];
};

type Toast = {
  id: number;
  tipo: "sucesso" | "erro" | "info";
  mensagem: string;
};

type JuradoCadastro = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
};

type EventoJurado = {
  id: string;
  evento_id: string;
  jurado_id: string;
  cache_valor: number | null;
  cache_status: "pago" | "pendente" | null;
  especialidade: string | null;
};

type JuradoEscalado = {
  vinculo_id: string;
  jurado_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cache_valor: number;
  cache_status: "pago" | "pendente";
  especialidade: string;
};

type ProdutoCatalogo = {
  id: string;
  nome: string;
  preco: number | null;
  estoque: number | null;
  ativo: boolean | null;
  tipo: string | null;
};

type EventoProduto = {
  id: string;
  evento_id: string;
  produto_id: string;
  preco_evento: number | null;
  estoque_evento: number | null;
  ativo_evento: boolean | null;
};

type ProdutoVinculado = {
  vinculo_id: string;
  produto_id: string;
  nome: string;
  preco_base: number;
  estoque_base: number;
  ativo_base: boolean;
  tipo: string;
  preco_evento: number;
  estoque_evento: number;
  ativo_evento: boolean;
};

type LocalEvento = {
  id: string;
  evento_id: string;
  nome_local: string;
  cidade: string | null;
  estado: string | null;
};

type FormCategoria = {
  nome: string;
  valor_solo: number;
  valor_duo: number;
  valor_conjunto: number;
  genero: string;
  faixa_etaria_min: string;
  faixa_etaria_max: string;
  faixa_etaria_label: string;
  categoria_pai_id: string;
};

type CategoriaParaExcluir = {
  id: string;
  nome: string;
};

const GENERO_LABELS: Record<string, string> = {
  livre: "Livre",
  masculino: "Masculino",
  feminino: "Feminino",
  misto: "Misto",
};

const STATUS_LABELS: Record<EventoStatus, string> = {
  "Em Montagem": "Rascunho / Em Montagem",
  inscricoes_abertas: "Inscrições Abertas",
  inscricoes_prorrogadas: "Inscrições Prorrogadas",
  adiado: "Adiado",
  cancelado: "Cancelado",
};

const STATUS_CORES: Record<EventoStatus, string> = {
  "Em Montagem": "text-gray-400 bg-white/5 border-white/10",
  inscricoes_abertas: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  inscricoes_prorrogadas: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  adiado: "text-axon-gold bg-axon-gold/10 border-axon-gold/20",
  cancelado: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_OPTIONS: Array<{ value: EventoStatus; label: string }> = [
  { value: "Em Montagem", label: "Rascunho / Em Montagem" },
  { value: "inscricoes_abertas", label: "Inscrições Abertas" },
  { value: "inscricoes_prorrogadas", label: "Inscrições Prorrogadas" },
  { value: "adiado", label: "Adiado" },
  { value: "cancelado", label: "Cancelado" },
];

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mascaraTelefone(valor: string | null | undefined) {
  const n = (valor ?? "").replace(/\D/g, "").slice(0, 11);
  if (!n) return "";
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function secaoProdutoLabel(tipo: string | null | undefined) {
  const valor = (tipo ?? "").toLowerCase().trim();
  if (valor === "bilheteria") return "Bilheteria";
  return "Cantina";
}

function criarEstadoInicialCategoria(): FormCategoria {
  return {
    nome: "",
    valor_solo: 0,
    valor_duo: 0,
    valor_conjunto: 0,
    genero: "livre",
    faixa_etaria_min: "",
    faixa_etaria_max: "",
    faixa_etaria_label: "",
    categoria_pai_id: "",
  };
}

function formatarDataLocal(dataStr: string | null | undefined): string {
  if (!dataStr) return "Data não informada";
  const apenasData = dataStr.split("T")[0];
  const partes = apenasData.split("-");
  if (partes.length === 3) {
    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }
  return "Data não informada";
}

let toastId = 0;

function ToastContainer({
  toasts,
  remover,
}: {
  toasts: Toast[];
  remover: (id: number) => void;
}) {
  const cores: Record<Toast["tipo"], string> = {
    sucesso: "border-emerald-500/30 bg-axon-panel",
    erro: "border-red-400/30 bg-axon-panel",
    info: "border-axon-gold/30 bg-axon-panel",
  };

  const icones: Record<Toast["tipo"], React.ReactNode> = {
    sucesso: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    erro: <XCircle size={16} className="text-red-400 shrink-0" />,
    info: <Info size={16} className="text-axon-gold shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl pointer-events-auto transition-all ${cores[t.tipo]}`}
        >
          {icones[t.tipo]}
          <span className="text-sm font-medium text-white">{t.mensagem}</span>
          <button
            onClick={() => remover(t.id)}
            className="ml-2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 bg-axon-gold/5 border border-axon-gold/15 rounded-xl px-4 py-3">
      <Info size={14} className="text-axon-gold shrink-0 mt-0.5" />
      <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 border ${
        checked ? "bg-axon-gold/20 border-axon-gold/40" : "bg-axon-bg border-axon-border"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full transition-transform duration-200 ${
          checked ? "translate-x-6 bg-axon-gold" : "translate-x-1 bg-gray-500"
        }`}
      />
    </button>
  );
}

function ModalConfirmarExclusaoCategoria({
  open,
  categoria,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  categoria: CategoriaParaExcluir | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !categoria) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-axon-panel border border-red-400/20 rounded-xl w-full max-w-md p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Confirmar Exclusão</h3>
            <p className="text-xs text-gray-500 mt-1">
              Categoria selecionada: {categoria.nome}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">
              Esta ação excluirá permanentemente a categoria e todas as suas
              configurações/subcategorias. Deseja continuar?
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={loading}
            className="flex items-center gap-2 bg-red-500 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-red-400 transition-all duration-200 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfigurarJuradosEvento({
  open,
  eventoId,
  produtoraId,
  onClose,
  onSaved,
  addToast,
}: {
  open: boolean;
  eventoId: string;
  produtoraId: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  addToast: (tipo: Toast["tipo"], mensagem: string) => void;
}) {
  const [tab, setTab] = useState<"escalados" | "adicionar">("escalados");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [juradosCadastro, setJuradosCadastro] = useState<JuradoCadastro[]>([]);
  const [juradosEscalados, setJuradosEscalados] = useState<JuradoEscalado[]>([]);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    if (!open || !produtoraId) return;
    setLoading(true);

    const [{ data: cadastroData }, { data: eventoJuradosData }] = await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nome, email, telefone")
        .eq("role", "jurado")
        .eq("produtora_id", produtoraId)
        .order("nome"),
      supabase
        .from("evento_jurados")
        .select("id, evento_id, jurado_id, cache_valor, cache_status, especialidade")
        .eq("evento_id", eventoId),
    ]);

    const cadastro = (cadastroData ?? []) as JuradoCadastro[];
    const escaladosRaw = (eventoJuradosData ?? []) as EventoJurado[];
    const cadastroMap = new Map(cadastro.map((j) => [j.id, j] as const));

    const escalados = escaladosRaw
      .map((v) => {
        const jurado = cadastroMap.get(v.jurado_id);
        if (!jurado) return null;
        return {
          vinculo_id: v.id,
          jurado_id: v.jurado_id,
          nome: jurado.nome,
          email: jurado.email,
          telefone: jurado.telefone ?? null,
          cache_valor: v.cache_valor ?? 0,
          cache_status: v.cache_status === "pago" ? "pago" : "pendente",
          especialidade: v.especialidade ?? "",
        } satisfies JuradoEscalado;
      })
      .filter(Boolean) as JuradoEscalado[];

    setJuradosCadastro(cadastro);
    setJuradosEscalados(escalados);
    setLoading(false);
  }, [open, produtoraId, eventoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
        void onSaved();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onSaved]);

  const idsEscalados = useMemo(
    () => new Set(juradosEscalados.map((j) => j.jurado_id)),
    [juradosEscalados]
  );

  const juradosDisponiveis = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return juradosCadastro
      .filter((j) => !idsEscalados.has(j.id))
      .filter((j) => {
        if (!termo) return true;
        return (
          j.nome.toLowerCase().includes(termo) ||
          j.email.toLowerCase().includes(termo)
        );
      });
  }, [juradosCadastro, idsEscalados, search]);

  async function adicionarJurado(jurado: JuradoCadastro) {
    setAddingIds((prev) => ({ ...prev, [jurado.id]: true }));

    try {
      const { data, error } = await supabase
        .from("evento_jurados")
        .insert({
          evento_id: eventoId,
          jurado_id: jurado.id,
          cache_valor: 0,
          cache_status: "pendente",
          especialidade: null,
        })
        .select("id, evento_id, jurado_id, cache_valor, cache_status, especialidade")
        .single();

      if (error) {
        addToast("erro", `Erro ao adicionar jurado: ${error.message}`);
        return;
      }

      if (data) {
        const vinculo = data as EventoJurado;
        setJuradosEscalados((prev) => [
          ...prev,
          {
            vinculo_id: vinculo.id,
            jurado_id: jurado.id,
            nome: jurado.nome,
            email: jurado.email,
            telefone: jurado.telefone ?? null,
            cache_valor: vinculo.cache_valor ?? 0,
            cache_status: vinculo.cache_status === "pago" ? "pago" : "pendente",
            especialidade: vinculo.especialidade ?? "",
          },
        ]);
        addToast("sucesso", "Jurado adicionado com sucesso!");
        await onSaved();
      }
    } catch (error) {
      addToast(
        "erro",
        `Erro ao adicionar jurado: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setAddingIds((prev) => ({ ...prev, [jurado.id]: false }));
    }
  }

  async function salvarJurado(vinculoId: string) {
    const jurado = juradosEscalados.find((item) => item.vinculo_id === vinculoId);
    if (!jurado) return;

    setSavingIds((prev) => ({ ...prev, [vinculoId]: true }));

    try {
      const { error } = await supabase
        .from("evento_jurados")
        .update({
          cache_valor: Number(jurado.cache_valor ?? 0),
          cache_status: jurado.cache_status,
          especialidade: jurado.especialidade.trim() || null,
        })
        .eq("id", vinculoId)
        .select()
        .single();

      if (error) {
        addToast("erro", "Erro do Banco: " + error.message);
        return;
      }

      addToast("sucesso", "Configuração do jurado salva com sucesso!");
      await onSaved();
    } catch (error) {
      addToast(
        "erro",
        "Erro do Banco: " + (error instanceof Error ? error.message : "Erro inesperado")
      );
    } finally {
      setSavingIds((prev) => ({ ...prev, [vinculoId]: false }));
    }
  }

  async function removerJurado(vinculoId: string) {
    setRemovingIds((prev) => ({ ...prev, [vinculoId]: true }));

    try {
      const { error } = await supabase
        .from("evento_jurados")
        .delete()
        .eq("id", vinculoId)
        .eq("evento_id", eventoId);

      if (error) {
        addToast("erro", `Erro ao remover jurado: ${error.message}`);
        return;
      }

      setJuradosEscalados((prev) => prev.filter((item) => item.vinculo_id !== vinculoId));
      addToast("sucesso", "Jurado removido com sucesso!");
      await onSaved();
    } catch (error) {
      addToast(
        "erro",
        `Erro ao remover jurado: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setRemovingIds((prev) => ({ ...prev, [vinculoId]: false }));
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={async () => {
        onClose();
        await onSaved();
      }}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-axon-border">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Configurar Jurados do Evento
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escale jurados do cadastro central da produtora e configure cachê,
              status e especialidade para este festival.
            </p>
          </div>
          <button
            onClick={async () => {
              onClose();
              await onSaved();
            }}
            className="text-gray-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-axon-border px-4 overflow-x-auto">
          {[
            { id: "escalados", label: "Jurados Escalados", icon: Users },
            { id: "adicionar", label: "Adicionar do Cadastro", icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "escalados" | "adicionar")}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 ${
                tab === id
                  ? "border-axon-gold text-axon-gold"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-axon-gold" />
            </div>
          ) : tab === "escalados" ? (
            <div className="space-y-4">
              {juradosEscalados.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                  <Users size={36} className="mx-auto mb-3 opacity-20 text-axon-gold" />
                  <p className="font-medium text-gray-300">Nenhum jurado escalado</p>
                  <p className="text-sm mt-1 text-gray-500">
                    Adicione jurados do cadastro central da produtora para este evento.
                  </p>
                </div>
              ) : (
                juradosEscalados.map((jurado) => (
                  <div
                    key={jurado.vinculo_id}
                    className="bg-axon-bg border border-axon-border rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-white">{jurado.nome}</p>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1">
                          <p className="text-xs text-gray-500 break-all">{jurado.email}</p>
                          {jurado.telefone && (
                            <p className="text-xs text-gray-600">
                              {mascaraTelefone(jurado.telefone)}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => void removerJurado(jurado.vinculo_id)}
                        disabled={!!removingIds[jurado.vinculo_id]}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
                      >
                        {removingIds[jurado.vinculo_id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">
                          Especialidade
                        </label>
                        <input
                          type="text"
                          value={jurado.especialidade}
                          onChange={(e) =>
                            setJuradosEscalados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === jurado.vinculo_id
                                  ? { ...item, especialidade: e.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Ex: Técnica, Avaliação, Curadoria"
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">Cachê</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={jurado.cache_valor}
                          onChange={(e) =>
                            setJuradosEscalados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === jurado.vinculo_id
                                  ? { ...item, cache_valor: Number(e.target.value || 0) }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">
                          Status do cachê
                        </label>
                        <select
                          value={jurado.cache_status}
                          onChange={(e) =>
                            setJuradosEscalados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === jurado.vinculo_id
                                  ? {
                                      ...item,
                                      cache_status: e.target.value as "pago" | "pendente",
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        >
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => void salvarJurado(jurado.vinculo_id)}
                        disabled={!!savingIds[jurado.vinculo_id]}
                        className="flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm disabled:opacity-50"
                      >
                        {savingIds[jurado.vinculo_id] ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        Salvar configuração
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail"
                  className="w-full bg-axon-bg border border-axon-border rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                />
              </div>

              {juradosDisponiveis.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                  <Users size={36} className="mx-auto mb-3 opacity-20 text-axon-gold" />
                  <p className="font-medium text-gray-300">Nenhum jurado disponível</p>
                  <p className="text-sm mt-1 text-gray-500">
                    Todos os jurados do cadastro central já foram escalados neste evento
                    ou não correspondem à busca.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {juradosDisponiveis.map((jurado) => (
                    <div
                      key={jurado.id}
                      className="bg-axon-bg border border-axon-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{jurado.nome}</p>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-3 mt-1">
                          <p className="text-xs text-gray-500 break-all">{jurado.email}</p>
                          {jurado.telefone && (
                            <p className="text-xs text-gray-600">
                              {mascaraTelefone(jurado.telefone)}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => void adicionarJurado(jurado)}
                        disabled={!!addingIds[jurado.id]}
                        className="flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm disabled:opacity-50"
                      >
                        {addingIds[jurado.id] ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Plus size={15} />
                        )}
                        Escalar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalConfigurarPdvEvento({
  open,
  eventoId,
  produtoraId,
  onClose,
  onSaved,
  addToast,
}: {
  open: boolean;
  eventoId: string;
  produtoraId: string;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  addToast: (tipo: Toast["tipo"], mensagem: string) => void;
}) {
  const [tab, setTab] = useState<"vinculados" | "catalogo">("vinculados");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [produtosCatalogo, setProdutosCatalogo] = useState<ProdutoCatalogo[]>([]);
  const [produtosVinculados, setProdutosVinculados] = useState<ProdutoVinculado[]>(
    []
  );
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [addingIds, setAddingIds] = useState<Record<string, boolean>>({});
  const [removingIds, setRemovingIds] = useState<Record<string, boolean>>({});

  const carregar = useCallback(async () => {
    if (!open || !produtoraId) return;
    setLoading(true);

    const [{ data: catalogoData }, { data: eventoProdutosData }] = await Promise.all([
      supabase
        .from("pdv_produtos")
        .select("id, nome, preco, estoque, ativo, tipo")
        .eq("produtora_id", produtoraId)
        .order("nome"),
      supabase
        .from("evento_produtos")
        .select("id, evento_id, produto_id, preco_evento, estoque_evento, ativo_evento")
        .eq("evento_id", eventoId),
    ]);

    const catalogo = (catalogoData ?? []) as ProdutoCatalogo[];
    const vinculadosRaw = (eventoProdutosData ?? []) as EventoProduto[];
    const catalogoMap = new Map(catalogo.map((p) => [p.id, p] as const));

    const vinculados = vinculadosRaw
      .map((v) => {
        const produto = catalogoMap.get(v.produto_id);
        if (!produto) return null;
        return {
          vinculo_id: v.id,
          produto_id: v.produto_id,
          nome: produto.nome,
          preco_base: produto.preco ?? 0,
          estoque_base: produto.estoque ?? 0,
          ativo_base: produto.ativo ?? true,
          tipo: secaoProdutoLabel(produto.tipo),
          preco_evento: v.preco_evento ?? produto.preco ?? 0,
          estoque_evento: v.estoque_evento ?? produto.estoque ?? 0,
          ativo_evento: v.ativo_evento ?? true,
        } satisfies ProdutoVinculado;
      })
      .filter(Boolean) as ProdutoVinculado[];

    setProdutosCatalogo(catalogo);
    setProdutosVinculados(vinculados);
    setLoading(false);
  }, [open, produtoraId, eventoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
        void onSaved();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, onSaved]);

  const idsVinculados = useMemo(
    () => new Set(produtosVinculados.map((p) => p.produto_id)),
    [produtosVinculados]
  );

  const produtosDisponiveis = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return produtosCatalogo
      .filter((p) => !idsVinculados.has(p.id))
      .filter((p) => {
        if (!termo) return true;
        return p.nome.toLowerCase().includes(termo);
      });
  }, [produtosCatalogo, idsVinculados, search]);

  const produtosDisponiveisCantina = useMemo(
    () => produtosDisponiveis.filter((p) => secaoProdutoLabel(p.tipo) === "Cantina"),
    [produtosDisponiveis]
  );

  const produtosDisponiveisBilheteria = useMemo(
    () =>
      produtosDisponiveis.filter((p) => secaoProdutoLabel(p.tipo) === "Bilheteria"),
    [produtosDisponiveis]
  );

  async function adicionarProduto(produto: ProdutoCatalogo) {
    setAddingIds((prev) => ({ ...prev, [produto.id]: true }));

    try {
      const { data, error } = await supabase
        .from("evento_produtos")
        .insert({
          evento_id: eventoId,
          produto_id: produto.id,
          preco_evento: produto.preco ?? 0,
          estoque_evento: produto.estoque ?? 0,
          ativo_evento: produto.ativo ?? true,
        })
        .select("id, evento_id, produto_id, preco_evento, estoque_evento, ativo_evento")
        .single();

      if (error) {
        addToast("erro", `Erro ao vincular produto: ${error.message}`);
        return;
      }

      if (data) {
        const vinculo = data as EventoProduto;
        setProdutosVinculados((prev) => [
          ...prev,
          {
            vinculo_id: vinculo.id,
            produto_id: produto.id,
            nome: produto.nome,
            preco_base: produto.preco ?? 0,
            estoque_base: produto.estoque ?? 0,
            ativo_base: produto.ativo ?? true,
            tipo: secaoProdutoLabel(produto.tipo),
            preco_evento: vinculo.preco_evento ?? produto.preco ?? 0,
            estoque_evento: vinculo.estoque_evento ?? produto.estoque ?? 0,
            ativo_evento: vinculo.ativo_evento ?? true,
          },
        ]);
        addToast("sucesso", "Produto vinculado com sucesso!");
        await onSaved();
      }
    } catch (error) {
      addToast(
        "erro",
        `Erro ao vincular produto: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setAddingIds((prev) => ({ ...prev, [produto.id]: false }));
    }
  }

  async function salvarProduto(vinculoId: string) {
    const produto = produtosVinculados.find((item) => item.vinculo_id === vinculoId);
    if (!produto) return;

    setSavingIds((prev) => ({ ...prev, [vinculoId]: true }));

    try {
      const { error } = await supabase
        .from("evento_produtos")
        .update({
          preco_evento: Number(produto.preco_evento ?? 0),
          estoque_evento: Number(produto.estoque_evento ?? 0),
          ativo_evento: produto.ativo_evento,
        })
        .eq("id", vinculoId)
        .eq("evento_id", eventoId);

      if (error) {
        addToast("erro", `Erro ao salvar configuração do produto: ${error.message}`);
        return;
      }

      addToast("sucesso", "Configuração do produto salva com sucesso!");
      await onSaved();
    } catch (error) {
      addToast(
        "erro",
        `Erro ao salvar configuração do produto: ${
          error instanceof Error ? error.message : "Erro inesperado"
        }`
      );
    } finally {
      setSavingIds((prev) => ({ ...prev, [vinculoId]: false }));
    }
  }

  async function removerProduto(vinculoId: string) {
    setRemovingIds((prev) => ({ ...prev, [vinculoId]: true }));

    try {
      const { error } = await supabase
        .from("evento_produtos")
        .delete()
        .eq("id", vinculoId)
        .eq("evento_id", eventoId);

      if (error) {
        addToast("erro", `Erro ao remover produto: ${error.message}`);
        return;
      }

      setProdutosVinculados((prev) => prev.filter((item) => item.vinculo_id !== vinculoId));
      addToast("sucesso", "Produto removido com sucesso!");
      await onSaved();
    } catch (error) {
      addToast(
        "erro",
        `Erro ao remover produto: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setRemovingIds((prev) => ({ ...prev, [vinculoId]: false }));
    }
  }

  function renderListaCatalogo(
    titulo: string,
    icon: React.ReactNode,
    itens: ProdutoCatalogo[]
  ) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-semibold text-white">{titulo}</h4>
        </div>

        {itens.length === 0 ? (
          <div className="bg-axon-bg border border-axon-border rounded-xl px-4 py-5 text-sm text-gray-500">
            Nenhum produto disponível nesta seção.
          </div>
        ) : (
          itens.map((produto) => (
            <div
              key={produto.id}
              className="bg-axon-bg border border-axon-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{produto.nome}</p>
                <div className="flex flex-wrap gap-3 mt-1">
                  <p className="text-xs text-gray-500">
                    Preço base {moeda(produto.preco ?? 0)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Estoque base {produto.estoque ?? 0}
                  </p>
                </div>
              </div>

              <button
                onClick={() => void adicionarProduto(produto)}
                disabled={!!addingIds[produto.id]}
                className="flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm disabled:opacity-50"
              >
                {addingIds[produto.id] ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                Vincular
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={async () => {
        onClose();
        await onSaved();
      }}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-axon-border">
          <div>
            <h3 className="text-lg font-semibold text-white">Configurar PDV do Evento</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Vincule produtos do catálogo central e ajuste preço, estoque e
              ativação localmente para este festival.
            </p>
          </div>
          <button
            onClick={async () => {
              onClose();
              await onSaved();
            }}
            className="text-gray-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-axon-border px-4 overflow-x-auto">
          {[
            { id: "vinculados", label: "Produtos Vinculados", icon: ShoppingCart },
            { id: "catalogo", label: "Vincular do Catálogo", icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as "vinculados" | "catalogo")}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 ${
                tab === id
                  ? "border-axon-gold text-axon-gold"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-axon-gold" />
            </div>
          ) : tab === "vinculados" ? (
            <div className="space-y-4">
              {produtosVinculados.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                  <ShoppingCart
                    size={36}
                    className="mx-auto mb-3 opacity-20 text-axon-gold"
                  />
                  <p className="font-medium text-gray-300">Nenhum produto vinculado</p>
                  <p className="text-sm mt-1 text-gray-500">
                    Vincule produtos do catálogo central para ativar o PDV deste evento.
                  </p>
                </div>
              ) : (
                produtosVinculados.map((produto) => (
                  <div
                    key={produto.vinculo_id}
                    className="bg-axon-bg border border-axon-border rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{produto.nome}</p>
                          <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                            {produto.tipo}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            Preço base {moeda(produto.preco_base)}
                          </p>
                          <p className="text-xs text-gray-600">
                            Estoque base {produto.estoque_base}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => void removerProduto(produto.vinculo_id)}
                        disabled={!!removingIds[produto.vinculo_id]}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
                      >
                        {removingIds[produto.vinculo_id] ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Remover
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">
                          Preço no evento
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={produto.preco_evento}
                          onChange={(e) =>
                            setProdutosVinculados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === produto.vinculo_id
                                  ? { ...item, preco_evento: Number(e.target.value || 0) }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">
                          Estoque no evento
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={produto.estoque_evento}
                          onChange={(e) =>
                            setProdutosVinculados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === produto.vinculo_id
                                  ? { ...item, estoque_evento: Number(e.target.value || 0) }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400 font-medium">
                          Ativo no evento
                        </label>
                        <select
                          value={produto.ativo_evento ? "true" : "false"}
                          onChange={(e) =>
                            setProdutosVinculados((prev) =>
                              prev.map((item) =>
                                item.vinculo_id === produto.vinculo_id
                                  ? { ...item, ativo_evento: e.target.value === "true" }
                                  : item
                              )
                            )
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        >
                          <option value="true">Ativo</option>
                          <option value="false">Inativo</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => void salvarProduto(produto.vinculo_id)}
                        disabled={!!savingIds[produto.vinculo_id]}
                        className="flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm disabled:opacity-50"
                      >
                        {savingIds[produto.vinculo_id] ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Save size={15} />
                        )}
                        Salvar configuração
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produto por nome"
                  className="w-full bg-axon-bg border border-axon-border rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                />
              </div>

              {renderListaCatalogo(
                "Cantina",
                <Coffee size={16} className="text-axon-gold" />,
                produtosDisponiveisCantina
              )}

              {renderListaCatalogo(
                "Bilheteria",
                <Ticket size={16} className="text-emerald-400" />,
                produtosDisponiveisBilheteria
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PainelEventoPage() {
  const params = useParams();
  const router = useRouter();
  const eventoId = params.id as string;

  const [hasMounted, setHasMounted] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<
    "visao-geral" | "configuracoes" | "categorias" | "lineup"
  >("visao-geral");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [evento, setEvento] = useState<Evento | null>(null);
  const [form, setForm] = useState<Partial<Evento>>({});

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [apresentacoes, setApresentacoes] = useState<Apresentacao[]>([]);
  const [totalInscritos, setTotalInscritos] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [totalJurados, setTotalJurados] = useState(0);
  const [pdvConfigurado, setPdvConfigurado] = useState(false);
  const [criteriosConfigurados, setCriteriosConfigurados] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [perfilSlug, setPerfilSlug] = useState("default");

  const [modalCat, setModalCat] = useState(false);
  const [catEditando, setCatEditando] = useState<Categoria | null>(null);
  const [modalJuradosOpen, setModalJuradosOpen] = useState(false);
  const [modalPdvOpen, setModalPdvOpen] = useState(false);
  const [modalExcluirCategoriaOpen, setModalExcluirCategoriaOpen] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] =
    useState<CategoriaParaExcluir | null>(null);
  const [excluindoCategoria, setExcluindoCategoria] = useState(false);

  const [formCat, setFormCat] = useState<FormCategoria>(criarEstadoInicialCategoria());

  const [locaisEvento, setLocaisEvento] = useState<LocalEvento[]>([]);
  const [loadingLocais, setLoadingLocais] = useState(false);
  const [salvandoLocal, setSalvandoLocal] = useState(false);
  const [removendoLocalId, setRemovendoLocalId] = useState<string | null>(null);
  const [novoLocal, setNovoLocal] = useState({
    nome_local: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalCat) {
        setModalCat(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [modalCat]);

  const addToast = useCallback((tipo: Toast["tipo"], mensagem: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, tipo, mensagem }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removerToast = useCallback((id: number) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const carregarLocais = useCallback(async () => {
    if (!eventoId) return;
    setLoadingLocais(true);

    const { data } = await supabase
      .from("locais_evento")
      .select("id, evento_id, nome_local, cidade, estado")
      .eq("evento_id", eventoId)
      .order("nome_local");

    setLocaisEvento((data ?? []) as LocalEvento[]);
    setLoadingLocais(false);
  }, [eventoId]);

  const carregarEvento = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const [evRes, catsRes, apresRes] = await Promise.all([
          supabase
            .from("eventos")
            .select(
              "id, nome, data_inicio, data_fim, local, status, descricao, produtora_id, perfil_id, formato, tipo_premiacao, multilocal, logo_url, banner_url, perfis_festival:perfil_id ( slug )"
            )
            .eq("id", eventoId)
            .single(),
          supabase.from("categorias").select("*").eq("evento_id", eventoId).order("nome"),
          supabase
            .from("apresentacoes")
            .select("id, nome, tipo, ordem_apresentacao, status_pagamento")
            .eq("evento_id", eventoId)
            .order("ordem_apresentacao", { ascending: true, nullsFirst: false }),
        ]);

        if (evRes.error || !evRes.data) {
          router.push("/eventos");
          return;
        }

        const eventoAtual = evRes.data as Evento;
        setEvento(eventoAtual);
        setForm(eventoAtual);

        // Vocabulário e presets seguem o tipo do festival do evento
        const perfilEv = (eventoAtual as unknown as { perfis_festival?: { slug?: string } | { slug?: string }[] | null }).perfis_festival;
        const slugEv = Array.isArray(perfilEv) ? perfilEv[0]?.slug : perfilEv?.slug;
        setPerfilSlug(slugEv ?? "default");


        const cats = (catsRes.data ?? []) as Categoria[];
        let apres = (apresRes.data ?? []) as Apresentacao[];

        // Buscar elenco das apresentações para o alerta de troca rápida
        const apresentacoesIds = apres.map((a) => a.id);
        if (apresentacoesIds.length > 0) {
          const { data: elencoData } = await supabase
            .from("apresentacao_elenco")
            .select("apresentacao_id, participante_id, participantes(nome)")
            .in("apresentacao_id", apresentacoesIds);

          const elencoMap = new Map<string, { participante_id: string; nome: string }[]>();
          (elencoData ?? []).forEach((row: any) => {
            const apId = row.apresentacao_id;
            const nome = row.participantes?.nome ?? "Sem nome";
            if (!elencoMap.has(apId)) elencoMap.set(apId, []);
            elencoMap.get(apId)!.push({ participante_id: row.participante_id, nome });
          });

          apres = apres.map((a) => ({
            ...a,
            elenco: elencoMap.get(a.id) ?? [],
          }));
        }

        const pais = cats
          .filter((c) => !c.categoria_pai_id)
          .map((pai) => ({
            ...pai,
            subcategorias: cats.filter((c) => c.categoria_pai_id === pai.id),
          }));

        setCategorias(pais);
        setApresentacoes(apres);
        setTotalInscritos(apres.length);
        setTotalPendentes(apres.filter((a) => a.status_pagamento === "Pendente").length);

        try {
          const { count } = await supabase
            .from("evento_jurados")
            .select("id", { count: "exact", head: true })
            .eq("evento_id", eventoId);
          setTotalJurados(count ?? 0);
        } catch {
          setTotalJurados(0);
        }

        try {
          const { count } = await supabase
            .from("criterios_avaliacao")
            .select("id", { count: "exact", head: true })
            .eq("evento_id", eventoId);
          setCriteriosConfigurados((count ?? 0) > 0);
        } catch {
          setCriteriosConfigurados(false);
        }

        try {
          const { count: produtosCount } = await supabase
            .from("evento_produtos")
            .select("id", { count: "exact", head: true })
            .eq("evento_id", eventoId);
          setPdvConfigurado((produtosCount ?? 0) > 0);
        } catch (err) {
          console.error("Erro ao checar produtos do PDV:", err);
          setPdvConfigurado(false);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [eventoId, router]
  );

  useEffect(() => {
    void carregarEvento();
  }, [carregarEvento]);

  useEffect(() => {
    if (form.multilocal) {
      void carregarLocais();
    } else {
      setLocaisEvento([]);
    }
  }, [form.multilocal, carregarLocais]);

  async function salvarEvento() {
    setSalvando(true);

    try {
      const payload = {
        nome: form.nome ?? "",
        local: form.local ?? "",
        data_inicio: form.data_inicio ?? "",
        data_fim: form.data_fim ?? "",
        status: (form.status ?? "Em Montagem") as EventoStatus,
        descricao: form.descricao ?? null,
        formato: (form.formato ?? "competitivo") as EventoFormato,
        tipo_premiacao: (form.tipo_premiacao ?? "sem_premiacao") as TipoPremiacao,
        perfil_id: form.perfil_id ?? null,
        multilocal: Boolean(form.multilocal),
        logo_url: evento?.logo_url ?? null,
        banner_url: evento?.banner_url ?? null,
      };

      const { error } = await supabase.from("eventos").update(payload).eq("id", eventoId);

      if (error) {
        addToast("erro", `Erro ao salvar evento: ${error.message}`);
        return;
      }

      const atualizado = { ...(evento as Evento), ...payload } as Evento;
      setEvento(atualizado);
      setForm(atualizado);
      addToast("sucesso", "Evento salvo com sucesso!");

      if (payload.multilocal) {
        await carregarLocais();
      } else {
        setLocaisEvento([]);
      }
    } catch (error) {
      addToast(
        "erro",
        `Erro ao salvar evento: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarLocalEvento() {
    if (!novoLocal.nome_local.trim()) {
      addToast("info", "Informe o nome do local.");
      return;
    }

    setSalvandoLocal(true);

    try {
      const { data, error } = await supabase
        .from("locais_evento")
        .insert({
          evento_id: eventoId,
          nome_local: novoLocal.nome_local.trim(),
          cidade: novoLocal.cidade.trim() || null,
          estado: novoLocal.estado.trim() || null,
        })
        .select("id, evento_id, nome_local, cidade, estado")
        .single();

      if (error) {
        addToast("erro", `Erro ao adicionar local: ${error.message}`);
        return;
      }

      if (data) {
        setLocaisEvento((prev) =>
          [...prev, data as LocalEvento].sort((a, b) =>
            a.nome_local.localeCompare(b.nome_local)
          )
        );
        setNovoLocal({ nome_local: "", cidade: "", estado: "" });
        addToast("sucesso", "Local adicionado.");
      }
    } catch (error) {
      addToast(
        "erro",
        `Erro ao adicionar local: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setSalvandoLocal(false);
    }
  }

  async function removerLocalEvento(id: string) {
    setRemovendoLocalId(id);

    try {
      const { error } = await supabase
        .from("locais_evento")
        .delete()
        .eq("id", id)
        .eq("evento_id", eventoId);

      if (error) {
        addToast("erro", `Erro ao remover local: ${error.message}`);
        return;
      }

      setLocaisEvento((prev) => prev.filter((local) => local.id !== id));
      addToast("sucesso", "Local removido.");
    } catch (error) {
      addToast(
        "erro",
        `Erro ao remover local: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setRemovendoLocalId(null);
    }
  }

  async function recarregarCategorias() {
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("evento_id", eventoId)
      .order("nome");

    const todasCats = (data ?? []) as Categoria[];
    const pais = todasCats
      .filter((c) => !c.categoria_pai_id)
      .map((pai) => ({
        ...pai,
        subcategorias: todasCats.filter((c) => c.categoria_pai_id === pai.id),
      }));

    setCategorias(pais);
  }

  function abrirModalNova() {
    setCatEditando(null);
    setFormCat(criarEstadoInicialCategoria());
    setModalCat(true);
  }

  function abrirModalEditar(cat: Categoria) {
    setCatEditando(cat);
    setFormCat({
      nome: cat.nome,
      valor_solo: cat.valor_solo,
      valor_duo: cat.valor_duo,
      valor_conjunto: cat.valor_conjunto,
      genero: cat.genero,
      faixa_etaria_min: cat.faixa_etaria_min?.toString() ?? "",
      faixa_etaria_max: cat.faixa_etaria_max?.toString() ?? "",
      faixa_etaria_label: cat.faixa_etaria_label ?? "",
      categoria_pai_id: cat.categoria_pai_id ?? "",
    });
    setModalCat(true);
  }

  function solicitarExclusaoCategoria(id: string, nome: string) {
    setCategoriaParaExcluir({ id, nome });
    setModalExcluirCategoriaOpen(true);
  }

  function fecharModalExcluirCategoria() {
    if (excluindoCategoria) return;
    setModalExcluirCategoriaOpen(false);
    setCategoriaParaExcluir(null);
  }

  async function confirmarExclusaoCategoria() {
    if (!categoriaParaExcluir) return;

    setExcluindoCategoria(true);

    try {
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", categoriaParaExcluir.id);

      if (error) {
        addToast("erro", `Erro ao remover categoria: ${error.message}`);
        return;
      }

      addToast("sucesso", `${categoriaParaExcluir.nome} removida.`);
      fecharModalExcluirCategoria();
      await recarregarCategorias();
    } catch (error) {
      addToast(
        "erro",
        `Erro ao remover categoria: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    } finally {
      setExcluindoCategoria(false);
    }
  }

  async function salvarCategoria() {
    if (!formCat.nome.trim()) return;

    const isCategoriaPrincipal = !formCat.categoria_pai_id;

    const payload = {
      nome: formCat.nome,
      valor_solo: isCategoriaPrincipal ? 0 : Number(formCat.valor_solo),
      valor_duo: isCategoriaPrincipal ? 0 : Number(formCat.valor_duo),
      valor_conjunto: isCategoriaPrincipal ? 0 : Number(formCat.valor_conjunto),
      genero: isCategoriaPrincipal ? "livre" : formCat.genero,
      faixa_etaria_min: isCategoriaPrincipal
        ? null
        : formCat.faixa_etaria_min.trim()
          ? Number(formCat.faixa_etaria_min)
          : null,
      faixa_etaria_max: isCategoriaPrincipal
        ? null
        : formCat.faixa_etaria_max.trim()
          ? Number(formCat.faixa_etaria_max)
          : null,
      faixa_etaria_label: isCategoriaPrincipal ? null : formCat.faixa_etaria_label || null,
      categoria_pai_id: formCat.categoria_pai_id || null,
      evento_id: eventoId,
    };

    try {
      if (catEditando) {
        const { error } = await supabase
          .from("categorias")
          .update(payload)
          .eq("id", catEditando.id);

        if (error) {
          addToast("erro", `Erro ao atualizar categoria: ${error.message}`);
          return;
        }

        addToast("sucesso", `${formCat.nome} atualizada!`);
        await recarregarCategorias();
      } else {
        const { error } = await supabase.from("categorias").insert(payload);

        if (error) {
          addToast("erro", `Erro ao criar categoria: ${error.message}`);
          return;
        }

        addToast("sucesso", `${formCat.nome} criada!`);
        await recarregarCategorias();
      }

      setModalCat(false);
    } catch (error) {
      addToast(
        "erro",
        `Erro ao salvar categoria: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    }
  }

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const items = Array.from(apresentacoes);
    const [moved] = items.splice(result.source.index, 1);
    if (!moved) return;

    items.splice(result.destination.index, 0, moved);

    const reordenadas = items.map((c, i) => ({ ...c, ordem_apresentacao: i + 1 }));
    setApresentacoes(reordenadas);

    try {
      await Promise.all(
        reordenadas.map((c) =>
          supabase
            .from("apresentacoes")
            .update({ ordem_apresentacao: c.ordem_apresentacao })
            .eq("id", c.id)
        )
      );

      addToast("sucesso", "Ordem salva!");
    } catch (error) {
      addToast(
        "erro",
        `Erro ao salvar ordem: ${error instanceof Error ? error.message : "Erro inesperado"}`
      );
    }
  }

  async function handleModalJuradosSaved() {
    await carregarEvento(true);
  }

  async function handleModalPdvSaved() {
    await carregarEvento(true);
  }

  const alertasTroca = useMemo(() => {
    return apresentacoes.map((ap, idx) => {
      if (!ap.elenco || ap.elenco.length === 0) return null;
      for (let offset = 1; offset <= 2; offset++) {
        const nextIdx = idx + offset;
        if (nextIdx >= apresentacoes.length) break;
        const nextAp = apresentacoes[nextIdx];
        if (!nextAp.elenco) continue;
        const idsAtual = new Set(ap.elenco.map((e) => e.participante_id));
        const conflito = nextAp.elenco.find((e) => idsAtual.has(e.participante_id));
        if (conflito) return conflito.nome;
      }
      return null;
    });
  }, [apresentacoes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-axon-gold" />
      </div>
    );
  }

  if (!evento) return null;

  const presetAtual = PRESETS[perfilSlug] ?? PRESETS.default;
  const categoriasPrincipais = categorias.filter((c) => !c.categoria_pai_id);
  const checklistJuradosOk = form.formato === "mostra" ? true : totalJurados > 0;

  const checklist = [
    {
      label: "Dados básicos preenchidos",
      descricao: "Nome, local e datas do evento.",
      ok: !!evento.nome && !!evento.local && !!evento.data_inicio,
      acao: "configuracoes" as const,
      onAcao: null as null | (() => void),
      acaoLabel: evento.nome && evento.local && evento.data_inicio ? "Editar →" : "Preencher",
    },
    {
      label: "Ao menos 1 categoria criada",
      descricao: "Categorias definem as taxas e faixas etárias aceitas.",
      ok: categorias.length > 0,
      acao: "categorias" as const,
      onAcao: null as null | (() => void),
      acaoLabel: categorias.length > 0 ? "Gerenciar →" : "Criar categoria",
    },
    {
      label: form.formato === "mostra" ? "Jurados configurados (opcional em mostra)" : "Jurados configurados",
      descricao:
        form.formato === "mostra"
          ? "Em formato mostra, jurados não são obrigatórios."
          : "Escala e módulo de avaliação do evento.",
      ok: checklistJuradosOk,
      acao: null,
      onAcao: () => setModalJuradosOpen(true),
      acaoLabel: checklistJuradosOk ? "Gerenciar →" : "Configurar",
    },
    {
      label: "PDV / Bilheteria configurados",
      descricao: "Ponto de venda no dia do evento.",
      ok: pdvConfigurado,
      acao: null,
      onAcao: () => setModalPdvOpen(true),
      acaoLabel: pdvConfigurado ? "Gerenciar →" : "Configurar",
    },
  ];

  const totalChecklist = checklist.length;
  const checklistConcluidos = checklist.filter((item) => item.ok).length;
  const checklistPercentual =
    totalChecklist > 0 ? Math.round((checklistConcluidos / totalChecklist) * 100) : 0;
  const checklistMensagem =
    checklistPercentual < 50
      ? "Vamos começar a configurar seu evento? Complete os itens abaixo."
      : checklistPercentual < 100
        ? "Quase lá! Falta pouco para liberar as inscrições."
        : "Excelente! Tudo pronto para começar a receber inscrições.";

  return (
    <>
      <ToastContainer toasts={toasts} remover={removerToast} />

      <ModalConfigurarJuradosEvento
        open={modalJuradosOpen}
        eventoId={eventoId}
        produtoraId={evento.produtora_id ?? ""}
        onClose={() => setModalJuradosOpen(false)}
        onSaved={handleModalJuradosSaved}
        addToast={addToast}
      />

      <ModalConfigurarPdvEvento
        open={modalPdvOpen}
        eventoId={eventoId}
        produtoraId={evento.produtora_id ?? ""}
        onClose={() => setModalPdvOpen(false)}
        onSaved={handleModalPdvSaved}
        addToast={addToast}
      />

      <ModalConfirmarExclusaoCategoria
        open={modalExcluirCategoriaOpen}
        categoria={categoriaParaExcluir}
        onClose={fecharModalExcluirCategoria}
        onConfirm={confirmarExclusaoCategoria}
        loading={excluindoCategoria}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/eventos"
            prefetch={false}
            className="w-10 h-10 bg-axon-panel border border-axon-border rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-axon-gold hover:bg-axon-gold/10 transition-all duration-200"
          >
            <ChevronLeft size={20} />
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{evento.nome}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_CORES[evento.status]}`}
              >
                {STATUS_LABELS[evento.status]}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {formatarDataLocal(evento.data_inicio)} até {formatarDataLocal(evento.data_fim)}
              {evento.local ? ` • ${evento.local}` : " • Local não informado"}
            </p>
          </div>
        </div>

        <div className="bg-axon-panel border border-axon-border rounded-xl overflow-hidden">
          <div className="flex border-b border-axon-border px-4 overflow-x-auto">
            {[
              { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
              { id: "configuracoes", label: "Configurações", icon: Settings },
              { id: "categorias", label: "Categorias & Taxas", icon: ListTree },
              { id: "lineup", label: "Line-up", icon: CalendarDays },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() =>
                  setAbaAtiva(id as "visao-geral" | "configuracoes" | "categorias" | "lineup")
                }
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 ${
                  abaAtiva === id
                    ? "border-axon-gold text-axon-gold"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {abaAtiva === "visao-geral" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Visão Geral do Evento
                  </h3>
                  <p className="text-sm text-gray-400">
                    Acompanhe o status atual e verifique o que ainda precisa ser
                    configurado antes de abrir as inscrições.
                  </p>
                </div>

                {evento.status === "Em Montagem" && (
                  <div className="bg-axon-gold/10 border border-axon-gold/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-axon-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-axon-gold font-semibold text-sm">
                        Evento em montagem · inscrições bloqueadas
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        As organizações ainda não podem se inscrever. Quando tudo
                        estiver configurado, vá em{" "}
                        <button
                          onClick={() => setAbaAtiva("configuracoes")}
                          className="text-axon-gold underline hover:no-underline"
                        >
                          Configurações
                        </button>{" "}
                        e mude o status para <strong>Inscrições Abertas</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Inscrições",
                      valor: totalInscritos,
                      icon: Users,
                      cor: "text-axon-gold",
                      sufixo: totalInscritos === 1 ? "inscrição" : "inscrições",
                      onClick: () => router.push(`/eventos/${eventoId}/inscricoes`),
                    },
                    {
                      label: "Pagamentos Pendentes",
                      valor: totalPendentes,
                      icon: CreditCard,
                      cor: totalPendentes > 0 ? "text-red-400" : "text-emerald-400",
                      sufixo: totalPendentes > 0 ? "aguardando" : "tudo em dia",
                      onClick: () => router.push(`/eventos/${eventoId}/inscricoes?status=pendente`),
                    },
                    {
                      label: "Jurados",
                      valor: totalJurados,
                      icon: Star,
                      cor: "text-white",
                      sufixo: totalJurados === 1 ? "jurado cadastrado" : "jurados cadastrados",
                      onClick: () => setModalJuradosOpen(true),
                    },
                    {
                      label: "PDV / Bilheteria",
                      valor: pdvConfigurado ? "Ativo" : "Inativo",
                      icon: ShoppingCart,
                      cor: pdvConfigurado ? "text-emerald-400" : "text-gray-500",
                      sufixo: pdvConfigurado ? "Configurado" : "Não configurado",
                      onClick: () => setModalPdvOpen(true),
                    },
                  ].map(({ label, valor, icon: Icon, cor, sufixo, onClick }) =>
                    onClick ? (
                      <button
                        key={label}
                        onClick={onClick}
                        className="bg-axon-bg border border-axon-border rounded-xl p-5 text-left hover:border-gray-600 hover:bg-white/[0.02] transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {label}
                          </p>
                          <Icon size={16} className={cor} />
                        </div>
                        <p className={`text-2xl font-bold tabular-nums ${cor}`}>{valor}</p>
                        <p className="text-xs text-gray-500 mt-1">{sufixo}</p>
                      </button>
                    ) : (
                      <div key={label} className="bg-axon-bg border border-axon-border rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {label}
                          </p>
                          <Icon size={16} className={cor} />
                        </div>
                        <p className={`text-2xl font-bold tabular-nums ${cor}`}>{valor}</p>
                        <p className="text-xs text-gray-500 mt-1">{sufixo}</p>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Checklist de Preparação
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Complete esses itens antes de abrir as inscrições para as organizações.
                  </p>

                  <div className="mb-4 rounded-xl border border-axon-border bg-axon-bg p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {checklistPercentual}% concluído
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{checklistMensagem}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {checklistConcluidos}/{totalChecklist} itens completos
                      </div>
                    </div>

                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-axon-gold transition-all duration-500"
                        style={{ width: `${checklistPercentual}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-axon-bg border border-axon-border rounded-xl divide-y divide-axon-border">
                    {checklist.map(({ label, descricao, ok, acao, onAcao, acaoLabel }) => (
                      <div key={label} className="flex items-center justify-between px-5 py-4 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              ok ? "bg-emerald-500/20" : "bg-white/5"
                            }`}
                          >
                            {ok ? (
                              <CheckCircle size={14} className="text-emerald-400" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-600" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className={`text-sm font-medium ${ok ? "text-white" : "text-gray-300"}`}>
                              {label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
                          </div>
                        </div>

                        {acao ? (
                          <button
                            onClick={() => setAbaAtiva(acao)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 whitespace-nowrap ${
                              ok
                                ? "text-gray-300 border-white/10 hover:text-white hover:border-gray-500 hover:bg-white/5"
                                : "text-axon-gold hover:text-white hover:bg-axon-gold/10 border-axon-gold/30"
                            }`}
                          >
                            {acaoLabel}
                          </button>
                        ) : onAcao ? (
                          <button
                            onClick={onAcao}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 whitespace-nowrap ${
                              ok
                                ? "text-gray-300 border-white/10 hover:text-white hover:border-gray-500 hover:bg-white/5"
                                : "text-axon-gold hover:text-white hover:bg-axon-gold/10 border-axon-gold/30"
                            }`}
                          >
                            {acaoLabel}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600 bg-white/5 px-2.5 py-1 rounded-full">
                            Em breve
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === "configuracoes" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Dados do Evento</h3>
                  <p className="text-sm text-gray-400">
                    Informações básicas e estruturais do festival. O status público
                    automático será calculado pela página pública a partir das datas
                    quando aplicável.
                  </p>
                </div>

                <div
                  className={`rounded-xl p-4 border text-sm flex items-start gap-2.5 ${
                    form.status === "inscricoes_abertas"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : form.status === "inscricoes_prorrogadas"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : form.status === "adiado"
                          ? "bg-axon-gold/10 border-axon-gold/20 text-axon-gold"
                          : form.status === "cancelado"
                            ? "bg-red-400/10 border-red-400/20 text-red-300"
                            : "bg-white/5 border-white/10 text-gray-400"
                  }`}
                >
                  <Info size={15} className="shrink-0 mt-0.5" />
                  <span>
                    {form.status === "Em Montagem" &&
                      "Rascunho / Em Montagem: o formulário de inscrição permanece bloqueado para as organizações."}
                    {form.status === "inscricoes_abertas" &&
                      "Inscrições Abertas: as organizações já podem se inscrever neste evento."}
                    {form.status === "inscricoes_prorrogadas" &&
                      "Inscrições Prorrogadas: o evento segue aceitando inscrições em período estendido."}
                    {form.status === "adiado" &&
                      "Adiado: o evento foi postergado e pode exigir atualização de datas e comunicação pública."}
                    {form.status === "cancelado" &&
                      "Cancelado: o evento foi cancelado e não deve aceitar novas inscrições."}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-gray-400 font-medium">Nome do Festival</label>
                    <input
                      type="text"
                      value={form.nome ?? ""}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Local principal</label>
                    <input
                      type="text"
                      value={form.local ?? ""}
                      placeholder="Ex: Teatro Municipal, São Paulo - SP"
                      onChange={(e) => setForm({ ...form, local: e.target.value })}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Status</label>
                    <select
                      value={form.status ?? "Em Montagem"}
                      onChange={(e) => setForm({ ...form, status: e.target.value as EventoStatus })}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Data de Início</label>
                    <input
                      type="date"
                      value={form.data_inicio ? form.data_inicio.split("T")[0] : ""}
                      onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Data de Fim</label>
                    <input
                      type="date"
                      value={form.data_fim ? form.data_fim.split("T")[0] : ""}
                      onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <ListTree size={14} className="text-axon-gold" />
                      Formato
                    </label>
                    <select
                      value={form.formato ?? "competitivo"}
                      onChange={(e) => setForm({ ...form, formato: e.target.value as EventoFormato })}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    >
                      <option value="competitivo">Competitivo</option>
                      <option value="mostra">Mostra</option>
                      <option value="misto">Misto</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-gray-400 font-medium">Tipo do festival</label>
                    <SeletorPerfil valor={form.perfil_id}
                      onChange={(perfil) => { setForm({ ...form, perfil_id: perfil.id }); setPerfilSlug(perfil.slug); }} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <Trophy size={14} className="text-axon-gold" />
                      Tipo de premiação
                    </label>
                    <select
                      value={form.tipo_premiacao ?? "sem_premiacao"}
                      onChange={(e) =>
                        setForm({ ...form, tipo_premiacao: e.target.value as TipoPremiacao })
                      }
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200"
                    >
                      <option value="sem_premiacao">Sem premiação</option>
                      <option value="apenas_trofeus_e_medalhas">
                        Apenas troféus e medalhas
                      </option>
                      <option value="com_premiacao_dinheiro">Com premiação em dinheiro</option>
                    </select>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <Globe size={14} className="text-axon-gold" />
                      Festival multilocal
                    </label>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-axon-border bg-axon-bg">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Ativar múltiplos locais / palcos
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Quando ativado, você poderá cadastrar palcos, teatros ou
                          cidades adicionais vinculados a este evento.
                        </p>
                      </div>

                      <Switch
                        checked={Boolean(form.multilocal)}
                        onChange={(value) => setForm({ ...form, multilocal: value })}
                      />
                    </div>
                  </div>

                  {form.multilocal && (
                    <div className="md:col-span-2 space-y-4 rounded-xl border border-axon-border bg-axon-bg p-5">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-axon-gold" />
                        <h4 className="text-sm font-semibold text-white">
                          Locais vinculados ao evento
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Nome do local"
                          value={novoLocal.nome_local}
                          onChange={(e) =>
                            setNovoLocal((prev) => ({ ...prev, nome_local: e.target.value }))
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={novoLocal.cidade}
                          onChange={(e) =>
                            setNovoLocal((prev) => ({ ...prev, cidade: e.target.value }))
                          }
                          className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="UF"
                            value={novoLocal.estado}
                            onChange={(e) =>
                              setNovoLocal((prev) => ({
                                ...prev,
                                estado: e.target.value.toUpperCase(),
                              }))
                            }
                            maxLength={2}
                            className="w-full bg-axon-panel border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => void adicionarLocalEvento()}
                            disabled={salvandoLocal}
                            className="shrink-0 flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm disabled:opacity-50"
                          >
                            {salvandoLocal ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Plus size={15} />
                            )}
                            Adicionar
                          </button>
                        </div>
                      </div>

                      {loadingLocais ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 size={20} className="animate-spin text-axon-gold" />
                        </div>
                      ) : locaisEvento.length === 0 ? (
                        <div className="text-sm text-gray-500 border border-dashed border-axon-border rounded-xl px-4 py-5">
                          Nenhum local adicional cadastrado.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {locaisEvento.map((local) => (
                            <div
                              key={local.id}
                              className="flex items-center justify-between gap-4 rounded-xl border border-axon-border bg-axon-panel px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white">{local.nome_local}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {[local.cidade, local.estado].filter(Boolean).join(" - ") ||
                                    "Sem cidade/UF informada"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => void removerLocalEvento(local.id)}
                                disabled={removendoLocalId === local.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
                              >
                                {removendoLocalId === local.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-gray-400 font-medium">Descrição</label>
                    <textarea
                      value={form.descricao ?? ""}
                      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      rows={5}
                      className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-axon-gold focus:ring-1 focus:ring-axon-gold/20 transition-all duration-200 resize-y"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => void salvarEvento()}
                    disabled={salvando}
                    className="flex items-center gap-2 bg-axon-gold text-black font-bold px-5 py-2.5 rounded-lg hover:bg-axon-gold/80 hover:shadow-lg hover:shadow-axon-gold/20 active:scale-95 transition-all duration-200 text-sm disabled:opacity-50"
                  >
                    {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            {abaAtiva === "categorias" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Categorias & Taxas
                    </h3>
                    <p className="text-sm text-gray-400">
                      Organize as categorias principais e subcategorias do evento.
                      As taxas são cobradas nas subcategorias.
                    </p>
                  </div>

                  <button
                    onClick={abrirModalNova}
                    className="inline-flex items-center gap-2 bg-axon-gold text-black font-bold px-4 py-2.5 rounded-lg hover:bg-axon-gold/80 transition-all duration-200 text-sm"
                  >
                    <Plus size={15} />
                    Nova categoria
                  </button>
                </div>

                <Dica>{presetAtual.dica}</Dica>

                {categoriasPrincipais.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                    <ListTree size={40} className="mx-auto mb-3 opacity-20 text-axon-gold" />
                    <p className="font-medium text-gray-300">Nenhuma categoria criada</p>
                    <p className="text-sm mt-1 text-gray-500">
                      Crie a primeira categoria principal para começar a estruturar o evento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoriasPrincipais.map((cat) => {
                      const subcategoriasValidas = (cat.subcategorias ?? []).filter(
                        (sub) => typeof sub.nome === "string" && sub.nome.trim() !== ""
                      );

                      return (
                        <div
                          key={cat.id}
                          className="bg-axon-bg border border-axon-border rounded-xl overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-4 p-4 group">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold text-white">{cat.nome}</p>
                                <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                  Categoria principal
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {presetAtual.explicacaoPrincipal}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => abrirModalEditar(cat)}
                                className="p-2 text-gray-400 hover:text-axon-gold hover:bg-axon-gold/10 rounded-lg transition-all duration-200"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => solicitarExclusaoCategoria(cat.id, cat.nome)}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {subcategoriasValidas.length > 0 && (
                            <div className="border-t border-axon-border divide-y divide-axon-border bg-black/10">
                              {subcategoriasValidas.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between px-4 py-3 group"
                                >
                                  <div className="flex items-center gap-3 pl-4">
                                    <div className="w-px h-4 bg-axon-border" />
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm text-gray-200 font-medium">
                                          {sub.nome}
                                        </p>
                                        <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                          {GENERO_LABELS[sub.genero]}
                                        </span>
                                        {sub.faixa_etaria_label && (
                                          <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                            {sub.faixa_etaria_label}
                                          </span>
                                        )}
                                        {!sub.faixa_etaria_label &&
                                          sub.faixa_etaria_min != null &&
                                          sub.faixa_etaria_max != null && (
                                            <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                              {sub.faixa_etaria_min}-{sub.faixa_etaria_max} anos
                                            </span>
                                          )}
                                      </div>

                                      <p className="text-sm text-gray-400 mt-1.5">
                                        {presetAtual.taxaSolo.replace("R$", "")}{" "}
                                        <span className="text-white">{moeda(sub.valor_solo)}</span> ·{" "}
                                        {presetAtual.taxaDuo.replace("R$", "")}{" "}
                                        <span className="text-white">{moeda(sub.valor_duo)}</span> ·{" "}
                                        {presetAtual.taxaConjunto.replace("R$", "")}{" "}
                                        <span className="text-white">
                                          {moeda(sub.valor_conjunto)}
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => abrirModalEditar(sub)}
                                      className="p-2 text-gray-400 hover:text-axon-gold hover:bg-axon-gold/10 rounded-lg transition-all duration-200"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => solicitarExclusaoCategoria(sub.id, sub.nome)}
                                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border-t border-axon-border px-4 py-2">
                            <button
                              onClick={() => {
                                setCatEditando(null);
                                setFormCat({
                                  ...criarEstadoInicialCategoria(),
                                  categoria_pai_id: cat.id,
                                });
                                setModalCat(true);
                              }}
                              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-white text-sm hover:border-axon-gold hover:bg-axon-gold/5 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <Plus size={14} />
                              Adicionar subcategoria
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {abaAtiva === "lineup" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Montagem do Line-up
                  </h3>
                  <p className="text-sm text-gray-400">
                    Defina a ordem de apresentação do evento. As apresentações
                    aparecem aqui após as inscrições serem aprovadas.
                  </p>
                </div>

                <Dica>
                  Arraste e solte as apresentações para reordenar. A ordem é salva
                  automaticamente e será usada na geração do programa oficial do evento.
                </Dica>

                {apresentacoes.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                    <CalendarDays size={40} className="mx-auto mb-3 opacity-20 text-axon-gold" />
                    <p className="font-medium text-gray-300">Nenhuma apresentação ainda</p>
                    <p className="text-sm mt-1 text-gray-500">
                      As apresentações aparecerão aqui após as organizações se inscreverem
                      e as inscrições serem aprovadas.
                    </p>
                  </div>
                ) : !hasMounted ? (
                  <div className="flex items-center justify-center py-16 border border-dashed border-axon-border rounded-xl text-gray-500">
                    <div className="flex items-center gap-3">
                      <Loader2 size={18} className="animate-spin text-axon-gold" />
                      <span className="text-sm">Carregando editor de line-up...</span>
                    </div>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={(result) => void onDragEnd(result)}>
                    <Droppable droppableId="lineup">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {apresentacoes.map((ap, index) => (
                            <Draggable key={ap.id} draggableId={ap.id} index={index}>
                              {(providedDraggable, snapshot) => (
                                <div
                                  ref={providedDraggable.innerRef}
                                  {...providedDraggable.draggableProps}
                                  className={`flex items-center gap-4 bg-axon-bg border rounded-xl p-3.5 transition-all cursor-move group ${
                                    snapshot.isDragging
                                      ? "border-axon-gold shadow-lg shadow-axon-gold/10 scale-[1.02]"
                                      : "border-axon-border hover:border-gray-600"
                                  }`}
                                >
                                  <div
                                    {...providedDraggable.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical
                                      size={20}
                                      className="text-gray-600 group-hover:text-gray-400 transition-colors"
                                    />
                                  </div>

                                  <div className="w-8 h-8 rounded-lg bg-axon-gold/10 border border-axon-gold/20 flex items-center justify-center text-xs font-bold text-axon-gold">
                                    {index + 1}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-white text-sm font-medium truncate">
                                        {ap.nome}
                                      </p>
                                      {alertasTroca[index] && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 whitespace-nowrap">
                                          ⚠️ Troca rápida: {alertasTroca[index]}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {ap.tipo ?? "Tipo não informado"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalCat && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setModalCat(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {catEditando
                    ? "Editar Categoria"
                    : formCat.categoria_pai_id
                      ? "Nova Subcategoria"
                      : "Nova Categoria"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formCat.categoria_pai_id
                    ? presetAtual.explicacaoSub
                    : presetAtual.explicacaoPrincipal}
                </p>
              </div>

              <button
                onClick={() => setModalCat(false)}
                className="text-gray-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {!catEditando && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">
                    Categoria Principal{" "}
                    <span className="text-gray-600 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={formCat.categoria_pai_id}
                    onChange={(e) =>
                      setFormCat({
                        ...formCat,
                        categoria_pai_id: e.target.value,
                      })
                    }
                    className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                  >
                    <option value="">Nenhuma — criar categoria principal</option>
                    {categoriasPrincipais.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">
                  {formCat.categoria_pai_id
                    ? "Nome da Subcategoria"
                    : "Nome da Categoria Principal"}
                </label>
                <input
                  type="text"
                  placeholder={
                    formCat.categoria_pai_id
                      ? presetAtual.placeholderNomeSubcategoria
                      : presetAtual.placeholderNomePrincipal
                  }
                  value={formCat.nome}
                  onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })}
                  className="w-full bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-axon-gold transition-all duration-200"
                />
              </div>

              {formCat.categoria_pai_id && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">Gênero</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(["livre", "feminino", "masculino", "misto"] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormCat({ ...formCat, genero: g })}
                          className={`py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                            formCat.genero === g
                              ? "bg-axon-gold text-black border-axon-gold shadow-md shadow-axon-gold/20"
                              : "bg-axon-bg border-axon-border text-gray-400 hover:text-white hover:border-gray-500"
                          }`}
                        >
                          {GENERO_LABELS[g]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">
                      Faixa Etária{" "}
                      <span className="text-gray-600 font-normal">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Label</label>
                        <input
                          type="text"
                          placeholder="Ex: Infantil"
                          value={formCat.faixa_etaria_label}
                          onChange={(e) =>
                            setFormCat({ ...formCat, faixa_etaria_label: e.target.value })
                          }
                          className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Idade mínima</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="6"
                          value={formCat.faixa_etaria_min}
                          onChange={(e) =>
                            setFormCat({ ...formCat, faixa_etaria_min: e.target.value })
                          }
                          className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gray-500">Idade máxima</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="12"
                          value={formCat.faixa_etaria_max}
                          onChange={(e) =>
                            setFormCat({ ...formCat, faixa_etaria_max: e.target.value })
                          }
                          className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-axon-gold transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 font-medium">
                      Taxas de Inscrição
                    </label>
                    <p className="text-xs text-gray-500">
                      Valor cobrado por modalidade.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {(["valor_solo", "valor_duo", "valor_conjunto"] as const).map(
                        (campo) => {
                          const labelTaxa =
                            campo === "valor_solo"
                              ? presetAtual.taxaSolo
                              : campo === "valor_duo"
                                ? presetAtual.taxaDuo
                                : presetAtual.taxaConjunto;

                          return (
                            <div key={campo} className="space-y-1">
                              <label className="text-xs text-gray-500">{labelTaxa}</label>
                              <input
                                type="number"
                                min={0}
                                value={formCat[campo]}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setFormCat({
                                    ...formCat,
                                    [campo]: isNaN(val) ? 0 : val,
                                  });
                                }}
                                className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-axon-gold transition-all duration-200"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setModalCat(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                Cancelar
              </button>

              <button
                onClick={() => void salvarCategoria()}
                disabled={!formCat.nome.trim()}
                className="flex items-center gap-2 bg-axon-gold text-black font-bold px-5 py-2.5 rounded-lg hover:bg-axon-gold/80 hover:shadow-lg hover:shadow-axon-gold/20 active:scale-95 transition-all duration-200 text-sm disabled:opacity-50"
              >
                <Save size={15} />
                {catEditando ? "Salvar Alterações" : "Criar Categoria"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}