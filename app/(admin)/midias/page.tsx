"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, CloudOff, Download, ExternalLink, FileArchive, HardDriveDownload,
  Loader2, Music, RefreshCw, Trash2, Wifi, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { RegistrarOffline } from "@/lib/offline/RegistrarOffline";
import { maiuscula, perfilPorSlug, type ArquivoTecnico, type Perfil } from "@/lib/perfis";
import {
  apagarDoAparelho, blobLocal, buscarPacote, espacoUsado, guardados, pacoteLocal, pacotesLocais, prepararAparelho,
  type ArquivoMidia, type ItemMidia, type PacoteMidias,
} from "@/lib/midias/dados";

type Aba = "conferencia" | "palco";
type Filtro = "todos" | "recebido" | "recusado" | "aprovado" | "faltando";

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: "todos", nome: "Todos" },
  { id: "recebido", nome: "Em análise" },
  { id: "faltando", nome: "Faltando" },
  { id: "recusado", nome: "Recusados" },
  { id: "aprovado", nome: "Aprovados" },
];

const mb = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const at = () => setOnline(navigator.onLine);
    at();
    window.addEventListener("online", at);
    window.addEventListener("offline", at);
    return () => { window.removeEventListener("online", at); window.removeEventListener("offline", at); };
  }, []);
  return online;
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
}

function extensao(a: ArquivoMidia) {
  const daUrl = (a.nome ?? a.url).split("?")[0].match(/\.([a-z0-9]{2,5})$/i)?.[1];
  return daUrl ? `.${daUrl.toLowerCase()}` : "";
}

// Endereço para tocar/abrir: cópia do aparelho, se houver; senão o original
function useEnderecoArquivo(arquivo: ArquivoMidia | undefined) {
  const [endereco, setEndereco] = useState<{ url: string; local: boolean } | null>(null);
  useEffect(() => {
    let vivo = true;
    let criado: string | null = null;
    (async () => {
      if (!arquivo) { if (vivo) setEndereco(null); return; }
      const blob = await blobLocal(arquivo).catch(() => null);
      if (!vivo) return;
      if (blob) {
        criado = URL.createObjectURL(blob);
        setEndereco({ url: criado, local: true });
      } else {
        setEndereco({ url: arquivo.url, local: false });
      }
    })();
    return () => { vivo = false; if (criado) URL.revokeObjectURL(criado); };
  }, [arquivo]);
  return endereco;
}

// Só abre na tela tipos inofensivos; o resto (ex.: SVG, que pode ter código) vira download
const TIPOS_SEGUROS = /^(application\/pdf|audio\/[\w.+-]+|image\/(png|jpe?g|webp|gif))$/;

async function abrirArquivo(a: ArquivoMidia) {
  const blob = await blobLocal(a).catch(() => null);
  const link = document.createElement("a");
  link.target = "_blank";
  link.rel = "noopener";
  if (blob) {
    const tipo = [blob.type, a.mime ?? ""].find((t) => TIPOS_SEGUROS.test(t));
    link.href = URL.createObjectURL(new Blob([blob], { type: tipo ?? "application/octet-stream" }));
    if (!tipo) link.download = a.nome ?? "arquivo";
    setTimeout(() => URL.revokeObjectURL(link.href), 60000);
  } else {
    link.href = a.url;
  }
  link.click();
}

function Selo({ status, obrigatorio }: { status: ArquivoMidia["status"] | null; obrigatorio: boolean }) {
  const [cls, texto] =
    status === "aprovado" ? ["border-emerald-400/30 bg-emerald-400/10 text-emerald-300", "Aprovado"]
    : status === "recusado" ? ["border-red-400/30 bg-red-400/10 text-red-300", "Recusado"]
    : status === "recebido" ? ["border-sky-400/30 bg-sky-400/10 text-sky-300", "Em análise"]
    : obrigatorio ? ["border-axon-gold/30 bg-axon-gold/10 text-axon-gold", "Faltando"]
    : ["border-white/10 bg-white/5 text-gray-400", "Não enviado"];
  return <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{texto}</span>;
}

// ── Conferência ─────────────────────────────────────────────────────────────

function LinhaConferencia({ def, arquivo, online, onRevisado }: {
  def: ArquivoTecnico;
  arquivo: ArquivoMidia | undefined;
  online: boolean;
  onRevisado: (msg: string, erro?: boolean) => void;
}) {
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ouvir, setOuvir] = useState(false);
  const endereco = useEnderecoArquivo(ouvir ? arquivo : undefined);

  const revisar = async (status: "aprovado" | "recusado" | "recebido") => {
    if (!arquivo) return;
    setSalvando(true);
    const res = await fetch(apiUrl("/api/midias/revisar"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arquivo_id: arquivo.id, status, observacao: motivo }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => ({}))) as { error?: string; emailEnviado?: boolean } | undefined;
    setSalvando(false);
    if (!res?.ok) return onRevisado(json?.error ?? "Sem conexão: tente de novo com internet.", true);
    setRecusando(false);
    setMotivo("");
    onRevisado(status === "recusado"
      ? json?.emailEnviado ? "Arquivo recusado. O grupo foi avisado por e-mail." : "Arquivo recusado. O grupo verá o motivo no portal."
      : status === "aprovado" ? "Arquivo aprovado." : "Arquivo voltou para análise.");
  };

  const ehAudio = !!arquivo && (arquivo.mime?.startsWith("audio/") || def.tipos.includes("audio"));

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-white">{def.nome}{def.obrigatorio && <span className="ml-1 text-axon-gold">*</span>}</p>
          {arquivo ? (
            <button type="button" onClick={() => abrirArquivo(arquivo)} className="block max-w-full truncate text-left text-xs text-gray-400 hover:text-axon-gold">
              {arquivo.nome ?? "arquivo"} {arquivo.tamanho ? `· ${mb(arquivo.tamanho)}` : ""}
            </button>
          ) : (
            <p className="text-xs text-gray-600">Não enviado pelo grupo</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Selo status={arquivo?.status ?? null} obrigatorio={def.obrigatorio} />
          {arquivo && ehAudio && (
            <button type="button" onClick={() => setOuvir((v) => !v)} className="rounded-md border border-axon-border px-2 py-1 text-xs text-gray-300 hover:text-white">
              {ouvir ? "Fechar" : "Ouvir"}
            </button>
          )}
          {arquivo && online && arquivo.status !== "aprovado" && (
            <button type="button" disabled={salvando} onClick={() => revisar("aprovado")}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/30 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50">
              <Check size={12} /> Aprovar
            </button>
          )}
          {arquivo && online && arquivo.status !== "recusado" && (
            <button type="button" disabled={salvando} onClick={() => setRecusando((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-red-400/30 px-2 py-1 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50">
              <X size={12} /> Recusar
            </button>
          )}
          {arquivo && online && arquivo.status !== "recebido" && (
            <button type="button" disabled={salvando} onClick={() => revisar("recebido")} title="Voltar para análise"
              className="rounded-md p-1 text-gray-500 hover:text-white disabled:opacity-50"><RefreshCw size={12} /></button>
          )}
        </div>
      </div>
      {arquivo?.status === "recusado" && arquivo.observacao && <p className="mt-1.5 text-xs text-red-300">Motivo: {arquivo.observacao}</p>}
      {recusando && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500}
            placeholder="Motivo (o grupo recebe por e-mail)"
            className="flex-1 rounded-lg border border-axon-border bg-axon-bg px-3 py-2 text-sm text-white outline-none focus:border-red-400/60" />
          <button type="button" disabled={salvando || !motivo.trim()} onClick={() => revisar("recusado")}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">
            {salvando && <Loader2 size={13} className="animate-spin" />} Confirmar recusa
          </button>
        </div>
      )}
      {ouvir && endereco && <audio controls autoPlay src={endereco.url} className="mt-2 h-9 w-full max-w-lg" />}
    </li>
  );
}

function Conferencia({ pacote, perfil, online, filtro, onRevisado }: {
  pacote: PacoteMidias;
  perfil: Perfil;
  online: boolean;
  filtro: Filtro;
  onRevisado: (msg: string, erro?: boolean) => void;
}) {
  const T = perfil.termos;
  const itens = pacote.itens.filter((i) => {
    if (filtro === "todos") return true;
    if (filtro === "faltando") return perfil.arquivos.some((d) => d.obrigatorio && !i.arquivos.some((a) => a.tipo === d.chave));
    return i.arquivos.some((a) => a.status === filtro);
  });

  if (!itens.length) {
    return <p className="rounded-xl border border-dashed border-axon-border px-6 py-12 text-center text-sm text-gray-400">
      {pacote.itens.length ? "Nada neste filtro." : `Nenhuma ${T.apresentacao.singular} inscrita neste evento ainda.`}
    </p>;
  }

  return (
    <div className="space-y-3">
      {itens.map((i) => (
        <section key={i.apresentacao_id} className="rounded-xl border border-axon-border bg-axon-panel">
          <div className="flex items-start gap-3 border-b border-axon-border px-4 py-3">
            <span className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-md bg-axon-gold/10 px-1.5 text-xs font-semibold text-axon-gold">{i.ordem ?? "—"}</span>
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{i.nome}</p>
              <p className="text-xs text-gray-400">{i.grupo} · {i.categoria ?? "Sem categoria"} · {perfil.formacoes[i.tipo]}</p>
            </div>
          </div>
          <ul className="divide-y divide-axon-border/60">
            {perfil.arquivos.map((def) => (
              <LinhaConferencia key={def.chave} def={def} arquivo={i.arquivos.find((a) => a.tipo === def.chave)} online={online} onRevisado={onRevisado} />
            ))}
            {i.arquivos.filter((a) => !perfil.arquivos.some((d) => d.chave === a.tipo)).map((a) => (
              <LinhaConferencia key={a.id} def={{ chave: a.tipo, nome: maiuscula(a.tipo.replace(/_/g, " ")), descricao: "", tipos: ["pdf", "imagem", "audio"], obrigatorio: false }}
                arquivo={a} online={online} onRevisado={onRevisado} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ── Palco (funciona sem internet) ──────────────────────────────────────────

function Palco({ pacote, perfil, locais }: { pacote: PacoteMidias; perfil: Perfil; locais: Set<string> }) {
  const [indice, setIndice] = useState(0);
  const atual: ItemMidia | undefined = pacote.itens[indice];
  const audios = perfil.arquivos.filter((d) => d.tipos.includes("audio")).map((d) => d.chave);
  const trilha = atual?.arquivos.find((a) => audios.includes(a.tipo) && a.status !== "recusado");
  const endereco = useEnderecoArquivo(trilha);
  const docs = atual?.arquivos.filter((a) => !audios.includes(a.tipo) && a.status !== "recusado") ?? [];
  const lista = useRef<HTMLOListElement>(null);

  useEffect(() => {
    lista.current?.querySelector(`[data-i="${indice}"]`)?.scrollIntoView({ block: "nearest" });
  }, [indice]);

  if (!pacote.itens.length) return <p className="text-sm text-gray-400">Sem {perfil.termos.apresentacao.plural} neste evento.</p>;
  const nomeDef = (tipo: string) => perfil.arquivos.find((d) => d.chave === tipo)?.nome ?? tipo;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-axon-gold/30 bg-axon-panel p-5">
        <p className="text-xs uppercase tracking-wider text-axon-gold">Agora · nº {atual?.ordem ?? indice + 1}</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{atual?.nome}</h2>
        <p className="mt-1 text-sm text-gray-400">{atual?.grupo} · {atual?.categoria ?? "Sem categoria"} · {atual && perfil.formacoes[atual.tipo]}</p>

        <div className="mt-5 rounded-lg border border-axon-border bg-axon-bg p-4">
          {trilha ? (
            <>
              <p className="flex items-center justify-between gap-2 text-sm text-white">
                <span className="flex min-w-0 items-center gap-2"><Music size={15} className="shrink-0 text-axon-gold" /> <span className="truncate">{nomeDef(trilha.tipo)} · {trilha.nome}</span></span>
                {endereco && <span className={`shrink-0 text-[11px] ${endereco.local ? "text-emerald-300" : "text-axon-gold"}`}>{endereco.local ? "no aparelho" : "pela internet"}</span>}
              </p>
              {trilha.status === "recebido" && <p className="mt-1 text-xs text-sky-300">Ainda não conferido pela produção.</p>}
              {endereco && <audio key={endereco.url} controls src={endereco.url} className="mt-3 w-full" />}
            </>
          ) : (
            <p className="text-sm text-gray-400">Sem áudio para esta {perfil.termos.apresentacao.singular}.</p>
          )}
        </div>

        {docs.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {docs.map((d) => (
              <button key={d.id} type="button" onClick={() => abrirArquivo(d)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200 hover:border-axon-gold/40">
                <ExternalLink size={13} /> {nomeDef(d.tipo)}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button type="button" disabled={indice === 0} onClick={() => setIndice((i) => i - 1)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-axon-border py-3 text-sm text-gray-200 disabled:opacity-30">
            <ChevronLeft size={16} /> Anterior
          </button>
          <button type="button" disabled={indice >= pacote.itens.length - 1} onClick={() => setIndice((i) => i + 1)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-axon-gold py-3 text-sm font-semibold text-black disabled:opacity-30">
            Próxima <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <ol ref={lista} className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-axon-border bg-axon-panel p-2">
        {pacote.itens.map((i, n) => {
          const temTudo = i.arquivos.filter((a) => a.status !== "recusado").every((a) => locais.has(`${a.id}:${a.updated_at}`));
          return (
            <li key={i.apresentacao_id} data-i={n}>
              <button type="button" onClick={() => setIndice(n)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${n === indice ? "bg-axon-gold/10 text-white" : "text-gray-300 hover:bg-white/5"}`}>
                <span className="w-7 shrink-0 text-xs text-gray-500">{i.ordem ?? n + 1}</span>
                <span className="min-w-0 flex-1 truncate">{i.nome}<span className="block truncate text-xs text-gray-500">{i.grupo}</span></span>
                {i.arquivos.length > 0 && (temTudo ? <CheckCircle2 size={13} className="shrink-0 text-emerald-400" /> : <CloudOff size={13} className="shrink-0 text-gray-600" />)}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export default function MidiasPage({ searchParams }: { searchParams: Promise<{ evento?: string }> }) {
  const params = use(searchParams);
  const online = useOnline();
  const [eventos, setEventos] = useState<{ id: string; nome: string }[]>([]);
  const [eventoId, setEventoId] = useState(params.evento ?? "");
  const [pacote, setPacote] = useState<PacoteMidias | null>(null);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [locais, setLocais] = useState<Set<string>>(new Set());
  const [espaco, setEspaco] = useState(0);
  const [aba, setAba] = useState<Aba>("conferencia");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState<{ feitos: number; total: number; tipo: "aparelho" | "zip" } | null>(null);
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null);

  const mostrar = useCallback((texto: string, erro = false) => {
    setAviso({ erro, texto });
    window.setTimeout(() => setAviso(null), 6000);
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const locaisLista = (await pacotesLocais().catch(() => [])).map((p) => ({ id: p.evento.id, nome: p.evento.nome }));
      let lista = locaisLista;
      if (navigator.onLine) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { data: eu } = user ? await supabase.from("usuarios").select("role, produtora_id").eq("id", user.id).maybeSingle() : { data: null };
        let consulta = supabase.from("eventos").select("id, nome").order("data_inicio", { ascending: false });
        if (eu?.role !== "super_admin") consulta = consulta.eq("produtora_id", eu?.produtora_id ?? "");
        const { data } = await consulta;
        if (data) lista = [...data, ...locaisLista.filter((l) => !data.some((d) => d.id === l.id))];
      }
      if (!vivo) return;
      setEventos(lista);
      setEventoId((atual) => atual || lista[0]?.id || "");
    })();
    return () => { vivo = false; };
  }, []);

  const atualizarLocal = useCallback(async (id: string) => {
    const local = await pacoteLocal(id).catch(() => undefined);
    setSalvoEm(local?.atualizadoEm ?? null);
    setLocais(await guardados(id).catch(() => new Set<string>()));
    setEspaco(await espacoUsado(id).catch(() => 0));
    return local ?? null;
  }, []);

  const carregar = useCallback(async (id: string) => {
    if (!id) return;
    setCarregando(true);
    const local = await atualizarLocal(id);
    if (navigator.onLine) {
      try {
        setPacote(await buscarPacote(id));
      } catch (e) {
        setPacote(local);
        mostrar(e instanceof Error ? e.message : "Falha ao carregar.", true);
      }
    } else {
      setPacote(local);
    }
    setCarregando(false);
  }, [atualizarLocal, mostrar]);

  useEffect(() => {
    let vivo = true;
    (async () => { if (vivo) await carregar(eventoId); })();
    return () => { vivo = false; };
  }, [eventoId, carregar]);

  const perfil = useMemo(() => perfilPorSlug(pacote?.evento.perfil), [pacote]);

  const guardar = async () => {
    if (!pacote) return;
    setProgresso({ feitos: 0, total: 0, tipo: "aparelho" });
    const atual = navigator.onLine ? await buscarPacote(pacote.evento.id).catch(() => pacote) : pacote;
    setPacote(atual);
    const { falhas } = await prepararAparelho(atual, (feitos, total) => setProgresso({ feitos, total, tipo: "aparelho" }));
    setProgresso(null);
    await atualizarLocal(atual.evento.id);
    mostrar(falhas.length ? `Guardado, mas ${falhas.length} arquivo(s) falharam. Tente de novo.` : "Tudo guardado neste aparelho. Funciona sem internet.", falhas.length > 0);
  };

  const apagar = async () => {
    if (!pacote || !window.confirm("Apagar os arquivos guardados neste aparelho?")) return;
    await apagarDoAparelho(pacote.evento.id);
    await atualizarLocal(pacote.evento.id);
    mostrar("Arquivos apagados deste aparelho.");
  };

  const exportarZip = async () => {
    if (!pacote) return;
    const lista = pacote.itens.flatMap((i, n) => i.arquivos.filter((a) => a.status !== "recusado").map((a) => ({ i, n, a })));
    if (!lista.length) return mostrar("Nenhum arquivo para exportar.", true);
    const zip = new JSZip();
    setProgresso({ feitos: 0, total: lista.length, tipo: "zip" });
    let feitos = 0;
    const falhas: string[] = [];
    for (const { i, n, a } of lista) {
      try {
        let blob = await blobLocal(a);
        if (!blob) {
          const r = await fetch(a.url, { mode: "cors" }).catch(() => null);
          blob = r?.ok ? await r.blob() : await fetch(apiUrl(`/api/midias/arquivo?id=${a.id}`)).then((x) => (x.ok ? x.blob() : null));
        }
        if (!blob) throw new Error();
        const pasta = perfil.arquivos.find((d) => d.chave === a.tipo)?.nome ?? a.tipo;
        const ordem = String(i.ordem ?? n + 1).padStart(3, "0");
        zip.folder(pasta)!.file(`${ordem}_${normalizar(i.grupo)}_${normalizar(i.nome)}${extensao(a)}`, blob);
      } catch {
        falhas.push(a.nome ?? a.id);
      }
      setProgresso({ feitos: ++feitos, total: lista.length, tipo: "zip" });
    }
    const conteudo = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(conteudo);
    link.download = `midias_${normalizar(pacote.evento.nome)}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    setProgresso(null);
    if (falhas.length) mostrar(`${falhas.length} arquivo(s) não entraram no ZIP.`, true);
  };

  const contagem = useMemo(() => {
    const todos = pacote?.itens.flatMap((i) => i.arquivos) ?? [];
    const faltando = pacote?.itens.reduce((s, i) => s + perfil.arquivos.filter((d) => d.obrigatorio && !i.arquivos.some((a) => a.tipo === d.chave)).length, 0) ?? 0;
    return {
      recebido: todos.filter((a) => a.status === "recebido").length,
      aprovado: todos.filter((a) => a.status === "aprovado").length,
      recusado: todos.filter((a) => a.status === "recusado").length,
      faltando,
      guardaveis: todos.filter((a) => a.status !== "recusado"),
    };
  }, [pacote, perfil]);
  const faltamNoAparelho = contagem.guardaveis.filter((a) => !locais.has(`${a.id}:${a.updated_at}`)).length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <RegistrarOffline />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Mídias e arquivos técnicos</h1>
          <p className="mt-1 text-sm text-gray-400">Confira o que os grupos enviaram e guarde tudo no aparelho para usar no palco sem internet.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${online ? "border-emerald-400/30 text-emerald-300" : "border-axon-gold/40 text-axon-gold"}`}>
          {online ? <Wifi size={12} /> : <CloudOff size={12} />} {online ? "Online" : "Sem internet"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={eventoId} onChange={(e) => setEventoId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-axon-border bg-axon-panel px-3 py-2.5 text-sm text-white outline-none sm:flex-none sm:min-w-[280px]">
          {eventos.length === 0 && <option value="">Nenhum evento</option>}
          {eventos.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
        </select>
        <button type="button" onClick={() => carregar(eventoId)} disabled={!online || carregando} title="Atualizar"
          className="rounded-lg border border-axon-border p-2.5 text-gray-300 hover:text-white disabled:opacity-40">
          {carregando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
        </button>
      </div>

      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.erro ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{aviso.texto}</p>}

      {!pacote ? (
        <p className="rounded-xl border border-dashed border-axon-border px-6 py-12 text-center text-sm text-gray-400">
          {carregando ? "Carregando…" : online ? "Escolha um evento." : "Este evento não foi guardado neste aparelho. Abra com internet e toque em “Guardar neste aparelho”."}
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-axon-border bg-axon-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="flex items-center gap-2 text-white"><HardDriveDownload size={15} className="text-axon-gold" /> Neste aparelho</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {salvoEm
                    ? `Guardado em ${new Date(salvoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · ${mb(espaco)}${faltamNoAparelho ? ` · ${faltamNoAparelho} arquivo(s) novo(s) ainda não guardado(s)` : " · tudo guardado"}`
                    : "Nada guardado ainda. Guarde antes do evento para tocar as trilhas sem internet."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={guardar} disabled={!online || !!progresso}
                  className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-3.5 py-2 text-sm font-semibold text-black disabled:opacity-40">
                  {progresso?.tipo === "aparelho" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {salvoEm ? "Atualizar no aparelho" : "Guardar neste aparelho"}
                </button>
                <button type="button" onClick={exportarZip} disabled={!!progresso}
                  className="inline-flex items-center gap-2 rounded-lg border border-axon-border px-3.5 py-2 text-sm text-gray-200 disabled:opacity-40">
                  {progresso?.tipo === "zip" ? <Loader2 size={14} className="animate-spin" /> : <FileArchive size={14} />} Baixar ZIP
                </button>
                {salvoEm && (
                  <button type="button" onClick={apagar} disabled={!!progresso} title="Apagar do aparelho"
                    className="rounded-lg border border-axon-border p-2 text-gray-400 hover:text-red-300 disabled:opacity-40"><Trash2 size={15} /></button>
                )}
              </div>
            </div>
            {progresso && progresso.total > 0 && (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-axon-gold transition-all" style={{ width: `${(progresso.feitos / progresso.total) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-400">{progresso.feitos} de {progresso.total} arquivos</p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { n: contagem.recebido, t: "Em análise", c: "text-sky-300", i: Clock },
              { n: contagem.faltando, t: "Obrigatórios faltando", c: "text-axon-gold", i: X },
              { n: contagem.recusado, t: "Recusados", c: "text-red-300", i: X },
              { n: contagem.aprovado, t: "Aprovados", c: "text-emerald-300", i: Check },
            ].map((k) => (
              <div key={k.t} className="rounded-xl border border-axon-border bg-axon-panel p-3.5">
                <p className={`text-2xl font-semibold ${k.c}`}>{k.n}</p>
                <p className="text-xs text-gray-400">{k.t}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-axon-border">
            <div className="flex">
              {([["conferencia", "Conferência"], ["palco", "Palco"]] as const).map(([id, nome]) => (
                <button key={id} type="button" onClick={() => setAba(id)}
                  className={`border-b-2 px-4 py-2.5 text-sm ${aba === id ? "border-axon-gold text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
                  {nome}
                </button>
              ))}
            </div>
            {aba === "conferencia" && (
              <div className="flex flex-wrap gap-1 pb-2">
                {FILTROS.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                    className={`rounded-full px-3 py-1 text-xs ${filtro === f.id ? "bg-axon-gold/15 text-axon-gold" : "text-gray-400 hover:text-white"}`}>
                    {f.nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          {aba === "conferencia"
            ? <Conferencia pacote={pacote} perfil={perfil} online={online} filtro={filtro}
                onRevisado={(m, erro) => { mostrar(m, erro); if (!erro) void carregar(pacote.evento.id); }} />
            : <Palco pacote={pacote} perfil={perfil} locais={locais} />}
        </>
      )}
    </div>
  );
}
