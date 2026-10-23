"use client";

import { colunasEndereco, enderecoDe, type Endereco } from "@/lib/endereco";
import { CamposEndereco } from "@/app/_components/CamposEndereco";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { maiuscula, perfilPorSlug } from "@/lib/perfis";
import { Aviso, Cartao, campo } from "../_ui";
import { confirmar } from "@/app/_components/Dialogos";

export interface ItemProgramacao {
  id: string;
  nome: string;
  tipo: "solo" | "duo" | "conjunto" | "grupo";
  ordem: number | null;
  data: string | null;
  local: string | null;
  grupo: string;
  categoria: string | null;
  pessoas: { id: string; nome: string }[];
}

function diasEntre(inicio: string | null, fim: string | null) {
  if (!inicio) return [];
  const lista: string[] = [];
  const d = new Date(`${inicio}T12:00:00`);
  const f = new Date(`${(fim ?? inicio)}T12:00:00`);
  while (d <= f && lista.length < 31) {
    lista.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return lista;
}

export interface LocalPalco {
  id: string;
  nome_local: string;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

// Endereço de um palco/local (aparece na página pública quando o festival tem vários locais)
function EnderecoLocal({ local, onFechar, onSalvo }: { local: LocalPalco; onFechar: () => void; onSalvo: () => void }) {
  const [end, setEnd] = useState<Endereco>(enderecoDe({ ...local, logradouro: local.endereco }));
  const [erro, setErro] = useState<string | null>(null);
  const salvar = async () => {
    const { logradouro, ...resto } = colunasEndereco(end);
    const { error } = await createClient().from("locais_evento").update({ ...resto, endereco: logradouro }).eq("id", local.id);
    if (error) return setErro(error.message);
    onSalvo();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-t-2xl border border-axon-border bg-axon-panel sm:rounded-2xl">
        <h2 className="border-b border-axon-border px-5 py-4 font-semibold text-white">Endereço de {local.nome_local}</h2>
        <div className="space-y-3 px-5 py-5">
          <CamposEndereco valor={end} onChange={setEnd} classeCampo={campo} />
          {erro && <p className="text-sm text-red-300">{erro}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-axon-border px-5 py-4">
          <button type="button" onClick={onFechar} className="rounded-lg px-4 py-2 text-sm text-gray-300">Cancelar</button>
          <button type="button" onClick={salvar} className="rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black">Salvar</button>
        </div>
      </div>
    </div>
  );
}

export function Programacao({ eventoId, perfilSlug, itens, locais, podeGerir, dias }: {
  eventoId: string;
  perfilSlug: string;
  itens: ItemProgramacao[];
  locais: LocalPalco[];
  podeGerir: boolean;
  dias: { inicio: string | null; fim: string | null };
}) {
  const router = useRouter();
  const perfil = perfilPorSlug(perfilSlug);
  const T = perfil.termos;
  const [lista, setLista] = useState(itens);
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [novoLocal, setNovoLocal] = useState("");
  const [editandoLocal, setEditandoLocal] = useState<LocalPalco | null>(null);
  const datas = diasEntre(dias.inicio, dias.fim);

  // Mesma pessoa em cena em apresentações seguidas (no mesmo dia e palco)
  const trocas = useMemo(() => lista.map((a, i) => {
    const anterior = lista[i - 1];
    if (!anterior || anterior.data !== a.data || anterior.local !== a.local) return [];
    const ids = new Set(anterior.pessoas.map((p) => p.id));
    return a.pessoas.filter((p) => ids.has(p.id)).map((p) => p.nome);
  }), [lista]);

  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    const n = [...lista];
    [n[i], n[j]] = [n[j], n[i]];
    setLista(n);
    setAlterado(true);
  };
  const mudar = (id: string, campoNome: "data" | "local", valor: string) => {
    setLista((l) => l.map((a) => (a.id === id ? { ...a, [campoNome]: valor || null } : a)));
    setAlterado(true);
  };
  const ordenarPorCategoria = () => {
    setLista((l) => [...l].sort((a, b) => (a.data ?? "").localeCompare(b.data ?? "") || (a.categoria ?? "").localeCompare(b.categoria ?? "", "pt-BR") || a.grupo.localeCompare(b.grupo, "pt-BR")));
    setAlterado(true);
  };

  const salvar = async () => {
    setSalvando(true);
    setAviso(null);
    const supabase = createClient();
    const original = new Map(itens.map((a) => [a.id, a]));
    for (const [i, a] of lista.entries()) {
      const o = original.get(a.id);
      if (o && o.ordem === i + 1 && o.data === a.data && o.local === a.local) continue;
      const { error } = await supabase.from("apresentacoes").update({ ordem_apresentacao: i + 1, data_apresentacao: a.data, local_id: a.local }).eq("id", a.id);
      if (error) { setAviso({ tipo: "erro", texto: error.message }); setSalvando(false); return; }
    }
    setSalvando(false);
    setAlterado(false);
    setAviso({ tipo: "ok", texto: "Programação salva. Jurados, mídias e caixa usam esta ordem." });
    router.refresh();
  };

  const adicionarLocal = async () => {
    if (!novoLocal.trim()) return;
    const { error } = await createClient().from("locais_evento").insert({ evento_id: eventoId, nome_local: novoLocal.trim() });
    if (error) return setAviso({ tipo: "erro", texto: error.message });
    setNovoLocal("");
    router.refresh();
  };
  const removerLocal = async (id: string) => {
    if (!(await confirmar("Remover este palco? As apresentações ligadas a ele ficam sem palco."))) return;
    const { error } = await createClient().from("locais_evento").delete().eq("id", id);
    if (error) return setAviso({ tipo: "erro", texto: error.message });
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {aviso && <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>}

      <Cartao titulo="Ordem de apresentação" descricao={`Use as setas para reordenar. A ordem vale para jurados, mídias e programa. ${podeGerir ? "" : "Somente a gestão altera."}`}
        acao={podeGerir && lista.length > 1 ? <button type="button" onClick={ordenarPorCategoria} className="rounded-lg border border-axon-border px-3 py-1.5 text-xs text-gray-300 hover:text-white">Ordenar por dia e categoria</button> : undefined}>
        {lista.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Nenhuma {T.apresentacao.singular} inscrita ainda.</p>
        ) : (
          <ol className="divide-y divide-axon-border">
            {lista.map((a, i) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-axon-gold/10 text-xs font-bold text-axon-gold">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.nome}</p>
                  <p className="text-xs text-gray-500">{a.grupo} · {a.categoria ?? "Sem categoria"} · {perfil.formacoes[a.tipo]} · {a.pessoas.length} em cena</p>
                  {trocas[i].length > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-axon-gold"><AlertTriangle size={12} /> Troca rápida: {trocas[i].join(", ")} também {trocas[i].length > 1 ? "estão" : "está"} na anterior</p>
                  )}
                </div>
                {datas.length > 1 && (
                  <select value={a.data ?? ""} onChange={(e) => mudar(a.id, "data", e.target.value)} disabled={!podeGerir} aria-label={`Dia de ${a.nome}`} className="rounded-lg border border-axon-border bg-axon-bg px-2 py-1.5 text-xs text-white">
                    <option value="">Dia…</option>
                    {datas.map((d) => <option key={d} value={d}>{new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}</option>)}
                  </select>
                )}
                {locais.length > 0 && (
                  <select value={a.local ?? ""} onChange={(e) => mudar(a.id, "local", e.target.value)} disabled={!podeGerir} aria-label={`Palco de ${a.nome}`} className="rounded-lg border border-axon-border bg-axon-bg px-2 py-1.5 text-xs text-white">
                    <option value="">Palco…</option>
                    {locais.map((l) => <option key={l.id} value={l.id}>{l.nome_local}</option>)}
                  </select>
                )}
                {podeGerir && (
                  <span className="flex">
                    <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" className="rounded-lg p-1.5 text-gray-400 hover:text-white disabled:opacity-20"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label="Descer" className="rounded-lg p-1.5 text-gray-400 hover:text-white disabled:opacity-20"><ArrowDown size={15} /></button>
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </Cartao>

      {podeGerir && alterado && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-axon-gold/40 bg-axon-panel/95 px-5 py-3 backdrop-blur">
          <span className="text-sm text-axon-gold">Há mudanças não salvas.</span>
          <button type="button" onClick={salvar} disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-axon-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar programação
          </button>
        </div>
      )}

      <Cartao titulo="Palcos" descricao="Para festivais com mais de um palco ou sala. Com um só, não precisa cadastrar.">
        <div className="space-y-3 px-5 py-4">
          {locais.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {locais.map((l) => (
                <li key={l.id} className="inline-flex items-center gap-2 rounded-full border border-axon-border px-3 py-1 text-sm text-gray-200">
                  <MapPin size={12} className="text-gray-500" /> {l.nome_local}
                  {l.cidade && <span className="text-xs text-gray-500">· {l.cidade}</span>}
                  {podeGerir && <button type="button" onClick={() => setEditandoLocal(l)} className="text-xs text-axon-gold hover:underline">endereço</button>}
                  {podeGerir && <button type="button" onClick={() => removerLocal(l.id)} aria-label={`Remover ${l.nome_local}`} className="text-gray-500 hover:text-red-300"><Trash2 size={12} /></button>}
                </li>
              ))}
            </ul>
          )}
          {podeGerir && (
            <div className="flex gap-2">
              <input value={novoLocal} onChange={(e) => setNovoLocal(e.target.value)} placeholder={`Ex.: Palco principal`} maxLength={80} className={`${campo} max-w-xs`} />
              <button type="button" onClick={adicionarLocal} className="inline-flex items-center gap-1.5 rounded-lg border border-axon-border px-3 py-2 text-sm text-gray-200"><Plus size={14} /> Adicionar</button>
            </div>
          )}
          <p className="text-xs text-gray-500">{maiuscula(T.apresentacao.plural)} sem dia definido aparecem na data de início do evento.</p>
        </div>
      </Cartao>
      {editandoLocal && <EnderecoLocal local={editandoLocal} onFechar={() => setEditandoLocal(null)} onSalvo={() => { setEditandoLocal(null); router.refresh(); }} />}
    </div>
  );
}
