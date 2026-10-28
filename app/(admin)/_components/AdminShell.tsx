"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Crown, FileSignature, Gavel, History,
  LayoutDashboard, LogOut, Menu, Mic2, Receipt, Settings, ShieldCheck, Ticket, User, UserRound, Users, UsersRound, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { nomeCargo } from "@/lib/auth/cargos";
import { pode, type Area } from "@/lib/auth/permissoes";
import { Direitos } from "@/app/_components/Direitos";

interface ItemMenu { nome: string; href: string; icone: React.ElementType; area: Area }

const MENU_PRODUTORA: ItemMenu[] = [
  { nome: "Dashboard", href: "/dashboard", icone: LayoutDashboard, area: "dashboard" },
  { nome: "Eventos", href: "/eventos", icone: CalendarDays, area: "eventos" },
  { nome: "Inscrições", href: "/inscricoes", icone: Users, area: "evento_inscricoes" },
  { nome: "Mídias & Áudio", href: "/midias", icone: Mic2, area: "midias" },
  { nome: "Jurados & Apuração", href: "/jurados", icone: Gavel, area: "jurados" },
  { nome: "PDV & Bilheteria", href: "/pdv", icone: Ticket, area: "pdv" },
  { nome: "Termos & Regulamento", href: "/termos", icone: FileSignature, area: "termos" },
  { nome: "Faturas ARXUM", href: "/faturas", icone: Receipt, area: "faturas" },
];

const MENU_SUPER: ItemMenu[] = [
  { nome: "Visão geral", href: "/super", icone: BarChart3, area: "super" },
  { nome: "Produtoras", href: "/super/produtoras", icone: Building2, area: "super" },
  { nome: "Pessoas", href: "/super/pessoas", icone: UserRound, area: "super" },
  { nome: "Grupos", href: "/super/grupos", icone: UsersRound, area: "super" },
  { nome: "Participantes", href: "/super/participantes", icone: Users, area: "super" },
  { nome: "Planos e taxas", href: "/super/planos", icone: CreditCard, area: "super" },
  { nome: "Faturas", href: "/super/faturas", icone: Receipt, area: "super" },
  { nome: "Registro de ações", href: "/super/registro", icone: History, area: "super" },
];

// Telas fora do menu lateral (aparecem no topo com o nome certo)
const OUTRAS: { href: string; nome: string }[] = [
  { href: "/perfil", nome: "Meu perfil" },
  { href: "/usuarios", nome: "Equipe" },
  { href: "/configuracoes", nome: "Configurações da produtora" },
  { href: "/jurados/apuracao", nome: "Apuração das notas" },
  { href: "/faturas", nome: "Faturas do ARXUM" },
];

// Tela "de cima" para o botão Voltar do topo (nada nas telas do menu)
function voltarDe(pathname: string, menu: ItemMenu[], inicio: string): string | null {
  if (pathname === inicio || menu.some((m) => m.href === pathname)) return null;
  const pai = pathname.replace(/\/[^/]+$/, "");
  return pai && pai !== "/" ? pai : inicio;
}

function tituloDa(pathname: string, menu: ItemMenu[]): string {
  const candidatos = [...OUTRAS, ...menu.map((m) => ({ href: m.href, nome: m.nome }))]
    .filter((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
    .sort((a, b) => b.href.length - a.href.length);
  return candidatos[0]?.nome ?? "ARXUM Fest";
}

export interface AvisoFatura { valor: number; vencimento: string; vencida: boolean }

export default function AdminShell({ children, userEmail, userName, userRole, bloqueado = false, avisoFatura = null }: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  userRole: string;
  bloqueado?: boolean;
  avisoFatura?: AvisoFatura | null;
}) {
  const [aberto, setAberto] = useState(true);
  const [menuCelular, setMenuCelular] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const ehSuper = userRole === "super_admin";
  // Painel suspenso por fatura atrasada: só a tela de faturas
  const menu = ehSuper ? MENU_SUPER : MENU_PRODUTORA.filter((m) => pode(userRole, m.area) && (!bloqueado || m.area === "faturas"));
  const titulo = tituloDa(pathname, menu);
  const voltar = voltarDe(pathname, menu, ehSuper ? "/super" : "/dashboard");

  const sair = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  const ativo = (href: string) => (href === "/super" ? pathname === "/super" : pathname === href || pathname.startsWith(href + "/"));

  const navegacao = (compacto: boolean) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
      {menu.map((m) => {
        const Icone = m.icone;
        return (
          <Link key={m.href} href={m.href} onClick={() => setMenuCelular(false)} title={compacto ? m.nome : undefined}
            className={`flex items-center gap-3 rounded-lg transition-colors ${ativo(m.href) ? "bg-axon-gold/10 font-medium text-axon-gold" : "text-gray-400 hover:bg-white/5 hover:text-white"} ${compacto ? "justify-center p-3" : "px-3 py-2"}`}>
            <Icone size={20} className="shrink-0" />
            {!compacto && <span className="text-sm">{m.nome}</span>}
          </Link>
        );
      })}
    </nav>
  );

  const logo = (compacto: boolean) => (
    <span className="truncate px-2 text-xl font-bold tracking-wider">
      <span className="text-axon-gold">{compacto ? "AR" : "ARXUM"}</span>{!compacto && <span className="font-light text-white"> Fest</span>}
    </span>
  );

  const itemUsuario = "flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white";

  return (
    <div className="flex h-screen overflow-hidden bg-axon-bg text-white">
      {/* Menu lateral (computador) */}
      <aside className={`${aberto ? "w-64" : "w-20"} relative z-20 hidden flex-col border-r border-axon-border bg-axon-panel transition-all duration-300 lg:flex`}>
        <div className="flex h-16 items-center border-b border-axon-border px-4">{logo(!aberto)}</div>
        <button type="button" onClick={() => setAberto(!aberto)} aria-label={aberto ? "Recolher menu" : "Abrir menu"}
          className="absolute -right-3.5 top-20 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-axon-border bg-axon-panel text-gray-400 hover:text-white">
          {aberto ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        {navegacao(!aberto)}
      </aside>

      {/* Menu do celular */}
      {menuCelular && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex w-72 flex-col border-r border-axon-border bg-axon-panel">
            <div className="flex h-16 items-center justify-between border-b border-axon-border px-4">
              {logo(false)}
              <button type="button" onClick={() => setMenuCelular(false)} aria-label="Fechar menu" className="text-gray-400"><X size={20} /></button>
            </div>
            {navegacao(false)}
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMenuCelular(false)} />
        </div>
      )}

      <main className="relative flex h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-axon-border bg-axon-panel/80 px-4 backdrop-blur-md sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMenuCelular(true)} aria-label="Abrir menu" className="text-gray-400 lg:hidden"><Menu size={22} /></button>
            {voltar && (
              <Link href={voltar} aria-label="Voltar" title="Voltar"
                className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-axon-border pl-1.5 pr-3 text-xs text-gray-300 hover:bg-white/5 hover:text-white">
                <ChevronLeft size={15} /> Voltar
              </Link>
            )}
            <h1 className="truncate text-base font-semibold text-white sm:text-lg" data-titulo-tela>{titulo}</h1>
          </div>

          <div className="relative">
            <button type="button" onClick={() => setMenuUsuario(!menuUsuario)}
              className="flex items-center gap-3 rounded-full border border-transparent p-1.5 pr-3 transition-colors hover:border-axon-border hover:bg-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-axon-gold/30 bg-axon-bg text-sm font-bold uppercase text-axon-gold">
                {(userName || userEmail).substring(0, 2)}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-medium leading-tight text-white">{userName}</div>
                <div className="text-xs leading-tight text-gray-500">{nomeCargo(userRole)}</div>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${menuUsuario ? "rotate-180" : ""}`} />
            </button>

            {menuUsuario && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuUsuario(false)} />
                <div className="fixed right-4 top-16 z-50 w-64 overflow-hidden rounded-xl border border-axon-border bg-axon-panel py-2 shadow-2xl">
                  <div className="mb-1 border-b border-axon-border px-4 py-3">
                    <p className="text-sm font-medium text-white">{userName}</p>
                    <p className="truncate text-xs text-gray-400">{userEmail}</p>
                    <p className="mt-1 text-xs text-axon-gold">{nomeCargo(userRole)}</p>
                  </div>
                  <Link href="/perfil" onClick={() => setMenuUsuario(false)} className={itemUsuario}><User size={16} /> Meu perfil</Link>
                  {pode(userRole, "equipe") && <Link href="/usuarios" onClick={() => setMenuUsuario(false)} className={itemUsuario}><ShieldCheck size={16} /> Equipe e permissões</Link>}
                  {pode(userRole, "configuracoes") && <Link href="/configuracoes" onClick={() => setMenuUsuario(false)} className={itemUsuario}><Settings size={16} /> Configurações</Link>}
                  {ehSuper && <Link href="/super" onClick={() => setMenuUsuario(false)} className={itemUsuario}><Crown size={16} /> Super Admin</Link>}
                  <div className="my-1 h-px bg-axon-border" />
                  <button type="button" onClick={sair} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300">
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8">
          {avisoFatura && !bloqueado && pathname !== "/faturas" && (
            <Link href="/faturas" className={`mx-auto mb-6 block max-w-6xl rounded-lg border px-4 py-3 text-sm ${avisoFatura.vencida ? "border-red-400/40 bg-red-400/10 text-red-200" : "border-axon-gold/30 bg-axon-gold/10 text-axon-gold"}`}>
              {avisoFatura.vencida ? "Fatura do ARXUM vencida" : "Fatura do ARXUM em aberto"}: {avisoFatura.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}, vencimento em {new Date(`${avisoFatura.vencimento}T12:00:00`).toLocaleDateString("pt-BR")}. {avisoFatura.vencida ? "Pague para não ter o painel suspenso." : "Clique para pagar."}
            </Link>
          )}
          {children}
          <Direitos className="mt-12 text-center text-xs text-gray-600" />
        </div>
      </main>
    </div>
  );
}
