"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { maiuscula, perfilPorSlug } from "@/lib/perfis";
import { apiUrl } from "@/lib/base-path";
import {
  Search,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  Pencil,
  Trash2,
  UserPlus,
  MailCheck,
  UserMinus,
  ShieldAlert,
  ShieldOff,
  Calendar,
  User,
  Music,
} from "lucide-react";

// Instância global do cliente Supabase
const supabase = createClient();

// ============================================================
// TIPOS
// ============================================================
interface Grupo {
  id: string;
  nome: string;
  responsavel: string | null;
  telefone: string | null;
  email: string;
  documento: string | null;
  tipo_documento: "cpf" | "cnpj" | null;
  created_at: string;
  origem_produtora_id: string | null;
}

interface Participante {
  id: string;
  nome: string;
  nome_artistico: string | null;
  documento: string | null;
  data_nascimento: string;
  email_contato: string | null;
  termo_assinado: boolean;
  funcao: string | null;
  created_at: string;
  origem_produtora_id: string | null;
}

interface Vinculo {
  id: string;
  grupo_id: string;
  participante_id: string;
  funcao: string;
  confirmado: boolean;
  token_confirmacao: string | null;
  data_vinculo: string;
}

interface VinculoComGrupo {
  funcao: string;
  confirmado: boolean;
  data_vinculo: string;
  grupos: { nome: string } | null;
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function mascaraCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  if (numeros.length <= 9)
    return numeros.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function mascaraTelefone(valor: string) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 6) return n.replace(/(\d{2})(\d{0,4})/, "($1) $2");
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function formatarData(data: string) {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleDateString("pt-BR");
}

// ============================================================
// REFATORAÇÃO #3 — obterOpcoesFuncao e presetMap REMOVIDOS.
// opcoesFuncao vem do tipo de festival da produtora (lib/perfis.ts).
// ============================================================

// ============================================================
// MODAL DE CONFIRMAÇÃO CUSTOMIZADO
// ============================================================
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-md p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-axon-gold/10 border border-axon-gold/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={22} className="text-axon-gold" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 mb-6">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg border border-axon-border text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-axon-gold text-black font-bold hover:bg-axon-gold/80 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL CADASTRAR/EDITAR GRUPO
// ============================================================
interface ModalGrupoProps {
  open: boolean;
  grupo?: Grupo | null;
  onClose: () => void;
  onSaved: () => void;
  produtoraId: string;
}

function ModalGrupo({
  open,
  grupo,
  onClose,
  onSaved,
  produtoraId,
}: ModalGrupoProps) {
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<"cpf" | "cnpj">("cnpj");
  const [documento, setDocumento] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (grupo) {
      setNome(grupo.nome);
      setResponsavel(grupo.responsavel || "");
      setTelefone(grupo.telefone || "");
      setEmail(grupo.email);
      setTipoDocumento(grupo.tipo_documento || "cnpj");
      setDocumento(grupo.documento || "");
    } else {
      setNome("");
      setResponsavel("");
      setTelefone("");
      setEmail("");
      setTipoDocumento("cnpj");
      setDocumento("");
    }
  }, [grupo, open]);

  if (!open) return null;

  async function salvar() {
    setErro("");
    const docLimpo = documento.replace(/\D/g, "");
    if (!nome.trim()) return setErro("Nome do grupo é obrigatório.");
    if (!email.trim()) return setErro("E-mail é obrigatório.");
    if (!docLimpo)
      return setErro(`${tipoDocumento === "cpf" ? "CPF" : "CNPJ"} é obrigatório.`);
    if (tipoDocumento === "cpf" && docLimpo.length !== 11)
      return setErro("CPF deve ter 11 dígitos.");
    if (tipoDocumento === "cnpj" && docLimpo.length !== 14)
      return setErro("CNPJ deve ter 14 dígitos.");
    setSalvando(true);

    if (grupo) {
      const { error } = await supabase
        .from("grupos")
        .update({
          nome: nome.trim(),
          responsavel: responsavel.trim() || null,
          telefone: telefone.trim() || null,
          email: email.trim(),
          tipo_documento: tipoDocumento,
          documento: docLimpo,
        })
        .eq("id", grupo.id);
      if (error) setErro(error.message);
      else onSaved();
    } else {
      const { error } = await supabase.from("grupos").insert({
        nome: nome.trim(),
        responsavel: responsavel.trim() || null,
        telefone: telefone.trim() || null,
        email: email.trim(),
        tipo_documento: tipoDocumento,
        documento: docLimpo,
        origem_produtora_id: produtoraId,
      });
      if (error) setErro(error.message);
      else onSaved();
    }
    setSalvando(false);
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setDocumento(raw);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-axon-border">
          <h2 className="text-lg font-semibold text-white">
            {grupo ? "Editar" : "Novo"} Grupo
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Nome do grupo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Tipo de documento *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="cpf"
                  checked={tipoDocumento === "cpf"}
                  onChange={() => setTipoDocumento("cpf")}
                />{" "}
                CPF (diretor)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="cnpj"
                  checked={tipoDocumento === "cnpj"}
                  onChange={() => setTipoDocumento("cnpj")}
                />{" "}
                CNPJ (grupo)
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {tipoDocumento === "cpf" ? "CPF" : "CNPJ"} *
            </label>
            <input
              type="text"
              value={
                tipoDocumento === "cpf"
                  ? mascaraCPF(documento)
                  : documento
              }
              onChange={handleDocumentoChange}
              placeholder={
                tipoDocumento === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"
              }
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Responsável
            </label>
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Telefone</label>
            <input
              type="tel"
              value={mascaraTelefone(telefone)}
              onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          {erro && <p className="text-xs text-red-400">{erro}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-axon-border">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-axon-border text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-2 rounded-lg bg-axon-gold text-black font-bold flex items-center justify-center gap-2"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {grupo ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL CADASTRAR/EDITAR PARTICIPANTE
// ============================================================
interface ModalParticipanteProps {
  open: boolean;
  participante?: Participante | null;
  onClose: () => void;
  onSaved: () => void;
  userRole: string;
  produtoraId: string;
  opcoesFuncao: string[];
  termoParticipante: string | null;
}

function ModalParticipante({
  open,
  participante,
  onClose,
  onSaved,
  userRole,
  produtoraId,
  opcoesFuncao,
  termoParticipante,
}: ModalParticipanteProps) {
  const isSuperAdmin = userRole === "super_admin";

  const [nome, setNome] = useState("");
  const [nomeArtistico, setNomeArtistico] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [termoAssinado, setTermoAssinado] = useState(false);
  const [funcao, setFuncao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Match Global com máscara de privacidade (LGPD)
  const [matchGlobal, setMatchGlobal] = useState(false);
  const [nomeMascarado, setNomeMascarado] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (participante) {
      setNome(participante.nome);
      setNomeArtistico(participante.nome_artistico || "");
      setCpf(participante.documento || "");
      setDataNascimento(participante.data_nascimento || "");
      setEmailContato(participante.email_contato || "");
      setTermoAssinado(participante.termo_assinado);
      setFuncao(participante.funcao || opcoesFuncao[0] || "Outro");
    } else {
      setNome("");
      setNomeArtistico("");
      setCpf("");
      setDataNascimento("");
      setEmailContato("");
      setTermoAssinado(false);
      setFuncao(opcoesFuncao[0] || "Outro");
    }
    setMatchGlobal(false);
    setNomeMascarado("");
    setSucesso("");
  }, [participante, open, opcoesFuncao]);

  // Verificar se o CPF completo já existe na base global (apenas novo cadastro)
  useEffect(() => {
    const verificarMatch = async () => {
      const cpfLimpo = cpf.replace(/\D/g, "");
      if (cpfLimpo.length === 11 && !participante) {
        const { data } = await supabase
          .from("participantes")
          .select("nome")
          .eq("documento", cpfLimpo)
          .maybeSingle();
        if (data) {
          const partes = data.nome.split(" ");
          const mascarado = partes
            .map((parte: string) => {
              if (parte.length <= 1) return parte;
              return parte[0] + "*".repeat(parte.length - 1);
            })
            .join(" ");
          setNomeMascarado(mascarado);
          setMatchGlobal(true);
        } else {
          setMatchGlobal(false);
          setNomeMascarado("");
        }
      } else {
        setMatchGlobal(false);
        setNomeMascarado("");
      }
    };
    verificarMatch();
  }, [cpf, participante]);

  if (!open) return null;

  async function salvar() {
    setErro("");
    setSucesso("");

    // REFATORAÇÃO #4 — Se é match global, o botão está desabilitado e não deve
    // chegar aqui. Mas por segurança, bloqueamos qualquer ação de escrita.
    if (matchGlobal) return;

    const cpfLimpo = cpf.replace(/\D/g, "");
    if (!nome.trim()) return setErro("Nome completo é obrigatório.");
    if (cpfLimpo.length !== 11) return setErro("CPF deve ter 11 dígitos.");
    if (!emailContato.trim())
      return setErro("E-mail de contato é obrigatório.");
    if (!funcao) return setErro("Selecione a função.");
    setSalvando(true);

    if (participante) {
      const updateData: Record<string, unknown> = {
        nome_artistico: nomeArtistico.trim() || null,
        email_contato: emailContato.trim(),
        termo_assinado: termoAssinado,
        funcao: funcao,
      };
      if (isSuperAdmin) {
        updateData.nome = nome.trim();
        updateData.documento = cpfLimpo;
        updateData.data_nascimento = dataNascimento || null;
      }
      const { error } = await supabase
        .from("participantes")
        .update(updateData)
        .eq("id", participante.id);
      if (error) setErro(error.message);
      else onSaved();
    } else {
      const { error } = await supabase.from("participantes").insert({
        nome: nome.trim(),
        nome_artistico: nomeArtistico.trim() || null,
        documento: cpfLimpo,
        data_nascimento: dataNascimento || null,
        email_contato: emailContato.trim(),
        termo_assinado: termoAssinado,
        funcao: funcao,
        origem_produtora_id: produtoraId,
      });
      if (error) setErro(error.message);
      else onSaved();
    }
    setSalvando(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-axon-border">
          <h2 className="text-lg font-semibold text-white">
            {participante ? "Editar" : "Novo"} Participante
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">

          {/* REFATORAÇÃO #4 — Alerta de match global LGPD com instrução de fluxo correto */}
          {matchGlobal && (
            <div className="bg-amber-900/20 border border-amber-500/40 rounded-lg p-4 text-sm text-amber-200 space-y-2">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                Participante já cadastrado na base global
              </p>
              <p>
                O CPF informado pertence a{" "}
                <strong className="text-white">{nomeMascarado}</strong>. Por
                privacidade (LGPD), os dados completos não são exibidos.
              </p>
              <p className="text-amber-300 leading-relaxed">
                Este participante já possui cadastro global. Para adicioná-lo
                ao seu festival, <strong>feche este modal</strong>, clique em{" "}
                <strong>Detalhes do grupo</strong> desejado e use a opção{" "}
                <strong>Vincular</strong> para enviar um convite por e-mail.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              // REFATORAÇÃO #4 — bloquear todos os inputs quando matchGlobal
              disabled={!!(participante && !isSuperAdmin) || matchGlobal}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                (participante && !isSuperAdmin) || matchGlobal
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            />
            {participante && !isSuperAdmin && (
              <p className="text-xs text-amber-400 mt-1">
                Apenas o administrador do sistema pode editar o nome completo.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Nome artístico (opcional)
            </label>
            <input
              type="text"
              value={nomeArtistico}
              onChange={(e) => setNomeArtistico(e.target.value)}
              disabled={matchGlobal}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                matchGlobal ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">CPF *</label>
            <input
              type="text"
              value={mascaraCPF(cpf)}
              onChange={(e) => setCpf(e.target.value)}
              disabled={!!(participante && !isSuperAdmin)}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                participante && !isSuperAdmin
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
              maxLength={14}
            />
            {participante && !isSuperAdmin && (
              <p className="text-xs text-amber-400 mt-1">
                Apenas o administrador do sistema pode editar o CPF.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Data de nascimento *
            </label>
            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              disabled={!!(participante && !isSuperAdmin) || matchGlobal}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                (participante && !isSuperAdmin) || matchGlobal
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              E-mail de contato *
            </label>
            <input
              type="email"
              value={emailContato}
              onChange={(e) => setEmailContato(e.target.value)}
              disabled={matchGlobal}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                matchGlobal ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Função *</label>
            <select
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              disabled={matchGlobal}
              className={`w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white ${
                matchGlobal ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {opcoesFuncao.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Baseado no tipo de festival:{" "}
              <span className="text-axon-gold">{termoParticipante || "padrão"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="termo"
              checked={termoAssinado}
              onChange={(e) => setTermoAssinado(e.target.checked)}
              disabled={matchGlobal}
              className="w-4 h-4"
            />
            <label htmlFor="termo" className="text-sm text-gray-300">
              Termo de consentimento assinado
            </label>
          </div>

          {erro && <p className="text-xs text-red-400">{erro}</p>}
          {sucesso && <p className="text-xs text-emerald-400">{sucesso}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-axon-border">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-axon-border text-gray-400 hover:text-white"
          >
            {matchGlobal ? "Fechar e ir para Grupos" : "Cancelar"}
          </button>
          {/* REFATORAÇÃO #4 — Botão desabilitado no cenário de match global */}
          <button
            onClick={salvar}
            disabled={salvando || matchGlobal}
            title={
              matchGlobal
                ? "Use o fluxo de Vincular no drawer do grupo para convidar este participante."
                : undefined
            }
            className="flex-1 py-2 rounded-lg bg-axon-gold text-black font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {participante ? "Salvar" : "Cadastrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL VINCULAR PARTICIPANTE AO GRUPO
// ============================================================
interface ModalVincularProps {
  open: boolean;
  grupoId: string;
  onClose: () => void;
  onVinculado: () => void;
  opcoesFuncao: string[];
}

function ModalVincular({
  open,
  grupoId,
  onClose,
  onVinculado,
  opcoesFuncao,
}: ModalVincularProps) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Participante[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selecionado, setSelecionado] = useState<Participante | null>(null);
  const [funcao, setFuncao] = useState(opcoesFuncao[0] || "Outro");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setBusca("");
      setResultados([]);
      setSelecionado(null);
      setFuncao(opcoesFuncao[0] || "Outro");
      setErro("");
    }
  }, [open, opcoesFuncao]);

  if (!open) return null;

  async function buscar() {
    const termo = busca.trim();
    if (!termo) return;
    setBuscando(true);
    setErro("");
    let query = supabase.from("participantes").select("*");
    if (termo.length === 11 || /^\d+$/.test(termo)) {
      query = query.eq("documento", termo.replace(/\D/g, ""));
    } else {
      query = query.ilike("nome", `%${termo}%`);
    }
    const { data, error } = await query.limit(10);
    if (error) setErro(error.message);
    else setResultados(data || []);
    setBuscando(false);
  }

  async function vincular() {
    if (!selecionado) return setErro("Selecione um participante.");
    setSalvando(true);

    const { data: existente } = await supabase
      .from("grupo_participante")
      .select("id")
      .eq("grupo_id", grupoId)
      .eq("participante_id", selecionado.id)
      .maybeSingle();
    if (existente) {
      setErro("Este participante já está vinculado a este grupo.");
      setSalvando(false);
      return;
    }

    const token = crypto.randomUUID();
    const { error: insertErr } = await supabase
      .from("grupo_participante")
      .insert({
        grupo_id: grupoId,
        participante_id: selecionado.id,
        funcao: funcao,
        token_confirmacao: token,
        confirmado: false,
      });
    if (insertErr) {
      setErro(insertErr.message);
      setSalvando(false);
      return;
    }

    // Destinatário e dados do e-mail são buscados no servidor a partir do token
    await fetch(apiUrl("/api/enviar-confirmacao-vinculo"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(console.error);

    onVinculado();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-axon-panel border border-axon-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-axon-border">
          <h2 className="text-lg font-semibold text-white">
            Vincular Participante
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Buscar participante (CPF ou nome)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="flex-1 bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
              />
              <button
                onClick={buscar}
                disabled={buscando}
                className="px-3 py-2 rounded-lg border border-axon-border text-axon-gold hover:bg-axon-gold/10"
              >
                Buscar
              </button>
            </div>
            {buscando && <Loader2 size={16} className="animate-spin mt-2" />}
            {resultados.length > 0 && (
              <div className="mt-2 border border-axon-border rounded-lg overflow-hidden">
                {resultados.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelecionado(p)}
                    className={`p-2 cursor-pointer hover:bg-axon-gold/10 ${
                      selecionado?.id === p.id ? "bg-axon-gold/20" : ""
                    }`}
                  >
                    <p className="text-sm text-white">{p.nome}</p>
                    <p className="text-xs text-gray-500">
                      {mascaraCPF(p.documento || "")} • {p.funcao || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {selecionado && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Função neste grupo *
              </label>
              <select
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                className="w-full bg-axon-bg border border-axon-border rounded-lg px-3 py-2 text-sm text-white"
              >
                {opcoesFuncao.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
          {erro && <p className="text-xs text-red-400">{erro}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-axon-border">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-axon-border text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={vincular}
            disabled={salvando || !selecionado}
            className="flex-1 py-2 rounded-lg bg-axon-gold text-black font-bold flex items-center justify-center gap-2"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            Vincular
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DRAWER LATERAL DE DETALHES DO PARTICIPANTE
// ============================================================
interface DrawerParticipanteProps {
  open: boolean;
  participante: Participante | null;
  onClose: () => void;
}

function DrawerParticipante({ open, participante, onClose }: DrawerParticipanteProps) {
  const [vinculos, setVinculos] = useState<
    { grupo_nome: string; funcao: string; confirmado: boolean; data_vinculo: string }[]
  >([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !participante) return;
    const carregarDados = async () => {
      setCarregando(true);
      const { data, error } = await supabase
        .from("grupo_participante")
        .select(
          `
          funcao,
          confirmado,
          data_vinculo,
          grupos:grupo_id (nome)
        `
        )
        .eq("participante_id", participante.id)
        .returns<VinculoComGrupo[]>();

      if (!error && data) {
        const formatted = data.map((v: VinculoComGrupo) => ({
          grupo_nome: v.grupos?.nome || "Grupo desconhecido",
          funcao: v.funcao,
          confirmado: v.confirmado,
          data_vinculo: v.data_vinculo,
        }));
        setVinculos(formatted);
      }
      setCarregando(false);
    };
    carregarDados();
  }, [open, participante]);

  if (!open || !participante) return null;

  const statusConfirmacao = () => {
    const vinculoAtivo = vinculos.find((v) => v.confirmado === true);
    if (vinculoAtivo)
      return {
        label: "Confirmado",
        color: "text-emerald-400",
        icon: <CheckCircle2 size={14} />,
      };
    const pendente = vinculos.some((v) => v.confirmado === false);
    if (pendente)
      return {
        label: "Pendente",
        color: "text-amber-400",
        icon: <MailCheck size={14} />,
      };
    return { label: "Sem vínculo ativo", color: "text-gray-500", icon: null };
  };
  const status = statusConfirmacao();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-axon-panel border-l border-axon-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-axon-border">
          <h2 className="text-xl font-semibold text-white">
            Detalhes do Participante
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-axon-gold" />
                <span className="text-sm text-gray-400">Nome artístico</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {status.icon}
                <span className={status.color}>{status.label}</span>
              </div>
            </div>
            <p className="text-white text-lg font-medium">
              {participante.nome_artistico || "—"}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <User size={18} className="text-axon-gold" />
              <span className="text-sm text-gray-400">Nome completo</span>
            </div>
            <p className="text-white">{participante.nome}</p>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-axon-border">
              <div>
                <p className="text-xs text-gray-400">CPF</p>
                <p className="text-sm text-white">
                  {mascaraCPF(participante.documento || "")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Data de nascimento</p>
                <p className="text-sm text-white">
                  {formatarData(participante.data_nascimento)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400">E-mail de contato</p>
                <p className="text-sm text-white">{participante.email_contato}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Função (principal)</p>
                <p className="text-sm text-white">
                  {participante.funcao || "Não definida"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-axon-border">
            <h3 className="text-sm font-semibold text-axon-gold mb-3">
              Histórico de vínculos
            </h3>
            {carregando ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-axon-gold" size={20} />
              </div>
            ) : vinculos.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum vínculo encontrado.</p>
            ) : (
              <div className="space-y-3">
                {vinculos.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-axon-bg border border-axon-border rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {v.grupo_nome}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Função: {v.funcao}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vinculado em: {formatarData(v.data_vinculo)}
                        </p>
                      </div>
                      {v.confirmado ? (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Confirmado
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          <MailCheck size={12} /> Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// DRAWER LATERAL DE DETALHES DO GRUPO (com bloqueio via blacklist)
// ============================================================
interface DrawerGrupoProps {
  open: boolean;
  grupo: Grupo | null;
  onClose: () => void;
  onRefresh: () => void;
  produtoraId: string;
  opcoesFuncao: string[];
}

function DrawerGrupo({
  open,
  grupo,
  onClose,
  onRefresh,
  produtoraId,
  opcoesFuncao,
}: DrawerGrupoProps) {
  const [participantes, setParticipantes] = useState<
    Array<
      Participante & {
        funcao: string;
        confirmado: boolean;
        vinculoId: string;
        bloqueado: boolean;
      }
    >
  >([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVincular, setModalVincular] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "remover" | "bloquear" | "desbloquear";
    participanteId?: string;
    participanteNome?: string;
  }>({ open: false, type: "remover" });

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const carregarDados = useCallback(async () => {
    if (!grupo) return;
    setCarregando(true);

    // REFATORAÇÃO #2 — Removido o filtro .eq("status", "ativo") que causava Erro 400.
    // A tabela grupo_participante não possui essa coluna. Filtra apenas por grupo_id.
    const { data: vinculos, error } = await supabase
      .from("grupo_participante")
      .select("id, participante_id, funcao, confirmado")
      .eq("grupo_id", grupo.id);

    if (!error && vinculos) {
      const participantesIds = vinculos.map((v) => v.participante_id);
      const { data: parts } = await supabase
        .from("participantes")
        .select("*")
        .in("id", participantesIds);

      const { data: bloqueados } = await supabase
        .from("participantes_bloqueados")
        .select("participante_id")
        .eq("produtora_id", produtoraId);
      const bloqueadosIds = bloqueados?.map((b) => b.participante_id) || [];

      if (parts) {
        const combined = vinculos.map((v) => {
          const part = parts.find((p) => p.id === v.participante_id);
          const fallback: Participante = {
            id: v.participante_id,
            nome: "Participante desconhecido",
            nome_artistico: null,
            documento: null,
            data_nascimento: "",
            email_contato: "N/A",
            termo_assinado: false,
            funcao: null,
            created_at: "",
            origem_produtora_id: null,
          };
          const base = part ?? fallback;
          return {
            ...base,
            funcao: v.funcao,
            confirmado: v.confirmado,
            vinculoId: v.id,
            bloqueado: bloqueadosIds.includes(v.participante_id),
          };
        });
        setParticipantes(combined);
      }
    }
    setCarregando(false);
  }, [grupo, produtoraId]);

  useEffect(() => {
    if (open && grupo) carregarDados();
  }, [open, grupo, carregarDados]);

  async function removerVinculo(participanteId: string, participanteNome: string) {
    setConfirmModal({ open: true, type: "remover", participanteId, participanteNome });
  }

  async function bloquearParticipante(participanteId: string, participanteNome: string) {
    setConfirmModal({ open: true, type: "bloquear", participanteId, participanteNome });
  }

  async function desbloquearParticipante(participanteId: string, participanteNome: string) {
    setConfirmModal({ open: true, type: "desbloquear", participanteId, participanteNome });
  }

  async function confirmarAcao() {
    if (confirmModal.type === "remover" && confirmModal.participanteId) {
      const vinculo = participantes.find(
        (p) => p.id === confirmModal.participanteId
      )?.vinculoId;
      if (vinculo) {
        await supabase.from("grupo_participante").delete().eq("id", vinculo);
      }
    } else if (confirmModal.type === "bloquear" && confirmModal.participanteId) {
      await supabase.from("participantes_bloqueados").insert({
        participante_id: confirmModal.participanteId,
        produtora_id: produtoraId,
      });
    } else if (confirmModal.type === "desbloquear" && confirmModal.participanteId) {
      await supabase
        .from("participantes_bloqueados")
        .delete()
        .eq("participante_id", confirmModal.participanteId)
        .eq("produtora_id", produtoraId);
    }
    setConfirmModal({ open: false, type: "remover" });
    onRefresh();
    carregarDados();
  }

  if (!open || !grupo) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-axon-panel border-l border-axon-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex justify-between items-center p-6 border-b border-axon-border">
          <h2 className="text-xl font-semibold text-white">{grupo.nome}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-axon-gold">Informações</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Responsável:</div>
              <div className="text-white">{grupo.responsavel || "—"}</div>
              <div className="text-gray-400">E-mail:</div>
              <div className="text-white">{grupo.email}</div>
              <div className="text-gray-400">Telefone:</div>
              <div className="text-white">
                {mascaraTelefone(grupo.telefone || "") || "—"}
              </div>
              <div className="text-gray-400">Documento:</div>
              <div className="text-white">
                {grupo.tipo_documento === "cpf"
                  ? mascaraCPF(grupo.documento || "")
                  : grupo.documento}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-axon-gold">
                Participantes vinculados
              </h3>
              <button
                onClick={() => setModalVincular(true)}
                className="text-xs bg-axon-gold/10 text-axon-gold px-2 py-1 rounded flex items-center gap-1"
              >
                <UserPlus size={12} /> Vincular
              </button>
            </div>
            {carregando ? (
              <Loader2 className="animate-spin" />
            ) : participantes.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nenhum participante vinculado.
              </p>
            ) : (
              <div className="space-y-2">
                {participantes.map((p) => (
                  <div
                    key={p.id}
                    className="bg-axon-bg border border-axon-border rounded-lg p-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {p.nome}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-400 mt-1">
                          <span>Função: {p.funcao}</span>
                          <span>•</span>
                          {p.confirmado ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={10} /> Confirmado
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              <MailCheck size={10} /> Pendente
                            </span>
                          )}
                          {p.bloqueado && (
                            <span className="text-red-400 flex items-center gap-1">
                              <ShieldAlert size={10} /> Bloqueado (não pode participar)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => removerVinculo(p.id, p.nome)}
                          className="text-gray-400 hover:text-red-400"
                          title="Remover do festival"
                        >
                          <UserMinus size={16} />
                        </button>
                        {p.bloqueado ? (
                          <button
                            onClick={() => desbloquearParticipante(p.id, p.nome)}
                            className="text-gray-400 hover:text-green-400"
                            title="Desbloquear neste festival"
                          >
                            <ShieldOff size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => bloquearParticipante(p.id, p.nome)}
                            className="text-gray-400 hover:text-axon-gold"
                            title="Bloquear neste festival"
                          >
                            <ShieldAlert size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalVincular
        open={modalVincular}
        grupoId={grupo.id}
        onClose={() => setModalVincular(false)}
        onVinculado={() => {
          carregarDados();
          onRefresh();
        }}
        opcoesFuncao={opcoesFuncao}
      />
      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.type === "remover"
            ? "Remover participante"
            : confirmModal.type === "bloquear"
            ? "Bloquear participante"
            : "Desbloquear participante"
        }
        message={
          confirmModal.type === "remover"
            ? `Deseja remover ${confirmModal.participanteNome} deste grupo? O vínculo será apagado, mas o participante continuará na base global.`
            : confirmModal.type === "bloquear"
            ? `Ao bloquear ${confirmModal.participanteNome}, ele não poderá ser inscrito em nenhuma obra/grupo deste festival. Desbloquear só pelo Super Admin.`
            : `Deseja desbloquear ${confirmModal.participanteNome}? Ele poderá participar novamente deste festival.`
        }
        onConfirm={confirmarAcao}
        onCancel={() => setConfirmModal({ open: false, type: "remover" })}
      />
    </>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function InscricoesPage() {
  const [aba, setAba] = useState<"grupos" | "participantes">("grupos");
  const [busca, setBusca] = useState("");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [vinculosMap, setVinculosMap] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [modalGrupoOpen, setModalGrupoOpen] = useState(false);
  const [modalParticipanteOpen, setModalParticipanteOpen] = useState(false);
  const [editandoGrupo, setEditandoGrupo] = useState<Grupo | null>(null);
  const [editandoParticipante, setEditandoParticipante] = useState<Participante | null>(null);
  const [drawerGrupo, setDrawerGrupo] = useState<Grupo | null>(null);
  const [drawerParticipante, setDrawerParticipante] = useState<Participante | null>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [userRole, setUserRole] = useState<string>("admin");
  const [produtoraId, setProdutoraId] = useState<string>("");
  const [termoParticipante, setTermoParticipante] = useState<string | null>(null);
  // REFATORAÇÃO #3 — opcoesFuncao agora vem do banco (tenant_estilos_ativos + estilos)
  const [opcoesFuncao, setOpcoesFuncao] = useState<string[]>([]);


  const mostrarToast = (msg: string, tipo: "ok" | "erro" = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  // REFATORAÇÃO #3 — useEffect principal com busca dinâmica de estilos ativos
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("usuarios")
          .select("role, produtora_id")
          .eq("id", user.id)
          .single();
        if (data) {
          setUserRole(data.role);
          setProdutoraId(data.produtora_id || "");
          if (data.produtora_id) {
            // Vocabulário e funções seguem o tipo de festival da produtora
            const { data: config } = await supabase
              .from("tenant_config")
              .select("perfis_festival:perfil_id ( slug )")
              .eq("produtora_id", data.produtora_id)
              .maybeSingle();
            const rel = (config as { perfis_festival?: { slug?: string } | { slug?: string }[] | null } | null)?.perfis_festival;
            const perfil = perfilPorSlug(Array.isArray(rel) ? rel[0]?.slug : rel?.slug);
            setTermoParticipante(maiuscula(perfil.termos.participante.singular));
            setOpcoesFuncao(perfil.funcoes.map((f) => f.nome));
          } else {
            setTermoParticipante(null);
            setOpcoesFuncao(perfilPorSlug(null).funcoes.map((f) => f.nome));
          }
        }
      }
    };
    fetchUserData();
  }, []);

  // REFATORAÇÃO #1 — carregarDados com query de participantes segura (isolamento por produtora)
  const carregarDados = useCallback(async () => {
    if (!produtoraId) return;
    setCarregando(true);

    // Grupos: segue a lógica existente (próprios + inscritos nos seus eventos)
    let gruposQuery;

    if (userRole !== "super_admin" && produtoraId) {
      const { data: eventos } = await supabase
        .from("eventos")
        .select("id")
        .eq("produtora_id", produtoraId);
      const eventoIds = eventos?.map((e) => e.id) || [];

      let gruposInscritosIds: string[] = [];
      if (eventoIds.length > 0) {
        const { data: inscricoes } = await supabase
          .from("inscricoes_grupo_evento")
          .select("grupo_id")
          .in("evento_id", eventoIds);
        gruposInscritosIds = inscricoes?.map((i) => i.grupo_id) || [];
      }

      if (gruposInscritosIds.length > 0) {
        gruposQuery = supabase
          .from("grupos")
          .select("*")
          .or(
            `origem_produtora_id.eq.${produtoraId},id.in.(${gruposInscritosIds.join(",")})`
          )
          .order("nome");
      } else {
        gruposQuery = supabase
          .from("grupos")
          .select("*")
          .eq("origem_produtora_id", produtoraId)
          .order("nome");
      }
    } else {
      gruposQuery = supabase.from("grupos").select("*").order("nome");
    }

    // REFATORAÇÃO #1 — Query de participantes isolada por produtora:
    // Traz apenas participantes que esta produtora criou OU que estão nos seus grupos.
    const gruposData = await gruposQuery;
    const gruposDaProdutora: string[] = gruposData.data?.map((g) => g.id) ?? [];

    let participantesIdsVinculados: string[] = [];
    if (gruposDaProdutora.length > 0) {
      const { data: vincGrupos } = await supabase
        .from("grupo_participante")
        .select("participante_id")
        .in("grupo_id", gruposDaProdutora);
      participantesIdsVinculados =
        vincGrupos?.map((v) => v.participante_id) ?? [];
    }

    let participantesQuery;
    if (participantesIdsVinculados.length > 0) {
      // Participantes próprios OU vinculados a grupos desta produtora
      participantesQuery = supabase
        .from("participantes")
        .select("*")
        .or(
          `origem_produtora_id.eq.${produtoraId},id.in.(${participantesIdsVinculados.join(",")})`
        )
        .order("nome");
    } else {
      // Sem grupos inscritos: mostra apenas os próprios
      participantesQuery = supabase
        .from("participantes")
        .select("*")
        .eq("origem_produtora_id", produtoraId)
        .order("nome");
    }

    const [participantesRes, vinculosRes] = await Promise.all([
      participantesQuery,
      supabase.from("grupo_participante").select("grupo_id"),
    ]);

    if (gruposData.data) setGrupos(gruposData.data);
    if (participantesRes.data) setParticipantes(participantesRes.data);
    if (vinculosRes.data) {
      const counts: Record<string, number> = {};
      vinculosRes.data.forEach((v) => {
        counts[v.grupo_id] = (counts[v.grupo_id] || 0) + 1;
      });
      setVinculosMap(counts);
    }
    setCarregando(false);
  }, [userRole, produtoraId]);

  useEffect(() => {
    if (produtoraId) carregarDados();
  }, [carregarDados, produtoraId]);

  const gruposFiltrados = grupos.filter(
    (g) =>
      g.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (g.responsavel || "").toLowerCase().includes(busca.toLowerCase())
  );
  const participantesFiltrados = participantes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.nome_artistico || "").toLowerCase().includes(busca.toLowerCase()) ||
      (p.documento || "").includes(busca.replace(/\D/g, ""))
  );

  async function excluirGrupo(id: string) {
    if (userRole !== "super_admin") {
      mostrarToast("Apenas o Super Admin pode excluir grupos.", "erro");
      return;
    }
    if (
      !confirm(
        "Excluir grupo permanentemente? Isso também remove todos os vínculos e históricos."
      )
    )
      return;
    const { error } = await supabase.from("grupos").delete().eq("id", id);
    if (error) mostrarToast(error.message, "erro");
    else {
      mostrarToast("Grupo excluído.");
      carregarDados();
    }
  }

  return (
    <>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Base de Grupos & Participantes
            </h1>
            <p className="text-sm text-gray-500">
              Gerencie grupos e participantes. Vínculos precisam de confirmação por e-mail.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditandoGrupo(null);
                setModalGrupoOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-axon-gold text-black font-bold"
            >
              <Plus size={16} /> Novo Grupo
            </button>
            <button
              onClick={() => {
                setEditandoParticipante(null);
                setModalParticipanteOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-axon-gold text-axon-gold font-bold"
            >
              <UserPlus size={16} /> Novo Participante
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, nome artístico, responsável ou CPF/CNPJ..."
            className="w-full bg-axon-panel border border-axon-border rounded-lg pl-10 pr-3 py-2 text-sm text-white"
          />
        </div>

        <div className="flex border-b border-axon-border">
          <button
            onClick={() => setAba("grupos")}
            className={`px-4 py-2 text-sm font-medium ${
              aba === "grupos"
                ? "border-b-2 border-axon-gold text-axon-gold"
                : "text-gray-400"
            }`}
          >
            Grupos ({grupos.length})
          </button>
          <button
            onClick={() => setAba("participantes")}
            className={`px-4 py-2 text-sm font-medium ${
              aba === "participantes"
                ? "border-b-2 border-axon-gold text-axon-gold"
                : "text-gray-400"
            }`}
          >
            Participantes ({participantes.length})
          </button>
        </div>

        {aba === "grupos" &&
          (carregando ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-axon-gold" size={32} />
            </div>
          ) : gruposFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum grupo encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gruposFiltrados.map((g) => (
                <div
                  key={g.id}
                  className="bg-axon-panel border border-axon-border rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
                >
                  <div className="p-4 cursor-pointer" onClick={() => setDrawerGrupo(g)}>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-white">{g.nome}</h3>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditandoGrupo(g);
                            setModalGrupoOpen(true);
                          }}
                          className="p-1 text-gray-400 hover:text-axon-gold"
                        >
                          <Pencil size={14} />
                        </button>
                        {userRole === "super_admin" && (
                          <button
                            onClick={() => excluirGrupo(g.id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {g.responsavel && (
                      <p className="text-xs text-gray-500 mt-1">{g.responsavel}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {vinculosMap[g.id] || 0} participantes
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatarData(g.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-axon-border px-4 py-2 text-xs text-right">
                    <span className="text-axon-gold">Clique para detalhes</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {aba === "participantes" &&
          (carregando ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-axon-gold" size={32} />
            </div>
          ) : participantesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhum participante encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-axon-border">
                  <tr className="text-left text-gray-400">
                    <th className="pb-2">Nome artístico</th>
                    <th className="pb-2">Nome completo</th>
                    <th className="pb-2">Função</th>
                    <th className="pb-2">CPF</th>
                    <th className="pb-2">E-mail</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {participantesFiltrados.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-axon-border/50 hover:bg-white/5 cursor-pointer"
                      onClick={() => setDrawerParticipante(p)}
                    >
                      <td className="py-3 font-medium text-axon-gold">
                        {p.nome_artistico || "—"}
                      </td>
                      <td className="py-3 text-gray-300 text-xs">{p.nome}</td>
                      <td className="py-3 text-gray-300">{p.funcao || "—"}</td>
                      <td className="py-3 text-gray-300">
                        {mascaraCPF(p.documento || "")}
                      </td>
                      <td className="py-3 text-gray-300">{p.email_contato}</td>
                      <td className="py-3">
                        <div
                          className="flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditandoParticipante(p);
                              setModalParticipanteOpen(true);
                            }}
                            className="text-gray-400 hover:text-axon-gold"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      <ModalGrupo
        open={modalGrupoOpen}
        grupo={editandoGrupo}
        onClose={() => {
          setModalGrupoOpen(false);
          setEditandoGrupo(null);
        }}
        onSaved={() => {
          carregarDados();
          mostrarToast("Grupo salvo.");
          setModalGrupoOpen(false);
        }}
        produtoraId={produtoraId}
      />
      <ModalParticipante
        open={modalParticipanteOpen}
        participante={editandoParticipante}
        onClose={() => {
          setModalParticipanteOpen(false);
          setEditandoParticipante(null);
        }}
        onSaved={() => {
          carregarDados();
          mostrarToast("Participante salvo.");
          setModalParticipanteOpen(false);
        }}
        userRole={userRole}
        produtoraId={produtoraId}
        opcoesFuncao={opcoesFuncao}
        termoParticipante={termoParticipante}
      />
      <DrawerGrupo
        open={!!drawerGrupo}
        grupo={drawerGrupo}
        onClose={() => setDrawerGrupo(null)}
        onRefresh={carregarDados}
        produtoraId={produtoraId}
        opcoesFuncao={opcoesFuncao}
      />
      <DrawerParticipante
        open={!!drawerParticipante}
        participante={drawerParticipante}
        onClose={() => setDrawerParticipante(null)}
      />

      {toast && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            toast.tipo === "ok" ? "bg-axon-gold text-black" : "bg-red-500 text-white"
          }`}
        >
          <CheckCircle2 size={16} />
          {toast.msg}
        </div>
      )}
    </>
  );
}