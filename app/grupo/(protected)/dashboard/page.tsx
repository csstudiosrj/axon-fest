'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Music2,
  Users,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileMusic,
  TrendingUp,
} from 'lucide-react'

interface Stats {
  apresentaçãos: number
  participantes: number
  musicasEnviadas: number
  pagamentosPendentes: number
  pagamentosConfirmados: number
  valorPendente: number
  valorPago: number
}

interface Apresentação {
  id: string
  nome: string
  tipo: string
  categoria_id_old: string | null
  status_pagamento: string
  valor_total: number | null
  arquivo_audio: string | null
  created_at: string
}

const INITIAL_STATS: Stats = {
  apresentaçãos: 0,
  participantes: 0,
  musicasEnviadas: 0,
  pagamentosPendentes: 0,
  pagamentosConfirmados: 0,
  valorPendente: 0,
  valorPago: 0,
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-axon-border bg-axon-panel p-5">
      <div className="flex items-start justify-between">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-4 w-4 rounded bg-white/10" />
      </div>
      <div className="mt-3 h-8 w-20 rounded bg-white/10" />
      <div className="mt-2 h-3 w-36 rounded bg-white/10" />
    </div>
  )
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'default',
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  accent?: 'gold' | 'success' | 'alert' | 'default'
}) {
  const valueClass: Record<string, string> = {
    gold: 'text-axon-gold',
    success: 'text-white',
    alert: 'text-red-400',
    default: 'text-white',
  }

  return (
    <div className="rounded-xl border border-axon-border bg-axon-panel p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm text-white/50">{title}</span>
        <Icon size={18} className="text-white/25" />
      </div>
      <div className={`mt-2 text-3xl font-bold ${valueClass[accent]}`}>{value}</div>
      <div className="mt-1 text-xs text-white/40">{subtitle}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isPago = status === 'pago'

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        isPago ? 'bg-white/10 text-white' : 'bg-yellow-500/10 text-yellow-400'
      }`}
    >
      {status}
    </span>
  )
}

export default function EscolaDashboardPage() {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS)
  const [organizacaoNome, setOrganizacaoNome] = useState<string>('')
  const [recentes, setRecentes] = useState<Apresentação[]>([])
  const [loading, setLoading] = useState(true)
  const [semOrganizacao, setSemOrganizacao] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('organizacao_id')
        .eq('id', user.id)
        .single()

      if (!usuario?.organizacao_id) {
        setSemOrganizacao(true)
        setLoading(false)
        return
      }

      const organizacaoId = usuario.organizacao_id

      const [organizacaoRes, apresentacoesRes, participantesRes] = await Promise.all([
        supabase.from('grupos').select('nome').eq('id', organizacaoId).single(),
        supabase
          .from('apresentacoes')
          .select(
            'id, nome, tipo, categoria_id_old, status_pagamento, valor_total, arquivo_audio, created_at'
          )
          .eq('grupo_id', organizacaoId)
          .order('created_at', { ascending: false }),
        supabase
          .from('grupo_participantes')
          .select('participante_id', { count: 'exact', head: true })
          .eq('grupo_id', organizacaoId),
      ])

      if (organizacaoRes.data) {
        setOrganizacaoNome(organizacaoRes.data.nome)
      }

      const apresentacoes = apresentacoesRes.data ?? []
      const participantesCount = participantesRes.count ?? 0

      const musicasEnviadas = apresentacoes.filter((item) => item.arquivo_audio).length
      const pendentes = apresentacoes.filter((item) => item.status_pagamento === 'pendente')
      const pagos = apresentacoes.filter((item) => item.status_pagamento === 'pago')

      setStats({
        apresentaçãos: apresentacoes.length,
        participantes: participantesCount,
        musicasEnviadas,
        pagamentosPendentes: pendentes.length,
        pagamentosConfirmados: pagos.length,
        valorPendente: pendentes.reduce((acc, item) => acc + (item.valor_total ?? 0), 0),
        valorPago: pagos.reduce((acc, item) => acc + (item.valor_total ?? 0), 0),
      })

      setRecentes(apresentacoes.slice(0, 6))
      setLoading(false)
    }

    load()
  }, [])

  if (semOrganizacao) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle size={40} className="mb-4 text-yellow-500" />
        <h2 className="text-lg font-semibold text-white">Organizacao nao vinculada</h2>
        <p className="mt-2 max-w-sm text-sm text-white/40">
          Seu usuario nao esta vinculado a nenhuma organizacao. Entre em contato com o
          administrador do festival.
        </p>
      </div>
    )
  }

  const progressoMusicas =
    stats.apresentaçãos > 0
      ? Math.round((stats.musicasEnviadas / stats.apresentaçãos) * 100)
      : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/40">
          {organizacaoNome ? `Painel da organizacao ${organizacaoNome}` : 'Visao geral da sua conta'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              title="Apresentacoes"
              value={stats.apresentaçãos}
              subtitle="cadastradas no portal"
              icon={Music2}
              accent="gold"
            />
            <KpiCard
              title="Participantes"
              value={stats.participantes}
              subtitle="no banco de elenco"
              icon={Users}
            />
            <KpiCard
              title="Musicas Enviadas"
              value={`${stats.musicasEnviadas}/${stats.apresentaçãos}`}
              subtitle={`${progressoMusicas}% das apresentacoes`}
              icon={Upload}
              accent={
                stats.musicasEnviadas === stats.apresentaçãos && stats.apresentaçãos > 0
                  ? 'success'
                  : 'default'
              }
            />
            <KpiCard
              title="Pagamentos Pendentes"
              value={stats.pagamentosPendentes}
              subtitle={formatCurrency(stats.valorPendente)}
              icon={Clock}
              accent={stats.pagamentosPendentes > 0 ? 'alert' : 'default'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-axon-border bg-axon-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/60">Situacao Financeira</h2>
          {loading ? (
            <div className="flex animate-pulse flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 rounded bg-white/10" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-white/70" />
                  <span className="text-sm text-white/60">Confirmados</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(stats.valorPago)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  <span className="text-sm text-white/60">Aguardando pagamento</span>
                </div>
                <span className="text-sm font-semibold text-yellow-400">
                  {formatCurrency(stats.valorPendente)}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between border-t border-axon-border pt-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-axon-gold" />
                  <span className="text-xs text-white/40">Total geral</span>
                </div>
                <span className="text-sm font-bold text-axon-gold">
                  {formatCurrency(stats.valorPago + stats.valorPendente)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-axon-border bg-axon-panel p-5">
          <h2 className="mb-4 text-sm font-semibold text-white/60">Envio de Musicas</h2>
          {loading ? (
            <div className="flex animate-pulse flex-col gap-3">
              <div className="h-5 rounded bg-white/10" />
              <div className="h-2 rounded-full bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
            </div>
          ) : stats.apresentaçãos === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <FileMusic size={28} className="mb-2 text-white/15" />
              <p className="text-sm text-white/40">Nenhuma apresentacao cadastrada ainda</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Musicas enviadas</span>
                <span className="font-semibold text-white">
                  {stats.musicasEnviadas} de {stats.apresentaçãos}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-axon-gold transition-all duration-500"
                  style={{ width: `${progressoMusicas}%` }}
                />
              </div>

              <p className="text-xs text-white/40">
                {stats.apresentaçãos - stats.musicasEnviadas > 0
                  ? `${stats.apresentaçãos - stats.musicasEnviadas} apresentacao(oes) aguardando envio de musica`
                  : 'Todas as musicas foram enviadas'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-axon-border bg-axon-panel">
        <div className="border-b border-axon-border px-5 py-4">
          <h2 className="text-sm font-semibold text-white/60">Ultimas Apresentacoes</h2>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ) : recentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Music2 size={36} className="mb-3 text-white/15" />
            <p className="text-sm text-white/40">Nenhuma apresentacao cadastrada</p>
            <p className="mt-1 text-xs text-white/25">
              Acesse Apresentaçãos no menu lateral para comecar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-axon-border">
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Nome</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Tipo</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Musica</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">
                    Pagamento
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-white/40">
                    Cadastro
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentes.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-axon-border/40 transition-colors last:border-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-3 font-medium text-white">{c.nome}</td>
                    <td className="px-5 py-3 capitalize text-white/50">{c.tipo ?? '-'}</td>
                    <td className="px-5 py-3">
                      {c.arquivo_audio ? (
                        <span className="inline-flex items-center gap-1 text-xs text-white/80">
                          <CheckCircle2 size={12} />
                          enviada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-500/80">
                          <Clock size={12} />
                          pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status_pagamento} />
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
