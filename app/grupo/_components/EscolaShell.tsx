"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Music2,
  Users,
  Upload,
  Lightbulb,
  School,
  ChevronDown,
  LogOut,
  User,
  Menu,
} from 'lucide-react'

type Usuario = {
  nome: string
  email: string
  role: string
  organizacao_id?: string | null
  produtora_id?: string | null
}

type TenantConfig = {
  id: string
  produtora_id: string
  perfil_id: string | null
  nome_exibicao: string | null
  logo_url: string | null
  cor_primaria: string | null
  termo_inscricao: string | null
  termo_participante: string | null
  termo_participante_plural: string | null
  termo_grupo: string | null
  termo_grupo_plural: string | null
  termo_apresentacao: string | null
  termo_apresentacao_plural: string | null
}

export default function GrupoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [organizacaoNome, setOrganizacaoNome] = useState<string>('')
  const [config, setConfig] = useState<TenantConfig | null>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/grupo/login')
        return
      }

      const { data } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, organizacao_id, produtora_id')
        .eq('id', user.id)
        .single()

      if (!data) {
        router.push('/grupo/login')
        return
      }

      setUsuario({
        nome: data.nome,
        email: data.email ?? user.email ?? '',
        role: data.role,
        organizacao_id: data.organizacao_id,
        produtora_id: data.produtora_id,
      })

      // Carrega config do tenant e nome da organização em paralelo
      if (data.produtora_id) {
        const [{ data: tenantConfig }, { data: organizacao }] = await Promise.all([
          supabase
            .from('tenant_config')
            .select('*')
            .eq('produtora_id', data.produtora_id)
            .single(),
          data.organizacao_id
            ? supabase
                .from('grupos')
                .select('nome')
                .eq('id', data.organizacao_id)
                .single()
            : Promise.resolve({ data: null }),
        ])

        if (tenantConfig) setConfig(tenantConfig as TenantConfig)
        if (organizacao) setOrganizacaoNome(organizacao.nome)
      }
    }

    loadUser()
  }, [router])

  const labels = useMemo(() => ({
    apresentacao: config?.termo_apresentacao_plural?.trim() || 'Apresentações',
    participante: config?.termo_participante_plural?.trim() || 'Participantes',
    grupo: config?.termo_grupo?.trim() || 'Meu Grupo',
  }), [config])

  const navItems = useMemo(() => [
    { label: 'Dashboard',         href: '/grupo/dashboard',     icon: LayoutDashboard },
    { label: labels.apresentacao, href: '/grupo/apresentacoes', icon: Music2 },
    { label: labels.participante, href: '/grupo/participantes', icon: Users },
    { label: 'Músicas & Áudio',   href: '/grupo/midias',        icon: Upload },
    { label: 'Mapas de Luz',      href: '/grupo/mapas-de-luz',  icon: Lightbulb },
    { label: labels.grupo,        href: '/grupo/perfil',        icon: School },
  ], [labels])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/grupo/login')
  }

  const corPrimaria = config?.cor_primaria || '#C5A059'

  return (
    <div className="flex h-screen overflow-hidden bg-axon-bg text-white">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-axon-border bg-axon-panel transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-3 border-b border-axon-border px-5">
          {config?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logo_url}
              alt={config.nome_exibicao || 'Logo'}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <span className="text-base font-bold tracking-tight">
              <span style={{ color: corPrimaria }}>
                {config?.nome_exibicao || 'ARXUM'}
              </span>
              <span className="text-white"> Fest</span>
            </span>
          )}
          {organizacaoNome && (
            <span className="truncate text-xs text-white/40">{organizacaoNome}</span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 active:scale-95 ${
                  active
                    ? 'bg-axon-gold/10 text-axon-gold'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}
                style={active ? { color: corPrimaria } : {}}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-axon-border px-3 py-3">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold uppercase text-axon-bg"
              style={{ backgroundColor: corPrimaria }}
            >
              {usuario?.nome?.[0] ?? 'U'}
            </div>
            <div className="flex flex-1 flex-col text-left">
              <span className="truncate text-xs font-medium text-white/80">
                {usuario?.nome ?? 'Usuário'}
              </span>
              <span className="truncate text-xs text-white/35">{usuario?.email ?? ''}</span>
            </div>
            <ChevronDown
              size={14}
              className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="mt-1 rounded-lg border border-axon-border bg-axon-bg py-1">
              <Link
                href="/grupo/perfil"
                className="flex items-center gap-2 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={13} />
                Meu Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-white/5"
              >
                <LogOut size={13} />
                Sair da plataforma
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-axon-border bg-axon-panel px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/50 transition-colors hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold">
            <span style={{ color: corPrimaria }}>
              {config?.nome_exibicao || 'ARXUM'}
            </span>
            <span className="text-white"> Fest</span>
          </span>
          <div className="w-5" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}