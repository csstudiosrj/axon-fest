"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadFiles } from "@/utils/uploadthing";
import { STATUS_EVENTO, infoStatus } from "@/lib/eventos/status";
import { slugificar } from "@/lib/eventos/slug";
import { urlAbsoluta } from "@/lib/base-path";
import { SeletorPerfil } from "../../../_components/SeletorPerfil";
import type { EventoPainel } from "@/lib/eventos/painel";
import { Aviso, Cartao, Rotulo, campo } from "../_ui";

const FORMATOS = [
  { valor: "competitivo", nome: "Competitivo", ajuda: "Jurados avaliam e há classificação." },
  { valor: "mostra", nome: "Mostra", ajuda: "Sem avaliação nem classificação." },
  { valor: "misto", nome: "Misto", ajuda: "Algumas categorias competem, outras são mostra." },
];
const PREMIACOES = [
  { valor: "apenas_trofeus_e_medalhas", nome: "Troféus e medalhas" },
  { valor: "com_premiacao_dinheiro", nome: "Inclui prêmios em dinheiro" },
  { valor: "sem_premiacao", nome: "Sem premiação" },
];

function Enviar({ rotulo, tipo, url, onEnviado, disabled }: {
  rotulo: string; tipo: "imagem" | "pdf"; url: string | null; onEnviado: (url: string | null) => void; disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const enviar = async (file?: File) => {
    if (!file) return;
    setEnviando(true);
    setErro(null);
    try {
      const [r] = await uploadFiles(tipo === "imagem" ? "imageUploader" : "arquivoTecnico", { files: [file] });
      if (!r) throw new Error("Falha no envio.");
      onEnviado(r.ufsUrl);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no envio.");
    }
    setEnviando(false);
  };
  return (
    <div className="rounded-lg border border-axon-border bg-axon-bg p-3">
      <p className="text-xs text-gray-400">{rotulo}</p>
      <div className="mt-2 flex items-center gap-3">
        {url ? (
          tipo === "imagem"
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={url} alt="" className="h-12 w-12 rounded-md border border-axon-border object-cover" />
            : <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-axon-gold hover:underline"><FileText size={14} /> Ver arquivo</a>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-axon-border text-gray-600">{tipo === "imagem" ? <ImageIcon size={16} /> : <FileText size={16} />}</span>
        )}
        <input ref={input} type="file" hidden accept={tipo === "imagem" ? "image/png,image/jpeg,image/webp" : "application/pdf"} onChange={(e) => enviar(e.target.files?.[0])} />
        <button type="button" disabled={disabled || enviando} onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-1.5 text-xs text-gray-200 disabled:opacity-40">
          {enviando ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {url ? "Trocar" : "Enviar"}
        </button>
        {url && !disabled && <button type="button" onClick={() => onEnviado(null)} className="text-xs text-gray-500 hover:text-red-300">Remover</button>}
      </div>
      {erro && <p className="mt-1 text-xs text-red-300">{erro}</p>}
    </div>
  );
}

export function DadosEvento({ evento, podeGerir, temInscricoes }: { evento: EventoPainel; podeGerir: boolean; temInscricoes: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    nome: evento.nome,
    perfil_id: evento.perfil_id,
    formato: evento.formato ?? "competitivo",
    tipo_premiacao: evento.tipo_premiacao ?? "apenas_trofeus_e_medalhas",
    data_inicio: evento.data_inicio ?? "",
    data_fim: evento.data_fim ?? "",
    local: evento.local ?? "",
    descricao: evento.descricao ?? "",
    status: evento.status ?? "Em Montagem",
    slug: evento.slug ?? "",
    cor_primaria: evento.cor_primaria ?? "#d4af37",
    tema_escuro: evento.tema_escuro ?? true,
    logo_url: evento.logo_url,
    banner_url: evento.banner_url,
    regulamento_url: evento.regulamento_url,
  });
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const slug = slugificar(f.slug);
    if (!f.nome.trim()) return setMsg({ tipo: "erro", texto: "Informe o nome do evento." });
    if (!slug) return setMsg({ tipo: "erro", texto: "Informe o endereço da página pública." });
    if (f.data_inicio && f.data_fim && f.data_fim < f.data_inicio) return setMsg({ tipo: "erro", texto: "A data de fim é anterior à de início." });
    setSalvando(true);
    const { error } = await createClient().from("eventos").update({
      nome: f.nome.trim(), perfil_id: f.perfil_id, formato: f.formato, tipo_premiacao: f.tipo_premiacao,
      data_inicio: f.data_inicio || null, data_fim: f.data_fim || null, local: f.local.trim() || null,
      descricao: f.descricao.trim() || null, status: f.status, slug, cor_primaria: f.cor_primaria, tema_escuro: f.tema_escuro,
      logo_url: f.logo_url, banner_url: f.banner_url, regulamento_url: f.regulamento_url,
    }).eq("id", evento.id);
    setSalvando(false);
    if (error) {
      setMsg({ tipo: "erro", texto: error.code === "23505" ? "Este endereço de página já está em uso. Escolha outro." : error.message });
      return;
    }
    set("slug", slug);
    setMsg({ tipo: "ok", texto: "Alterações salvas." });
    router.refresh();
  };

  const excluir = async () => {
    const digitado = window.prompt(`Excluir o evento apaga categorias, inscrições, notas e resultados. Para confirmar, digite o nome do evento:\n${evento.nome}`);
    if (digitado === null) return;
    if (digitado.trim() !== evento.nome.trim()) return setMsg({ tipo: "erro", texto: "Nome digitado não confere. Nada foi apagado." });
    const { error } = await createClient().from("eventos").delete().eq("id", evento.id);
    if (error) return setMsg({ tipo: "erro", texto: error.message });
    router.push("/eventos");
  };

  const dis = !podeGerir;
  return (
    <form onSubmit={salvar} className="space-y-5">
      {!podeGerir && <Aviso tipo="info">Somente a gestão da produtora (admin e produtor) altera os dados do evento.</Aviso>}

      <Cartao titulo="Situação do evento">
        <div className="grid gap-4 px-5 py-5 md:grid-cols-[260px_1fr]">
          <select value={f.status} onChange={(e) => set("status", e.target.value)} disabled={dis} className={campo} aria-label="Situação">
            {STATUS_EVENTO.map((s) => <option key={s} value={s}>{infoStatus(s).rotulo}</option>)}
          </select>
          <p className={`rounded-lg border px-3 py-2 text-sm ${infoStatus(f.status).cor}`}>{infoStatus(f.status).explicacao}</p>
        </div>
      </Cartao>

      <Cartao titulo="Informações">
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          <div className="md:col-span-2"><Rotulo texto="Nome do evento"><input required value={f.nome} onChange={(e) => set("nome", e.target.value)} disabled={dis} maxLength={140} className={campo} /></Rotulo></div>
          <Rotulo texto="Tipo de festival" ajuda={temInscricoes ? "Já há inscrições: mudar o tipo muda o vocabulário e os arquivos pedidos aos grupos." : "Define o vocabulário e os arquivos técnicos pedidos."}>
            <SeletorPerfil valor={f.perfil_id} disabled={dis} onChange={(p) => set("perfil_id", p.id)} />
          </Rotulo>
          <Rotulo texto="Formato" ajuda={FORMATOS.find((x) => x.valor === f.formato)?.ajuda}>
            <select value={f.formato} onChange={(e) => set("formato", e.target.value)} disabled={dis} className={campo}>
              {FORMATOS.map((x) => <option key={x.valor} value={x.valor}>{x.nome}</option>)}
            </select>
          </Rotulo>
          <Rotulo texto="Data de início"><input type="date" value={f.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} disabled={dis} className={campo} style={{ colorScheme: "dark" }} /></Rotulo>
          <Rotulo texto="Data de fim"><input type="date" value={f.data_fim} onChange={(e) => set("data_fim", e.target.value)} disabled={dis} className={campo} style={{ colorScheme: "dark" }} /></Rotulo>
          <Rotulo texto="Local"><input value={f.local} onChange={(e) => set("local", e.target.value)} disabled={dis} maxLength={160} placeholder="Ex.: Teatro Municipal de Niterói" className={campo} /></Rotulo>
          <Rotulo texto="Premiação">
            <select value={f.tipo_premiacao} onChange={(e) => set("tipo_premiacao", e.target.value)} disabled={dis} className={campo}>
              {PREMIACOES.map((x) => <option key={x.valor} value={x.valor}>{x.nome}</option>)}
            </select>
          </Rotulo>
          <div className="md:col-span-2"><Rotulo texto="Descrição (aparece na página pública)"><textarea rows={4} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} disabled={dis} maxLength={4000} className={`${campo} resize-y`} /></Rotulo></div>
        </div>
      </Cartao>

      <Cartao titulo="Página pública" descricao="Endereço, identidade visual e regulamento.">
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Rotulo texto="Endereço da página" ajuda={`${urlAbsoluta("/e/")}${slugificar(f.slug) || "…"}`}>
              <input value={f.slug} onChange={(e) => set("slug", e.target.value)} disabled={dis} maxLength={60} className={campo} />
            </Rotulo>
          </div>
          <Rotulo texto="Cor principal">
            <div className="flex items-center gap-2">
              <input type="color" value={f.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} disabled={dis} className="h-10 w-14 rounded border border-axon-border bg-transparent" />
              <input value={f.cor_primaria} onChange={(e) => set("cor_primaria", e.target.value)} disabled={dis} maxLength={7} className={campo} />
            </div>
          </Rotulo>
          <Rotulo texto="Tema">
            <select value={f.tema_escuro ? "escuro" : "claro"} onChange={(e) => set("tema_escuro", e.target.value === "escuro")} disabled={dis} className={campo}>
              <option value="escuro">Escuro</option>
              <option value="claro">Claro</option>
            </select>
          </Rotulo>
          <Enviar rotulo="Logo (quadrada)" tipo="imagem" url={f.logo_url} onEnviado={(u) => set("logo_url", u)} disabled={dis} />
          <Enviar rotulo="Banner (largo, topo da página)" tipo="imagem" url={f.banner_url} onEnviado={(u) => set("banner_url", u)} disabled={dis} />
          <div className="md:col-span-2"><Enviar rotulo="Regulamento (PDF)" tipo="pdf" url={f.regulamento_url} onEnviado={(u) => set("regulamento_url", u)} disabled={dis} /></div>
        </div>
      </Cartao>

      {podeGerir && (
        <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-4 rounded-xl border border-axon-border bg-axon-panel/95 px-5 py-3 backdrop-blur">
          <span className="text-sm">{msg && <span className={msg.tipo === "ok" ? "text-emerald-300" : "text-red-300"}>{msg.texto}</span>}</span>
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-5 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar alterações
          </button>
        </div>
      )}

      {podeGerir && (
        <Cartao titulo="Excluir evento" descricao="Apaga o evento e tudo que está ligado a ele. Não dá para desfazer.">
          <div className="px-5 py-4">
            <button type="button" onClick={excluir} className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10">
              <Trash2 size={14} /> Excluir evento
            </button>
          </div>
        </Cartao>
      )}
    </form>
  );
}
