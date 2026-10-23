"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, Loader2, Search, Trash2, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BASE_PATH } from "@/lib/base-path";
import { TIPOS_TERMO, modeloTermo, type TipoTermo } from "@/lib/termos";
import { confirmar, useAvisoNaoSalvo } from "@/app/_components/Dialogos";
import { EditorTexto } from "@/app/_components/EditorTexto";

export interface DocumentoTermo {
  id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
  ativo: boolean;
  versao: number;
  atualizado_em: string;
}

export interface Assinatura {
  id: string;
  nome: string;
  grupo: string;
  assinado: boolean;
  assinadoEm: string | null;
  menor: boolean;
  responsavel: string | null;
}

type Aba = TipoTermo | "assinaturas";

const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function Editor({ tipo, documento, evento, produtoraId, produtora, onSalvo }: {
  tipo: TipoTermo;
  documento: DocumentoTermo | undefined;
  evento: { id: string; nome: string; slug: string | null };
  produtoraId: string;
  produtora: { nome: string; documento: string | null; cidade: string | null };
  onSalvo: (texto: string) => void;
}) {
  const info = TIPOS_TERMO.find((t) => t.tipo === tipo)!;
  const editor = useRef<HTMLDivElement>(null);
  const [titulo, setTitulo] = useState(documento?.titulo ?? info.nome);
  const [publicado, setPublicado] = useState(documento?.ativo ?? true);
  const [vazio, setVazio] = useState(!documento?.conteudo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mexeu, setMexeu] = useState(false);
  useAvisoNaoSalvo(mexeu);

  const usarModelo = async () => {
    if (!editor.current) return;
    if (editor.current.innerText.trim() && !(await confirmar("Substituir o texto atual pelo modelo?"))) return;
    editor.current.innerHTML = modeloTermo(tipo, { festival: evento.nome, produtora: produtora.nome, documento: produtora.documento, cidade: produtora.cidade });
    setVazio(false);
    setMexeu(true);
  };

  const salvar = async () => {
    const conteudo = editor.current?.innerHTML.trim() ?? "";
    if (!titulo.trim()) return setErro("Informe o título.");
    if (!editor.current?.innerText.trim()) return setErro("Escreva o texto do documento (ou use o modelo).");
    setSalvando(true);
    setErro(null);
    const supabase = createClient();
    const dados = {
      titulo: titulo.trim(), conteudo, ativo: publicado, formato: "html", atualizado_em: new Date().toISOString(),
      versao: documento ? documento.versao + (documento.conteudo === conteudo ? 0 : 1) : 1,
    };
    const { error } = documento
      ? await supabase.from("termos_documentos").update(dados).eq("id", documento.id)
      : await supabase.from("termos_documentos").insert({ ...dados, tipo, evento_id: evento.id, produtora_id: produtoraId });
    setSalvando(false);
    if (error) return setErro(error.message);
    setMexeu(false);
    onSalvo(publicado ? "Documento salvo e publicado na página do evento." : "Documento salvo como rascunho (não aparece na página do evento).");
  };

  const excluir = async () => {
    if (!documento || !(await confirmar(`Excluir “${documento.titulo}”?`))) return;
    const { error } = await createClient().from("termos_documentos").delete().eq("id", documento.id);
    if (error) return setErro(error.message);
    onSalvo("Documento excluído.");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">{info.descricao} {documento && <span className="text-gray-500">· versão {documento.versao}, atualizado em {dataHora(documento.atualizado_em)}</span>}</p>
      <label className="block">
        <span className="text-xs text-gray-400">Título</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150}
          className="mt-1.5 w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold" />
      </label>
      <EditorTexto ref={editor} valorInicial={documento?.conteudo ?? ""} rotulo={`Texto do ${info.nome}`} altura="min-h-[320px]"
        onMudar={(_, v) => { setVazio(v); setMexeu(true); }}
        acoes={<button type="button" onClick={usarModelo} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-axon-gold hover:bg-axon-gold/10"><Wand2 size={13} /> Usar modelo</button>} />
      {vazio && <p className="text-xs text-gray-500">Escreva o texto ou clique em “Usar modelo”. O modelo já vem com o nome do evento e da produtora; revise os trechos entre colchetes [ ] e adapte ao seu festival.</p>}
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} className="accent-[#d4af37]" />
        Mostrar na página pública do evento (seção “Regulamento e Diretrizes”)
      </label>
      {erro && <p className="text-sm text-red-300">{erro}</p>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {documento && <button type="button" onClick={excluir} className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-red-300"><Trash2 size={14} /> Excluir</button>}
        {evento.slug && documento?.ativo && (
          <a href={`${BASE_PATH}/e/${evento.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white"><ExternalLink size={14} /> Ver na página</a>
        )}
        <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
          {salvando && <Loader2 size={15} className="animate-spin" />} Salvar
        </button>
      </div>
    </div>
  );
}

function Assinaturas({ lista }: { lista: Assinatura[] }) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const filtrados = termo ? lista.filter((a) => a.nome.toLowerCase().includes(termo) || a.grupo.toLowerCase().includes(termo)) : lista;
  const assinados = lista.filter((a) => a.assinado).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Pessoas no elenco das apresentações deste evento e se já aceitaram o termo de participação (pelo link que recebem por e-mail quando o grupo as cadastra).
        O texto desse termo fica em <Link href="/configuracoes" className="text-axon-gold hover:underline">Configurações</Link>.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { rotulo: "No elenco", valor: lista.length, cor: "text-white" },
          { rotulo: "Assinaram", valor: assinados, cor: "text-emerald-300" },
          { rotulo: "Pendentes", valor: lista.length - assinados, cor: "text-amber-300" },
        ].map((k) => (
          <div key={k.rotulo} className="rounded-xl border border-axon-border bg-axon-bg p-4 text-center">
            <p className={`text-2xl font-semibold tabular-nums ${k.cor}`}>{k.valor}</p>
            <p className="mt-1 text-xs text-gray-500">{k.rotulo}</p>
          </div>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-10 text-center text-sm text-gray-400">Ninguém no elenco deste evento ainda.</p>
      ) : (
        <>
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa ou grupo"
              className="w-full rounded-lg border border-axon-border bg-axon-bg py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-axon-gold" />
          </label>
          <ul className="divide-y divide-axon-border rounded-xl border border-axon-border">
            {filtrados.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.nome}{a.menor && <span className="ml-2 text-xs text-gray-500">menor de idade</span>}</p>
                  <p className="text-xs text-gray-500">{a.grupo}{a.assinado && a.menor && a.responsavel ? ` · responsável: ${a.responsavel}` : ""}</p>
                </div>
                {a.assinado ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-300">
                    <CheckCircle2 size={12} /> Assinado{a.assinadoEm ? ` em ${new Date(a.assinadoEm).toLocaleDateString("pt-BR")}` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300"><Clock size={12} /> Pendente</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function Termos({ eventos, evento, produtoraId, produtora, documentos, assinaturas }: {
  eventos: { id: string; nome: string }[];
  evento: { id: string; nome: string; slug: string | null };
  produtoraId: string;
  produtora: { nome: string; documento: string | null; cidade: string | null };
  documentos: DocumentoTermo[];
  assinaturas: Assinatura[];
}) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("regulamento");
  const [aviso, setAviso] = useState<string | null>(null);
  const doc = (t: string) => documentos.find((d) => d.tipo === t);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Termos</h1>
          <p className="mt-1 text-sm text-gray-400">Regulamento e autorizações de cada evento. O regulamento em PDF (opcional) é enviado em Evento → Dados.</p>
        </div>
        <select value={evento.id} aria-label="Evento" onChange={(e) => router.push(`/termos?evento=${e.target.value}`)}
          className="rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white">
          {eventos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
      </div>

      {aviso && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{aviso}</p>}

      <div className="rounded-xl border border-axon-border bg-axon-panel">
        <div className="flex overflow-x-auto border-b border-axon-border px-2">
          {[...TIPOS_TERMO.map((t) => ({ id: t.tipo as Aba, nome: t.nome, status: doc(t.tipo) ? (doc(t.tipo)!.ativo ? "publicado" : "rascunho") : "" })), { id: "assinaturas" as Aba, nome: "Assinaturas", status: "" }].map((t) => (
            <button key={t.id} type="button" onClick={() => { setAba(t.id); setAviso(null); }}
              className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-sm ${aba === t.id ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
              {t.nome}
              {t.status && <span className={`ml-2 text-[11px] ${t.status === "publicado" ? "text-emerald-400" : "text-gray-500"}`}>{t.status}</span>}
            </button>
          ))}
        </div>
        <div className="p-5">
          {aba === "assinaturas" ? (
            <Assinaturas lista={assinaturas} />
          ) : (
            <Editor key={`${evento.id}-${aba}`} tipo={aba} documento={doc(aba)} evento={evento} produtoraId={produtoraId} produtora={produtora}
              onSalvo={(texto) => { setAviso(texto); router.refresh(); }} />
          )}
        </div>
      </div>
    </div>
  );
}
