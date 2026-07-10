'use client'

import { useEffect, useState } from 'react'

interface ChartData {
  name: string
  value: number
  timestamp?: string
}

interface AnimatedChartProps {
  data: ChartData[]
  title: string
  type: 'line' | 'bar'
  color?: string
  animationDuration?: number
}

export function AnimatedChart({
  data,
  title,
  type = 'line',
  color = '#4caf28',
  animationDuration = 800,
}: AnimatedChartProps) {
  const [displayData, setDisplayData] = useState<ChartData[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!data || data.length === 0) return

    setIsAnimating(true)

    // Stagger animation for each data point
    const duration = animationDuration / data.length
    let currentIndex = 0

    const timer = setInterval(() => {
      if (currentIndex <= data.length) {
        setDisplayData(data.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(timer)
        setIsAnimating(false)
      }
    }, duration)

    return () => clearInterval(timer)
  }, [data, animationDuration])

  const maxValue = Math.max(...data.map(d => d.value), 100)
  const height = 200

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{title}</h3>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>{Math.round(maxValue)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 relative w-full h-full">
          {/* Grid lines */}
          <div className="absolute inset-0 border-l border-b border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <div className="border-t border-gray-100 dark:border-gray-800" />
          </div>

          {/* Chart bars/line */}
          {type === 'bar' ? (
            <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
              {displayData.map((d, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(d.value / maxValue) * height}px`,
                    backgroundColor: color,
                    opacity: isAnimating ? 0.8 : 1,
                  }}
                  title={`${d.name}: ${d.value}`}
                />
              ))}
            </div>
          ) : (
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline
                points={displayData
                  .map((d, idx) => {
                    const x = (idx / (displayData.length - 1 || 1)) * 100 + '%'
                    const y = height - (d.value / maxValue) * height
                    return `${x} ${y}`
                  })
                  .join(' ')}
                fill="none"
                stroke={color}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
                style={{
                  transition: `all ${animationDuration}ms ease-out`,
                  opacity: isAnimating ? 0.8 : 1,
                }}
              />
              {/* Dots on line */}
              {displayData.map((d, idx) => (
                <circle
                  key={idx}
                  cx={`${(idx / (displayData.length - 1 || 1)) * 100}%`}
                  cy={height - (d.value / maxValue) * height}
                  r="4"
                  fill={color}
                  style={{
                    transition: `all ${animationDuration}ms ease-out`,
                  }}
                />
              ))}
            </svg>
          )}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="ml-12 flex justify-between text-xs text-gray-500 mt-2 px-2">
        {displayData.map((d, idx) => (
          <span key={idx} className="flex-1 text-center truncate">
            {d.name}
          </span>
        ))}
      </div>

      {isAnimating && (
        <p className="text-sm text-gray-500 mt-2 animate-pulse">Updating...</p>
      )}
    </div>
  )
}
