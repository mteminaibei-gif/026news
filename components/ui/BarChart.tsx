'use client'

interface BarChartProps {
  data: number[] | { label: string; value: number }[]
  labels?: string[]
  height?: number
  color?: string
  highlightColor?: string
}

function normalizeData(data: number[] | { label: string; value: number }[]) {
  if (data.length === 0) return { values: [], labels: [] }
  if (typeof data[0] === 'number') {
    return {
      values: data as number[],
      labels: [] as string[],
    }
  }
  return {
    values: (data as { label: string; value: number }[]).map(item => item.value),
    labels: (data as { label: string; value: number }[]).map(item => item.label),
  }
}

export function BarChart({
  data,
  labels,
  height = 80,
  color = '#e8f5ea',
  highlightColor = '#1a5c2a',
}: BarChartProps) {
  const normalized = normalizeData(data)
  const values = normalized.values
  const computedLabels = labels?.length ? labels : normalized.labels
  const max = values.length > 0 ? Math.max(...values) : 1

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {values.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-colors cursor-pointer hover:opacity-80"
            style={{
              height: `${(val / max) * 100}%`,
              backgroundColor: i === values.length - 1 ? highlightColor : color,
            }}
            title={computedLabels.length ? `${computedLabels[i]}: ${val}` : `${val}`}
          />
        ))}
      </div>
      {computedLabels.length > 0 && (
        <div className="flex justify-between mt-1">
          {computedLabels.map((l, i) => (
            <span key={i} className="text-[10px] text-gray-400 flex-1 text-center">{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}
