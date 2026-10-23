"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Camera, CheckCircle2, CreditCard, FileText, Loader2, QrCode, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mensagemEnvio, uploadFiles } from "@/utils/uploadthing";
import { cpfValido, soDigitos } from "@/lib/documentos";
import { cnpjValido, mascaraCpfCnpj, mascaraTelefone, telefoneValido } from "@/lib/mascaras";
import { colunasEndereco, enderecoDe, type Endereco } from "@/lib/endereco";
import { CamposEndereco } from "@/app/_components/CamposEndereco";
import { useAvisoNaoSalvo } from "@/app/_components/Dialogos";
import { termoParticipacaoBase } from "@/lib/termos";

interface Produtora {
  id: string;
  nome: string;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  logo_url: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold disabled:opacity-60";

function Aviso({ aviso }: { aviso: { ok: boolean; texto: string } | null }) {
  if (!aviso) return null;
  return <p className={`text-sm ${aviso.ok ? "text-emerald-300" : "text-red-300"}`}>{aviso.texto}</p>;
}

export function ConfigProdutora({ produtora, termo, temPix, podeEditar }: { produtora: Produtora; termo: string; temPix: boolean; podeEditar: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    nome: produtora.nome,
    documento: mascaraCpfCnpj(produtora.documento),
    email: produtora.email ?? "",
    telefone: mascaraTelefone(produtora.telefone),
    logo_url: produtora.logo_url,
  });
  const [endereco, setEndereco] = useState<Endereco>(enderecoDe(produtora));
  // Sem texto próprio salvo, o campo já vem com o texto base montado com os dados da produtora
  const [texto, setTexto] = useState(termo || termoParticipacaoBase(produtora));
  const [termoSalvo, setTermoSalvo] = useState(termo);
  const atualDados = useMemo(() => JSON.stringify({ f, endereco }), [f, endereco]);
  const [dadosSalvos, setDadosSalvos] = useState(atualDados);
  useAvisoNaoSalvo(podeEditar && (atualDados !== dadosSalvos || (!!termoSalvo && texto !== termoSalvo)));
  const [salvando, setSalvando] = useState<"dados" | "termo" | "logo" | null>(null);
  const [avisoDados, setAvisoDados] = useState<{ ok: boolean; texto: string } | null>(null);
  const [avisoTermo, setAvisoTermo] = useState<{ ok: boolean; texto: string } | null>(null);

  const trocarLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setAvisoDados({ ok: false, texto: "Use uma imagem JPG, PNG ou WebP." });
    setSalvando("logo");
    setAvisoDados(null);
    try {
      const [r] = await uploadFiles("imageUploader", { files: [file] });
      if (!r) throw new Error("Falha no envio da imagem.");
      setF((atual) => ({ ...atual, logo_url: r.ufsUrl }));
      setAvisoDados({ ok: true, texto: "Logo enviada. Clique em Salvar para confirmar." });
    } catch (e) {
      setAvisoDados({ ok: false, texto: mensagemEnvio(e) });
    }
    setSalvando(null);
  };

  const salvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    const documento = soDigitos(f.documento);
    if (!f.nome.trim()) return setAvisoDados({ ok: false, texto: "Informe o nome da produtora." });
    if (documento && !(documento.length === 11 ? cpfValido(documento) : cnpjValido(documento))) return setAvisoDados({ ok: false, texto: "CPF ou CNPJ inválido. Confira os números." });
    if (f.telefone && !telefoneValido(f.telefone)) return setAvisoDados({ ok: false, texto: "Telefone incompleto: informe DDD e número." });
    setSalvando("dados");
    setAvisoDados(null);
    const { error } = await createClient().from("produtoras").update({
      nome: f.nome.trim(),
      documento: documento || null,
      email: f.email.trim().toLowerCase() || null,
      telefone: soDigitos(f.telefone) || null,
      logo_url: f.logo_url,
      ...colunasEndereco(endereco),
    }).eq("id", produtora.id);
    setAvisoDados(error ? { ok: false, texto: error.message } : { ok: true, texto: "Dados salvos." });
    setSalvando(null);
    if (!error) {
      setDadosSalvos(atualDados);
      router.refresh();
    }
  };

  const salvarTermo = async () => {
    setSalvando("termo");
    setAvisoTermo(null);
    const supabase = createClient();
    const valor = texto.trim() || null;
    const { data: existente } = await supabase.from("tenant_config").select("id").eq("produtora_id", produtora.id).limit(1).maybeSingle();
    const { error } = existente
      ? await supabase.from("tenant_config").update({ termo_legal_texto: valor }).eq("id", existente.id)
      : await supabase.from("tenant_config").insert({ produtora_id: produtora.id, termo_legal_texto: valor });
    setAvisoTermo(error ? { ok: false, texto: error.message } : { ok: true, texto: "Termo salvo." });
    setSalvando(null);
    if (!error) {
      setTermoSalvo(valor ?? "");
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Configurações da produtora</h1>
        <p className="mt-1 text-sm text-gray-400">Dados cadastrais da sua produtora. O tipo de festival, as categorias e a identidade visual ficam em cada evento.</p>
      </div>

      {!podeEditar && <p className="rounded-lg border border-axon-border px-4 py-3 text-sm text-gray-400">Somente o admin da produtora altera estes dados.</p>}

      <form onSubmit={salvarDados} className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="flex items-center gap-2 border-b border-axon-border px-5 py-3.5 font-semibold text-white"><Building2 size={16} className="text-axon-gold" /> Dados da produtora</h2>
        <fieldset disabled={!podeEditar} className="space-y-4 px-5 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-axon-border bg-axon-bg">
              {f.logo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={f.logo_url} alt="Logo da produtora" className="h-full w-full object-contain" />
                : <Building2 size={24} className="text-gray-600" />}
            </span>
            {podeEditar && (
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:border-axon-gold">
                  {salvando === "logo" ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {f.logo_url ? "Trocar logo" : "Enviar logo"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => trocarLogo(e.target.files?.[0])} />
                </label>
                {f.logo_url && <button type="button" onClick={() => setF({ ...f, logo_url: null })} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white">Remover</button>}
              </div>
            )}
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">Nome da produtora</span>
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={150} className={`${campo} mt-1.5`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs text-gray-400">CPF ou CNPJ</span>
              <input inputMode="numeric" value={f.documento} onChange={(e) => setF({ ...f, documento: mascaraCpfCnpj(e.target.value) })} placeholder="000.000.000-00 ou 00.000.000/0000-00" className={`${campo} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">E-mail de contato</span>
              <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={`${campo} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Telefone / WhatsApp</span>
              <input inputMode="tel" autoComplete="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascaraTelefone(e.target.value) })} placeholder="(00) 00000-0000" className={`${campo} mt-1.5`} />
            </label>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Endereço</p>
            <CamposEndereco valor={endereco} onChange={setEndereco} disabled={!podeEditar} classeCampo={campo} />
          </div>
          {podeEditar && (
            <div className="flex items-center justify-end gap-3">
              <Aviso aviso={avisoDados} />
              <button type="submit" disabled={salvando !== null} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
                {salvando === "dados" && <Loader2 size={15} className="animate-spin" />} Salvar dados
              </button>
            </div>
          )}
        </fieldset>
      </form>

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="flex items-center gap-2 border-b border-axon-border px-5 py-3.5 font-semibold text-white"><FileText size={16} className="text-axon-gold" /> Termo de participação</h2>
        <div className="space-y-3 px-5 py-5">
          <p className="text-sm text-gray-400">
            Texto que cada integrante (ou o responsável, se for menor de idade) lê e aceita ao confirmar o vínculo com o grupo pelo link do e-mail.
            Os documentos de cada evento (regulamento, uso de imagem…) ficam em <Link href="/termos" className="text-axon-gold hover:underline">Termos</Link>.
          </p>
          <textarea rows={10} value={texto} disabled={!podeEditar} onChange={(e) => setTexto(e.target.value)} maxLength={20000}
            placeholder="Ex.: Declaro que participo das atividades do festival por livre vontade, que estou apto(a) fisicamente…"
            className={`${campo} resize-y leading-relaxed`} />
          {!termoSalvo && <p className="text-xs text-amber-300">Este é o texto base, montado com os dados da sua produtora. Revise, ajuste se quiser e clique em Salvar termo. Enquanto não salvar, é ele que os integrantes veem.</p>}
          {podeEditar && termoSalvo && (
            <button type="button" onClick={() => setTexto(termoParticipacaoBase({ ...produtora, nome: f.nome, documento: soDigitos(f.documento), cidade: endereco.cidade || null, estado: endereco.estado || null }))}
              className="text-xs text-axon-gold hover:underline">Restaurar o texto base</button>
          )}
          {podeEditar && (
            <div className="flex items-center justify-end gap-3">
              <Aviso aviso={avisoTermo} />
              <button type="button" onClick={salvarTermo} disabled={salvando !== null} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
                {salvando === "termo" && <Loader2 size={15} className="animate-spin" />} Salvar termo
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/pdv?aba=configuracoes" className="rounded-xl border border-axon-border bg-axon-panel p-4 hover:border-axon-gold/50">
          <QrCode size={18} className="text-axon-gold" />
          <p className="mt-2 text-sm font-medium text-white">PIX e PIN do caixa</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">{temPix ? <><CheckCircle2 size={12} className="text-emerald-400" /> PIX configurado</> : "Ainda sem chave PIX"}</p>
        </Link>
        <Link href="/usuarios" className="rounded-xl border border-axon-border bg-axon-panel p-4 hover:border-axon-gold/50">
          <Users size={18} className="text-axon-gold" />
          <p className="mt-2 text-sm font-medium text-white">Equipe</p>
          <p className="mt-1 text-xs text-gray-400">Convide produção, financeiro, marketing e operadores.</p>
        </Link>
        <Link href="/perfil" className="rounded-xl border border-axon-border bg-axon-panel p-4 hover:border-axon-gold/50">
          <CreditCard size={18} className="text-axon-gold" />
          <p className="mt-2 text-sm font-medium text-white">Plano</p>
          <p className="mt-1 text-xs text-gray-400">Veja o plano e os limites da produtora.</p>
        </Link>
      </section>
    </div>
  );
}
