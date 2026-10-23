"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  FileText,
  Loader2,
  Mail,
  Send,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
  CalendarCheck,
} from "lucide-react";
import { apiUrl } from "@/lib/base-path";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Vinculo {
  id: string;
  confirmado: boolean;
  grupo_id: string;
  participante_id: string;
}

interface Participante {
  id: string;
  nome: string;
  data_nascimento: string;
  email_contato: string | null;
  termo_assinado: boolean;
  responsavel_nome: string | null;
  responsavel_cpf: string | null;
}

interface Grupo {
  id: string;
  nome: string;
  origem_produtora_id: string | null;
}

interface TenantConfig {
  termo_participante: string | null;
  termo_legal_texto: string | null;
}

interface DadosConfirmacao {
  vinculo: Vinculo;
  participante: Participante;
  grupo: Grupo;
  tenantConfig: TenantConfig | null;
  idade: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function aplicarMascaraCPF(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9)
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ConfirmarParticipacaoPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";

  const searchParams = useSearchParams();
  const isResponsavelLink = searchParams.get("responsavel") === "true";

  // ── dados carregados da API
  const [dados, setDados] = useState<DadosConfirmacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // ── loading por ação
  const [updateLoading, setUpdateLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  // ── passo do fluxo: 1 = Confirmação de Presença | 2 = Termo/Assinatura | 3 = Sucesso
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── máquina de estados do menor de idade
  const [mostraFormResponsavel, setMostraFormResponsavel] = useState(false);
  const [mostraOpcaoEmail, setMostraOpcaoEmail] = useState(false);
  const [responsavelJaEnviado, setResponsavelJaEnviado] = useState(false);

  // ── campos: assinatura adulto
  const [nomeAssinatura, setNomeAssinatura] = useState("");

  // ── campos: responsável presente
  const [respNome, setRespNome] = useState("");
  const [respCPF, setRespCPF] = useState("");
  const [respParentesco, setRespParentesco] = useState("");
  const [respAssinatura, setRespAssinatura] = useState("");

  // ── campo: e-mail do responsável (link)
  const [emailResponsavel, setEmailResponsavel] = useState("");

  // ─────────────────────────────────────────────────────────────────────────
  // Carregamento inicial
  // ─────────────────────────────────────────────────────────────────────────
  const carregarDados = useCallback(async () => {
    if (!token) return;
    // (carregando já começa true e só roda uma vez, ao abrir o link)
    try {
      const res = await fetch(apiUrl("/api/confirmar-participacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "carregar_dados" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao carregar os dados.");
        return;
      }

      const dadosCarregados = json as DadosConfirmacao;
      setDados(dadosCarregados);

      const { vinculo, participante } = dadosCarregados;

      if (isResponsavelLink) {
        // Link de responsável: pula direto para o passo de assinatura
        setStep(2);
        setMostraFormResponsavel(true);
      } else {
        // Fluxo normal do participante
        if (vinculo.confirmado && participante.termo_assinado) {
          setStep(3);
        } else if (vinculo.confirmado && !participante.termo_assinado) {
          setStep(2);
        } else {
          setStep(1);
        }
      }
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [token, isResponsavelLink]);

  useEffect(() => {
    void Promise.resolve().then(carregarDados);
  }, [carregarDados]);

  // ─────────────────────────────────────────────────────────────────────────
  // Ação: confirmar presença (Passo 1 → Passo 2)
  // ─────────────────────────────────────────────────────────────────────────
  async function confirmarPresenca() {
    if (!token) return;
    setUpdateLoading(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl("/api/confirmar-participacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "confirmar_presenca" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao confirmar presença.");
        return;
      }
      // Atualiza o estado local do vínculo para refletir a confirmação
      setDados((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vinculo: { ...prev.vinculo, confirmado: true },
        };
      });
      setStep(2);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setUpdateLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ação: assinar termo (adulto) (Passo 2 → Passo 3)
  // ─────────────────────────────────────────────────────────────────────────
  async function assinarAdulto() {
    if (!token || !nomeAssinatura.trim()) return;
    setUpdateLoading(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl("/api/confirmar-participacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "assinar_adulto",
          nome_assinatura: nomeAssinatura.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao registrar assinatura.");
        return;
      }
      setStep(3);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setUpdateLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ação: assinar como responsável presente (Passo 2 → Passo 3)
  // ─────────────────────────────────────────────────────────────────────────
  async function assinarResponsavel() {
    if (!token) return;
    if (
      !respNome.trim() ||
      !respCPF.trim() ||
      !respParentesco.trim() ||
      !respAssinatura.trim()
    ) {
      setErro("Preencha todos os campos do responsável antes de assinar.");
      return;
    }
    setUpdateLoading(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl("/api/confirmar-participacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "assinar_responsavel",
          respNome: respNome.trim(),
          respCPF: respCPF.replace(/\D/g, ""),
          respParentesco: respParentesco.trim(),
          respAssinatura: respAssinatura.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao registrar responsável.");
        return;
      }
      setStep(3);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setUpdateLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ação: enviar link por e-mail ao responsável
  // ─────────────────────────────────────────────────────────────────────────
  async function enviarLinkResponsavel() {
    if (!token || !emailResponsavel.trim()) return;
    setEnviandoEmail(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl("/api/confirmar-participacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "enviar_email_responsavel",
          emailResponsavel: emailResponsavel.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? "Erro ao enviar e-mail.");
        return;
      }
      setResponsavelJaEnviado(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviandoEmail(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper: reset estado do menor
  // ─────────────────────────────────────────────────────────────────────────
  function voltarEscolhaInicial() {
    setMostraFormResponsavel(false);
    setMostraOpcaoEmail(false);
    setResponsavelJaEnviado(false);
    setRespNome("");
    setRespCPF("");
    setRespParentesco("");
    setRespAssinatura("");
    setEmailResponsavel("");
    setErro(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: carregando
  // ─────────────────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="min-h-screen bg-axon-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-axon-gold animate-spin" />
          <p className="text-gray-400 text-sm">Carregando sua confirmação...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: erro fatal (sem dados)
  // ─────────────────────────────────────────────────────────────────────────
  if (erro && !dados) {
    return (
      <div className="min-h-screen bg-axon-bg flex items-center justify-center p-4">
        <div className="bg-axon-panel border border-axon-border rounded-2xl p-8 max-w-md w-full flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400" />
          <h1 className="text-zinc-100 text-xl font-semibold">Link inválido</h1>
          <p className="text-gray-400 text-sm">{erro}</p>
        </div>
      </div>
    );
  }

  if (!dados) return null;

  const { participante, grupo, tenantConfig, idade } = dados;

  // ─────────────────────────────────────────────────────────────────────────
  // Render: Passo 3 — Sucesso final
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen bg-axon-bg flex items-center justify-center p-4">
        <div className="bg-axon-panel border border-axon-border rounded-2xl p-8 max-w-md w-full flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-400" />
          <h1 className="text-zinc-100 text-2xl font-bold">
            Participação confirmada!
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            O termo de{" "}
            <span className="text-zinc-100 font-medium">{participante.nome}</span>{" "}
            foi registrado com sucesso. Nos vemos no{" "}
            <span className="text-zinc-100 font-medium">{grupo.nome}</span>!
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render: layout principal (Passos 1 e 2)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-axon-bg py-10 px-4">
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        {/* ── Cabeçalho */}
        <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-axon-gold mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">
              Arxum Fest
            </span>
          </div>
          <h1 className="text-zinc-100 text-xl font-bold leading-snug">
            {isResponsavelLink
              ? "Autorização de Responsável Legal"
              : "Confirmação de Participação"}
          </h1>
          <p className="text-gray-400 text-sm">
            Grupo:{" "}
            <span className="text-zinc-100 font-medium">{grupo.nome}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Participante:{" "}
            <span className="text-zinc-100 font-medium">{participante.nome}</span>
          </p>

          {/* Indicador de Passo (apenas fluxo normal) */}
          {!isResponsavelLink && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-axon-border">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  step >= 1 ? "text-axon-gold" : "text-gray-600"
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                Participação
              </div>
              <div className="flex-1 h-px bg-axon-border" />
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  step >= 2 ? "text-axon-gold" : "text-gray-600"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Termo
              </div>
              <div className="flex-1 h-px bg-axon-border" />
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  step >= 3 ? "text-axon-gold" : "text-gray-600"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </div>
            </div>
          )}
        </div>

        {/* ── Banner de erro inline */}
        {erro && (
          <div className="bg-red-950/50 border border-red-800/60 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{erro}</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PASSO 1: CONFIRMAÇÃO DE PRESENÇA
        ════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-axon-gold">
              <CalendarCheck className="w-5 h-5" />
              <span className="text-sm font-semibold">Confirmar participação</span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              Olá,{" "}
              <span className="text-zinc-100 font-medium">{participante.nome}</span>!
              Antes de assinar o termo de participação, confirme que você faz parte de{" "}
              <span className="text-zinc-100 font-medium">{grupo.nome}</span>.
            </p>

            <button
              onClick={confirmarPresenca}
              disabled={updateLoading || enviandoEmail}
              className="flex items-center justify-center gap-2 bg-axon-gold text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {updateLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck className="w-4 h-4" />
              )}
              {updateLoading ? "Confirmando..." : "Confirmar minha participação"}
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            PASSO 2: TERMO E ASSINATURA
        ════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            {/* ── Texto do Termo */}
            <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-axon-gold">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-semibold">Termo de Participação</span>
              </div>
              {tenantConfig?.termo_legal_texto ? (
                <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto pr-1">
                  {tenantConfig.termo_legal_texto}
                </div>
              ) : (
                <p className="text-gray-400 text-sm leading-relaxed">
                  Ao assinar, você confirma sua participação e concorda com os
                  termos e condições do{" "}
                  <span className="text-zinc-100">{grupo.nome}</span>.
                </p>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════
                FLUXO: MAIOR DE IDADE (>= 18)
            ════════════════════════════════════════════════════════ */}
            {idade >= 18 && (
              <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="nomeAssinatura"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    Digite seu nome completo para assinar
                  </label>
                  <input
                    id="nomeAssinatura"
                    type="text"
                    value={nomeAssinatura}
                    onChange={(e) => setNomeAssinatura(e.target.value)}
                    disabled={updateLoading || enviandoEmail}
                    placeholder={participante.nome}
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-gray-400 text-xs">
                    A assinatura deve ser idêntica ao nome completo cadastrado.
                  </p>
                </div>

                <button
                  onClick={assinarAdulto}
                  disabled={
                    updateLoading || enviandoEmail || !nomeAssinatura.trim()
                  }
                  className="flex items-center justify-center gap-2 bg-axon-gold text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {updateLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  {updateLoading
                    ? "Registrando assinatura..."
                    : "Assinar e confirmar participação"}
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════
                FLUXO: MENOR DE IDADE (< 18)
            ════════════════════════════════════════════════════════ */}

            {/* Caso 1: Escolha Inicial */}
            {idade < 18 &&
              !mostraFormResponsavel &&
              !mostraOpcaoEmail &&
              !responsavelJaEnviado && (
                <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-axon-gold shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <h2 className="text-zinc-100 text-base font-semibold">
                        Participante menor de idade
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Como{" "}
                        <span className="text-zinc-100">{participante.nome}</span>{" "}
                        tem menos de 18 anos, é necessária a autorização de um
                        responsável legal para confirmar a participação no{" "}
                        <span className="text-zinc-100">{grupo.nome}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    <button
                      onClick={() => {
                        setErro(null);
                        setMostraFormResponsavel(true);
                      }}
                      disabled={updateLoading || enviandoEmail}
                      className="flex items-center gap-3 bg-axon-bg border border-axon-border rounded-xl px-5 py-4 text-left transition-colors hover:border-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-5 h-5 text-axon-gold shrink-0" />
                      <div>
                        <p className="text-zinc-100 text-sm font-medium">
                          Meu responsável está comigo agora
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Preencha os dados e colete a assinatura presencialmente.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setErro(null);
                        setMostraOpcaoEmail(true);
                      }}
                      disabled={updateLoading || enviandoEmail}
                      className="flex items-center gap-3 bg-axon-bg border border-axon-border rounded-xl px-5 py-4 text-left transition-colors hover:border-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail className="w-5 h-5 text-axon-gold shrink-0" />
                      <div>
                        <p className="text-zinc-100 text-sm font-medium">
                          Enviar link de assinatura para o e-mail do meu
                          responsável
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          Informe o e-mail e enviaremos o link de autorização.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

            {/* Caso 2: Formulário Presencial do Responsável */}
            {idade < 18 && mostraFormResponsavel && (
              <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 text-axon-gold">
                  <UserPlus className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Dados do Responsável Legal
                  </span>
                </div>

                {/* Nome do Responsável */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="respNome"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    Nome completo do responsável
                  </label>
                  <input
                    id="respNome"
                    type="text"
                    value={respNome}
                    onChange={(e) => setRespNome(e.target.value)}
                    disabled={updateLoading || enviandoEmail}
                    placeholder="Nome completo"
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* CPF do Responsável */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="respCPF"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    CPF do responsável
                  </label>
                  <input
                    id="respCPF"
                    type="text"
                    inputMode="numeric"
                    value={respCPF}
                    onChange={(e) =>
                      setRespCPF(aplicarMascaraCPF(e.target.value))
                    }
                    maxLength={14}
                    disabled={updateLoading || enviandoEmail}
                    placeholder="000.000.000-00"
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Grau de Parentesco */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="respParentesco"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    Grau de parentesco
                  </label>
                  <input
                    id="respParentesco"
                    type="text"
                    value={respParentesco}
                    onChange={(e) => setRespParentesco(e.target.value)}
                    disabled={updateLoading || enviandoEmail}
                    placeholder="Ex: Mãe, Pai, Avó, Tutor(a)..."
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Assinatura do Responsável */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="respAssinatura"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    Assinatura do responsável
                  </label>
                  <input
                    id="respAssinatura"
                    type="text"
                    value={respAssinatura}
                    onChange={(e) => setRespAssinatura(e.target.value)}
                    disabled={updateLoading || enviandoEmail}
                    placeholder="Digite o nome completo do responsável para assinar"
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="text-gray-400 text-xs">
                    A assinatura deve ser idêntica ao nome completo do
                    responsável informado acima.
                  </p>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-3 pt-1">
                  <button
                    onClick={assinarResponsavel}
                    disabled={
                      updateLoading ||
                      enviandoEmail ||
                      !respNome.trim() ||
                      !respCPF.trim() ||
                      !respParentesco.trim() ||
                      !respAssinatura.trim()
                    }
                    className="flex items-center justify-center gap-2 bg-axon-gold text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {updateLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {updateLoading
                      ? "Registrando..."
                      : "Confirmar com assinatura do responsável"}
                  </button>

                  {/* Botão Voltar: oculto quando é link de responsável */}
                  {!isResponsavelLink && (
                    <button
                      onClick={voltarEscolhaInicial}
                      disabled={updateLoading || enviandoEmail}
                      className="flex items-center justify-center gap-2 text-gray-400 text-sm hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Voltar à escolha anterior
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Caso 3: Formulário de E-mail (antes do envio) */}
            {idade < 18 && mostraOpcaoEmail && !responsavelJaEnviado && (
              <div className="bg-axon-panel border border-axon-border rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-2 text-axon-gold">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Enviar link para o responsável
                  </span>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Informe o e-mail do responsável de{" "}
                  <span className="text-zinc-100">{participante.nome}</span>.
                  Enviaremos um link para que ele(a) possa autorizar a
                  participação digitalmente.
                </p>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="emailResponsavel"
                    className="text-zinc-100 text-sm font-medium"
                  >
                    E-mail do responsável
                  </label>
                  <input
                    id="emailResponsavel"
                    type="email"
                    inputMode="email"
                    value={emailResponsavel}
                    onChange={(e) => setEmailResponsavel(e.target.value)}
                    disabled={updateLoading || enviandoEmail}
                    placeholder="responsavel@exemplo.com"
                    className="bg-axon-bg border border-axon-border rounded-lg px-4 py-2.5 text-zinc-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-axon-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <button
                    onClick={enviarLinkResponsavel}
                    disabled={
                      updateLoading ||
                      enviandoEmail ||
                      !emailResponsavel.trim() ||
                      !emailResponsavel.includes("@")
                    }
                    className="flex items-center justify-center gap-2 bg-axon-gold text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {enviandoEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {enviandoEmail
                      ? "Enviando e-mail..."
                      : "Enviar link de autorização"}
                  </button>

                  <button
                    onClick={voltarEscolhaInicial}
                    disabled={updateLoading || enviandoEmail}
                    className="flex items-center justify-center gap-2 text-gray-400 text-sm hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar à escolha anterior
                  </button>
                </div>
              </div>
            )}

            {/* Caso 4: Feedback de E-mail Enviado */}
            {idade < 18 && responsavelJaEnviado && (
              <div className="bg-axon-panel border border-axon-border rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="w-14 h-14 text-green-400" />
                <h2 className="text-zinc-100 text-lg font-bold leading-snug">
                  E-mail de autorização enviado ao seu responsável!
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                  Enviamos o link de autorização para{" "}
                  <span className="text-zinc-100 font-medium">
                    {emailResponsavel}
                  </span>
                  . Assim que seu responsável aceitar, sua participação em{" "}
                  <span className="text-zinc-100 font-medium">{grupo.nome}</span>{" "}
                  estará confirmada.
                </p>
                <p className="text-gray-400 text-xs">
                  Aguarde o aceite do responsável. Você pode fechar esta página.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}