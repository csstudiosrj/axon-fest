import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-8 ${className}`}>{children}</div>;
}

export function Rotulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] text-arx-slate ${className}`}>{children}</p>
  );
}

export function Titulo({ children, className = "", as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag className={`text-balance font-medium tracking-[-0.035em] text-white ${className}`}>{children}</Tag>
  );
}

export function Paragrafo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-pretty text-[16px] leading-[1.7] text-arx-mist sm:text-[17px] ${className}`}>{children}</p>;
}

export function BotaoPrimario({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md bg-arx-fest px-5 text-[14px] font-semibold text-arx-obsidian transition-colors hover:bg-[#e2c255] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arx-fest ${className}`}>
      {children}
    </Link>
  );
}

export function BotaoSecundario({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border border-arx-line px-5 text-[14px] font-medium text-arx-frost transition-colors hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arx-fest ${className}`}>
      {children}
    </Link>
  );
}

export function LinkSeta({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-arx-fest">
      {children}
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function EmBreve() {
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-sm border border-arx-line px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-[0.14em] text-arx-slate">
      Em breve
    </span>
  );
}

// Cabeçalho padrão de seção: rótulo + título + texto
export function CabecalhoSecao({ rotulo, titulo, texto, className = "" }: { rotulo: string; titulo: ReactNode; texto?: ReactNode; className?: string }) {
  return (
    <div className={`max-w-[720px] ${className}`}>
      <Rotulo>{rotulo}</Rotulo>
      <Titulo className="mt-4 text-[32px] leading-[1.08] sm:text-[44px]">{titulo}</Titulo>
      {texto && <Paragrafo className="mt-5">{texto}</Paragrafo>}
    </div>
  );
}
