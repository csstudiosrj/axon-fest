"use client";

import { useState, useEffect } from "react";
import {
  UserPlus, Mail, Shield, Trash2, Pencil,
  Send, CheckCircle, AlertCircle,
  Loader2, ChevronDown, Crown, Users, X, AlertTriangle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HIERARQUIA, podeAtribuir } from "@/lib/auth/roles";
import { apiUrl } from "@/lib/base-path";

const supabase = createClient();

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Usuario {
  id: string;
  email: string;
  nome: string | null;
  role: string;
  foto_url: string | null;
  produtora_id: string | null;
}

interface TenantConfig {
  nome_organizacao: string | null;
  termo_evento: string | null;
  termo_inscricao: string | null;
  termo_participante: string | null;
  termo_grupo: string | null;
  termo_apresentacao: string | null;
}

// ─── Configuração de cargos ───────────────────────────────────────────────────

const CARGOS: Record<string, { label: string; descricao: string; cor: string }> = {
  super_admin: { label: "Super Admin",     descricao: "Acesso total incluindo assinatura e credenciais", cor: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  admin:       { label: "Admin",           descricao: "Acesso total exceto credenciais e assinatura",    cor: "text-axon-gold bg-axon-gold-dim border-axon-gold-dim" },
  produtor:    { label: "Produtor",        descricao: "PDV, Loja, Inscrições e Dashboard",               cor: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  marketing:   { label: "Marketing",       descricao: "Marketing, Dashboard e Inscrições (sem valores)", cor: "text-pink-400 bg-pink-400/10 border-pink-400/30" },
  assistente:  { label: "Assistente",      descricao: "Inscrições & Elenco e Mídias & Áudio",            cor: "text-green-400 bg-green-400/10 border-green-400/30" },
  operador:    { label: "Operador",        descricao: "Caixa e bilheteria no celular (login + PIN)",     cor: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  org_admin:   { label: "Admin do Grupo",  descricao: "Administração do grupo (elenco, inscrições)",     cor: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  org_membro:  { label: "Membro do Grupo", descricao: "Acesso básico ao portal do grupo",                cor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30" },
  jurado:      { label: "Jurado",          descricao: "Acesso ao portal de avaliação",                   cor: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
};


// ─── Helpers ──────────────────────────────────────────────────────────────────

function BadgeCargo({ role }: { role: string }) {
  const cfg = CARGOS[role] ?? { label: role, cor: "text-gray-400 bg-gray-400/10 border-gray-400/30" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cor}`}>
      {cfg.label}
    </span>
  );
}

function Toast({ msg, tipo, visivel }: { msg: string; tipo: "ok" | "erro"; visivel: boolean }) {
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full font-semibold text-sm shadow-xl transition-all duration-300 ${
      visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    } ${tipo === "ok" ? "bg-axon-gold text-black" : "bg-red-500/90 text-white"}`}>
      {tipo === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

// ─── Modal Confirmação de Exclusão ────────────────────────────────────────────

function ModalConfirmarExclusao({
  usuario, onConfirmar, onCancelar, excluindo,
}: {
  usuario: Usuario; onConfirmar: () => void; onCancelar: () => void; excluindo: boolean;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancelar}>
      <div className="bg-arxon-panel border border-red-500/30 rounded-2xl p-6 w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Remover Usuário</h2>
            <p className="text-gray-400 text-sm mt-1">
              Tem certeza que deseja remover{" "}
              <span className="text-white font-medium">{usuario.nome ?? usuario.email}</span>?
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Esta ação revoga o acesso imediatamente e não pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="bg-axon-bg border border-axon-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-axon-panel border border-axon-border flex items-center justify-center shrink-0 overflow-hidden">
            {usuario.foto_url ? (
              <img src={usuario.foto_url} alt={usuario.nome ?? usuario.email} className="w-full h-full object-cover" />
            ) : (
              <span className="text-axon-gold font-bold text-xs uppercase">
                {(usuario.nome ?? usuario.email).substring(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{usuario.nome ?? "—"}</p>
            <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
          </div>
          <BadgeCargo role={usuario.role} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancelar} disabled={excluindo}
            className="py-3 rounded-xl border border-axon-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirmar} disabled={excluindo}
            className="py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {excluindo ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {excluindo ? "Removendo..." : "Sim, remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Editar Cargo ───────────────────────────────────────────────────────

function ModalEditarCargo({
  usuario, inviterRole, onSalvar, onCancelar, salvando,
}: {
  usuario: Usuario; inviterRole: string;
  onSalvar: (novoRole: string) => void;
  onCancelar: () => void; salvando: boolean;
}) {
  const [roleAtual, setRoleAtual] = useState(usuario.role);
  const cargosPermitidos: readonly string[] = HIERARQUIA[inviterRole] ?? [];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancelar();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onCancelar}>
      <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Pencil size={16} className="text-axon-gold" /> Editar Cargo
          </h2>
          <button onClick={onCancelar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Info do usuário */}
        <div className="bg-axon-bg border border-axon-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-axon-panel border border-axon-border flex items-center justify-center shrink-0 overflow-hidden">
            {usuario.foto_url ? (
              <img src={usuario.foto_url} alt={usuario.nome ?? usuario.email} className="w-full h-full object-cover" />
            ) : (
              <span className="text-axon-gold font-bold text-sm uppercase">
                {(usuario.nome ?? usuario.email).substring(0, 2)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate">{usuario.nome ?? "—"}</p>
            <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
          </div>
        </div>

        {/* Seletor de cargo */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Novo Cargo</label>
          <div className="relative">
            <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select value={roleAtual} onChange={(e) => setRoleAtual(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-axon-gold appearance-none">
              {cargosPermitidos.map((c) => (
                <option key={c} value={c}>{CARGOS[c]?.label ?? c}</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          {roleAtual && CARGOS[roleAtual] && (
            <p className="text-xs text-gray-500 pl-1">{CARGOS[roleAtual].descricao}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancelar} disabled={salvando}
            className="py-3 rounded-xl border border-axon-border text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={() => onSalvar(roleAtual)} disabled={salvando || roleAtual === usuario.role}
            className="py-3 rounded-xl bg-axon-gold text-black font-bold text-sm hover:bg-axon-gold-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Convidar (apenas convite por e-mail) ──────────────────────────────

function ModalConvidar({
  inviterRole, onSucesso, onFechar,
}: {
  inviterRole: string; onSucesso: () => void; onFechar: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [produtoras, setProdutoras] = useState<{ id: string; nome: string }[]>([]);
  const [produtoraId, setProdutoraId] = useState("");
  const isSuperAdmin = inviterRole === "super_admin";

  const cargosPermitidos: readonly string[] = HIERARQUIA[inviterRole] ?? [];

  // Super admin não tem produtora: escolhe em qual produtora está criando o acesso
  useEffect(() => {
    if (!isSuperAdmin) return;
    supabase.from("produtoras").select("id, nome").order("nome")
      .then(({ data }) => setProdutoras((data as { id: string; nome: string }[] | null) ?? []));
  }, [isSuperAdmin]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onFechar]);

  const handleSubmit = async () => {
    if (!email || !role) { setErro("Preencha e-mail e cargo."); return; }
    if (isSuperAdmin && !produtoraId) { setErro("Selecione a produtora."); return; }
    setErro(""); setEnviando(true);
    try {
      const res = await fetch(apiUrl("/api/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, action: "invite", ...(isSuperAdmin ? { produtora_id: produtoraId } : {}) }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro desconhecido."); setEnviando(false); return; }
      onSucesso();
    } catch {
      setErro("Erro de conexão. Tente novamente.");
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 w-full max-w-md space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <UserPlus size={18} className="text-axon-gold" /> Adicionar Membro
          </h2>
          <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          O usuário receberá um e-mail para definir a própria senha.
        </p>

        {/* E-mail */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider">E-mail</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-axon-gold placeholder:text-gray-600" />
          </div>
        </div>

        {/* Produtora (somente super admin) */}
        {isSuperAdmin && (
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Produtora</label>
            <div className="relative">
              <Crown size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select value={produtoraId} onChange={(e) => setProdutoraId(e.target.value)}
                className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-axon-gold appearance-none">
                <option value="">Selecione a produtora...</option>
                {produtoras.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Cargo */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Cargo</label>
          <div className="relative">
            <Shield size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-8 py-3 text-white text-sm focus:outline-none focus:border-axon-gold appearance-none">
              <option value="">Selecione um cargo...</option>
              {cargosPermitidos.map((c) => (
                <option key={c} value={c}>{CARGOS[c]?.label ?? c}</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
          {role && CARGOS[role] && (
            <p className="text-xs text-gray-500 pl-1">{CARGOS[role].descricao}</p>
          )}
        </div>

        {erro && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <AlertCircle size={13} /> {erro}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onFechar}
            className="py-3 rounded-xl border border-axon-border text-gray-400 hover:text-white text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={enviando || !email || !role}
            className="py-3 rounded-xl bg-axon-gold text-black font-bold text-sm hover:bg-axon-gold-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {enviando ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {enviando ? "Enviando..." : "Enviar Convite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meuId, setMeuId] = useState("");
  const [inviterRole, setInviterRole] = useState("");
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Modais
  const [modalConvidar, setModalConvidar] = useState(false);
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Usuario | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [toast, setToast] = useState({ msg: "", tipo: "ok" as "ok" | "erro", visivel: false });

  const mostrarToast = (msg: string, tipo: "ok" | "erro" = "ok") => {
    setToast({ msg, tipo, visivel: true });
    setTimeout(() => setToast((t) => ({ ...t, visivel: false })), 3000);
  };

  const carregar = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMeuId(user.id);

    const { data: eu } = await supabase
      .from("usuarios").select("role, produtora_id").eq("id", user.id).single();
    if (eu) {
      setInviterRole(eu.role);
      if (eu.produtora_id) {
        const { data: tenant } = await supabase
          .from("tenant_config")
          .select("*")
          .eq("produtora_id", eu.produtora_id)
          .maybeSingle();
        setConfig(tenant as TenantConfig | null);
      }
    }

    // Admin vê só a própria produtora; super admin vê todas
    let query = supabase
      .from("usuarios").select("id, email, nome, role, foto_url, produtora_id").order("role");
    if (eu?.role !== "super_admin") {
      if (!eu?.produtora_id) { setUsuarios([]); setCarregando(false); return; }
      query = query.eq("produtora_id", eu.produtora_id);
    }
    const { data } = await query;
    if (data) setUsuarios(data as Usuario[]);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  // ── Editar cargo ──
  const handleEditarCargo = async (novoRole: string) => {
    if (!modalEditar) return;
    setSalvandoEdicao(true);
    try {
      const res = await fetch(apiUrl("/api/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", userId: modalEditar.id, role: novoRole }),
      });
      const json = await res.json();
      if (!res.ok) { mostrarToast(json.error ?? "Erro ao atualizar.", "erro"); return; }
      setUsuarios((prev) => prev.map((u) => u.id === modalEditar.id ? { ...u, role: novoRole } : u));
      setModalEditar(null);
      mostrarToast("Cargo atualizado com sucesso!");
    } catch {
      mostrarToast("Erro de conexão.", "erro");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // ── Excluir usuário ──
  const handleExcluir = async () => {
    if (!modalExcluir) return;
    setExcluindo(true);
    try {
      const res = await fetch(apiUrl("/api/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", userId: modalExcluir.id }),
      });
      const json = await res.json();
      if (!res.ok) { mostrarToast(json.error ?? "Erro ao remover.", "erro"); return; }
      setUsuarios((prev) => prev.filter((u) => u.id !== modalExcluir.id));
      setModalExcluir(null);
      mostrarToast("Usuário removido.");
    } catch {
      mostrarToast("Erro de conexão.", "erro");
    } finally {
      setExcluindo(false);
    }
  };

  // ── Helpers de permissão ──
  const podeEditar = (u: Usuario) => u.id !== meuId && podeAtribuir(inviterRole, u.role);

  const podeExcluir = podeEditar;

  const podeConvidar = !!HIERARQUIA[inviterRole];

  return (
    <>
      <Toast msg={toast.msg} tipo={toast.tipo} visivel={toast.visivel} />

      {modalConvidar && (
        <ModalConvidar inviterRole={inviterRole}
          onFechar={() => setModalConvidar(false)}
          onSucesso={() => { setModalConvidar(false); mostrarToast("Usuário adicionado!"); carregar(); }} />
      )}

      {modalEditar && (
        <ModalEditarCargo usuario={modalEditar} inviterRole={inviterRole}
          onSalvar={handleEditarCargo} onCancelar={() => setModalEditar(null)} salvando={salvandoEdicao} />
      )}

      {modalExcluir && (
        <ModalConfirmarExclusao usuario={modalExcluir}
          onConfirmar={handleExcluir} onCancelar={() => setModalExcluir(null)} excluindo={excluindo} />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {config?.nome_organizacao ? `${config.nome_organizacao} - Usuários & Permissões` : "Usuários & Permissões"}
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Gerencie quem acessa o painel e com quais permissões.</p>
          </div>
          {podeConvidar && (
            <button onClick={() => setModalConvidar(true)}
              className="flex items-center gap-2 bg-axon-gold text-black px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-axon-gold-dim transition-colors">
              <UserPlus size={16} /> Adicionar Membro
            </button>
          )}
        </div>

        {/* Mapa de acessos */}
        <div className="bg-axon-panel border border-axon-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-axon-gold" />
            <h2 className="text-white font-semibold text-sm">Mapa de Acessos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(CARGOS).map(([key, cfg]) => (
              <div key={key} className="bg-axon-bg border border-axon-border rounded-xl p-3 space-y-1.5">
                <BadgeCargo role={key} />
                <p className="text-xs text-gray-500 leading-relaxed">{cfg.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="bg-axon-panel border border-axon-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-axon-border">
            <Users size={16} className="text-axon-gold" />
            <h2 className="text-white font-semibold text-sm">
              {config?.nome_organizacao ? `Equipe ${config.nome_organizacao}` : "Equipe"}{" "}
              <span className="text-gray-500 font-normal">({usuarios.length})</span>
            </h2>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-axon-gold" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
              <Users size={36} className="opacity-20" />
              <p className="text-sm">Nenhum usuário cadastrado ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-axon-border">
              {usuarios.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full border border-axon-border flex items-center justify-center shrink-0 overflow-hidden bg-axon-panel">
                      {u.foto_url ? (
                        <img src={u.foto_url} alt={u.nome ?? u.email} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-axon-gold font-bold text-xs uppercase">
                          {(u.nome ?? u.email).substring(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{u.nome ?? "—"}</p>
                        {u.id === meuId && (
                          <span className="text-xs text-gray-600 font-normal">(você)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <BadgeCargo role={u.role} />

                    {/* Editar */}
                    {podeEditar(u) ? (
                      <button onClick={() => setModalEditar(u)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-axon-gold hover:bg-axon-gold-dim transition-colors"
                        title="Editar cargo">
                        <Pencil size={14} />
                      </button>
                    ) : <div className="w-8" />}

                    {/* Excluir */}
                    {podeExcluir(u) ? (
                      <button onClick={() => setModalExcluir(u)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Remover usuário">
                        <Trash2 size={14} />
                      </button>
                    ) : <div className="w-8" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}