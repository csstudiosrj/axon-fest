"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, CheckCircle2, Clock, FileAudio, FileImage, FileText, Loader2, Pencil, Plus, Trash2, Upload, Users, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mensagemEnvio, uploadFiles } from "@/utils/uploadthing";
import { formatarTempo } from "@/lib/mascaras";
import { idadeEm } from "@/lib/documentos";
import { maiuscula, MIME_ARQUIVO, novo, perfilPorSlug, type ArquivoTecnico, type Perfil } from "@/lib/perfis";
import type { IntegranteElenco } from "@/lib/grupo/contexto";
import type { ApresentacaoGrupo, ArquivoEnviado, CategoriaEvento } from "@/lib/grupo/dados";
import { Cartao, Selo, Vazio, brl, dataCurta } from "../../../_components/ui";
import { confirmar } from "@/app/_components/Dialogos";

type Tipo = ApresentacaoGrupo["tipo"];

const campo = "w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold";

const pago = (s: string | null) => !!s && s.toLowerCase() !== "pendente";

function nomeCategoria(c: CategoriaEvento | undefined) {
  if (!c) return "Sem categoria";
  return c.pai_nome ? `${c.pai_nome} › ${c.nome}` : c.nome;
}

function valorDe(c: CategoriaEvento | undefined, tipo: Tipo) {
  if (!c) return 0;
  return tipo === "solo" ? c.valor_solo : tipo === "duo" ? c.valor_duo : c.valor_conjunto;
}

// Formações que a categoria aceita, com o nome usado no tipo do festival
function formacoes(perfil: Perfil, c: CategoriaEvento | undefined): { tipo: Tipo; nome: string }[] {
  const lista: { tipo: Tipo; nome: string }[] = [];
  if (!c || c.permite_solo) lista.push({ tipo: "solo", nome: perfil.formacoes.solo });
  if (!c || c.permite_duo) lista.push({ tipo: "duo", nome: perfil.formacoes.duo });
  if (!c || c.permite_conjunto) {
    lista.push({ tipo: "conjunto", nome: perfil.formacoes.conjunto });
    if (perfil.formacoes.grupo !== perfil.formacoes.conjunto) lista.push({ tipo: "grupo", nome: perfil.formacoes.grupo });
  }
  return lista;
}

const nomePessoa = (p: IntegranteElenco) => p.nome_artistico || p.nome || `Convidado(a) · CPF final ${p.documento_final ?? "—"}`;

// Regras da categoria: `bloqueios` impedem salvar; `avisos` só orientam (confirmação chega depois, por e-mail).
// Sem ninguém marcado ainda, salva (o elenco pode ser escolhido depois).
function avisosElenco(c: CategoriaEvento | undefined, tipo: Tipo, escolhidos: IntegranteElenco[], dataEvento: string | null) {
  const n = escolhidos.length;
  const bloqueios: string[] = [];
  const avisos: string[] = [];
  if (n === 0) return { bloqueios, avisos };
  if (tipo === "solo" && n !== 1) bloqueios.push("Solo deve ter exatamente 1 pessoa em cena.");
  if (tipo === "duo" && n !== 2) bloqueios.push("Duo deve ter exatamente 2 pessoas em cena.");
  if ((tipo === "conjunto" || tipo === "grupo") && n < 3) bloqueios.push("Conjunto deve ter pelo menos 3 pessoas em cena.");
  if (c?.min_participantes && n < c.min_participantes) bloqueios.push(`A categoria pede no mínimo ${c.min_participantes} pessoas.`);
  if (c?.max_participantes && n > c.max_participantes) bloqueios.push(`A categoria aceita no máximo ${c.max_participantes} pessoas.`);
  if (c && (c.faixa_etaria_min != null || c.faixa_etaria_max != null)) {
    const fora = escolhidos.filter((p) => {
      const idade = idadeEm(p.data_nascimento, dataEvento);
      if (idade === null) return false;
      return (c.faixa_etaria_min != null && idade < c.faixa_etaria_min) || (c.faixa_etaria_max != null && idade > c.faixa_etaria_max);
    });
    if (fora.length) bloqueios.push(`Fora da faixa etária da categoria: ${fora.map(nomePessoa).join(", ")}.`);
  }
  const pendentes = escolhidos.filter((p) => !p.confirmado || !p.termo_assinado).length;
  if (pendentes) avisos.push(`${pendentes} ${pendentes === 1 ? "pessoa ainda não confirmou ou não assinou" : "pessoas ainda não confirmaram ou não assinaram"} o termo.`);
  return { bloqueios, avisos };
}

// ── Formulário de nova/editar apresentação ──────────────────────────────────

function Formulario({ perfil, evento, grupoId, categorias, elenco, editando, onFechar, onSalvo, verValores }: {
  verValores: boolean;
  perfil: Perfil;
  evento: { id: string; data_inicio: string | null };
  grupoId: string;
  categorias: CategoriaEvento[];
  elenco: IntegranteElenco[];
  editando: ApresentacaoGrupo | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const T = perfil.termos;
  const [nome, setNome] = useState(editando?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(editando?.categoria_id ?? "");
  const [tipo, setTipo] = useState<Tipo>(editando?.tipo ?? "solo");
  const [observacoes, setObservacoes] = useState(editando?.observacoes ?? "");
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set(editando?.elenco ?? []));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categoria = categorias.find((c) => c.id === categoriaId);
  const opcoes = formacoes(perfil, categoria);
  const tipoValido = opcoes.some((o) => o.tipo === tipo) ? tipo : opcoes[0]?.tipo ?? "solo";
  const travadoPorPagamento = !!editando && pago(editando.status_pagamento);
  const pessoas = elenco.filter((p) => escolhidos.has(p.participante_id));
  const { bloqueios, avisos } = avisosElenco(categoria, tipoValido, pessoas, evento.data_inicio);

  const grupos = useMemo(() => {
    const m = new Map<string, CategoriaEvento[]>();
    for (const c of categorias) {
      const k = c.pai_nome ?? "";
      m.set(k, [...(m.get(k) ?? []), c]);
    }
    return [...m.entries()];
  }, [categorias]);

  // Categoria esgotada fica bloqueada (menos a que a apresentação já ocupa)
  const opcaoCategoria = (c: CategoriaEvento) => {
    const atual = c.id === editando?.categoria_id;
    const esgotada = c.restantes === 0 && !atual;
    const vagas = esgotada ? " — esgotada" : c.restantes != null && c.mostrar_vagas && !atual ? ` — ${c.restantes} vaga${c.restantes === 1 ? "" : "s"}` : "";
    return <option key={c.id} value={c.id} disabled={esgotada}>{c.nome}{vagas}</option>;
  };

  const alternar = (id: string) => {
    const s = new Set(escolhidos);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setEscolhidos(s);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!categoria) return setErro("Escolha a categoria.");
    if (bloqueios.length) return setErro("Corrija os itens em vermelho antes de salvar: eles não atendem às regras da categoria.");
    setSalvando(true);
    const supabase = createClient();
    const dados = {
      nome: nome.trim(),
      categoria_id: categoria.id,
      tipo: tipoValido,
      observacoes: observacoes.trim() || null,
      quantidade_bailarinos: Math.max(1, escolhidos.size),
    };

    let id = editando?.id;
    if (id) {
      const { error } = await supabase.from("apresentacoes").update(dados).eq("id", id);
      if (error) { setErro(error.message); setSalvando(false); return; }
    } else {
      const { data, error } = await supabase.from("apresentacoes")
        .insert({ ...dados, evento_id: evento.id, grupo_id: grupoId, categoria_id_old: categoria.id })
        .select("id").single();
      if (error || !data) { setErro(error?.message ?? "Não foi possível salvar."); setSalvando(false); return; }
      id = data.id as string;
    }

    const antes = new Set(editando?.elenco ?? []);
    const sair = [...antes].filter((p) => !escolhidos.has(p));
    const entrar = [...escolhidos].filter((p) => !antes.has(p));
    if (sair.length) {
      const { error } = await supabase.from("apresentacao_elenco").delete().eq("apresentacao_id", id).in("participante_id", sair);
      if (error) { setErro(error.message); setSalvando(false); return; }
    }
    if (entrar.length) {
      const { error } = await supabase.from("apresentacao_elenco").insert(entrar.map((p) => ({ apresentacao_id: id, participante_id: p })));
      if (error) { setErro(error.message); setSalvando(false); return; }
    }
    onSalvo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">{editando ? `Editar ${T.apresentacao.singular}` : novo(T.apresentacao)}</h2>
          <button type="button" onClick={onFechar} className="text-gray-400 hover:text-white" aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="text-xs text-gray-400">Nome {T.apresentacao.genero === "f" ? "da" : "do"} {T.apresentacao.singular}</span>
            <input required minLength={2} maxLength={160} value={nome} onChange={(e) => setNome(e.target.value)} className={`${campo} mt-1.5`} />
          </label>

          {travadoPorPagamento && (
            <p className="rounded-lg border border-axon-gold/30 bg-axon-gold/10 px-3 py-2 text-xs text-axon-gold">Inscrição já paga: categoria e formação só mudam pela produção.</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-400">Categoria</span>
              <select required value={categoriaId} disabled={travadoPorPagamento} onChange={(e) => setCategoriaId(e.target.value)} className={`${campo} mt-1.5`}>
                <option value="">Escolha…</option>
                {grupos.map(([pai, cats]) =>
                  pai ? (
                    <optgroup key={pai} label={pai}>
                      {cats.map(opcaoCategoria)}
                    </optgroup>
                  ) : cats.map(opcaoCategoria)
                )}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Formação</span>
              <select value={tipoValido} disabled={travadoPorPagamento} onChange={(e) => setTipo(e.target.value as Tipo)} className={`${campo} mt-1.5`}>
                {opcoes.map((o) => <option key={o.tipo} value={o.tipo}>{o.nome}</option>)}
              </select>
            </label>
          </div>

          {categoria && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg border border-axon-border bg-axon-bg px-4 py-3 text-xs text-gray-400">
              {verValores && <span>Taxa de inscrição: <strong className="text-white">{brl(valorDe(categoria, tipoValido))}</strong></span>}
              {(categoria.faixa_etaria_label || categoria.faixa_etaria_min != null || categoria.faixa_etaria_max != null) && (
                <span>Idade: {categoria.faixa_etaria_label ?? `${categoria.faixa_etaria_min ?? 0}–${categoria.faixa_etaria_max ?? "∞"} anos`}</span>
              )}
              {(categoria.tempo_min_segundos || categoria.tempo_max_segundos) && (
                <span>Tempo: {formatarTempo(categoria.tempo_min_segundos ?? 0)} a {categoria.tempo_max_segundos ? formatarTempo(categoria.tempo_max_segundos) : "∞"} min</span>
              )}
              {(categoria.min_participantes || categoria.max_participantes) && (
                <span>Pessoas em cena: {categoria.min_participantes ?? 1}–{categoria.max_participantes ?? "∞"}</span>
              )}
              {categoria.observacoes && <span className="basis-full text-gray-500">{categoria.observacoes}</span>}
            </div>
          )}

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-400">Quem está em cena</span>
              <span className="text-xs text-gray-500">{escolhidos.size} selecionado{escolhidos.size === 1 ? "" : "s"}</span>
            </div>
            {elenco.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-axon-border px-4 py-4 text-sm text-gray-400">
                O {T.elenco} do grupo está vazio. Cadastre as pessoas na aba “{maiuscula(T.elenco)}” e volte aqui.
              </p>
            ) : (
              <div className="mt-2 grid max-h-60 gap-1.5 overflow-y-auto rounded-lg border border-axon-border bg-axon-bg p-2 sm:grid-cols-2">
                {elenco.map((p) => (
                  <label key={p.participante_id} className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${escolhidos.has(p.participante_id) ? "bg-axon-gold/10 text-white" : "text-gray-300 hover:bg-white/5"}`}>
                    <input type="checkbox" checked={escolhidos.has(p.participante_id)} onChange={() => alternar(p.participante_id)} className="accent-[#d4af37]" />
                    <span className="min-w-0 flex-1 truncate">{nomePessoa(p)}</span>
                    {!p.confirmado && <span className="text-[10px] text-axon-gold">pendente</span>}
                  </label>
                ))}
              </div>
            )}
            {bloqueios.length > 0 && (
              <ul className="mt-2 space-y-1">
                {bloqueios.map((a) => <li key={a} className="flex items-start gap-1.5 text-xs text-red-300"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}</li>)}
              </ul>
            )}
            {avisos.length > 0 && (
              <ul className="mt-2 space-y-1">
                {avisos.map((a) => <li key={a} className="flex items-start gap-1.5 text-xs text-axon-gold"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}</li>)}
              </ul>
            )}
          </div>

          <label className="block">
            <span className="text-xs text-gray-400">Observações para a produção (opcional)</span>
            <textarea rows={3} maxLength={2000} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className={`${campo} mt-1.5 resize-y`} />
          </label>

          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white">Cancelar</button>
          <button type="submit" disabled={salvando || bloqueios.length > 0} title={bloqueios.length ? "Corrija os itens em vermelho" : undefined} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando && <Loader2 size={15} className="animate-spin" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Arquivos técnicos de uma apresentação ───────────────────────────────────

function aceita(def: ArquivoTecnico, file: File) {
  return def.tipos.some((t) => (t === "pdf" ? file.type === "application/pdf" : file.type.startsWith(t === "audio" ? "audio/" : "image/")));
}

function IconeArquivo({ def }: { def: ArquivoTecnico }) {
  if (def.tipos.includes("audio")) return <FileAudio size={16} />;
  if (def.tipos.includes("imagem") && !def.tipos.includes("pdf")) return <FileImage size={16} />;
  return <FileText size={16} />;
}

function LinhaArquivo({ def, enviado, apresentacaoId, podeEnviar, onMudou }: {
  def: ArquivoTecnico;
  enviado: ArquivoEnviado | undefined;
  apresentacaoId: string;
  podeEnviar: boolean;
  onMudou: (erro?: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (file: File | undefined) => {
    if (!file) return;
    if (!aceita(def, file)) return onMudou(`${def.nome}: formato não aceito.`);
    setEnviando(true);
    try {
      const [r] = await uploadFiles("arquivoTecnico", { files: [file] });
      if (!r) throw new Error("Falha no envio do arquivo.");
      const { error } = await createClient().from("apresentacao_arquivos").upsert(
        { apresentacao_id: apresentacaoId, tipo: def.chave, url: r.ufsUrl, nome: r.name ?? file.name, tamanho: r.size ?? file.size, mime: r.type || file.type },
        { onConflict: "apresentacao_id,tipo" }
      );
      if (error) throw new Error(error.message);
      onMudou();
    } catch (e) {
      onMudou(mensagemEnvio(e));
    }
    setEnviando(false);
    if (input.current) input.current.value = "";
  };

  const remover = async () => {
    if (!enviado || !(await confirmar(`Remover ${def.nome.toLowerCase()}?`))) return;
    const { error } = await createClient().from("apresentacao_arquivos").delete().eq("id", enviado.id);
    onMudou(error?.message);
  };

  const selo = !enviado
    ? def.obrigatorio ? <Selo tom="vermelho">Obrigatório · não enviado</Selo> : <Selo>Não enviado</Selo>
    : enviado.status === "aprovado" ? <Selo tom="verde"><CheckCircle2 size={11} /> Aprovado</Selo>
    : enviado.status === "recusado" ? <Selo tom="vermelho">Recusado</Selo>
    : <Selo tom="azul"><Clock size={11} /> Em análise</Selo>;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-gray-500"><IconeArquivo def={def} /></span>
          <div className="min-w-0">
            <p className="text-sm text-white">{def.nome}</p>
            {enviado ? (
              <a href={enviado.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-gray-400 hover:text-axon-gold">
                {enviado.nome ?? "arquivo"} · enviado em {dataCurta(enviado.updated_at)}
              </a>
            ) : (
              <p className="text-xs text-gray-500">{def.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selo}
          {podeEnviar && (
            <>
              <input ref={input} type="file" className="hidden" accept={def.tipos.map((t) => MIME_ARQUIVO[t]).join(",")} onChange={(e) => enviar(e.target.files?.[0])} />
              <button type="button" disabled={enviando} onClick={() => input.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-2.5 py-1.5 text-xs text-gray-200 hover:border-axon-gold/40 disabled:opacity-50">
                {enviando ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} {enviado ? "Trocar" : "Enviar"}
              </button>
              {enviado && enviado.status !== "aprovado" && (
                <button type="button" onClick={remover} title="Remover" className="rounded-lg p-1.5 text-gray-500 hover:text-red-300"><Trash2 size={13} /></button>
              )}
            </>
          )}
        </div>
      </div>
      {enviado?.status === "recusado" && enviado.observacao && (
        <p className="mt-2 rounded-md bg-red-400/10 px-3 py-2 text-xs text-red-200">Motivo: {enviado.observacao}</p>
      )}
      {enviado && enviado.mime?.startsWith("audio/") && (
        <audio controls preload="none" src={enviado.url} className="mt-2 h-9 w-full max-w-md" />
      )}
    </li>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export function Apresentacoes({ evento, grupoId, perfilSlug, categorias, apresentacoes, elenco, podeEditar, podeEnviarArquivos, abrirNova, verValores }: {
  verValores: boolean; // o coreógrafo não vê valores
  evento: { id: string; data_inicio: string | null };
  grupoId: string;
  perfilSlug: string;
  categorias: CategoriaEvento[];
  apresentacoes: ApresentacaoGrupo[];
  elenco: IntegranteElenco[];
  podeEditar: boolean;
  podeEnviarArquivos: boolean;
  abrirNova: boolean;
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const T = perfil.termos;
  const [form, setForm] = useState<{ editando: ApresentacaoGrupo | null } | null>(abrirNova ? { editando: null } : null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const porId = new Map(elenco.map((p) => [p.participante_id, p]));
  const catPorId = new Map(categorias.map((c) => [c.id, c]));
  const esgotado = categorias.length > 0 && categorias.every((c) => c.restantes === 0);
  const nomeFormacao = (t: Tipo) => perfil.formacoes[t];

  const excluir = async (a: ApresentacaoGrupo) => {
    if (!(await confirmar(`Excluir “${a.nome}”? Os arquivos enviados também serão apagados.`))) return;
    const { error } = await createClient().from("apresentacoes").delete().eq("id", a.id);
    setAviso(error ? { ok: false, texto: error.message } : { ok: true, texto: `“${a.nome}” foi excluíd${T.apresentacao.genero === "f" ? "a" : "o"}.` });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{maiuscula(T.apresentacao.plural)}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {podeEditar
              ? `Inscreva cada ${T.apresentacao.singular}, escolha quem está em cena e envie os arquivos técnicos.`
              : podeEnviarArquivos
                ? "Inscrições fechadas: só os arquivos técnicos ainda podem ser enviados."
                : "Festival finalizado: apenas consulta."}
          </p>
        </div>
        {podeEditar && (
          <button type="button" onClick={() => setForm({ editando: null })} disabled={categorias.length === 0 || esgotado}
            className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-40">
            <Plus size={15} /> {novo(T.apresentacao)}
          </button>
        )}
      </div>

      {podeEditar && esgotado && (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">As vagas deste festival estão esgotadas. Fale com a produção se precisar de uma vaga.</p>
      )}
      {podeEditar && categorias.length === 0 && (
        <p className="rounded-lg border border-axon-gold/30 bg-axon-gold/10 px-4 py-3 text-sm text-axon-gold">A produção ainda não cadastrou as categorias deste festival.</p>
      )}
      {aviso && <p className={`rounded-lg border px-4 py-3 text-sm ${aviso.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>{aviso.texto}</p>}

      {apresentacoes.length === 0 ? (
        <Cartao>
          <Vazio icone={<Users size={22} />} titulo={T.apresentacao.genero === "f" ? `Nenhuma ${T.apresentacao.singular} inscrita` : `Nenhum ${T.apresentacao.singular} inscrito`}
            texto={podeEditar ? `Clique em “${novo(T.apresentacao)}” para começar.` : "As inscrições deste festival estão fechadas."} />
        </Cartao>
      ) : (
        apresentacoes.map((a) => {
          const cat = a.categoria_id ? catPorId.get(a.categoria_id) : undefined;
          const pessoas = a.elenco.map((id) => porId.get(id)).filter((p): p is IntegranteElenco => !!p);
          const regras = avisosElenco(cat, a.tipo, pessoas, evento.data_inicio);
          return (
            <Cartao key={a.id} className="scroll-mt-24 overflow-hidden">
              <div id={a.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white">{a.nome}</h3>
                  <p className="mt-0.5 text-xs text-gray-400">{nomeCategoria(cat)} · {nomeFormacao(a.tipo)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {verValores && <Selo tom={pago(a.status_pagamento) ? "verde" : "ouro"}>{brl(a.valor_total)} · {pago(a.status_pagamento) ? a.status_pagamento : "Pagamento pendente"}</Selo>}
                    {a.ordem_apresentacao != null && <Selo tom="azul">Ordem nº {a.ordem_apresentacao}</Selo>}
                    {a.data_apresentacao && <Selo>{dataCurta(a.data_apresentacao)}</Selo>}
                  </div>
                </div>
                {podeEditar && (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setForm({ editando: a })} title="Editar" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"><Pencil size={15} /></button>
                    {!pago(a.status_pagamento) && (
                      <button type="button" onClick={() => excluir(a)} title="Excluir" className="rounded-lg p-2 text-gray-400 hover:bg-red-400/10 hover:text-red-300"><Trash2 size={15} /></button>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-axon-border px-5 py-3">
                <p className="text-xs text-gray-500">Em cena ({pessoas.length})</p>
                <p className="mt-1 text-sm text-gray-200">{pessoas.length ? pessoas.map(nomePessoa).join(", ") : <span className="text-gray-500">Ninguém selecionado</span>}</p>
                {regras.bloqueios.map((w) => <p key={w} className="mt-1 flex items-start gap-1.5 text-xs text-red-300"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}</p>)}
                {regras.avisos.map((w) => <p key={w} className="mt-1 flex items-start gap-1.5 text-xs text-axon-gold"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {w}</p>)}
                {a.observacoes && <p className="mt-2 text-xs text-gray-400">Obs.: {a.observacoes}</p>}
              </div>

              {perfil.arquivos.length > 0 && (
                <div className="border-t border-axon-border">
                  <p className="px-5 pt-3 text-xs text-gray-500">Arquivos técnicos</p>
                  <ul className="divide-y divide-axon-border/60 px-1">
                    {perfil.arquivos.map((def) => (
                      <LinhaArquivo key={def.chave} def={def} apresentacaoId={a.id} podeEnviar={podeEnviarArquivos}
                        enviado={a.arquivos.find((f) => f.tipo === def.chave)}
                        onMudou={(erro) => { setAviso(erro ? { ok: false, texto: erro } : null); router.refresh(); }} />
                    ))}
                  </ul>
                </div>
              )}
            </Cartao>
          );
        })
      )}

      {form && (
        <Formulario verValores={verValores} perfil={perfil} evento={evento} grupoId={grupoId} categorias={categorias} elenco={elenco} editando={form.editando}
          onFechar={() => setForm(null)}
          onSalvo={() => { setForm(null); setAviso({ ok: true, texto: "Salvo." }); router.refresh(); }} />
      )}
    </div>
  );
}
