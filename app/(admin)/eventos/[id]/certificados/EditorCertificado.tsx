"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { apiUrl, BASE_PATH } from "@/lib/base-path";
import { mensagemEnvio, uploadFiles } from "@/utils/uploadthing";
import { CAMPOS_CERTIFICADO, TEXTO_PADRAO_CERTIFICADO, type DadosCertificado, type ModeloCertificado } from "@/lib/certificados";
import { FolhaCertificado } from "@/app/_components/Certificado";
import { useAvisoNaoSalvo } from "@/app/_components/Dialogos";
import { Aviso, Cartao, Rotulo, campo } from "../_ui";

export function EditorCertificado({ eventoId, slug, inicial, liberado: liberadoInicial, checkins, exemplo }: {
  eventoId: string;
  slug: string | null;
  inicial: ModeloCertificado;
  liberado: boolean;
  checkins: number;
  exemplo: DadosCertificado;
}) {
  const router = useRouter();
  const [m, setM] = useState<ModeloCertificado>(inicial);
  const [liberado, setLiberado] = useState(liberadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const texto = useRef<HTMLTextAreaElement>(null);
  const atual = useMemo(() => JSON.stringify({ m, liberado }), [m, liberado]);
  const [salvo, setSalvo] = useState(atual);
  useAvisoNaoSalvo(atual !== salvo);

  const inserirCampo = (chave: string) => {
    const el = texto.current;
    if (!el) return setM({ ...m, texto: m.texto + chave });
    const ini = el.selectionStart, fim = el.selectionEnd;
    setM({ ...m, texto: m.texto.slice(0, ini) + chave + m.texto.slice(fim) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(ini + chave.length, ini + chave.length); });
  };

  const enviarFundo = async (file?: File) => {
    if (!file) return;
    setEnviando(true);
    setMsg(null);
    try {
      const [r] = await uploadFiles("imageUploader", { files: [file] });
      if (!r) throw new Error("Falha no envio.");
      setM({ ...m, fundo_url: r.ufsUrl });
    } catch (e) {
      setMsg({ tipo: "erro", texto: mensagemEnvio(e) });
    }
    setEnviando(false);
  };

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    const res = await fetch(apiUrl("/api/certificados"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "modelo", evento_id: eventoId, ...m, liberado }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSalvando(false);
    if (!res.ok) return setMsg({ tipo: "erro", texto: json.error ?? "Não foi possível salvar." });
    setSalvo(atual);
    setMsg({ tipo: "ok", texto: liberado ? "Modelo salvo. Os certificados estão liberados para download." : "Modelo salvo (certificados ainda não liberados)." });
    router.refresh();
  };

  const assinatura = (i: number, k: "nome" | "cargo", v: string) =>
    setM({ ...m, assinaturas: m.assinaturas.map((a, j) => (j === i ? { ...a, [k]: v } : a)) });

  return (
    <div className="space-y-4">
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      <Cartao titulo="Certificados de participação"
        descricao="Cada pessoa recebe um certificado por apresentação em que fez check-in. Ela baixa informando CPF e data de nascimento na página de certificados.">
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Rotulo texto="Título"><input value={m.titulo} onChange={(e) => setM({ ...m, titulo: e.target.value })} maxLength={80} className={campo} /></Rotulo>
            <Rotulo texto="Cor">
              <input type="color" value={m.cor} onChange={(e) => setM({ ...m, cor: e.target.value })} className="h-[42px] w-full cursor-pointer rounded-lg border border-axon-border bg-axon-bg" />
            </Rotulo>
          </div>
          <div>
            <Rotulo texto="Texto">
              <textarea ref={texto} rows={4} value={m.texto} onChange={(e) => setM({ ...m, texto: e.target.value })} maxLength={1200} className={`${campo} resize-y`} />
            </Rotulo>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-gray-500">Inserir:</span>
              {CAMPOS_CERTIFICADO.map((c) => (
                <button key={c.chave} type="button" title={c.descricao} onClick={() => inserirCampo(c.chave)}
                  className="rounded-full border border-axon-border px-2 py-0.5 font-mono text-[11px] text-gray-300 hover:border-axon-gold hover:text-axon-gold">{c.chave}</button>
              ))}
              <button type="button" onClick={() => setM({ ...m, texto: TEXTO_PADRAO_CERTIFICADO })} className="ml-auto text-[11px] text-axon-gold hover:underline">Restaurar texto padrão</button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">Fundo (opcional): uma imagem deitada, tamanho A4 (ex.: 3508 × 2480). Sem fundo, o certificado usa uma moldura na cor escolhida.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-axon-border px-3 py-1.5 text-xs text-gray-200">
                {enviando ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />} {m.fundo_url ? "Trocar fundo" : "Enviar fundo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => enviarFundo(e.target.files?.[0])} />
              </label>
              {m.fundo_url && <button type="button" onClick={() => setM({ ...m, fundo_url: null })} className="text-xs text-gray-500 hover:text-red-300">Remover fundo</button>}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">Assinaturas (até 3)</p>
            <div className="mt-2 space-y-2">
              {m.assinaturas.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <input value={a.nome} onChange={(e) => assinatura(i, "nome", e.target.value)} placeholder="Nome" maxLength={80} className={campo} />
                  <input value={a.cargo} onChange={(e) => assinatura(i, "cargo", e.target.value)} placeholder="Cargo (ex.: Direção do festival)" maxLength={80} className={campo} />
                  <button type="button" aria-label="Remover assinatura" onClick={() => setM({ ...m, assinaturas: m.assinaturas.filter((_, j) => j !== i) })} className="px-2 text-gray-500 hover:text-red-300"><Trash2 size={15} /></button>
                </div>
              ))}
              {m.assinaturas.length < 3 && (
                <button type="button" onClick={() => setM({ ...m, assinaturas: [...m.assinaturas, { nome: "", cargo: "" }] })} className="inline-flex items-center gap-1 text-xs text-axon-gold hover:underline"><Plus size={13} /> Adicionar assinatura</button>
              )}
            </div>
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-gray-200">
            <input type="checkbox" checked={liberado} onChange={(e) => setLiberado(e.target.checked)} className="mt-0.5 accent-[#d4af37]" />
            <span>Liberar certificados para download<span className="block text-xs text-gray-500">{checkins} check-in(s) registrados neste evento = {checkins} certificado(s).</span></span>
          </label>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href={`${BASE_PATH}/certificados${slug ? `?evento=${slug}` : ""}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white"><ExternalLink size={14} /> Página de certificados</a>
            <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar modelo
            </button>
          </div>
        </div>
      </Cartao>
      <Cartao titulo="Prévia" descricao="Com dados de exemplo.">
        <div className="p-4"><FolhaCertificado modelo={m} dados={exemplo} codigo="ABCD-2345" /></div>
      </Cartao>
    </div>
  );
}
