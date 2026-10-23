"use client";

// Janelas de confirmação no padrão ARXUM (substituem confirm/prompt do navegador).
// Uso: `if (!(await confirmar({ mensagem: "Excluir?" }))) return;`
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";

interface Pedido {
  tipo: "confirmar" | "texto";
  titulo: string;
  mensagem: string;
  botao: string;
  perigo: boolean;
  valorInicial: string;
  exigir: string | null;
  rotuloCampo: string | null;
  tipoCampo: string;
  responder: (v: boolean | string | null) => void;
}

let atual: Pedido | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((o) => o());

function abrir(p: Omit<Pedido, "responder">) {
  return new Promise<boolean | string | null>((resolve) => {
    atual?.responder(p.tipo === "confirmar" ? false : null);
    atual = { ...p, responder: (v) => { atual = null; avisar(); resolve(v); } };
    avisar();
  });
}

export interface OpcoesConfirmar { titulo?: string; mensagem: string; botao?: string; perigo?: boolean; exigir?: string }

// Sim/não. Com `exigir`, a pessoa precisa digitar exatamente esse texto para liberar o botão.
export async function confirmar(o: OpcoesConfirmar | string): Promise<boolean> {
  const op = typeof o === "string" ? { mensagem: o } : o;
  const perigo = op.perigo ?? /excluir|remover|apagar|bloquear|tirar/i.test(op.mensagem + (op.botao ?? ""));
  const r = await abrir({
    tipo: "confirmar", titulo: op.titulo ?? "Confirmar", mensagem: op.mensagem, botao: op.botao ?? (perigo ? "Confirmar" : "Continuar"),
    perigo, valorInicial: "", exigir: op.exigir ?? null, rotuloCampo: op.exigir ? "Digite para confirmar" : null, tipoCampo: "text",
  });
  return r === true;
}

// Pede um texto. Devolve null se a pessoa cancelar.
export async function pedirTexto(o: { titulo: string; mensagem?: string; rotulo: string; valor?: string; botao?: string; tipo?: string }): Promise<string | null> {
  const r = await abrir({
    tipo: "texto", titulo: o.titulo, mensagem: o.mensagem ?? "", botao: o.botao ?? "Salvar", perigo: false,
    valorInicial: o.valor ?? "", exigir: null, rotuloCampo: o.rotulo, tipoCampo: o.tipo ?? "text",
  });
  return typeof r === "string" ? r : null;
}

const assinar = (fn: () => void) => { ouvintes.add(fn); return () => { ouvintes.delete(fn); }; };

export function Dialogos() {
  const pedido = useSyncExternalStore(assinar, () => atual, () => null);
  if (!pedido) return null;
  return <Janela key={pedido.mensagem + pedido.titulo} pedido={pedido} />;
}

function Janela({ pedido }: { pedido: Pedido }) {
  const [valor, setValor] = useState(pedido.valorInicial);
  const campo = useRef<HTMLInputElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const cancelar = () => pedido.responder(pedido.tipo === "confirmar" ? false : null);
  const liberado = pedido.exigir ? valor.trim() === pedido.exigir.trim() : pedido.tipo === "texto" ? valor.trim() !== "" : true;
  const ok = () => { if (liberado) pedido.responder(pedido.tipo === "confirmar" ? true : valor.trim()); };

  useEffect(() => {
    (campo.current ?? botao.current)?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cancelar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={cancelar}>
      <form role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); ok(); }}
        className="w-full max-w-md space-y-4 rounded-2xl border border-axon-border bg-axon-panel p-6 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="dialogo-titulo" className="flex items-center gap-2 font-semibold text-white">
            {pedido.perigo && <AlertTriangle size={18} className="text-red-400" />} {pedido.titulo}
          </h2>
          <button type="button" onClick={cancelar} aria-label="Fechar" className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>
        {pedido.mensagem && <p className="whitespace-pre-line text-sm text-gray-300">{pedido.mensagem}</p>}
        {pedido.rotuloCampo && (
          <label className="block text-xs text-gray-400">
            {pedido.rotuloCampo}{pedido.exigir && <strong className="text-white">: {pedido.exigir}</strong>}
            <input ref={campo} type={pedido.tipoCampo} value={valor} onChange={(e) => setValor(e.target.value)} autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-axon-border bg-axon-bg px-3 py-2.5 text-sm text-white outline-none focus:border-axon-gold" />
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={cancelar} className="rounded-lg border border-axon-border px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Cancelar</button>
          <button ref={botao} type="submit" disabled={!liberado}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${pedido.perigo ? "bg-red-500 text-white hover:bg-red-400" : "bg-axon-gold text-black hover:brightness-110"}`}>
            {pedido.botao}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Alterações não salvas ──
// Telas com formulário chamam useAvisoNaoSalvo(sujo). Enquanto houver algo sem salvar,
// clicar num link interno pede confirmação, e fechar/recarregar a aba aciona o aviso do navegador.
const sujos = new Set<symbol>();

export function useAvisoNaoSalvo(sujo: boolean) {
  const [chave] = useState(() => Symbol("form"));
  useEffect(() => {
    if (sujo) sujos.add(chave);
    else sujos.delete(chave);
    return () => { sujos.delete(chave); };
  }, [sujo, chave]);
}

export function GuardaNavegacao() {
  const router = useRouter();
  useEffect(() => {
    const clique = (e: MouseEvent) => {
      if (!sujos.size || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const destino = new URL(a.href, window.location.href);
      if (destino.origin !== window.location.origin || destino.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmar({ titulo: "Alterações não salvas", mensagem: "Você preencheu dados que ainda não foram salvos. Se sair agora, eles serão perdidos.", botao: "Sair sem salvar", perigo: true })
        .then((sair) => {
          if (!sair) return;
          sujos.clear();
          const caminho = destino.pathname.startsWith(BASE_PATH) ? destino.pathname.slice(BASE_PATH.length) || "/" : destino.pathname;
          router.push(caminho + destino.search + destino.hash);
        });
    };
    const fechar = (e: BeforeUnloadEvent) => { if (sujos.size) { e.preventDefault(); e.returnValue = ""; } };
    document.addEventListener("click", clique, true);
    window.addEventListener("beforeunload", fechar);
    return () => { document.removeEventListener("click", clique, true); window.removeEventListener("beforeunload", fechar); };
  }, [router]);
  return null;
}
