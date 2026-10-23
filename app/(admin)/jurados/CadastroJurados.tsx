"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Mail, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { apiUrl } from "@/lib/base-path";
import { mascaraTelefone } from "@/lib/mascaras";
import { mensagemEnvio, uploadFiles } from "@/utils/uploadthing";
import type { JuradoEquipe as Membro } from "@/lib/equipe";
import { confirmar } from "@/app/_components/Dialogos";

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

async function chamar(corpo: Record<string, unknown>) {
  const res = await fetch(apiUrl("/api/invite"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const json = (await res.json().catch(() => ({}))) as { error?: string; desativado?: boolean; vinculado?: boolean; convitePendente?: boolean; desvinculado?: boolean };
  if (!res.ok) throw new Error(json.error ?? "Não foi possível concluir.");
  return json;
}

function Avatar({ nome, foto, tamanho = 48 }: { nome: string; foto: string | null; tamanho?: number }) {
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt={nome} width={tamanho} height={tamanho} className="shrink-0 rounded-full object-cover" style={{ width: tamanho, height: tamanho }} />;
  }
  const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-axon-gold/15 text-sm font-semibold text-axon-gold" style={{ width: tamanho, height: tamanho }}>
      {iniciais}
    </span>
  );
}

function EditarPerfil({ jurado, onFechar, onSalvo }: { jurado: Membro; onFechar: () => void; onSalvo: () => void }) {
  const [f, setF] = useState({
    nome: jurado.nome ?? "",
    telefone: mascaraTelefone(jurado.telefone),
    especialidade: jurado.especialidade ?? "",
    mini_bio: jurado.mini_bio ?? "",
    foto_url: jurado.foto_url,
  });
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const trocarFoto = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErro("Use uma foto JPG, PNG ou WebP.");
    setEnviandoFoto(true);
    setErro(null);
    try {
      const [r] = await uploadFiles("imageUploader", { files: [file] });
      if (!r) throw new Error("Falha no envio da foto.");
      setF((atual) => ({ ...atual, foto_url: r.ufsUrl }));
    } catch (e) {
      setErro(mensagemEnvio(e));
    }
    setEnviandoFoto(false);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nome.trim()) return setErro("Informe o nome.");
    setSalvando(true);
    setErro(null);
    try {
      await chamar({ action: "perfil", userId: jurado.id, ...f });
      onSalvo();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">Perfil do jurado</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="text-xs text-gray-500">Foto, nome, especialidade e mini bio aparecem na página pública dos eventos em que o jurado está escalado.</p>
          <div className="flex items-center gap-4">
            <Avatar nome={f.nome || jurado.email} foto={f.foto_url} tamanho={72} />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:border-axon-gold">
                {enviandoFoto ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {f.foto_url ? "Trocar foto" : "Enviar foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={enviandoFoto} onChange={(e) => trocarFoto(e.target.files?.[0])} />
              </label>
              {f.foto_url && (
                <button type="button" onClick={() => setF({ ...f, foto_url: null })} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white">Remover</button>
              )}
            </div>
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">Nome</span>
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} maxLength={200} className={`${campo} mt-1.5`} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-400">Especialidade</span>
              <input value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} maxLength={80} placeholder="Ex.: Ballet clássico" className={`${campo} mt-1.5`} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Telefone (não aparece no site)</span>
              <input inputMode="tel" placeholder="(00) 00000-0000" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascaraTelefone(e.target.value) })} className={`${campo} mt-1.5`} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-400">Mini bio ({f.mini_bio.length}/300)</span>
            <textarea rows={4} value={f.mini_bio} onChange={(e) => setF({ ...f, mini_bio: e.target.value.slice(0, 300) })} className={`${campo} mt-1.5 resize-y`} />
          </label>
          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300">Cancelar</button>
          <button type="submit" disabled={salvando || enviandoFoto} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando && <Loader2 size={15} className="animate-spin" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export function CadastroJurados({ jurados, eventos, podeGerir }: {
  jurados: Membro[];
  eventos: Record<string, { id: string; nome: string }[]>;
  podeGerir: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState({ nome: "", email: "", especialidade: "" });
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<Membro | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const executar = async (id: string, corpo: Record<string, unknown>, sucesso: string) => {
    setOcupado(id);
    setAviso(null);
    try {
      const r = await chamar({ userId: id, ...corpo });
      setAviso({ ok: true, texto: r.desativado ? "O jurado já tem notas lançadas e foi desativado em vez de excluído." : r.desvinculado ? "Jurado retirado da sua equipe." : sucesso });
      router.refresh();
    } catch (e) {
      setAviso({ ok: false, texto: (e as Error).message });
    }
    setOcupado(null);
  };

  const convidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setAviso(null);
    try {
      const r = await chamar({ action: "invite", role: "jurado", email: f.email, nome: f.nome || undefined, especialidade: f.especialidade || undefined });
      setAviso({ ok: true, texto: r.convitePendente
        ? `${f.email} já é jurado(a) no ARXUM Fest. Enviamos o convite: assim que aceitar, aparece pronto para escalar.`
        : r.vinculado ? `${f.email} já tinha conta de jurado e foi ligado(a) à sua produtora.` : `Convite enviado para ${f.email}. O jurado cria a senha pelo link do e-mail.` });
      setF({ nome: "", email: "", especialidade: "" });
      router.refresh();
    } catch (err) {
      setAviso({ ok: false, texto: (err as Error).message });
    }
    setEnviando(false);
  };

  return (
    <div className="space-y-6">
      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>{aviso.texto}</p>}

      {podeGerir ? (
        <form onSubmit={convidar} className="rounded-xl border border-axon-border bg-axon-panel p-5">
          <h2 className="font-semibold text-white">Convidar jurado</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome" maxLength={200} className={campo} />
            <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="E-mail" className={campo} />
            <input value={f.especialidade} onChange={(e) => setF({ ...f, especialidade: e.target.value })} placeholder="Especialidade (opcional)" maxLength={80} className={campo} />
            <button type="submit" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50">
              {enviando ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Convidar
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">O jurado recebe um e-mail para criar a senha. Ele só enxerga a avaliação dos eventos em que for escalado.</p>
        </form>
      ) : (
        <p className="rounded-lg border border-axon-border px-4 py-3 text-sm text-gray-400">Somente o admin da produtora convida e edita jurados. Você pode escalá-los nos eventos.</p>
      )}

      <section className="rounded-xl border border-axon-border bg-axon-panel">
        <h2 className="border-b border-axon-border px-5 py-3.5 font-semibold text-white">Jurados ({jurados.length})</h2>
        {jurados.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">Nenhum jurado cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {jurados.map((j) => {
              const nome = j.nome ?? j.email;
              const evs = eventos[j.id] ?? [];
              return (
                <li key={j.id} className={`flex flex-wrap items-start gap-4 px-5 py-4 ${j.ativo ? "" : "opacity-50"}`}>
                  <Avatar nome={nome} foto={j.foto_url} />
                  <div className="min-w-[220px] flex-1">
                    <p className="font-medium text-white">{nome}</p>
                    <p className="text-xs text-gray-500">
                      {j.especialidade ? `${j.especialidade} · ` : ""}{j.email} · {j.vinculo === "pendente" ? "aguardando aceitar o convite" : j.vinculo === "recusado" ? "recusou o convite" : !j.ativo ? "acesso desativado" : j.pendente ? "ainda não acessou" : `último acesso ${new Date(j.ultimoAcesso!).toLocaleDateString("pt-BR")}`}
                    </p>
                    {j.mini_bio && <p className="mt-1.5 line-clamp-2 text-sm text-gray-300">{j.mini_bio}</p>}
                    <p className="mt-1.5 text-xs text-gray-400">
                      {evs.length === 0 ? "Não escalado em nenhum evento." : (
                        <>Escalado em: {evs.map((ev, i) => (
                          <span key={ev.id}>{i > 0 && ", "}<Link href={`/eventos/${ev.id}/jurados`} className="text-axon-gold hover:underline">{ev.nome}</Link></span>
                        ))}</>
                      )}
                    </p>
                  </div>
                  {podeGerir && (
                    <span className="flex items-center gap-1">
                      {ocupado === j.id && <Loader2 size={14} className="animate-spin text-gray-400" />}
                      {j.origem && <button type="button" onClick={() => setEditando(j)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-200 hover:bg-white/5"><Pencil size={12} /> Perfil</button>}
                      {j.origem && j.pendente && j.ativo && (
                        <button type="button" onClick={() => executar(j.id, { action: "reenviar" }, "Link de acesso reenviado.")} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-axon-gold hover:bg-axon-gold/10"><Mail size={12} /> Reenviar</button>
                      )}
                      {j.origem && <button type="button" onClick={() => executar(j.id, { action: "ativo", ativo: !j.ativo }, j.ativo ? "Acesso desativado." : "Acesso reativado.")}
                        className="rounded-lg px-2 py-1.5 text-xs text-gray-300 hover:bg-white/5">{j.ativo ? "Desativar" : "Reativar"}</button>}
                      <button type="button" title="Excluir" onClick={async () => (await confirmar(j.origem ? `Excluir o jurado ${nome}? Se já tiver notas lançadas ou trabalhar com outras produtoras, ele só sai da sua equipe.` : `Tirar ${nome} da sua equipe?`)) && executar(j.id, { action: "remove" }, "Jurado excluído.")}
                        className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editando && <EditarPerfil jurado={editando} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); setAviso({ ok: true, texto: "Perfil salvo." }); router.refresh(); }} />}
    </div>
  );
}
