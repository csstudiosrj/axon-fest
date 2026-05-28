"use client";

import type { CSSProperties } from "react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EventoInscricao {
  id: string;
  nome: string;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  tema_escuro: boolean;
  logo_url: string | null;
  status: string;
}

interface GrupoEncontrado {
  id: string;
  nome: string;
  email: string | null;
  documento: string;
}

interface InscricaoFormProps {
  eventoId: string;
  evento: EventoInscricao;
}

type Etapa = "identificacao" | "login" | "cadastro" | "aguardando_confirmacao";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatDocumento(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => {
      if (!b) return `(${a}`;
      if (!c) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    });
  }
  return digits.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_, a, b, c) => {
    if (!b) return `(${a}`;
    if (!c) return `(${a}) ${b}`;
    return `(${a}) ${b}-${c}`;
  });
}

function maskEmail(email: string | null) {
  if (!email) return "e-mail não informado";
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const head = name.slice(0, 2);
  return `${head}${"*".repeat(Math.max(name.length - 2, 3))}@${domain}`;
}

function StepSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="space-y-4">
      <div className="animate-pulse rounded-xl border border-axon-border bg-axon-panel p-5">
        <div className="mb-4 h-5 w-40 rounded-lg bg-axon-bg/60" />
        <div className="h-11 rounded-xl bg-axon-bg/60" />
      </div>
      <div className="animate-pulse rounded-xl border border-axon-border bg-axon-panel p-5">
        <div className="mb-3 h-4 w-28 rounded-lg bg-axon-bg/60" />
        <div className="mb-3 h-11 rounded-xl bg-axon-bg/60" />
        <div className="h-11 rounded-xl bg-axon-bg/60" />
      </div>
    </div>
  );
}

function StepBadge({ active, done, accent, label, isDark }: { active: boolean; done: boolean; accent: string; label: string; isDark: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
        style={active || done
          ? { background: accent, color: "rgba(255,255,255,1)" }
          : { background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}
      >
        {done ? <CheckCircle2 size={12} /> : null}
        {!done ? label : null}
      </div>
    </div>
  );
}

export default function InscricaoForm({ eventoId, evento }: InscricaoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [etapa, setEtapa] = useState<Etapa>("identificacao");
  const [documento, setDocumento] = useState("");
  const [grupoEncontrado, setGrupoEncontrado] = useState<GrupoEncontrado | null>(null);
  const [erroIdentificacao, setErroIdentificacao] = useState("");
  const [erroLogin, setErroLogin] = useState("");
  const [erroCadastro, setErroCadastro] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [emailAguardando, setEmailAguardando] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);

  const [nomeGrupo, setNomeGrupo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [email, setEmail] = useState("");
  const [emailContato, setEmailContato] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhaCadastro, setMostrarSenhaCadastro] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const accent = evento.cor_primaria || "var(--accent-fallback)";
  const isDark = evento.tema_escuro;

  const panelClass = isDark ? "bg-axon-panel" : "bg-white";
  const mutedPanelClass = isDark ? "bg-axon-bg" : "bg-white";
  const borderClass = "border-axon-border";
  const headingClass = isDark ? "text-white" : "text-black";
  const textClass = isDark ? "text-gray-400" : "text-gray-600";
  const faintClass = isDark ? "text-gray-500" : "text-gray-500";

  const docDigits = useMemo(() => onlyDigits(documento), [documento]);
  const tipoDocumento = docDigits.length > 11 ? "CNPJ" : "CPF";

  const inputBase = `w-full rounded-xl border ${borderClass} ${mutedPanelClass} px-4 py-3 text-sm ${headingClass} placeholder:text-gray-500 focus:outline-none`;
  const iconClass = faintClass;

  const handleBuscarDocumento = useCallback(async () => {
    const doc = onlyDigits(documento);
    if (doc.length !== 11 && doc.length !== 14) {
      setErroIdentificacao("Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.");
      return;
    }

    setErroIdentificacao("");
    setBuscando(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("grupos")
        .select("id, nome, email, documento")
        .eq("documento", doc)
        .maybeSingle();

      if (error) {
        setErroIdentificacao("Não foi possível verificar o documento agora. Tente novamente.");
        return;
      }

      if (data) {
        setGrupoEncontrado(data as GrupoEncontrado);
        setLoginEmail(data.email || "");
        setEtapa("login");
        return;
      }

      setGrupoEncontrado(null);
      setEtapa("cadastro");
    } catch {
      setErroIdentificacao("Erro inesperado ao verificar documento.");
    } finally {
      setBuscando(false);
    }
  }, [documento]);

  const handleLogin = useCallback(() => {
    setErroLogin("");
    if (!loginEmail || !loginSenha) {
      setErroLogin("Preencha e-mail e senha.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginSenha,
        });

        if (signInError) {
          setErroLogin("E-mail ou senha inválidos.");
          return;
        }

        const { data: authUser, error: authUserError } = await supabase.auth.getUser();
        if (authUserError || !authUser.user) {
          setErroLogin("Não foi possível validar sua sessão.");
          return;
        }

        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("role, organizacao_id")
          .eq("id", authUser.user.id)
          .single();

        if (usuarioError || !usuario) {
          setErroLogin("Não foi possível validar o vínculo da sua conta.");
          return;
        }

        if (!["org_admin", "org_membro"].includes(usuario.role)) {
          setErroLogin("Sua conta não possui permissão para continuar esta inscrição.");
          return;
        }

        if (!usuario.organizacao_id) {
          setErroLogin("Sua conta não está vinculada a nenhum grupo.");
          return;
        }

        const { error: inscricaoError } = await supabase
          .from("inscricoes_grupo_evento")
          .upsert(
            { grupo_id: usuario.organizacao_id, evento_id: eventoId, status: "ativo", origem: "landing" },
            { onConflict: "grupo_id,evento_id" }
          );

        if (inscricaoError) {
          setErroLogin("Seu login foi realizado, mas não foi possível registrar a inscrição.");
          return;
        }

        router.push("/grupo/dashboard");
      } catch {
        setErroLogin("Erro inesperado ao entrar. Tente novamente.");
      }
    });
  }, [eventoId, loginEmail, loginSenha, router]);

  const handleCadastro = useCallback(() => {
    setErroCadastro("");

    if (!nomeGrupo || !responsavel || !email || !telefone || !cidade || !estado || !senha || !confirmarSenha) {
      setErroCadastro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senha.length < 6) {
      setErroCadastro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErroCadastro("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const documentoLimpo = onlyDigits(documento);

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: {
              nome: responsavel,
            },
          },
        });

        if (authError || !authData.user) {
          setErroCadastro(authError?.message || "Não foi possível criar sua conta agora.");
          return;
        }

        if (authData.user && !authData.session) {
          setEmailAguardando(email);
          setEtapa("aguardando_confirmacao");
          return;
        }

        const { data: grupo, error: grupoError } = await supabase
          .from("grupos")
          .insert({
            nome: nomeGrupo,
            documento: documentoLimpo,
            tipo_documento: tipoDocumento,
            email,
            email_contato: emailContato || null,
            responsavel,
            telefone: onlyDigits(telefone),
            cidade,
            estado,
          })
          .select("id")
          .single();

        if (grupoError || !grupo) {
          setErroCadastro("Sua conta foi criada, mas não foi possível salvar o grupo.");
          return;
        }

        const { error: usuarioError } = await supabase.from("usuarios").insert({
          id: authData.user.id,
          email,
          nome: responsavel,
          role: "org_admin",
          organizacao_id: grupo.id,
        });

        if (usuarioError) {
          setErroCadastro("Sua conta foi criada, mas não foi possível vincular o usuário ao grupo.");
          return;
        }

        const { error: inscricaoError } = await supabase.from("inscricoes_grupo_evento").insert({
          grupo_id: grupo.id,
          evento_id: eventoId,
          status: "ativo",
          origem: "landing",
        });

        if (inscricaoError) {
          setErroCadastro("Cadastro concluído, mas houve um erro ao registrar a inscrição.");
          return;
        }

        router.push("/grupo/dashboard");
      } catch {
        setErroCadastro("Erro inesperado ao criar cadastro. Tente novamente.");
      }
    });
  }, [cidade, confirmarSenha, documento, email, emailContato, eventoId, nomeGrupo, responsavel, router, senha, estado, telefone, tipoDocumento]);

  return (
    <div className={`overflow-hidden rounded-3xl border ${borderClass} ${panelClass}`} style={{ "--accent-fallback": "var(--bg-axon-gold)" } as CSSProperties}>
      <div className="h-1.5 w-full" style={{ background: accent }} />

      <div className="border-b border-axon-border px-6 py-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <StepBadge active={etapa === "identificacao"} done={etapa !== "identificacao"} accent={accent} label="1" isDark={isDark} />
            <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${etapa === "identificacao" ? headingClass : textClass}`}>Identificação</span>
          </div>
          <ChevronRight size={13} className={faintClass} />
          {etapa === "login" && (
            <>
              <div className="flex items-center gap-2">
                <StepBadge active done={false} accent={accent} label="2" isDark={isDark} />
                <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${headingClass}`}>Login</span>
              </div>
            </>
          )}
          {etapa === "cadastro" && (
            <>
              <div className="flex items-center gap-2">
                <StepBadge active done={false} accent={accent} label="2" isDark={isDark} />
                <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${headingClass}`}>Cadastro</span>
              </div>
            </>
          )}
        </div>
        <h2 className={`text-xl font-bold ${headingClass}`}>{evento.nome}</h2>
        <p className={`mt-1 text-sm ${textClass}`}>Siga as etapas para confirmar sua inscrição no festival.</p>
      </div>

      <div className="px-6 py-6 sm:px-7 sm:py-7">
        {(buscando || isPending) && <StepSkeleton isDark={isDark} />}

        {!buscando && !isPending && etapa === "identificacao" && (
          <div className="space-y-5">
            <div>
              <h3 className={`text-lg font-bold ${headingClass}`}>Identificação</h3>
              <p className={`mt-1 text-sm ${textClass}`}>Digite o CPF ou CNPJ para localizar um cadastro existente ou criar um novo.</p>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>CNPJ ou CPF</label>
              <div className="relative">
                <Building2 size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                <input
                  type="text"
                  inputMode="numeric"
                  value={documento}
                  onChange={(e) => {
                    setErroIdentificacao("");
                    setDocumento(formatDocumento(e.target.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleBuscarDocumento();
                  }}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className={`${inputBase} pl-10`}
                  style={{ borderColor: docDigits ? `${accent}30` : undefined }}
                />
              </div>
              {erroIdentificacao && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle size={12} />
                  {erroIdentificacao}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleBuscarDocumento}
              disabled={docDigits.length !== 11 && docDigits.length !== 14}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: accent }}
            >
              <ArrowRight size={16} />
              Continuar
            </button>
          </div>
        )}

        {!buscando && !isPending && etapa === "login" && grupoEncontrado && (
          <div className="space-y-5">
            <div>
              <h3 className={`text-lg font-bold ${headingClass}`}>Encontramos seu cadastro!</h3>
              <p className={`mt-1 text-sm ${textClass}`}>Faça login para continuar.</p>
            </div>

            <div className="rounded-2xl border border-axon-border bg-axon-gold-dim p-4" style={{ borderColor: `${accent}30` }}>
              <p className={`text-sm font-semibold ${headingClass}`}>
                {grupoEncontrado.nome} — {maskEmail(grupoEncontrado.email)}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>E-mail</label>
                <div className="relative">
                  <Mail size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setErroLogin("");
                      setLoginEmail(e.target.value);
                    }}
                    placeholder="email@exemplo.com"
                    className={`${inputBase} pl-10`}
                    style={{ borderColor: loginEmail ? `${accent}30` : undefined }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Senha</label>
                <div className="relative">
                  <Lock size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input
                    type={mostrarSenhaLogin ? "text" : "password"}
                    value={loginSenha}
                    onChange={(e) => {
                      setErroLogin("");
                      setLoginSenha(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLogin();
                    }}
                    placeholder="Sua senha"
                    className={`${inputBase} pl-10 pr-11`}
                    style={{ borderColor: loginSenha ? `${accent}30` : undefined }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenhaLogin((prev) => !prev)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${faintClass}`}
                    aria-label={mostrarSenhaLogin ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenhaLogin ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {erroLogin && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} />
                {erroLogin}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                style={{ background: accent }}
              >
                <CheckCircle2 size={16} />
                Entrar e continuar inscrição
              </button>
              <button
                type="button"
                onClick={() => {
                  setErroLogin("");
                  setEtapa("identificacao");
                }}
                className={`inline-flex items-center justify-center rounded-xl border ${borderClass} px-4 py-3 text-sm font-medium ${textClass}`}
              >
                Voltar
              </button>
            </div>
          </div>
        )}

        {!buscando && !isPending && etapa === "aguardando_confirmacao" && (
          <div className="space-y-6 py-2">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${accent}18`, border: `1px solid ${accent}30`, color: accent }}
            >
              <Mail size={24} />
            </div>
            <div className="space-y-2">
              <h3 className={`text-lg font-bold ${headingClass}`}>Verifique seu e-mail</h3>
              <p className={`text-sm leading-relaxed ${textClass}`}>
                Enviamos um link de confirmação para{" "}
                <span className={`font-semibold ${headingClass}`}>{emailAguardando}</span>.
                Clique no link para ativar sua conta e continuar a inscrição.
              </p>
              <p className={`text-sm leading-relaxed ${textClass}`}>
                Após confirmar, volte para esta página e faça login com seu e-mail e senha.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEtapa("identificacao");
                setEmailAguardando("");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
              style={{ background: accent }}
            >
              <CheckCircle2 size={16} />
              Já confirmei meu e-mail
            </button>
          </div>
        )}

        {!buscando && !isPending && etapa === "cadastro" && (
          <div className="space-y-5">
            <div>
              <h3 className={`text-lg font-bold ${headingClass}`}>Vamos criar seu cadastro</h3>
              <p className={`mt-1 text-sm ${textClass}`}>Preencha os dados do grupo para continuar a inscrição.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>{tipoDocumento}</label>
                <div className="relative">
                  <Building2 size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="text" readOnly value={documento} className={`${inputBase} pl-10 opacity-70`} style={{ borderColor: `${accent}24` }} />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Nome do grupo</label>
                <div className="relative">
                  <Building2 size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="text" value={nomeGrupo} onChange={(e) => { setErroCadastro(""); setNomeGrupo(e.target.value); }} className={`${inputBase} pl-10`} style={{ borderColor: nomeGrupo ? `${accent}30` : undefined }} />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Responsável</label>
                <div className="relative">
                  <User size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="text" value={responsavel} onChange={(e) => { setErroCadastro(""); setResponsavel(e.target.value); }} className={`${inputBase} pl-10`} style={{ borderColor: responsavel ? `${accent}30` : undefined }} />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>E-mail</label>
                <div className="relative">
                  <Mail size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="email" value={email} onChange={(e) => { setErroCadastro(""); setEmail(e.target.value); }} className={`${inputBase} pl-10`} style={{ borderColor: email ? `${accent}30` : undefined }} />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>E-mail de contato alternativo</label>
                <div className="relative">
                  <Mail size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="email" value={emailContato} onChange={(e) => setEmailContato(e.target.value)} className={`${inputBase} pl-10`} />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Telefone</label>
                <div className="relative">
                  <Phone size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="text" inputMode="numeric" value={telefone} onChange={(e) => { setErroCadastro(""); setTelefone(formatPhone(e.target.value)); }} className={`${inputBase} pl-10`} style={{ borderColor: telefone ? `${accent}30` : undefined }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Cidade</label>
                <div className="relative">
                  <MapPin size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type="text" value={cidade} onChange={(e) => { setErroCadastro(""); setCidade(e.target.value); }} className={`${inputBase} pl-10`} style={{ borderColor: cidade ? `${accent}30` : undefined }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Estado</label>
                <select value={estado} onChange={(e) => { setErroCadastro(""); setEstado(e.target.value); }} className={inputBase} style={{ borderColor: estado ? `${accent}30` : undefined }}>
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Senha</label>
                <div className="relative">
                  <Lock size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type={mostrarSenhaCadastro ? "text" : "password"} value={senha} onChange={(e) => { setErroCadastro(""); setSenha(e.target.value); }} className={`${inputBase} pl-10 pr-11`} style={{ borderColor: senha ? `${accent}30` : undefined }} />
                  <button type="button" onClick={() => setMostrarSenhaCadastro((prev) => !prev)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${faintClass}`} aria-label={mostrarSenhaCadastro ? "Ocultar senha" : "Mostrar senha"}>
                    {mostrarSenhaCadastro ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className={`text-xs font-semibold uppercase tracking-[0.16em] ${textClass}`}>Confirmar senha</label>
                <div className="relative">
                  <Lock size={15} className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${iconClass}`} />
                  <input type={mostrarConfirmarSenha ? "text" : "password"} value={confirmarSenha} onChange={(e) => { setErroCadastro(""); setConfirmarSenha(e.target.value); }} className={`${inputBase} pl-10 pr-11`} style={{ borderColor: confirmarSenha ? `${accent}30` : undefined }} />
                  <button type="button" onClick={() => setMostrarConfirmarSenha((prev) => !prev)} className={`absolute right-3.5 top-1/2 -translate-y-1/2 ${faintClass}`} aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}>
                    {mostrarConfirmarSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {erroCadastro && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} />
                {erroCadastro}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCadastro}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"
                style={{ background: accent }}
              >
                <CheckCircle2 size={16} />
                Criar cadastro e continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  setErroCadastro("");
                  setEtapa("identificacao");
                }}
                className={`inline-flex items-center justify-center rounded-xl border ${borderClass} px-4 py-3 text-sm font-medium ${textClass}`}
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}