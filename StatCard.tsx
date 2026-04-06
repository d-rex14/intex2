import type { ReactNode } from 'react'

interface StatCardProps {
    label: string
    value: string | number
    sub?: string
    accent?: 'amber' | 'teal' | 'crimson' | 'default'
    icon?: ReactNode
  }
  
  const accentMap = {
    amber: 'border-amber-500/30 bg-amber-500/5',
    teal: 'border-teal-500/30 bg-teal-500/5',
    crimson: 'border-red-500/30 bg-red-500/5',
    default: 'border-[#1e3a5f] bg-[#111827]',
  }
  
  const valueAccentMap = {
    amber: 'text-amber-400',
    teal: 'text-teal-400',
    crimson: 'text-red-400',
    default: 'text-white',
  }
  
  export function StatCard({ label, value, sub, accent = 'default', icon }: StatCardProps) {
    return (
      <div className={`rounded-xl border p-5 flex flex-col gap-2 ${accentMap[accent]}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-[#8da0c4]">{label}</span>
          {icon && <span className="text-[#8da0c4]">{icon}</span>}
        </div>
        <span className={`text-3xl font-display font-bold ${valueAccentMap[accent]}`}>{value}</span>
        {sub && <span className="text-xs text-[#4a5a7a]">{sub}</span>}
      </div>
    )
  }