"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, CloudOff, Download, Loader2, Lock, LogOut, Minus, Plus, QrCode, RefreshCw, Wifi,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiUrl } from "@/lib/base-path";
import { limparDadosOffline } from "@/lib/offline/RegistrarOffline";
import { contar, perfilPorSlug } from "@/lib/perfis";
import { criptografarPacote, montarQuadros, type PacoteNotas } from "@/lib/offline/transferencia";
import {
  apagarTudo, baixarPacote, fichasDoEvento, listarPacotes, pendentes, salvarFicha, sincronizar,
  type Apresentacao, type FichaLocal, type Pacote,
} from "./dados";

interface EventoRemoto { id: string; nome: string; data_inicio: string | null; data_fim: string | null; local: string | null }

type Tela =
  | { nome: "eventos" }
  | { nome: "evento"; eventoId: string }
  | { nome: "ficha"; eventoId: string; apresentacaoId: string }
  | { nome: "qr"; eventoId: string };


const dataCurta = (iso: string | null) =>
  iso ? new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "";
const horaCurta = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  return online;
}

function fichaVazia(eventoId: string, apresentacaoId: string): FichaLocal {
  return { k: `${eventoId}:${apresentacaoId}`, e: eventoId, a: apresentacaoId, notas: {}, c: "", f: null, u: new Date(0).toISOString(), s: null };
}

function completa(f: FichaLocal | undefined, pacote: Pacote) {
  return !!f && pacote.criterios.every((c) => typeof f.notas[c.id] === "number");
}

// ═══════════════════════════════════════════════════════════════════════════

export function AppJurado({ nomeJurado }: { nomeJurado: string }) {
  const online = useOnline();
  const [tela, setTela] = useState<Tela>({ nome: "eventos" });
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [remotos, setRemotos] = useState<EventoRemoto[] | null>(null);
  const [fichas, setFichas] = useState<FichaLocal[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const eventoAtual = "eventoId" in tela ? tela.eventoId : null;
  const pacote = useMemo(() => pacotes.find((p) => p.evento.id === eventoAtual) ?? null, [pacotes, eventoAtual]);

  // Recarrega do IndexedDB quando muda o evento ou após baixar/sincronizar
  const [versaoLocal, setVersaoLocal] = useState(0);
  const recarregarLocal = useCallback(() => setVersaoLocal((v) => v + 1), []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const p = await listarPacotes();
      const f = eventoAtual ? await fichasDoEvento(eventoAtual) : null;
      if (!vivo) return;
      setPacotes(p);
      if (f) setFichas(f);
    })();
    return () => { vivo = false; };
  }, [eventoAtual, versaoLocal]);

  // Lista de eventos designados (precisa de internet)
  useEffect(() => {
    if (!online) return;
    fetch(apiUrl("/api/jurado/eventos"), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { eventos?: EventoRemoto[] } | null) => j && setRemotos(j.eventos ?? []))
      .catch(() => {});
  }, [online]);

  const mostrar = (tipo: "ok" | "erro", texto: string) => {
    setAviso({ tipo, texto });
    window.setTimeout(() => setAviso(null), 4000);
  };

  const baixar = async (eventoId: string) => {
    setOcupado(eventoId);
    try {
      await baixarPacote(eventoId);
      recarregarLocal();
      mostrar("ok", "Evento pronto para uso sem internet.");
    } catch (e) {
      mostrar("erro", e instanceof Error ? e.message : "Falha ao baixar.");
    } finally {
      setOcupado(null);
    }
  };

  const sincronizarAgora = useCallback(async (eventoId: string, silencioso = false) => {
    if (!navigator.onLine) return;
    if (!silencioso) setOcupado("sync");
    try {
      const r = await sincronizar(eventoId);
      setFichas(await fichasDoEvento(eventoId));
      if (!silencioso) mostrar(r.problemas.length ? "erro" : "ok", r.problemas.length ? `Algumas fichas não foram aceitas: ${r.problemas[0]}` : "Notas enviadas ao servidor.");
    } catch (e) {
      if (!silencioso) mostrar("erro", e instanceof Error ? e.message : "Falha ao sincronizar.");
    } finally {
      if (!silencioso) setOcupado(null);
    }
  }, []);

  // Sincroniza sozinho quando a internet volta
  useEffect(() => {
    if (!online || !eventoAtual) return;
    sincronizar(eventoAtual).then(recarregarLocal).catch(() => {});
  }, [online, eventoAtual, recarregarLocal]);

  const sair = async () => {
    const algumPendente = (await Promise.all(pacotes.map((p) => fichasDoEvento(p.evento.id)))).some((l) => pendentes(l).length > 0);
    if (algumPendente && !window.confirm("Há notas que ainda não foram enviadas ao servidor nem entregues por QR. Se sair, elas serão apagadas deste aparelho. Sair mesmo assim?")) return;
    await apagarTudo();
    await limparDadosOffline();
    await createClient().auth.signOut();
    window.location.href = apiUrl("/login");
  };

  const atualizarFicha = async (f: FichaLocal) => {
    await salvarFicha(f);
    setFichas((lista) => [...lista.filter((x) => x.k !== f.k), f]);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-arx-line bg-arx-obsidian/90 px-4 backdrop-blur">
        {tela.nome === "eventos" ? (
          <span className="text-[13px] text-arx-mist">Olá, <span className="text-white">{nomeJurado.split(" ")[0]}</span></span>
        ) : (
          <button type="button" className="-ml-2 inline-flex h-10 items-center gap-1 px-2 text-[14px] text-arx-mist"
            onClick={() => setTela(tela.nome === "evento" ? { nome: "eventos" } : { nome: "evento", eventoId: tela.eventoId })}>
            <ArrowLeft size={18} /> Voltar
          </button>
        )}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${online ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
            {online ? <Wifi size={12} /> : <CloudOff size={12} />} {online ? "Online" : "Offline"}
          </span>
          {tela.nome === "eventos" && (
            <button type="button" onClick={sair} aria-label="Sair" className="inline-flex h-9 w-9 items-center justify-center text-arx-slate hover:text-white">
              <LogOut size={17} />
            </button>
          )}
        </div>
      </header>

      {aviso && (
        <div role="status" className={`mx-4 mt-3 rounded-md px-4 py-3 text-[13px] ${aviso.tipo === "ok" ? "bg-emerald-400/10 text-emerald-200" : "bg-red-400/10 text-red-200"}`}>
          {aviso.texto}
        </div>
      )}

      <main className="flex-1 px-4 pb-28 pt-5">
        {tela.nome === "eventos" && (
          <ListaEventos pacotes={pacotes} remotos={remotos} online={online} ocupado={ocupado}
            onBaixar={baixar} onAbrir={(id) => setTela({ nome: "evento", eventoId: id })} />
        )}
        {tela.nome === "evento" && pacote && (
          <TelaEvento pacote={pacote} fichas={fichas} online={online} ocupado={ocupado}
            onAtualizar={() => baixar(pacote.evento.id)}
            onSincronizar={() => sincronizarAgora(pacote.evento.id)}
            onQr={() => setTela({ nome: "qr", eventoId: pacote.evento.id })}
            onAbrir={(a) => setTela({ nome: "ficha", eventoId: pacote.evento.id, apresentacaoId: a })} />
        )}
        {tela.nome === "ficha" && pacote && (
          <TelaFicha key={tela.apresentacaoId} pacote={pacote} apresentacaoId={tela.apresentacaoId}
            ficha={fichas.find((f) => f.a === tela.apresentacaoId) ?? fichaVazia(pacote.evento.id, tela.apresentacaoId)}
            onSalvar={atualizarFicha}
            onFinalizada={() => online && sincronizarAgora(pacote.evento.id, true)}
            onIr={(a) => setTela({ nome: "ficha", eventoId: pacote.evento.id, apresentacaoId: a })} />
        )}
        {tela.nome === "qr" && pacote && <TelaQr pacote={pacote} fichas={fichas} />}
        {"eventoId" in tela && !pacote && (
          <p className="text-[14px] text-arx-mist">Este evento não está baixado neste aparelho.</p>
        )}
      </main>
    </div>
  );
}

// ── Lista de eventos ───────────────────────────────────────────────────────

function ListaEventos({ pacotes, remotos, online, ocupado, onBaixar, onAbrir }: {
  pacotes: Pacote[]; remotos: EventoRemoto[] | null; online: boolean; ocupado: string | null;
  onBaixar: (id: string) => void; onAbrir: (id: string) => void;
}) {
  const baixados = new Map(pacotes.map((p) => [p.evento.id, p]));
  const lista: EventoRemoto[] = [
    ...(remotos ?? []),
    ...pacotes.map((p) => p.evento).filter((e) => !(remotos ?? []).some((r) => r.id === e.id)),
  ];

  return (
    <>
      <h1 className="text-[26px] font-medium tracking-[-0.02em] text-white">Seus eventos</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-arx-mist">
        Baixe o evento com internet antes de começar. Depois, a avaliação funciona sem conexão.
      </p>

      {remotos === null && online && <Loader2 className="mt-8 animate-spin text-arx-slate" size={20} />}
      {lista.length === 0 && (remotos !== null || !online) && (
        <p className="mt-8 rounded-lg border border-arx-line p-5 text-[14px] text-arx-mist">
          {online ? "Você ainda não foi designado para nenhum evento." : "Nenhum evento baixado neste aparelho. Conecte-se à internet para baixar."}
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {lista.map((e) => {
          const p = baixados.get(e.id);
          return (
            <li key={e.id} className="rounded-xl border border-arx-line bg-arx-surface p-4">
              <p className="text-[16px] text-white">{e.nome}</p>
              <p className="mt-1 text-[12px] text-arx-slate">
                {[dataCurta(e.data_inicio), e.data_fim && e.data_fim !== e.data_inicio ? dataCurta(e.data_fim) : null].filter(Boolean).join(" – ")}
                {e.local ? ` · ${e.local}` : ""}
              </p>
              <p className="mt-3 text-[12px] text-arx-mist">
                {p ? <>Disponível offline · baixado às {horaCurta(p.baixado_em)}</> : "Ainda não baixado neste aparelho"}
              </p>
              <div className="mt-4 flex gap-2">
                {p && (
                  <button type="button" onClick={() => onAbrir(e.id)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-arx-fest text-[14px] font-semibold text-arx-obsidian">
                    Avaliar
                  </button>
                )}
                {online && (
                  <button type="button" onClick={() => onBaixar(e.id)} disabled={ocupado === e.id}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border border-arx-line px-4 text-[14px] text-arx-frost disabled:opacity-60 ${p ? "" : "flex-1"}`}>
                    {ocupado === e.id ? <Loader2 size={16} className="animate-spin" /> : p ? <RefreshCw size={16} /> : <Download size={16} />}
                    {p ? "Atualizar" : "Baixar para usar offline"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── Evento: ordem das apresentações ────────────────────────────────────────

function TelaEvento({ pacote, fichas, online, ocupado, onAtualizar, onSincronizar, onQr, onAbrir }: {
  pacote: Pacote; fichas: FichaLocal[]; online: boolean; ocupado: string | null;
  onAtualizar: () => void; onSincronizar: () => void; onQr: () => void; onAbrir: (a: string) => void;
}) {
  const porA = new Map(fichas.map((f) => [f.a, f]));
  const finalizadas = fichas.filter((f) => f.f).length;
  const aEnviar = pendentes(fichas).length;
  const total = pacote.apresentacoes.length;

  // Agrupa por dia
  const dias = new Map<string, Apresentacao[]>();
  for (const a of pacote.apresentacoes) {
    const d = a.data_apresentacao ?? "";
    dias.set(d, [...(dias.get(d) ?? []), a]);
  }

  return (
    <>
      <h1 className="text-[24px] font-medium leading-[1.15] tracking-[-0.02em] text-white">{pacote.evento.nome}</h1>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-arx-surface-2">
        <div className="h-full rounded-full bg-arx-fest transition-all" style={{ width: `${total ? (finalizadas / total) * 100 : 0}%` }} />
      </div>
      <p className="mt-2 text-[13px] text-arx-mist">{finalizadas} de {contar(total, perfilPorSlug(pacote.perfil).termos.apresentacao)} avaliadas</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onQr}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-arx-fest/40 text-[14px] text-arx-fest">
          <QrCode size={16} /> Entregar por QR
        </button>
        <button type="button" onClick={online ? onSincronizar : undefined} disabled={!online || ocupado === "sync"}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-arx-line text-[14px] text-arx-frost disabled:opacity-50">
          {ocupado === "sync" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {aEnviar ? `Enviar (${aEnviar})` : "Sincronizado"}
        </button>
      </div>
      {!online && aEnviar > 0 && (
        <p className="mt-3 text-[12px] text-amber-200/80">{aEnviar} ficha(s) guardada(s) só neste aparelho. Serão enviadas quando houver internet — ou entregue por QR.</p>
      )}

      {pacote.criterios.length === 0 && (
        <p className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-[13px] text-amber-100">
          A produção ainda não cadastrou os critérios de avaliação. {online && <button type="button" className="underline" onClick={onAtualizar}>Atualizar</button>}
        </p>
      )}

      {[...dias.entries()].map(([dia, lista]) => (
        <section key={dia} className="mt-7">
          {dia && <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-arx-slate">{dataCurta(dia)}</h2>}
          <ul className="divide-y divide-arx-line overflow-hidden rounded-xl border border-arx-line">
            {lista.map((a) => {
              const f = porA.get(a.id);
              const estado = f?.f ? "finalizada" : f && Object.values(f.notas).some((n) => n !== null) ? "andamento" : "pendente";
              return (
                <li key={a.id}>
                  <button type="button" onClick={() => onAbrir(a.id)} className="flex w-full items-center gap-3 bg-arx-surface px-4 py-3.5 text-left active:bg-arx-surface-2">
                    <span className="w-7 shrink-0 text-[12px] tabular-nums text-arx-slate">{a.ordem_apresentacao ?? "—"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-white">{a.nome}</span>
                      <span className="block truncate text-[12px] text-arx-slate">{a.grupo} · {a.categoria} · {perfilPorSlug(pacote.perfil).formacoes[a.tipo as "solo"] ?? a.tipo}</span>
                    </span>
                    {estado === "finalizada" && <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-arx-fest/15 text-arx-fest"><Check size={14} /></span>}
                    {estado === "andamento" && <span className="h-2 w-2 rounded-full bg-amber-300" aria-label="Em andamento" />}
                    {estado === "pendente" && <ChevronRight size={16} className="text-arx-slate" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

// ── Ficha de avaliação ─────────────────────────────────────────────────────

function TelaFicha({ pacote, apresentacaoId, ficha, onSalvar, onFinalizada, onIr }: {
  pacote: Pacote; apresentacaoId: string; ficha: FichaLocal;
  onSalvar: (f: FichaLocal) => Promise<void>; onFinalizada: () => void; onIr: (a: string) => void;
}) {
  const [atual, setAtual] = useState<FichaLocal>(ficha);
  const [confirmar, setConfirmar] = useState(false);
  const indice = pacote.apresentacoes.findIndex((a) => a.id === apresentacaoId);
  const a = pacote.apresentacoes[indice];
  const anterior = pacote.apresentacoes[indice - 1];
  const proxima = pacote.apresentacoes[indice + 1];
  const travada = !!atual.f;
  const criterios = [...pacote.criterios].sort((x, y) => (x.ordem ?? 0) - (y.ordem ?? 0));

  const alterar = (mudanca: Partial<FichaLocal>) => {
    if (travada) return;
    const nova = { ...atual, ...mudanca, u: new Date().toISOString() };
    setAtual(nova);
    void onSalvar(nova);
  };

  const definirNota = (cid: string, valor: number | null, min: number, max: number) => {
    const v = valor === null || Number.isNaN(valor) ? null : Math.min(max, Math.max(min, Math.round(valor * 10) / 10));
    alterar({ notas: { ...atual.notas, [cid]: v } });
  };

  const finalizar = async () => {
    const agora = new Date().toISOString();
    const nova = { ...atual, f: agora, u: agora };
    setAtual(nova);
    await onSalvar(nova);
    setConfirmar(false);
    onFinalizada();
    if (proxima) onIr(proxima.id);
  };

  if (!a) return null;
  const pronta = completa(atual, pacote);

  return (
    <>
      <p className="text-[12px] text-arx-slate">{a.ordem_apresentacao ? `#${a.ordem_apresentacao} · ` : ""}{a.categoria} · {perfilPorSlug(pacote.perfil).formacoes[a.tipo as "solo"] ?? a.tipo}</p>
      <h1 className="mt-1 text-[24px] font-medium leading-[1.15] tracking-[-0.02em] text-white">{a.nome}</h1>
      <p className="mt-1 text-[14px] text-arx-mist">{a.grupo}</p>

      {travada && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-arx-fest/10 px-3 py-2 text-[13px] text-arx-fest">
          <Lock size={14} /> Finalizada às {horaCurta(atual.f!)}. Só a produção pode reabrir.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {criterios.map((c) => {
          const valor = atual.notas[c.id];
          const passo = 0.5;
          return (
            <div key={c.id} className="rounded-xl border border-arx-line bg-arx-surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] text-white">{c.nome}</span>
                <span className="text-[11px] text-arx-slate">{c.nota_min} a {c.nota_max}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" aria-label={`Diminuir ${c.nome}`} disabled={travada}
                  onClick={() => definirNota(c.id, (valor ?? c.nota_max) - passo, c.nota_min, c.nota_max)}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-arx-line text-arx-frost disabled:opacity-40">
                  <Minus size={18} />
                </button>
                <input inputMode="decimal" aria-label={`Nota de ${c.nome}`} disabled={travada}
                  value={valor === null || valor === undefined ? "" : String(valor).replace(".", ",")}
                  onChange={(e) => {
                    const t = e.target.value.replace(",", ".").trim();
                    definirNota(c.id, t === "" ? null : Number(t), c.nota_min, c.nota_max);
                  }}
                  placeholder="—"
                  className="h-12 w-full rounded-md border border-arx-line bg-arx-obsidian text-center text-[22px] font-medium tabular-nums text-white outline-none focus:border-arx-fest/60 disabled:opacity-70" />
                <button type="button" aria-label={`Aumentar ${c.nome}`} disabled={travada}
                  onClick={() => definirNota(c.id, (valor ?? c.nota_min) + passo, c.nota_min, c.nota_max)}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-arx-line text-arx-frost disabled:opacity-40">
                  <Plus size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <label className="mt-5 block">
        <span className="text-[13px] text-arx-frost">Comentário <span className="text-arx-slate">(opcional)</span></span>
        <textarea value={atual.c} disabled={travada} onChange={(e) => alterar({ c: e.target.value })} rows={4}
          className="mt-2 w-full rounded-md border border-arx-line bg-arx-obsidian px-4 py-3 text-[15px] text-white outline-none focus:border-arx-fest/60 disabled:opacity-70" />
      </label>
      {!travada && <p className="mt-2 text-[12px] text-arx-slate">Salvo automaticamente neste aparelho.</p>}

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-arx-line bg-arx-obsidian/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] gap-2">
          <button type="button" disabled={!anterior} onClick={() => anterior && onIr(anterior.id)} aria-label="Anterior"
            className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-arx-line text-arx-frost disabled:opacity-30"><ChevronLeft size={20} /></button>
          {travada ? (
            <span className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-arx-surface text-[14px] text-arx-mist"><Lock size={15} /> Finalizada</span>
          ) : confirmar ? (
            <button type="button" onClick={finalizar}
              className="h-12 flex-1 rounded-md bg-arx-fest text-[14px] font-semibold text-arx-obsidian">Confirmar — não poderá alterar</button>
          ) : (
            <button type="button" disabled={!pronta} onClick={() => setConfirmar(true)}
              className="h-12 flex-1 rounded-md bg-arx-fest text-[14px] font-semibold text-arx-obsidian disabled:opacity-40">
              {pronta ? "Finalizar avaliação" : "Preencha todas as notas"}
            </button>
          )}
          <button type="button" disabled={!proxima} onClick={() => proxima && onIr(proxima.id)} aria-label="Próxima"
            className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-arx-line text-arx-frost disabled:opacity-30"><ChevronRight size={20} /></button>
        </div>
      </nav>
    </>
  );
}

// ── Entrega das notas por QR ───────────────────────────────────────────────

function TelaQr({ pacote, fichas }: { pacote: Pacote; fichas: FichaLocal[] }) {
  const [imagens, setImagens] = useState<string[] | null>(null);
  const [quadro, setQuadro] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const finalizadas = useMemo(() => fichas.filter((f) => f.f), [fichas]);
  const intervalo = useRef<number | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const k = pacote.criterios.map((c) => c.id);
        const conteudo: PacoteNotas = {
          v: 1, e: pacote.evento.id, j: pacote.jurado_id, t: new Date().toISOString(), k,
          fichas: finalizadas.map((f) => ({ a: f.a, n: k.map((cid) => f.notas[cid] ?? null), c: f.c || undefined, f: f.f!, u: f.u })),
        };
        const dados = await criptografarPacote(conteudo, pacote.chave);
        const quadros = montarQuadros(dados, pacote.evento.id, pacote.jurado_id);
        const imgs = await Promise.all(quadros.map((q) => QRCode.toDataURL(q, { errorCorrectionLevel: "L", margin: 2, width: 720, color: { dark: "#000000", light: "#ffffff" } })));
        if (vivo) setImagens(imgs);
      } catch (e) {
        if (vivo) setErro(e instanceof Error ? e.message : "Não foi possível gerar o QR.");
      }
    })();
    return () => { vivo = false; };
  }, [pacote, finalizadas]);

  useEffect(() => {
    if (!imagens || imagens.length < 2) return;
    intervalo.current = window.setInterval(() => setQuadro((q) => (q + 1) % imagens.length), 450);
    return () => { if (intervalo.current) window.clearInterval(intervalo.current); };
  }, [imagens]);

  return (
    <>
      <h1 className="text-[24px] font-medium tracking-[-0.02em] text-white">Entregar notas</h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-arx-mist">
        Mostre esta tela para a produção, que vai ler com a câmera em “Apuração → Receber notas”. As notas vão criptografadas.
      </p>
      <p className="mt-4 text-[13px] text-arx-frost">{finalizadas.length} ficha(s) finalizada(s) incluída(s)</p>

      {finalizadas.length === 0 ? (
        <p className="mt-6 rounded-lg border border-arx-line p-5 text-[14px] text-arx-mist">Finalize ao menos uma avaliação para gerar o QR.</p>
      ) : erro ? (
        <p className="mt-6 text-[14px] text-red-300">{erro}</p>
      ) : !imagens ? (
        <Loader2 className="mt-8 animate-spin text-arx-slate" size={22} />
      ) : (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagens[quadro]} alt={`QR ${quadro + 1} de ${imagens.length}`} className="mx-auto w-full max-w-[420px] rounded-lg bg-white" />
          <p className="mt-3 text-center text-[13px] tabular-nums text-arx-mist">
            Quadro {quadro + 1} de {imagens.length}{imagens.length > 1 ? " · mantenha na frente da câmera até completar" : ""}
          </p>
          <p className="mt-6 text-center text-[12px] text-arx-slate">Aumente o brilho da tela para facilitar a leitura.</p>
        </div>
      )}
    </>
  );
}
