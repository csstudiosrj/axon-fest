"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UploadButton } from "@/utils/uploadthing";
import { BASE_PATH, apiUrl } from "@/lib/base-path";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Info,
  Pencil,
  Trash2,
  Mail,
  ShieldCheck,
  Phone,
  ImageIcon,
} from "lucide-react";

interface Terminologia {
  grupo: string;
  participante: string;
  apresentacao: string;
  organizacao: string;
}

interface Jurado {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  foto_url?: string | null;
  mini_bio?: string | null;
}

interface UsuarioExistente {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  role?: string | null;
  produtora_id?: string | null;
  foto_url?: string | null;
  mini_bio?: string | null;
}

function mascaraTelefone(valor: string) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (!n) return "";
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}

function mascararNome(nome: string | null | undefined): string {
  if (!nome || !nome.trim()) return "Convidado (Pendente)";
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((parte) => {
      const letras = Array.from(parte);
      if (letras.length <= 1) return `${parte[0] ?? "*"}***`;
      return `${letras[0]}***`;
    })
    .join(" ");
}

function Dica({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-axon-gold/15 bg-axon-gold/5 px-4 py-3">
      <Info size={14} className="mt-0.5 shrink-0 text-axon-gold" />
      <p className="text-xs leading-relaxed text-gray-400">{children}</p>
    </div>
  );
}

interface ModalJuradoProps {
  termo: Terminologia;
  produtoraId: string;
  jurado?: Jurado | null;
  onClose: () => void;
  onSaved: () => void;
}

function ModalJurado({ termo, produtoraId, jurado, onClose, onSaved }: ModalJuradoProps) {
  const editando = !!jurado;

  const [nome, setNome] = useState(jurado?.nome ?? "");
  const [email, setEmail] = useState(jurado?.email ?? "");
  const [telefone, setTelefone] = useState(jurado?.telefone ? mascaraTelefone(jurado.telefone) : "");
  const [fotoUrl, setFotoUrl] = useState<string | null>(jurado?.foto_url ?? null);
  const [miniBio, setMiniBio] = useState(jurado?.mini_bio ?? "");
  const [salvando, setSalvando] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"formulario" | "confirmacao">("formulario");
  const [copiado, setCopiado] = useState(false);
  const [verificandoEmail, setVerificandoEmail] = useState(false);
  const [usuarioExistente, setUsuarioExistente] = useState<UsuarioExistente | null>(null);
  const emailCheckRef = useRef(0);

  const colisaoEmailOutroUsuario = !!usuarioExistente && usuarioExistente.id !== jurado?.id;
  const colisaoOutroRole = colisaoEmailOutroUsuario && usuarioExistente?.role !== "jurado";
  const colisaoOutroCadastroJurado = colisaoEmailOutroUsuario && usuarioExistente?.role === "jurado";
  const usuarioSemProdutora = !!usuarioExistente && !usuarioExistente.produtora_id;
  const camposPrivadosBloqueados =
    (colisaoOutroRole || colisaoOutroCadastroJurado) && !usuarioSemProdutora;
  const nomeExibidoContaExistente = usuarioExistente ? mascararNome(usuarioExistente.nome) : "";

  useEffect(() => {
    setNome(jurado?.nome ?? "");
    setEmail(jurado?.email ?? "");
    setTelefone(jurado?.telefone ? mascaraTelefone(jurado.telefone) : "");
    setFotoUrl(jurado?.foto_url ?? null);
    setMiniBio(jurado?.mini_bio ?? "");
    setErro(null);
    setEtapa("formulario");
    setCopiado(false);
    setUsuarioExistente(null);
    setVerificandoEmail(false);
    setUploadingFoto(false);
  }, [jurado]);

  useEffect(() => {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !produtoraId) {
      setUsuarioExistente(null);
      setVerificandoEmail(false);
      return;
    }

    if (editando && jurado?.email?.trim().toLowerCase() === emailNormalizado) {
      setUsuarioExistente(null);
      setVerificandoEmail(false);
      return;
    }

    const currentRequest = ++emailCheckRef.current;
    setVerificandoEmail(true);

    const timer = window.setTimeout(async () => {
      // Verificação feita no servidor: não expõe dados de contas de outras produtoras
      const res = await fetch(apiUrl("/api/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verificar_email", email: emailNormalizado }),
      }).catch(() => null);
      const data = res?.ok
        ? ((await res.json()) as {
            existe: boolean;
            id?: string | null;
            role?: string;
            nome_mascarado?: string;
            mesma_produtora?: boolean;
            sem_produtora?: boolean;
          })
        : null;

      if (currentRequest !== emailCheckRef.current) return;

      const existente: UsuarioExistente | null = data?.existe
        ? {
            id: data.id ?? "",
            nome: data.nome_mascarado ?? null,
            email: emailNormalizado,
            telefone: null,
            role: data.role ?? null,
            produtora_id: data.sem_produtora ? null : data.mesma_produtora ? produtoraId : "outra",
          }
        : null;
      setUsuarioExistente(existente);
      setVerificandoEmail(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [email, editando, jurado?.email, produtoraId]);

  async function salvar() {
    const supabase = createClient();
    setErro(null);

    if (!produtoraId) {
      setErro("Não foi possível identificar a produtora responsável por este cadastro.");
      return;
    }

    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }

    if (!email.trim()) {
      setErro("E-mail é obrigatório para enviar o convite.");
      return;
    }

    if (miniBio.length > 160) {
      setErro("A mini biografia deve ter no máximo 160 caracteres.");
      return;
    }

    if (camposPrivadosBloqueados) {
      if (colisaoOutroRole) {
        setErro(
          "Este e-mail já pertence a outra conta com perfil diferente. Para proteger os dados, use outro e-mail."
        );
      } else {
        setErro(
          "Já existe um jurado com este e-mail vinculado a outra produtora. Use o cadastro existente."
        );
      }
      return;
    }

    setSalvando(true);

    if (editando && jurado) {
      const payloadAtualizacao: {
        nome: string;
        email: string;
        telefone: string | null;
        foto_url: string | null;
        mini_bio: string | null;
      } = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.replace(/\D/g, "") || null,
        foto_url: fotoUrl,
        mini_bio: miniBio.trim() || null,
      };

      const { error } = await supabase
        .from("usuarios")
        .update(payloadAtualizacao)
        .eq("id", jurado.id)
        .eq("produtora_id", produtoraId)
        .eq("role", "jurado");

      if (error) {
        setErro("Erro ao atualizar o cadastro do jurado.");
        setSalvando(false);
        return;
      }

      setSalvando(false);
      onSaved();
      onClose();
      return;
    }

    // Convite (ou revínculo de jurado sem produtora) feito no servidor,
    // que valida cargo e produtora de quem chama
    const res = await fetch(apiUrl("/api/invite"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invite",
        email: email.trim().toLowerCase(),
        nome: nome.trim(),
        telefone: telefone.replace(/\D/g, "") || null,
        role: "jurado",
        foto_url: fotoUrl,
        mini_bio: miniBio.trim() || null,
      }),
    });

    const json = (await res.json()) as { error?: string };

    if (!res.ok) {
      setErro(json.error || "Erro ao enviar convite.");
      setSalvando(false);
      return;
    }


    setSalvando(false);
    setEtapa("confirmacao");
    onSaved();
  }

  function copiarLink() {
    navigator.clipboard.writeText(`${window.location.origin}${BASE_PATH}/login`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  function abrirWhatsApp() {
    const numeroLimpo = telefone.replace(/\D/g, "");
    const link = `${window.location.origin}${BASE_PATH}/login`;
    const msg = encodeURIComponent(
      `Olá, ${nome.trim()}! Você foi convidado para ser jurado em ${termo.organizacao}.\n\nAcesse o link para criar sua senha:\n\n${link}`
    );
    if (numeroLimpo) {
      window.open(`https://api.whatsapp.com/send?phone=55${numeroLimpo}&text=${msg}`, "_blank");
    } else {
      window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
    }
  }

  return (
    // Correção: backdrop unificado com overflow-y-auto e p-4
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        // Caixa interna com scroll controlado (max-h-[90vh] flex flex-col)
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-xl border border-axon-border bg-axon-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com shrink-0 */}
        <div className="shrink-0 flex items-center justify-between border-b border-axon-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {etapa === "formulario"
                ? editando
                  ? "Editar Jurado"
                  : "Adicionar Jurado"
                : "Jurado cadastrado"}
            </h2>
            {etapa === "formulario" && (
              <p className="mt-0.5 text-xs text-gray-500">
                {editando
                  ? "Atualize os dados centrais do jurado cadastrados na produtora."
                  : "Um convite por e-mail será enviado automaticamente e o jurado será cadastrado no cadastro central da produtora."}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {etapa === "formulario" && (
          <>
            {/* Área de conteúdo scrollável (flex-1 overflow-y-auto) */}
            <div className="space-y-4 p-6 overflow-y-auto flex-1">
              <Dica>
                {editando
                  ? "Edite os dados globais do jurado. Os campos privados só serão bloqueados se o e-mail informado colidir com outro cadastro protegido."
                  : "Preencha os dados do jurado. Ele receberá um e-mail com o link para criar a senha e entrar no portal do jurado."}
              </Dica>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Nome completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do jurado"
                  disabled={camposPrivadosBloqueados}
                  className="w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-axon-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">E-mail *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={camposPrivadosBloqueados}
                    className="w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-axon-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {verificandoEmail && (
                    <Loader2
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500"
                    />
                  )}
                  {!verificandoEmail && usuarioExistente && (
                    <ShieldCheck
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-axon-gold"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                  placeholder="(21) 99999-9999"
                  disabled={camposPrivadosBloqueados}
                  className="w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-axon-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">Foto do jurado</label>

                {fotoUrl ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-axon-border bg-axon-bg">
                      <img
                        src={fotoUrl}
                        alt="Foto do jurado"
                        className="h-40 w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <UploadButton
                        endpoint="imageUploader"
                        appearance={{
                          button:
                            "ut-ready:bg-[#d4af37] ut-ready:text-black ut-ready:hover:bg-[#caa22f] ut-uploading:bg-[#d4af37]/80 ut-uploading:text-black rounded-lg border-0 px-4 py-2 text-sm font-semibold",
                          allowedContent: "hidden",
                        }}
                        content={{
                          button({ ready }) {
                            if (uploadingFoto) return "Enviando foto...";
                            return ready ? "Trocar foto" : "Preparando...";
                          },
                        }}
                        onUploadBegin={() => {
                          setErro(null);
                          setUploadingFoto(true);
                        }}
                        onClientUploadComplete={(res) => {
                          const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? null;
                          setFotoUrl(url);
                          setUploadingFoto(false);
                        }}
                        onUploadError={(error: Error) => {
                          setErro(`Erro no upload da foto: ${error.message}`);
                          setUploadingFoto(false);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => setFotoUrl(null)}
                        className="rounded-lg border border-axon-border px-3 py-2 text-xs text-gray-400 transition-colors hover:text-white"
                      >
                        Remover foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-axon-border bg-axon-bg/70 p-4">
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-6 text-center">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-axon-gold">
                        <ImageIcon size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-white">Faça upload da foto</p>
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG ou WebP.
                        </p>
                      </div>

                      <UploadButton
                        endpoint="imageUploader"
                        appearance={{
                          button:
                            "ut-ready:bg-[#d4af37] ut-ready:text-black ut-ready:hover:bg-[#caa22f] ut-uploading:bg-[#d4af37]/80 ut-uploading:text-black rounded-lg border-0 px-4 py-2 text-sm font-semibold",
                          allowedContent: "hidden",
                        }}
                        content={{
                          button({ ready }) {
                            if (uploadingFoto) return "Enviando foto...";
                            return ready ? "Selecionar foto" : "Preparando...";
                          },
                        }}
                        onUploadBegin={() => {
                          setErro(null);
                          setUploadingFoto(true);
                        }}
                        onClientUploadComplete={(res) => {
                          const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? null;
                          setFotoUrl(url);
                          setUploadingFoto(false);
                        }}
                        onUploadError={(error: Error) => {
                          setErro(`Erro no upload da foto: ${error.message}`);
                          setUploadingFoto(false);
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Recomendado: Proporção 1:1 (quadrado), tamanho 256x256px. Esta foto será exibida na página pública do evento.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-400">Mini biografia</label>
                <textarea
                  value={miniBio}
                  onChange={(e) => setMiniBio(e.target.value.slice(0, 160))}
                  maxLength={160}
                  rows={4}
                  placeholder="Ex.: Doutora em dança, pesquisadora e curadora com atuação em festivais nacionais e internacionais."
                  className="w-full resize-none rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white placeholder:text-gray-600 transition-colors focus:border-axon-gold focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs leading-relaxed text-gray-500">
                    Resumo profissional ou acadêmico do jurado/avaliador. Será exibido na página pública.
                  </p>
                  <span className="shrink-0 text-xs text-gray-500">{miniBio.length}/160</span>
                </div>
              </div>

              {usuarioExistente &&
                usuarioExistente.id !== jurado?.id &&
                !usuarioSemProdutora && (
                  <div className="flex items-start gap-3 rounded-lg border border-axon-gold/20 bg-axon-gold/10 p-4">
                    <Mail size={16} className="mt-0.5 shrink-0 text-axon-gold" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {colisaoOutroRole
                          ? "Conta protegida encontrada"
                          : "Cadastro existente encontrado"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {colisaoOutroRole
                          ? "Este e-mail já está associado a uma conta com papel diferente. Para proteger dados privados, esse formulário não pode sobrescrever esse cadastro."
                          : "Já existe um jurado com este e-mail vinculado a outra produtora. Os dados privados desse cadastro não podem ser sobrescritos por este formulário."}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Cadastro identificado:{" "}
                        <span className="text-gray-300">{nomeExibidoContaExistente}</span>
                      </p>
                    </div>
                  </div>
                )}

              {usuarioExistente && usuarioSemProdutora && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Convite pendente encontrado</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Este e-mail já recebeu um convite, mas ainda não vinculou uma produtora. Ao
                      salvar, o cadastro será vinculado automaticamente a esta produtora.
                    </p>
                  </div>
                </div>
              )}

              <p className="-mt-1 text-xs text-gray-600">
                Este cadastro é centralizado por produtora e será reutilizado em outros fluxos
                internos do sistema.
              </p>

              {erro && (
                <p className="flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> {erro}
                </p>
              )}
            </div>

            {/* Rodapé com shrink-0 */}
            <div className="shrink-0 flex gap-3 border-t border-axon-border px-6 py-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-400 transition-all duration-200 hover:border-gray-500 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || verificandoEmail || uploadingFoto}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-axon-gold/80 active:scale-95 disabled:opacity-50"
              >
                {(salvando || uploadingFoto) && <Loader2 size={14} className="animate-spin" />}
                {editando ? "Salvar alterações" : "Cadastrar Jurado"}
              </button>
            </div>
          </>
        )}

        {etapa === "confirmacao" && (
          <>
            <div className="space-y-5 p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-white">{nome} cadastrado com sucesso</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Convite enviado para <span className="text-white">{email}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={copiarLink}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-300 transition-all duration-200 hover:border-gray-500 hover:text-white"
                >
                  {copiado ? (
                    <Check size={15} className="text-emerald-400" />
                  ) : (
                    <Copy size={15} />
                  )}
                  {copiado ? "Link copiado" : "Copiar link do portal do jurado"}
                </button>

                <button
                  onClick={abrirWhatsApp}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-300 transition-all duration-200 hover:border-gray-500 hover:text-white"
                >
                  <MessageCircle size={15} />
                  Enviar pelo WhatsApp
                </button>
              </div>
            </div>

            <div className="shrink-0 border-t border-axon-border px-6 py-4">
              <button
                onClick={onClose}
                className="w-full rounded-lg bg-axon-gold px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-axon-gold/80 active:scale-95"
              >
                Concluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ConfirmarExclusaoJuradoProps {
  jurado: Jurado;
  onClose: () => void;
  onConfirmar: () => Promise<string | null>;
}

function ConfirmarExclusaoJurado({
  jurado,
  onClose,
  onConfirmar,
}: ConfirmarExclusaoJuradoProps) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleConfirmar() {
    setExcluindo(true);
    setErro(null);
    const erroMsg = await onConfirmar();
    if (erroMsg) {
      setErro(erroMsg);
      setExcluindo(false);
      // Não fecha o modal se houver erro
    } else {
      setExcluindo(false);
      onClose();
    }
  }

  return (
    // Backdrop unificado
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-red-500/20 bg-axon-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-axon-border px-6 py-4">
          <h2 className="text-base font-semibold text-white">Excluir jurado</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <Trash2 size={16} className="mt-0.5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-white">
                Excluir {jurado.nome || "Sem Nome (Pendente)"} do cadastro de jurados
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Esta ação remove definitivamente o jurado do cadastro centralizado da produtora.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Use esta ação apenas quando o cadastro realmente não precisar mais existir na base
            central de jurados.
          </p>

          {erro && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              Não foi possível excluir o jurado. Ele pode estar escalado em festivais ativos.
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-axon-border px-6 py-4">
          <button
            onClick={onClose}
            disabled={excluindo}
            className="flex-1 rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-400 transition-all duration-200 hover:border-gray-500 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={excluindo}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:bg-red-400 active:scale-95 disabled:opacity-50"
          >
            {excluindo && <Loader2 size={14} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JuradosPage() {
  const [termo, setTermo] = useState<Terminologia>({
    grupo: "Grupo",
    participante: "Participante",
    apresentacao: "Apresentação",
    organizacao: "Organização",
  });
  const [produtoraId, setProdutoraId] = useState("");
  const [jurados, setJurados] = useState<Jurado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalJuradoAberta, setModalJuradoAberta] = useState(false);
  const [juradoEmEdicao, setJuradoEmEdicao] = useState<Jurado | null>(null);
  const [juradoExclusao, setJuradoExclusao] = useState<Jurado | null>(null);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let produtoraIdAtual = "";

    if (user) {
      const { data: usuarioAuth } = await supabase
        .from("usuarios")
        .select("produtora_id")
        .eq("id", user.id)
        .maybeSingle();

      produtoraIdAtual =
        (usuarioAuth as { produtora_id?: string | null } | null)?.produtora_id ?? "";
      setProdutoraId(produtoraIdAtual);
    } else {
      setProdutoraId("");
    }

    const { data: config } = await supabase
      .from("tenant_config")
      .select("termo_grupo, termo_participante, termo_apresentacao, nome_organizacao")
      .maybeSingle();

    if (config) {
      setTermo({
        grupo: (config as Record<string, string>).termo_grupo ?? "Grupo",
        participante: (config as Record<string, string>).termo_participante ?? "Participante",
        apresentacao: (config as Record<string, string>).termo_apresentacao ?? "Apresentação",
        organizacao: (config as Record<string, string>).nome_organizacao ?? "Organização",
      });
    }

    if (!produtoraIdAtual) {
      setJurados([]);
      setCarregando(false);
      return;
    }

    const { data: usuariosData } = await supabase
      .from("usuarios")
      .select("id, nome, email, telefone, foto_url, mini_bio")
      .eq("role", "jurado")
      .eq("produtora_id", produtoraIdAtual)
      .order("nome");

    setJurados(
      (
        (
          (usuariosData as Array<{
            id: string;
            nome: string | null;
            email: string;
            telefone: string | null;
            foto_url?: string | null;
            mini_bio?: string | null;
          }> | null) ?? []
        ).map((u) => ({
          id: u.id,
          nome: u.nome ?? "",
          email: u.email,
          telefone: u.telefone ?? null,
          foto_url: u.foto_url ?? null,
          mini_bio: u.mini_bio ?? null,
        })) satisfies Jurado[]
      )
    );

    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function excluirJurado(jurado: Jurado | null): Promise<string | null> {
    if (!jurado || !produtoraId) return null;

    const res = await fetch(apiUrl("/api/invite"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", userId: jurado.id }),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      return json.error || "Erro ao remover jurado.";
    }

    await carregar();
    return null;
  }

  return (
    <>
      {modalJuradoAberta && (
        <ModalJurado
          termo={termo}
          produtoraId={produtoraId}
          jurado={juradoEmEdicao}
          onClose={() => {
            setModalJuradoAberta(false);
            setJuradoEmEdicao(null);
          }}
          onSaved={carregar}
        />
      )}

      {juradoExclusao && (
        <ConfirmarExclusaoJurado
          jurado={juradoExclusao}
          onClose={() => setJuradoExclusao(null)}
          onConfirmar={() => excluirJurado(juradoExclusao)}
        />
      )}

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Cadastro de Jurados</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Gerencie os jurados cadastrados centralmente na produtora.
            </p>
          </div>

          <button
            onClick={() => {
              setJuradoEmEdicao(null);
              setModalJuradoAberta(true);
            }}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-axon-gold px-4 py-2 text-sm font-bold text-black transition-all duration-200 hover:bg-axon-gold/80 active:scale-95"
          >
            <Plus size={15} />
            Adicionar Jurado
          </button>
        </div>

        <Dica>
          Jurados cadastrados aqui compõem o <strong>cadastro central</strong> da produtora e
          poderão ser reutilizados em outros fluxos do sistema sem depender desta página de eventos.
        </Dica>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { label: "Jurados cadastrados", valor: jurados.length, icon: Users, cor: "text-white" },
              {
                label: "Com e-mail",
                valor: jurados.filter((j) => Boolean(j.email)).length,
                icon: Mail,
                cor: "text-axon-gold",
              },
              {
                label: "Com telefone",
                valor: jurados.filter((j) => Boolean(j.telefone)).length,
                icon: Phone,
                cor: "text-emerald-400",
              },
            ] as const
          ).map(({ label, valor, icon: Icon, cor }) => (
            <div key={label} className="rounded-xl border border-axon-border bg-axon-panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <Icon size={14} className={cor} />
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <p className={`tabular-nums text-lg font-semibold ${cor}`}>{valor}</p>
            </div>
          ))}
        </div>

        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-600" />
          </div>
        ) : jurados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-axon-border px-6 py-16 text-center text-gray-600">
            <Users size={36} className="mb-3 text-axon-gold opacity-20" />
            <p className="font-medium text-gray-300">Nenhum jurado cadastrado</p>
            <p className="mt-1 max-w-lg text-sm text-gray-500">
              Ainda não há jurados no cadastro central da produtora. Cadastre o primeiro jurado
              agora.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setJuradoEmEdicao(null);
                  setModalJuradoAberta(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-axon-border px-4 py-2.5 text-sm text-gray-300 transition-all duration-200 hover:border-gray-500 hover:text-white"
              >
                <Plus size={15} />
                Cadastrar Novo Jurado
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {jurados.map((j) => (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-axon-border bg-axon-panel px-5 py-4 transition-colors hover:border-gray-600"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="shrink-0">
                    {j.foto_url ? (
                      <img
                        src={j.foto_url}
                        alt={j.nome || "Foto do jurado"}
                        className="h-12 w-12 rounded-full border border-axon-border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-axon-border bg-axon-bg text-gray-600">
                        <Users size={16} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">
                      {j.nome || "Sem Nome (Pendente)"}
                    </p>
                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-3">
                      <p className="break-all text-xs text-gray-500">{j.email}</p>
                      {j.telefone && (
                        <p className="text-xs text-gray-600">{mascaraTelefone(j.telefone)}</p>
                      )}
                    </div>
                    {j.mini_bio && (
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-400">
                        {j.mini_bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setJuradoEmEdicao(j);
                      setModalJuradoAberta(true);
                    }}
                    className="rounded-lg p-1.5 text-gray-500 transition-all duration-200 hover:bg-white/5 hover:text-white"
                    title="Editar jurado"
                    aria-label={`Editar ${j.nome || "jurado"}`}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => setJuradoExclusao(j)}
                    className="rounded-lg p-1.5 text-gray-500 transition-all duration-200 hover:bg-red-400/10 hover:text-red-400"
                    title="Excluir jurado"
                    aria-label={`Excluir ${j.nome || "jurado"}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}