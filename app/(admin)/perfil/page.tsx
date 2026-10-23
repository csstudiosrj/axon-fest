"use client";

import { useState, useEffect, useRef } from "react";
import { PlanoAssinatura } from "./PlanoAssinatura";
import {
  User, Mail, Phone, Lock, Camera,
  Save, Eye, EyeOff, CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFiles } from "@/utils/uploadthing";

const supabase = createClient();

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Perfil {
  id: string;
  nome: string;
  telefone: string;
  foto_url: string;
  role: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, tipo, visivel }: { msg: string; tipo: "ok" | "erro"; visivel: boolean }) {
  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-full font-semibold text-sm shadow-xl transition-all duration-300 ${
      visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
    } ${tipo === "ok"
      ? "bg-axon-gold text-black"
      : "bg-red-500/90 text-white"
    }`}>
      {tipo === "ok" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {msg}
    </div>
  );
}

// ─── Avatar com Upload ────────────────────────────────────────────────────────

function AvatarUpload({
  fotoUrl, nome, uploading, onChange,
}: {
  fotoUrl: string; nome: string; uploading: boolean; onChange: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const iniciais = nome?.substring(0, 2).toUpperCase() || "??";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-2 border-axon-gold-dim overflow-hidden bg-axon-panel flex items-center justify-center">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-axon-gold">{iniciais}</span>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-axon-gold" />
            </div>
          )}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-axon-gold text-black flex items-center justify-center hover:bg-axon-gold-dim transition-colors shadow-lg disabled:opacity-50"
        >
          <Camera size={14} />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
      <p className="text-xs text-gray-500">JPG, PNG ou WebP · Máx. 5MB</p>
    </div>
  );
}

// ─── Campo de Input ───────────────────────────────────────────────────────────

function Campo({
  label, icon: Icon, type = "text", value, onChange, placeholder, disabled,
  extra,
}: {
  label: string; icon: React.ElementType; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-axon-gold disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-600 transition-colors"
        />
        {extra}
      </div>
    </div>
  );
}

// ─── Seção de Senha ───────────────────────────────────────────────────────────

function SecaoSenha({
  email, onSalvar, salvando,
}: {
  email: string; onSalvar: (nova: string, atual: string) => Promise<void>; salvando: boolean;
}) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState("");

  const valido = nova.length >= 8 && nova === confirma;

  const handleSalvar = async () => {
    if (!valido) { setErro("As senhas não coincidem ou são muito curtas (mín. 8 caracteres)."); return; }
    setErro("");
    await onSalvar(nova, atual);
    setAtual(""); setNova(""); setConfirma("");
  };

  const ToggleIcon = mostrar ? EyeOff : Eye;

  return (
    <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <Lock size={18} className="text-axon-gold" />
        <h2 className="text-white font-semibold">Alterar Senha</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Senha Atual", val: atual, set: setAtual, ph: "••••••••" },
          { label: "Nova Senha", val: nova, set: setNova, ph: "Mín. 8 caracteres" },
          { label: "Confirmar Nova Senha", val: confirma, set: setConfirma, ph: "Repita a nova senha" },
        ].map(({ label, val, set, ph }) => (
          <div key={label} className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type={mostrar ? "text" : "password"}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                className="w-full bg-axon-bg border border-axon-border rounded-xl pl-10 pr-10 py-3 text-white text-sm focus:outline-none focus:border-axon-gold placeholder:text-gray-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setMostrar(!mostrar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <ToggleIcon size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {erro && (
        <p className="text-red-400 text-xs flex items-center gap-1.5">
          <AlertCircle size={13} /> {erro}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSalvar}
          disabled={!valido || salvando || !atual}
          className="flex items-center gap-2 bg-axon-gold text-black px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-axon-gold-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {salvando ? "Salvando..." : "Atualizar Senha"}
        </button>
        {nova && confirma && nova !== confirma && (
          <p className="text-red-400 text-xs">Senhas não coincidem</p>
        )}
        {nova.length >= 6 && nova === confirma && (
          <p className="text-green-400 text-xs flex items-center gap-1">
            <CheckCircle size={13} /> Senhas coincidem
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [toast, setToast] = useState({ msg: "", tipo: "ok" as "ok" | "erro", visivel: false });

  const mostrarToast = (msg: string, tipo: "ok" | "erro" = "ok") => {
    setToast({ msg, tipo, visivel: true });
    setTimeout(() => setToast((t) => ({ ...t, visivel: false })), 3000);
  };

  // ── Carregar perfil ──
  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("usuarios")
        .select("id, nome, telefone, foto_url, role")
        .eq("id", user.id)
        .single();

      if (data) {
        setPerfil(data as Perfil);
        setNome(data.nome ?? "");
        setTelefone(data.telefone ?? "");
        setFotoUrl(data.foto_url ?? "");
      }
      setCarregando(false);
    }
    carregar();
  }, []);

  // ── Upload de foto com limpeza do arquivo anterior ──
  const handleUploadFoto = async (file: File) => {
    if (!perfil?.id) {
      mostrarToast("ID do perfil não encontrado.", "erro");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      mostrarToast("Arquivo muito grande. Máximo 5MB.", "erro");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      mostrarToast("Formato não permitido. Use JPG, PNG ou WebP.", "erro");
      return;
    }

    setUploading(true);
    try {
      const [enviado] = await uploadFiles("imageUploader", { files: [file] });
      if (!enviado) throw new Error("Falha no envio da foto.");
      const publicUrl = enviado.ufsUrl;
      setFotoUrl(publicUrl);

      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ foto_url: publicUrl })
        .eq("id", perfil.id);

      if (updateError) throw updateError;

      mostrarToast("Foto atualizada com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer upload da foto.";
      mostrarToast(msg, "erro");
    } finally {
      setUploading(false);
    }
  };

  // ── Salvar dados pessoais ──
  const salvarPerfil = async () => {
    if (!perfil) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("usuarios")
        .update({ nome, telefone })
        .eq("id", perfil.id);

      if (error) throw error;
      mostrarToast("Perfil atualizado com sucesso!");
    } catch {
      mostrarToast("Erro ao salvar perfil.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  // ── Alterar senha com re-autenticação ──
  const alterarSenha = async (novaSenha: string, senhaAtual: string) => {
    setSalvandoSenha(true);
    try {
      // Re-autenticar para confirmar senha atual
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email,
        password: senhaAtual,
      });

      if (reAuthError) {
        mostrarToast("A senha atual inserida está incorreta.", "erro");
        setSalvandoSenha(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
      if (updateError) throw updateError;

      mostrarToast("Senha alterada com sucesso!");
    } catch {
      mostrarToast("Erro ao alterar senha.", "erro");
    } finally {
      setSalvandoSenha(false);
    }
  };

  // ── Loading ──
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-axon-gold" />
      </div>
    );
  }

  return (
    <>
      <Toast msg={toast.msg} tipo={toast.tipo} visivel={toast.visivel} />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
          <p className="text-gray-400 mt-1 text-sm">Gerencie suas informações pessoais e segurança.</p>
        </div>

        {/* Card principal */}
        <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-axon-border pb-5">
            <User size={18} className="text-axon-gold" />
            <h2 className="text-white font-semibold">Informações Pessoais</h2>
          </div>

          {/* Avatar */}
          <AvatarUpload
            fotoUrl={fotoUrl}
            nome={nome}
            uploading={uploading}
            onChange={handleUploadFoto}
          />

          {/* Campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo
              label="Nome Completo"
              icon={User}
              value={nome}
              onChange={setNome}
              placeholder="Seu nome completo"
            />
            <Campo
              label="E-mail"
              icon={Mail}
              type="email"
              value={email}
              onChange={() => {}}
              disabled
              placeholder="seu@email.com"
            />
            <Campo
              label="Telefone / WhatsApp"
              icon={Phone}
              type="tel"
              value={telefone}
              onChange={setTelefone}
              placeholder="(00) 00000-0000"
            />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cargo</label>
              <div className="flex items-center h-[46px] px-3.5 bg-axon-bg border border-axon-border rounded-xl">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-axon-gold-dim text-axon-gold border border-axon-gold-dim capitalize">
                  {perfil?.role ?? "admin"}
                </span>
              </div>
            </div>
          </div>

          {/* Botão salvar */}
          <div className="flex justify-end pt-2">
            <button
              onClick={salvarPerfil}
              disabled={salvando}
              className="flex items-center gap-2 bg-axon-gold text-black px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-axon-gold-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {/* Seção de senha */}
        <SecaoSenha email={email} onSalvar={alterarSenha} salvando={salvandoSenha} />

        <PlanoAssinatura />
      </div>
    </>
  );
}