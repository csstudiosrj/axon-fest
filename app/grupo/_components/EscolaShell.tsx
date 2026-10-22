"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, LogOut, Menu, Ticket, X } from "lucide-react";

const NAV = [
  { label: "Meus festivais", href: "/grupo/dashboard", icon: Ticket },
  { label: "Dados do grupo", href: "/grupo/perfil", icon: Building2 },
];

export default function GrupoShell({ children, usuario, grupoNome }: {
  children: React.ReactNode;
  usuario: { nome: string | null; email: string };
  grupoNome: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);

  async function sair() {
    await createClient().auth.signOut();
    router.push("/grupo/login");
    router.refresh();
  }

  const ativo = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") || (href === "/grupo/dashboard" && /^\/grupo\/[0-9a-f-]{36}/.test(pathname));

  return (
    <div className="flex h-screen overflow-hidden bg-axon-bg text-white">
      {menuAberto && <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-axon-border bg-axon-panel transition-transform duration-200 lg:static lg:translate-x-0 ${menuAberto ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center justify-between border-b border-axon-border px-5">
          <span className="text-base font-bold tracking-tight">
            <span className="text-axon-gold">ARXUM</span> Fest
          </span>
          <button type="button" onClick={() => setMenuAberto(false)} className="text-gray-400 lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
        </div>
        {grupoNome && (
          <div className="border-b border-axon-border px-5 py-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Portal do grupo</p>
            <p className="truncate text-sm font-medium text-white">{grupoNome}</p>
          </div>
        )}

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {NAV.map(({ label, href, icon: Icone }) => (
            <Link key={href} href={href} onClick={() => setMenuAberto(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${ativo(href) ? "bg-axon-gold/10 text-axon-gold" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <Icone size={16} /> {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-axon-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-axon-gold text-xs font-bold uppercase text-black">
              {(usuario.nome ?? usuario.email)[0] ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{usuario.nome ?? "Usuário"}</p>
              <p className="truncate text-[11px] text-gray-500">{usuario.email}</p>
            </div>
          </div>
          <button type="button" onClick={sair}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-300 transition-colors hover:bg-white/5">
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-axon-border bg-axon-panel px-4 lg:hidden">
          <button type="button" onClick={() => setMenuAberto(true)} className="text-gray-400" aria-label="Abrir menu"><Menu size={20} /></button>
          <span className="text-sm font-bold"><span className="text-axon-gold">ARXUM</span> Fest</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
