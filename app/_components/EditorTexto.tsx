"use client";

// Editor de texto com formatação básica (títulos, negrito, itálico, listas, links).
// Grava HTML simples; quem exibe sempre passa por limparHtml (lib/termos-html.ts).
import { useEffect, useRef, type ReactNode, type Ref } from "react";
import { Bold, Heading2, Italic, Link2, List, ListOrdered } from "lucide-react";
import { pedirTexto } from "./Dialogos";

// Texto antigo, sem tags, vira parágrafos para o editor
export function paraHtml(texto: string | null | undefined): string {
  const t = texto ?? "";
  if (!t.trim() || /<[a-z][\s\S]*>/i.test(t)) return t;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return t.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export function EditorTexto({ valorInicial, onMudar, rotulo, desabilitado = false, altura = "min-h-[160px]", acoes, ref }: {
  valorInicial: string;
  onMudar?: (html: string, vazio: boolean) => void;
  rotulo: string;
  desabilitado?: boolean;
  altura?: string;
  acoes?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  const div = useRef<HTMLDivElement | null>(null);

  // contentEditable: o conteúdo inicial entra direto no DOM
  useEffect(() => {
    if (div.current) div.current.innerHTML = paraHtml(valorInicial);
  }, [valorInicial]);

  const avisar = () => { if (div.current) onMudar?.(div.current.innerHTML.trim(), !div.current.innerText.trim()); };

  const comando = (cmd: string, valor?: string) => {
    div.current?.focus();
    document.execCommand(cmd, false, valor);
    avisar();
  };

  const link = async () => {
    const sel = window.getSelection();
    const faixa = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const url = await pedirTexto({ titulo: "Inserir link", rotulo: "Endereço (https://…)", valor: "https://", botao: "Inserir" });
    if (!url || !/^https?:\/\/\S+\.\S+/.test(url)) return;
    div.current?.focus();
    if (faixa && sel) { sel.removeAllRanges(); sel.addRange(faixa); }
    if (faixa && !faixa.collapsed) comando("createLink", url);
    else comando("insertHTML", `<a href="${url.replace(/"/g, "%22")}">${url.replace(/</g, "&lt;")}</a>`);
  };

  const botao = "rounded-md p-2 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-40";

  return (
    <div className={`overflow-hidden rounded-lg border border-axon-border ${desabilitado ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-axon-border bg-axon-bg px-2 py-1.5">
        <button type="button" disabled={desabilitado} title="Título de seção" onClick={() => comando("formatBlock", "<h2>")} className={botao}><Heading2 size={15} /></button>
        <button type="button" disabled={desabilitado} title="Parágrafo" onClick={() => comando("formatBlock", "<p>")} className={`${botao} text-xs font-semibold`}>¶</button>
        <button type="button" disabled={desabilitado} title="Negrito" onClick={() => comando("bold")} className={botao}><Bold size={15} /></button>
        <button type="button" disabled={desabilitado} title="Itálico" onClick={() => comando("italic")} className={botao}><Italic size={15} /></button>
        <button type="button" disabled={desabilitado} title="Lista" onClick={() => comando("insertUnorderedList")} className={botao}><List size={15} /></button>
        <button type="button" disabled={desabilitado} title="Lista numerada" onClick={() => comando("insertOrderedList")} className={botao}><ListOrdered size={15} /></button>
        <button type="button" disabled={desabilitado} title="Link" onClick={link} className={botao}><Link2 size={15} /></button>
        <span className="flex-1" />
        {acoes}
      </div>
      <div
        ref={(el) => {
          div.current = el;
          if (typeof ref === "function") ref(el);
          else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
        }}
        contentEditable={!desabilitado}
        suppressContentEditableWarning
        role="textbox"
        aria-label={rotulo}
        aria-multiline
        onInput={avisar}
        className={`${altura} bg-axon-bg/40 px-4 py-3 text-sm leading-relaxed text-gray-200 outline-none [&_a]:text-axon-gold [&_a]:underline [&_h2]:mb-3 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5`}
      />
    </div>
  );
}
