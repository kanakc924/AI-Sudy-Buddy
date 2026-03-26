'use client'

import { useEffect, useState } from 'react'

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreCircle({ score, size = 120, strokeWidth = 8 }: ScoreCircleProps) {
  const [displayScore, setDisplayScore] = useState(0)
  const [offset, setOffset] = useState(0)

  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  useEffect(() => {
    // Initial offset to handle SSR
    setOffset(circumference)
    let startTimestamp: number
    const duration = 1000 // 1s
    
    // Animate dashoffset after a tiny delay for CSS transition to bite
    const timer = setTimeout(() => {
      setOffset(circumference - (score / 100) * circumference)
    }, 50)

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      setDisplayScore(Math.floor(progress * score))
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    const anim = window.requestAnimationFrame(step)

    return () => {
      clearTimeout(timer)
      window.cancelAnimationFrame(anim)
    }
  }, [score, circumference])

  let color = 'var(--destructive)'
  if (score >= 50) color = 'var(--gold)'
  if (score >= 75) color = '#4CAF50'

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke="var(--border)" strokeWidth={strokeWidth} fill="none"
        />
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-out' }}
          className="drop-shadow-sm"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-serif text-3xl font-bold" style={{ color }}>{displayScore}%</span>
      </div>
    </div>
  )
}
