import React from 'react'

interface BadgeProps {
    label: string
    variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'teal'
  }
  
  const variantMap: Record<string, string> = {
    green: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    gray: 'bg-[#1a2340] text-[#8da0c4] border border-[#1e3a5f]',
    teal: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  }
  
  export function Badge({ label, variant = 'gray' }: BadgeProps) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantMap[variant]}`}>
        {label}
      </span>
    )
  }
  
  // Helper to auto-pick variant from common status strings
  export function statusVariant(status: string): BadgeProps['variant'] {
    const s = status.toLowerCase()
    if (['active', 'completed', 'achieved', 'favorable', 'resolved'].some(k => s.includes(k))) return 'green'
    if (['inactive', 'closed', 'ended'].some(k => s.includes(k))) return 'gray'
    if (['high', 'critical', 'unfavorable', 'concerns', 'self'].some(k => s.includes(k))) return 'red'
    if (['medium', 'in progress', 'needs improvement', 'inconclusive'].some(k => s.includes(k))) return 'amber'
    if (['transferred', 'on hold'].some(k => s.includes(k))) return 'blue'
    if (['low', 'open'].some(k => s.includes(k))) return 'teal'
    return 'gray'
  }