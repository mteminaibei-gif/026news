interface Props {
  type: string
  label: string
}

const BADGE_STYLES: Record<string, string> = {
  bronze:   'bg-amber-100  text-amber-700  border border-amber-300',
  silver:   'bg-gray-100   text-gray-600   border border-gray-300',
  gold:     'bg-yellow-100 text-yellow-700 border border-yellow-300',
  platinum: 'bg-purple-100 text-purple-700 border border-purple-300',
  top5:     'bg-blue-100   text-blue-700   border border-blue-300',
}

export function BadgePill({ type, label }: Props) {
  const cls = BADGE_STYLES[type] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {label}
    </span>
  )
}
