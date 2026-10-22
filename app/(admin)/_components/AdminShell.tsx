"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mic2,
  Ticket,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Gavel,
  ShoppingBag,
  FileSignature,
  Megaphone,
  ShieldCheck,
  Crown,
} from "lucide-react";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Line-up & Eventos", href: "/eventos", icon: CalendarDays },
  { name: "Inscrições & Elenco", href: "/inscricoes", icon: Users },
  { name: "Mídias & Áudio", href: "/midias", icon: Mic2 },
  { name: "Jurados & Apuração", href: "/jurados", icon: Gavel },
  { name: "Loja & Upsell", href: "/loja", icon: ShoppingBag },
  { name: "Termos & Contratos", href: "/termos", icon: FileSignature },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "PDV & Bilheteria", href: "/pdv", icon: Ticket },
];

interface AdminShellProps {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  userRole: string;
}

export default function AdminShell({
  children,
  userEmail,
  userName,
  userRole,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleDisplay = userRole === "super_admin" ? "Super Admin" : "Organizador";

  return (
    <div className="flex h-screen overflow-hidden bg-axon-bg text-white">
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-axon-panel border-r border-axon-border flex flex-col transition-all duration-300 ease-in-out relative z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-axon-border">
          {isSidebarOpen ? (
            <span className="text-xl font-bold tracking-wider truncate px-2">
              <span className="text-axon-gold">ARXUM</span>
              <span className="text-white font-light"> Fest</span>
            </span>
          ) : (
            <span className="text-xl font-bold tracking-wider mx-auto text-axon-gold">
              AR
            </span>
          )}
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-axon-panel border border-axon-border rounded-full p-1 text-gray-400 hover:text-white hover:border-axon-gold transition-colors z-30"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
          {[...navLinks, ...(userRole === "super_admin" ? [{ name: "Super Admin", href: "/super", icon: Crown }] : [])].map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-md transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-axon-gold/10 text-axon-gold font-medium"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                } ${isSidebarOpen ? "px-3 py-2" : "p-3 justify-center"}`}
              >
                <Icon size={20} className="shrink-0" />
                {isSidebarOpen && <span className="text-sm">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-axon-panel/80 backdrop-blur-md border-b border-axon-border flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="text-gray-400 text-sm font-medium">{roleDisplay}</div>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-axon-border"
            >
              <div className="w-9 h-9 rounded-full bg-axon-bg border border-axon-gold/30 flex items-center justify-center text-axon-gold font-bold text-sm uppercase">
                {(userName || userEmail).substring(0, 2)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-white leading-tight">
                  {userName}
                </div>
                <div className="text-xs text-gray-500 leading-tight truncate max-w-[140px]">
                  {userEmail}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="fixed top-16 right-6 w-64 bg-axon-panel border border-axon-border rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-axon-border mb-1">
                    <p className="text-sm text-white font-medium">{userName}</p>
                    <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                  </div>

                  <Link
                    href="/perfil"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User size={16} />
                    <span>Meu Perfil</span>
                  </Link>

                  <div className="h-px bg-axon-border my-1" />
                  <p className="px-4 py-1.5 text-xs text-gray-600 font-medium uppercase tracking-wider">
                    Gestão
                  </p>

                  <Link
                    href="/usuarios"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ShieldCheck size={16} />
                    <span>Usuários & Permissões</span>
                  </Link>

                  <Link
                    href="/configuracoes"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings size={16} />
                    <span>Configurações</span>
                  </Link>

                  <div className="h-px bg-axon-border my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sair da plataforma</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}