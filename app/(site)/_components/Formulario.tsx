import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full rounded-md border border-arx-line bg-arx-obsidian px-4 py-3 text-[15px] text-white outline-none transition-colors placeholder:text-arx-slate/70 focus:border-arx-fest/60";

export function Campo({ label, opcional, children }: { label: string; opcional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] text-arx-frost">
        {label}{opcional && <span className="text-arx-slate"> (opcional)</span>}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function Entrada(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function AreaTexto(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} min-h-[140px] resize-y ${props.className ?? ""}`} />;
}

export function Selecao(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} appearance-none ${props.className ?? ""}`} />;
}

// Campo-isca contra robôs: invisível para pessoas e leitores de tela
export function Isca() {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label>Site<input type="text" name="site" tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}
