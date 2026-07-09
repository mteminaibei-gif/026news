'use client'

import { useEffect, useState } from 'react'

interface Doodle {
  id: number
  top: number
  left: number
  size: number
  rotation: number
  opacity: number
  color: string
  type: 'chat' | 'heart' | 'star' | 'check' | 'circle' | 'news'
}

export default function DoodleBackground() {
  const [doodles, setDoodles] = useState<Doodle[]>([])

  useEffect(() => {
    // Generate random doodles
    const newDoodles: Doodle[] = []
    const colors = [
      'text-green-300/30',
      'text-blue-300/30',
      'text-yellow-300/30',
      'text-pink-300/30',
      'text-purple-300/30',
    ]
    
    for (let i = 0; i < 40; i++) {
      newDoodles.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 30 + 10,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: ['chat', 'heart', 'star', 'check', 'circle', 'news'][Math.floor(Math.random() * 6)] as any,
      })
    }
    
    setDoodles(newDoodles)
  }, [])

  const getDoodleSVG = (type: Doodle['type']) => {
    switch (type) {
      case 'chat':
        return (
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 14H6l-2 2V4h16v12z"/>
        )
      case 'heart':
        return (
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        )
      case 'star':
        return (
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        )
      case 'check':
        return (
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        )
      case 'circle':
        return (
          <circle cx="12" cy="12" r="8"/>
        )
      case 'news':
        return (
          <>
            <rect x="3" y="3" width="18" height="13" rx="2"/>
            <path d="M3 8h18"/>
            <path d="M8 5v3"/>
            <path d="M3 16h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </>
        )
      default:
        return <circle cx="12" cy="12" r="8"/>
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {doodles.map((doodle) => (
        <div
          key={doodle.id}
          className={`absolute ${doodle.color}`}
          style={{
            top: `${doodle.top}%`,
            left: `${doodle.left}%`,
            width: `${doodle.size}px`,
            height: `${doodle.size}px`,
            transform: `rotate(${doodle.rotation}deg)`,
            opacity: doodle.opacity,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {getDoodleSVG(doodle.type)}
          </svg>
        </div>
      ))}
      
      {/* Floating chat bubbles */}
      <div className="absolute top-10 left-10 w-16 h-16 text-green-300/20 animate-bounce-slow">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      </div>
      
      <div className="absolute top-20 right-10 w-20 h-20 text-blue-300/20 animate-pulse">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      
      <div className="absolute bottom-20 left-1/4 w-14 h-14 text-yellow-300/20 animate-float">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      
      <div className="absolute bottom-10 right-1/4 w-24 h-24 text-purple-300/20 animate-bounce-slow">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M3 3h18v13H3V3zm1 2v9h16V5H4zm7 2h2v2h-2V7zm0 4h2v2h-2v-2zm-4-4h2v2H7V7zm0 4h2v2H7v-2z"/>
        </svg>
      </div>
    </div>
  )
}