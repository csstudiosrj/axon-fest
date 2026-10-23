"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { perfilPorSlug } from "@/lib/perfis";
import type { Tables } from "@/lib/supabase/database.types";
import { Aviso, Cartao, Rotulo, brl, campo } from "../_ui";
import { confirmar } from "@/app/_components/Dialogos";

type Categoria = Tables<"categorias">;

const GENEROS = [
  { valor: "livre", nome: "Livre" }, { valor: "feminino", nome: "Feminino" },
  { valor: "masculino", nome: "Masculino" }, { valor: "misto", nome: "Misto" },
];

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
const txt = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

function faixa(c: Categoria) {
  if (c.faixa_etaria_label) return c.faixa_etaria_label;
  if (c.faixa_etaria_min == null && c.faixa_etaria_max == null) return null;
  if (c.faixa_etaria_min != null && c.faixa_etaria_max != null) return `${c.faixa_etaria_min} a ${c.faixa_etaria_max} anos`;
  return c.faixa_etaria_min != null ? `a partir de ${c.faixa_etaria_min} anos` : `até ${c.faixa_etaria_max} anos`;
}

function Formulario({ eventoId, produtoraId, perfilSlug, categoria, paiInicial, principais, premioEmDinheiro, misto, onFechar, onSalvo }: {
  eventoId: string;
  produtoraId: string | null;
  perfilSlug: string;
  categoria: Categoria | null;
  paiInicial: string | null;
  principais: Categoria[];
  premioEmDinheiro: boolean;
  misto: boolean;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const perfil = perfilPorSlug(perfilSlug);
  const c = categoria;
  const [f, setF] = useState({
    nome: c?.nome ?? "", pai: c?.categoria_pai_id ?? paiInicial ?? "", genero: c?.genero ?? "livre",
    idadeMin: txt(c?.faixa_etaria_min), idadeMax: txt(c?.faixa_etaria_max), idadeTexto: c?.faixa_etaria_label ?? "",
    solo: c?.permite_solo ?? true, duo: c?.permite_duo ?? true, conjunto: c?.permite_conjunto ?? true,
    valorSolo: txt(c?.valor_solo ?? 0), valorDuo: txt(c?.valor_duo ?? 0), valorConjunto: txt(c?.valor_conjunto ?? 0),
    minPessoas: txt(c?.min_participantes), maxPessoas: txt(c?.max_participantes),
    tempoMin: txt(c?.tempo_apresentacao_min), tempoMax: txt(c?.tempo_apresentacao_max),
    competitiva: c?.competitiva ?? true, premio1: txt(c?.premio_dinheiro_1), premio2: txt(c?.premio_dinheiro_2), premio3: txt(c?.premio_dinheiro_3),
    observacoes: c?.observacoes ?? "",
    vagas: txt(c?.vagas),
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!f.nome.trim()) return setErro("Informe o nome.");
    if (!f.solo && !f.duo && !f.conjunto) return setErro("Marque ao menos uma formação.");
    const valores = [num(f.valorSolo), num(f.valorDuo), num(f.valorConjunto)];
    if (valores.some((v) => v === null || !Number.isFinite(v) || v < 0)) return setErro("Taxas inválidas (use 0 para gratuito).");
    const iMin = num(f.idadeMin), iMax = num(f.idadeMax);
    if (iMin != null && iMax != null && iMax < iMin) return setErro("Idade máxima menor que a mínima.");
    const pMin = num(f.minPessoas), pMax = num(f.maxPessoas);
    if (pMin != null && pMax != null && pMax < pMin) return setErro("Máximo de pessoas menor que o mínimo.");
    setSalvando(true);
    const dados = {
      evento_id: eventoId, produtora_id: produtoraId, nome: f.nome.trim(), categoria_pai_id: f.pai || null, genero: f.genero,
      faixa_etaria_min: iMin, faixa_etaria_max: iMax, faixa_etaria_label: f.idadeTexto.trim() || null,
      permite_solo: f.solo, permite_duo: f.duo, permite_conjunto: f.conjunto,
      valor_solo: valores[0]!, valor_duo: valores[1]!, valor_conjunto: valores[2]!,
      min_participantes: pMin, max_participantes: pMax, tempo_apresentacao_min: num(f.tempoMin), tempo_apresentacao_max: num(f.tempoMax),
      competitiva: misto ? f.competitiva : true,
      premio_dinheiro_1: premioEmDinheiro ? num(f.premio1) : null, premio_dinheiro_2: premioEmDinheiro ? num(f.premio2) : null, premio_dinheiro_3: premioEmDinheiro ? num(f.premio3) : null,
      observacoes: f.observacoes.trim() || null,
      vagas: num(f.vagas) || null,
    };
    const supabase = createClient();
    const { error } = c ? await supabase.from("categorias").update(dados).eq("id", c.id) : await supabase.from("categorias").insert(dados);
    setSalvando(false);
    if (error) return setErro(error.message);
    onSalvo();
  };

  const nomesForm = { solo: perfil.formacoes.solo, duo: perfil.formacoes.duo, conjunto: perfil.formacoes.conjunto };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-axon-border px-5 py-4">
          <h2 className="font-semibold text-white">{c ? "Editar categoria" : f.pai ? "Nova subcategoria" : "Nova categoria"}</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Rotulo texto="Nome"><input required value={f.nome} onChange={(e) => set("nome", e.target.value)} maxLength={80} placeholder="Ex.: Jazz Infantil" className={campo} /></Rotulo>
            <Rotulo texto="Dentro de" ajuda="Deixe em branco para uma categoria principal.">
              <select value={f.pai} onChange={(e) => set("pai", e.target.value)} className={campo}>
                <option value="">— (categoria principal)</option>
                {principais.filter((p) => p.id !== c?.id).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Rotulo>
          </div>

          <div>
            <p className="text-xs text-gray-400">Formações aceitas e taxa de inscrição (por apresentação)</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {(["solo", "duo", "conjunto"] as const).map((k) => {
                const vk = k === "solo" ? "valorSolo" : k === "duo" ? "valorDuo" : "valorConjunto";
                return (
                  <div key={k} className={`rounded-lg border p-3 ${f[k] ? "border-axon-gold/40" : "border-axon-border opacity-60"}`}>
                    <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} className="accent-[#d4af37]" /> {nomesForm[k]}</label>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">R$</span>
                      <input inputMode="decimal" value={f[vk]} disabled={!f[k]} onChange={(e) => set(vk, e.target.value.replace(/[^\d,.]/g, ""))} aria-label={`Taxa ${nomesForm[k]}`} className={campo} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Rotulo texto="Gênero"><select value={f.genero} onChange={(e) => set("genero", e.target.value)} className={campo}>{GENEROS.map((g) => <option key={g.valor} value={g.valor}>{g.nome}</option>)}</select></Rotulo>
            <Rotulo texto="Idade mínima"><input inputMode="numeric" value={f.idadeMin} onChange={(e) => set("idadeMin", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
            <Rotulo texto="Idade máxima"><input inputMode="numeric" value={f.idadeMax} onChange={(e) => set("idadeMax", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
            <Rotulo texto="Pessoas em cena (mín.)"><input inputMode="numeric" value={f.minPessoas} onChange={(e) => set("minPessoas", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
            <Rotulo texto="Pessoas em cena (máx.)"><input inputMode="numeric" value={f.maxPessoas} onChange={(e) => set("maxPessoas", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
            <Rotulo texto="Vagas (máx. de inscrições)" ajuda={f.pai ? "Em branco = sem limite." : "Em branco = sem limite. Numa categoria principal, conta junto as subcategorias."}><input inputMode="numeric" value={f.vagas} onChange={(e) => set("vagas", e.target.value.replace(/\D/g, "").replace(/^0+/, ""))} placeholder="Sem limite" className={campo} /></Rotulo>
            <Rotulo texto="Faixa etária (texto livre)" ajuda="Opcional, ex.: Infantil (7 a 11)"><input value={f.idadeTexto} onChange={(e) => set("idadeTexto", e.target.value)} maxLength={40} className={campo} /></Rotulo>
            <Rotulo texto="Tempo mínimo (min)"><input inputMode="numeric" value={f.tempoMin} onChange={(e) => set("tempoMin", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
            <Rotulo texto="Tempo máximo (min)"><input inputMode="numeric" value={f.tempoMax} onChange={(e) => set("tempoMax", e.target.value.replace(/\D/g, ""))} className={campo} /></Rotulo>
          </div>

          {misto && (
            <label className="flex items-center gap-2 text-sm text-gray-200"><input type="checkbox" checked={f.competitiva} onChange={(e) => set("competitiva", e.target.checked)} className="accent-[#d4af37]" /> Categoria competitiva (com notas e classificação)</label>
          )}
          {premioEmDinheiro && (
            <div className="grid gap-4 sm:grid-cols-3">
              {(["premio1", "premio2", "premio3"] as const).map((k, i) => (
                <Rotulo key={k} texto={`Prêmio ${i + 1}º lugar (R$)`}><input inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value.replace(/[^\d,.]/g, ""))} className={campo} /></Rotulo>
              ))}
            </div>
          )}
          <Rotulo texto="Observações para os grupos"><textarea rows={2} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} maxLength={500} className={`${campo} resize-y`} /></Rotulo>
          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300">Cancelar</button>
          <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando && <Loader2 size={15} className="animate-spin" />} Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export function Categorias({ eventoId, produtoraId, perfilSlug, categorias, usos, podeGerir, premioEmDinheiro, misto }: {
  eventoId: string;
  produtoraId: string | null;
  perfilSlug: string;
  categorias: Categoria[];
  usos: Record<string, number>;
  podeGerir: boolean;
  premioEmDinheiro: boolean;
  misto: boolean;
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const [form, setForm] = useState<{ categoria: Categoria | null; pai: string | null } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const principais = categorias.filter((c) => !c.categoria_pai_id);
  const filhas = (id: string) => categorias.filter((c) => c.categoria_pai_id === id);

  const excluir = async (c: Categoria) => {
    const total = (usos[c.id] ?? 0) + filhas(c.id).reduce((s, x) => s + (usos[x.id] ?? 0), 0);
    if (total > 0) return setErro(`“${c.nome}” tem ${total} inscrição(ões). Mova as inscrições para outra categoria antes de excluir.`);
    if (!(await confirmar(`Excluir “${c.nome}”${filhas(c.id).length ? " e suas subcategorias" : ""}?`))) return;
    const { error } = await createClient().from("categorias").delete().eq("id", c.id);
    setErro(error?.message ?? null);
    router.refresh();
  };

  // Inscrições da categoria (a principal soma as subcategorias) e as vagas, se houver limite
  const vagasTexto = (c: Categoria) => {
    const ocupadas = (usos[c.id] ?? 0) + filhas(c.id).reduce((s, x) => s + (usos[x.id] ?? 0), 0);
    if (c.vagas != null) {
      const cheia = ocupadas >= c.vagas;
      return <span className={`ml-1 text-xs font-normal ${cheia ? "text-amber-300" : "text-gray-500"}`}>· {ocupadas} de {c.vagas} vagas{cheia ? " (esgotada)" : ""}</span>;
    }
    return ocupadas ? <span className="ml-1 text-xs font-normal text-gray-500">· {ocupadas} inscrição(ões)</span> : null;
  };

  const Linha = ({ c, nivel }: { c: Categoria; nivel: 0 | 1 }) => {
    const temFilhas = nivel === 0 && filhas(c.id).length > 0;
    const formacoes = [c.permite_solo && `${perfil.formacoes.solo} ${brl(c.valor_solo)}`, c.permite_duo && `${perfil.formacoes.duo} ${brl(c.valor_duo)}`, c.permite_conjunto && `${perfil.formacoes.conjunto} ${brl(c.valor_conjunto)}`].filter(Boolean);
    const detalhes = [faixa(c), c.genero && c.genero !== "livre" ? GENEROS.find((g) => g.valor === c.genero)?.nome : null,
      (c.min_participantes || c.max_participantes) ? `${c.min_participantes ?? 1}–${c.max_participantes ?? "∞"} pessoas` : null,
      (c.tempo_apresentacao_min || c.tempo_apresentacao_max) ? `${c.tempo_apresentacao_min ?? 0}–${c.tempo_apresentacao_max ?? "∞"} min` : null,
      misto && c.competitiva === false ? "mostra" : null].filter(Boolean);
    return (
      <li className={`flex flex-wrap items-center gap-3 px-5 py-3 ${nivel ? "bg-white/[0.015] pl-10" : ""}`}>
        {nivel === 1 && <ChevronRight size={14} className="-ml-5 text-gray-600" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{c.nome} {vagasTexto(c)}</p>
          <p className="mt-0.5 text-xs text-gray-400">{temFilhas ? "Agrupa as subcategorias abaixo (as inscrições são feitas nelas)." : formacoes.join(" · ")}</p>
          {!temFilhas && detalhes.length > 0 && <p className="text-xs text-gray-500">{detalhes.join(" · ")}</p>}
        </div>
        {podeGerir && (
          <div className="flex items-center gap-1">
            {nivel === 0 && <button type="button" onClick={() => setForm({ categoria: null, pai: c.id })} className="rounded-lg px-2 py-1.5 text-xs text-axon-gold hover:bg-axon-gold/10">+ Subcategoria</button>}
            <button type="button" onClick={() => setForm({ categoria: c, pai: null })} title="Editar" className="rounded-lg p-2 text-gray-400 hover:text-white"><Pencil size={14} /></button>
            <button type="button" onClick={() => excluir(c)} title="Excluir" className="rounded-lg p-2 text-gray-400 hover:text-red-300"><Trash2 size={14} /></button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <Cartao titulo="Categorias" descricao={`Os ${perfil.termos.grupo.plural} escolhem uma categoria (ou subcategoria) e a formação ao inscrever cada ${perfil.termos.apresentacao.singular}. A taxa vem daqui.`}
        acao={podeGerir ? <button type="button" onClick={() => setForm({ categoria: null, pai: null })} className="inline-flex items-center gap-1.5 rounded-lg bg-axon-gold px-3 py-2 text-sm font-semibold text-black"><Plus size={14} /> Nova categoria</button> : undefined}>
        {principais.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma categoria ainda. Crie as categorias (ex.: Jazz, Ballet) e, se quiser, subcategorias por idade.</p>
        ) : (
          <ul className="divide-y divide-axon-border">
            {principais.map((p) => (
              <li key={p.id}>
                <ul className="divide-y divide-axon-border/60">
                  <Linha c={p} nivel={0} />
                  {filhas(p.id).map((s) => <Linha key={s.id} c={s} nivel={1} />)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
      {form && (
        <Formulario eventoId={eventoId} produtoraId={produtoraId} perfilSlug={perfilSlug} categoria={form.categoria} paiInicial={form.pai}
          principais={principais} premioEmDinheiro={premioEmDinheiro} misto={misto}
          onFechar={() => setForm(null)} onSalvo={() => { setForm(null); router.refresh(); }} />
      )}
    </div>
  );
}
