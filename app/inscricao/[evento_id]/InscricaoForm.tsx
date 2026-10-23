"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { perfilPorSlug } from "@/lib/perfis";
import { BASE_PATH, apiUrl } from "@/lib/base-path";
import { cpfValido, soDigitos } from "@/lib/documentos";
import { cnpjValido, mascaraCpfCnpj, mascaraTelefone, telefoneValido } from "@/lib/mascaras";
import { enderecoVazio, type Endereco } from "@/lib/endereco";
import { CampoSenha } from "@/app/_components/CampoSenha";
import { CamposEndereco } from "@/app/_components/CamposEndereco";

// Inscrição pela página pública do festival (portal único):
//   1. CPF/CNPJ do grupo;
//   2a. grupo já existe no ARXUM Fest → entra com o próprio login e dá o aceite;
//   2b. grupo novo → cadastro completo + aceite; confirma o e-mail e cai no portal.
// A produtora não inscreve nem convida grupos: o vínculo é sempre feito por eles.

interface EventoInscricao {
  id: string;
  nome: string;
  cor_primaria: string | null;
  tema_escuro: boolean;
  perfil_slug: string | null;
  slug: string | null;
  regulamento_url: string | null;
}

type Etapa = "documento" | "login" | "aceite" | "cadastro" | "enviado";

async function postar(caminho: `/${string}`, corpo: Record<string, unknown>): Promise<string | null> {
  const res = await fetch(apiUrl(caminho), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) }).catch(() => null);
  if (!res) return "Erro de conexão. Tente novamente.";
  if (res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return json.error ?? "Não foi possível concluir.";
}

export default function InscricaoForm({ evento }: { eventoId: string; evento: EventoInscricao }) {
  const T = perfilPorSlug(evento.perfil_slug).termos;
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("documento");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [documento, setDocumento] = useState("");
  const [grupo, setGrupo] = useState<{ id: string; nome: string; email: string } | null>(null);
  const [login, setLogin] = useState({ email: "", senha: "" });
  const [aceite, setAceite] = useState(false);
  const [f, setF] = useState({ nome: "", responsavel: "", email: "", email_contato: "", telefone: "", senha: "", confirmar: "" });
  const [endereco, setEndereco] = useState<Endereco>(enderecoVazio);

  const accent = evento.cor_primaria || "#d4af37";
  const escuro = evento.tema_escuro;
  const painel = escuro ? "bg-axon-panel" : "bg-white";
  const titulo = escuro ? "text-white" : "text-black";
  const texto = escuro ? "text-gray-400" : "text-gray-600";
  const campo = `w-full rounded-xl border border-axon-border ${escuro ? "bg-axon-bg text-white" : "bg-white text-black"} px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none`;
  const rotulo = `text-xs font-semibold uppercase tracking-[0.14em] ${texto}`;
  const botao = "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40";
  const linkRegulamento = evento.regulamento_url ?? (evento.slug ? `${BASE_PATH}/e/${evento.slug}#secao-regulamento` : null);
  const docOk = (() => { const d = soDigitos(documento); return d.length === 11 ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false; })();

  const blocoAceite = (nomeGrupo: string) => (
    <label className={`flex items-start gap-3 rounded-xl border border-axon-border p-4 text-sm ${titulo}`} style={{ borderColor: `${accent}40` }}>
      <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0" style={{ accentColor: accent }} />
      <span>
        Confirmo a inscrição de <strong>{nomeGrupo || `meu ${T.grupo.singular}`}</strong> em <strong>{evento.nome}</strong> e aceito o{" "}
        {linkRegulamento ? <a href={linkRegulamento} target="_blank" rel="noreferrer" className="underline" style={{ color: accent }}>regulamento do festival</a> : "regulamento do festival"}.
      </span>
    </label>
  );

  const blocoErro = erro ? <p className="flex items-center gap-1.5 text-sm text-red-400"><AlertCircle size={14} /> {erro}</p> : null;

  // 1. CPF/CNPJ
  const buscar = async () => {
    setErro(null);
    if (!docOk) return setErro("CPF ou CNPJ inválido. Confira os números.");
    setOcupado(true);
    const { data, error } = await createClient().rpc("grupo_por_documento", { p_documento: soDigitos(documento) }).maybeSingle();
    setOcupado(false);
    if (error) return setErro("Não foi possível verificar agora. Tente novamente.");
    const achado = data as { id: string; nome: string; email_mascarado: string } | null;
    if (achado) {
      setGrupo({ id: achado.id, nome: achado.nome, email: achado.email_mascarado });
      setEtapa("login");
    } else {
      setEtapa("cadastro");
    }
  };

  // 2a. Grupo existente: entra com o próprio login
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setOcupado(true);
    const supabase = createClient();
    const { data: sessao, error } = await supabase.auth.signInWithPassword({ email: login.email.trim(), password: login.senha });
    if (error || !sessao.user) { setOcupado(false); return setErro("E-mail ou senha incorretos."); }
    const { data: u } = await supabase.from("usuarios").select("role, organizacao_id").eq("id", sessao.user.id).maybeSingle();
    setOcupado(false);
    if (!u || u.organizacao_id !== grupo?.id) {
      await supabase.auth.signOut();
      return setErro(`Este login não é do ${T.grupo.singular} ${grupo?.nome}. Entre com o e-mail de acesso do ${T.grupo.singular}.`);
    }
    if (u.role !== "org_admin" && u.role !== "escola_admin") {
      return setErro(`Só o responsável pelo ${T.grupo.singular} confirma a inscrição em um festival.`);
    }
    setEtapa("aceite");
  };

  const confirmarExistente = async () => {
    setErro(null);
    if (!aceite) return setErro("Marque o aceite para confirmar a inscrição.");
    setOcupado(true);
    const falha = await postar("/api/grupo/cadastro", { evento_id: evento.id, aceite: true });
    if (falha) { setOcupado(false); return setErro(falha); }
    router.push(`/grupo/${evento.id}/inicio`);
  };

  // 2b. Grupo novo
  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.nome.trim() || !f.responsavel.trim()) return setErro("Preencha o nome e o responsável.");
    if (!telefoneValido(f.telefone)) return setErro("Telefone incompleto: informe DDD e número.");
    if (!endereco.estado || !endereco.cidade) return setErro("Informe estado e cidade.");
    if (f.senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (f.senha !== f.confirmar) return setErro("As senhas não são iguais.");
    if (!aceite) return setErro("Marque o aceite para confirmar a inscrição.");
    setOcupado(true);
    const falha = await postar("/api/grupo/novo", {
      evento_id: evento.id, documento: soDigitos(documento), nome: f.nome, responsavel: f.responsavel, email: f.email,
      email_contato: f.email_contato || null, telefone: soDigitos(f.telefone), senha: f.senha, aceite: true, ...endereco,
    });
    setOcupado(false);
    if (falha) return setErro(falha);
    setEtapa("enviado");
  };

  return (
    <div className={`overflow-hidden rounded-3xl border border-axon-border ${painel}`} style={{ "--accent": accent } as CSSProperties}>
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <div className="space-y-5 px-6 py-6 sm:px-7 sm:py-7">
        {etapa === "documento" && (
          <form onSubmit={(e) => { e.preventDefault(); buscar(); }} className="space-y-5">
            <div>
              <h2 className={`text-lg font-bold ${titulo}`}>Inscrição do {T.grupo.singular}</h2>
              <p className={`mt-1 text-sm ${texto}`}>Informe o CPF ou CNPJ. Se o {T.grupo.singular} já tem cadastro no ARXUM Fest (de qualquer festival), é só entrar com o mesmo login.</p>
            </div>
            <label className="block space-y-1.5">
              <span className={rotulo}>CPF ou CNPJ</span>
              <input inputMode="numeric" autoFocus value={documento} onChange={(e) => { setErro(null); setDocumento(mascaraCpfCnpj(e.target.value)); }}
                placeholder="000.000.000-00 ou 00.000.000/0000-00" className={campo} />
            </label>
            {blocoErro}
            <button type="submit" disabled={ocupado || soDigitos(documento).length < 11} className={botao} style={{ background: accent }}>
              {ocupado ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Continuar
            </button>
          </form>
        )}

        {etapa === "login" && grupo && (
          <form onSubmit={entrar} className="space-y-5">
            <div>
              <h2 className={`text-lg font-bold ${titulo}`}>Encontramos o cadastro</h2>
              <p className={`mt-1 text-sm ${texto}`}><strong className={titulo}>{grupo.nome}</strong> · acesso: {grupo.email}</p>
              <p className={`mt-1 text-sm ${texto}`}>Entre com o login do {T.grupo.singular} para se inscrever neste festival.</p>
            </div>
            <label className="block space-y-1.5">
              <span className={rotulo}>E-mail</span>
              <input type="email" name="email" autoComplete="username" required value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} className={campo} />
            </label>
            <label className="block space-y-1.5">
              <span className={rotulo}>Senha</span>
              <CampoSenha value={login.senha} onChange={(senha) => setLogin({ ...login, senha })} className={campo} />
            </label>
            {blocoErro}
            <button type="submit" disabled={ocupado} className={botao} style={{ background: accent }}>
              {ocupado ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} Entrar
            </button>
            <div className={`flex justify-between text-sm ${texto}`}>
              <button type="button" onClick={() => { setEtapa("documento"); setErro(null); }} className="hover:underline">Voltar</button>
              <Link href="/esqueci-senha" className="hover:underline">Esqueci minha senha</Link>
            </div>
          </form>
        )}

        {etapa === "aceite" && grupo && (
          <div className="space-y-5">
            <div>
              <h2 className={`text-lg font-bold ${titulo}`}>Confirmar inscrição</h2>
              <p className={`mt-1 text-sm ${texto}`}>Você entrou como <strong className={titulo}>{grupo.nome}</strong>.</p>
            </div>
            {blocoAceite(grupo.nome)}
            {blocoErro}
            <button type="button" onClick={confirmarExistente} disabled={ocupado || !aceite} className={botao} style={{ background: accent }}>
              {ocupado ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirmar inscrição
            </button>
          </div>
        )}

        {etapa === "cadastro" && (
          <form onSubmit={cadastrar} className="space-y-5">
            <div>
              <h2 className={`text-lg font-bold ${titulo}`}>Vamos criar o cadastro</h2>
              <p className={`mt-1 text-sm ${texto}`}>{mascaraCpfCnpj(documento)} ainda não tem cadastro. Ele vale para todos os festivais do ARXUM Fest.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-2">
                <span className={rotulo}>Nome do {T.grupo.singular}</span>
                <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={160} className={campo} />
              </label>
              <label className="block space-y-1.5">
                <span className={rotulo}>Responsável</span>
                <input required autoComplete="name" value={f.responsavel} onChange={(e) => setF({ ...f, responsavel: e.target.value })} maxLength={120} className={campo} />
              </label>
              <label className="block space-y-1.5">
                <span className={rotulo}>Telefone / WhatsApp</span>
                <input required inputMode="tel" autoComplete="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascaraTelefone(e.target.value) })} placeholder="(00) 00000-0000" className={campo} />
              </label>
              <label className="block space-y-1.5">
                <span className={rotulo}>E-mail de acesso</span>
                <input required type="email" name="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={campo} />
              </label>
              <label className="block space-y-1.5">
                <span className={rotulo}>E-mail de contato (opcional)</span>
                <input type="email" value={f.email_contato} onChange={(e) => setF({ ...f, email_contato: e.target.value })} className={campo} />
              </label>
            </div>
            <CamposEndereco valor={endereco} onChange={setEndereco} classeCampo={campo} classeRotulo={rotulo} obrigatorio={false} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className={rotulo}>Senha</span>
                <CampoSenha value={f.senha} onChange={(senha) => setF({ ...f, senha })} autoComplete="new-password" minLength={8} placeholder="Mínimo 8 caracteres" className={campo} />
              </label>
              <label className="block space-y-1.5">
                <span className={rotulo}>Repita a senha</span>
                <CampoSenha value={f.confirmar} onChange={(confirmar) => setF({ ...f, confirmar })} autoComplete="new-password" name="confirmar" className={campo} />
              </label>
            </div>
            {f.confirmar && f.senha !== f.confirmar && <p className="text-xs text-red-400">As senhas não são iguais.</p>}
            {blocoAceite(f.nome)}
            {blocoErro}
            <button type="submit" disabled={ocupado || !aceite} className={botao} style={{ background: accent }}>
              {ocupado ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Cadastrar e inscrever
            </button>
            <button type="button" onClick={() => { setEtapa("documento"); setErro(null); }} className={`w-full text-sm ${texto} hover:underline`}>Voltar</button>
          </form>
        )}

        {etapa === "enviado" && (
          <div className="space-y-4 text-center">
            <Mail size={36} className="mx-auto" style={{ color: accent }} />
            <h2 className={`text-lg font-bold ${titulo}`}>Confirme seu e-mail</h2>
            <p className={`text-sm ${texto}`}>Enviamos um link para <strong className={titulo}>{f.email}</strong>. Abra o e-mail e clique no botão para confirmar: você cai direto no portal do {T.grupo.singular} para cadastrar elenco e {T.apresentacao.plural}.</p>
            <p className={`text-xs ${texto}`}>Não chegou? Veja a caixa de spam.</p>
          </div>
        )}
      </div>
    </div>
  );
}
