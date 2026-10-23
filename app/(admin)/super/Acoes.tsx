"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, Copy, ExternalLink, KeyRound, Loader2, LogIn, Mail, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { confirmar, pedirTexto } from "@/app/_components/Dialogos";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/super/acoes"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as { error?: string; link?: string };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

const botao = "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5 disabled:opacity-40";

// Link de "entrar como": abrir numa janela anônima para não perder a sessão do super admin
function JanelaEntrarComo({ link, nome, onFechar }: { link: string; nome: string; onFechar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-4 rounded-2xl border border-axon-border bg-axon-panel p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-white">Entrar como {nome}</h3>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400"><X size={18} /></button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-300">
          <li>Copie o link abaixo.</li>
          <li>Abra uma <strong>janela anônima</strong> (Ctrl+Shift+N) e cole o link.</li>
          <li>Você verá o sistema exatamente como essa pessoa. Esta janela continua no Super Admin.</li>
        </ol>
        <p className="break-all rounded-lg border border-axon-border bg-axon-bg p-3 font-mono text-[11px] text-gray-400">{link}</p>
        <p className="text-xs text-amber-300">O link vale uma única vez e por pouco tempo. O acesso fica no Registro de ações.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { void navigator.clipboard.writeText(link); setCopiado(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black">
            {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? "Copiado" : "Copiar link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AcoesConta({ id, nome, email, ativo, podeEntrar = true }: { id: string; nome: string; email: string; ativo: boolean; podeEntrar?: boolean }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const executar = async (corpo: Record<string, unknown>, sucesso: string) => {
    setOcupado(true);
    setMsg(null);
    let deuCerto = false;
    try {
      const r = await chamar({ id, ...corpo });
      if (r.link) setLink(r.link);
      else setMsg({ ok: true, texto: sucesso });
      deuCerto = true;
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, texto: (e as Error).message });
    }
    setOcupado(false);
    return deuCerto;
  };

  const trocarEmail = async () => {
    const novo = (await pedirTexto({ titulo: "Trocar e-mail", mensagem: `Novo e-mail de acesso de ${nome}:`, rotulo: "E-mail", valor: email, tipo: "email" }))?.toLowerCase();
    if (!novo || novo === email) return;
    if (!(await executar({ acao: "trocar_email", email: novo }, `E-mail alterado para ${novo}.`))) return;
    // Lista filtrada pelo e-mail antigo: passa a buscar pelo novo para a pessoa continuar na tela
    const params = new URLSearchParams(window.location.search);
    if (params.get("q")?.toLowerCase() === email.toLowerCase()) {
      params.set("q", novo);
      router.replace(`?${params}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ocupado && <Loader2 size={14} className="animate-spin text-gray-400" />}
      <button type="button" disabled={ocupado} onClick={trocarEmail} className={`${botao} text-gray-300`} title="Trocar e-mail"><Mail size={12} /> E-mail</button>
      <button type="button" disabled={ocupado} onClick={() => executar({ acao: "reenviar_acesso" }, "Link de acesso enviado.")} className={`${botao} text-gray-300`} title="Reenviar acesso"><KeyRound size={12} /> Acesso</button>
      {podeEntrar && <button type="button" disabled={ocupado || !ativo} onClick={() => executar({ acao: "entrar_como" }, "")} className={`${botao} text-sky-300`} title="Entrar como"><LogIn size={12} /> Entrar como</button>}
      <button type="button" disabled={ocupado} onClick={async () => (await confirmar(ativo ? `Bloquear o acesso de ${nome}?` : `Desbloquear ${nome}?`)) && executar({ acao: "bloquear_usuario", ativo: !ativo }, ativo ? "Conta bloqueada." : "Conta desbloqueada.")}
        className={`${botao} ${ativo ? "text-red-300" : "text-emerald-300"}`}><Ban size={12} /> {ativo ? "Bloquear" : "Desbloquear"}</button>
      {msg && <span className={`basis-full text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.texto}</span>}
      {link && <JanelaEntrarComo link={link} nome={nome} onFechar={() => setLink(null)} />}
    </div>
  );
}

// Bloquear/desbloquear produtora ou grupo inteiro (+ entrar como o responsável)
export function AcoesOrganizacao({ tipo, id, nome, ativo, responsavelId }: { tipo: "produtora" | "grupo"; id: string; nome: string; ativo: boolean; responsavelId: string | null }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const bloquear = async () => {
    const aviso = tipo === "produtora"
      ? `Bloquear ${nome}? A equipe perde o acesso e as páginas dos eventos saem do ar.`
      : `Bloquear ${nome}? As contas do grupo perdem o acesso.`;
    if (!(await confirmar(ativo ? aviso : `Desbloquear ${nome}?`))) return;
    setOcupado(true);
    setMsg(null);
    try {
      await chamar({ acao: tipo === "produtora" ? "bloquear_produtora" : "bloquear_grupo", id, ativo: !ativo });
      setMsg({ ok: true, texto: ativo ? "Bloqueado." : "Desbloqueado." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, texto: (e as Error).message });
    }
    setOcupado(false);
  };

  const entrar = async () => {
    if (!responsavelId) return;
    setOcupado(true);
    try {
      const r = await chamar({ acao: "entrar_como", id: responsavelId });
      if (r.link) setLink(r.link);
    } catch (e) {
      setMsg({ ok: false, texto: (e as Error).message });
    }
    setOcupado(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {ocupado && <Loader2 size={14} className="animate-spin text-gray-400" />}
      {responsavelId && <button type="button" disabled={ocupado || !ativo} onClick={entrar} className={`${botao} text-sky-300`}><ExternalLink size={12} /> Entrar como</button>}
      <button type="button" disabled={ocupado} onClick={bloquear} className={`${botao} ${ativo ? "text-red-300" : "text-emerald-300"}`}><Ban size={12} /> {ativo ? "Bloquear" : "Desbloquear"}</button>
      {msg && <span className={`basis-full text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.texto}</span>}
      {link && <JanelaEntrarComo link={link} nome={nome} onFechar={() => setLink(null)} />}
    </div>
  );
}
