import React from 'react'

interface ParticleOrbitLogoProps {
  variant?: 'color' | 'dark' | 'light'
  size?: number
}

let idCounter = 0

export function ParticleOrbitLogo({ variant = 'color', size = 200 }: ParticleOrbitLogoProps) {
  const uniqueId = `logo-${idCounter++}`
  // Sunset color scheme (warm fiery tones)
  const gradientColors = [
    '#FF1744', '#FF3D00', '#FF6F00', '#FF9100',
    '#FFAB00', '#FFD600', '#FFEA00', '#FFC400',
    '#FF9E80', '#FF6E40', '#FF4081', '#F50057',
    '#E91E63', '#FF1744', '#FF5252',
  ]

  // Create concentric circular orbits
  const particles: Array<{ x: number; y: number; color: string; size: number }> = []
  const centerX = 70
  const centerY = 70

  // Outer orbit - largest ring
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2
    const x = centerX + Math.cos(angle) * 42
    const y = centerY + Math.sin(angle) * 42
    const colorIndex = Math.floor((i / 36) * gradientColors.length)
    particles.push({ x, y, color: gradientColors[colorIndex], size: 2.5 })
  }

  // Second orbit
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2 + 0.3
    const x = centerX + Math.cos(angle) * 34
    const y = centerY + Math.sin(angle) * 34
    const colorIndex = Math.floor((i / 30) * gradientColors.length)
    particles.push({ x, y, color: gradientColors[colorIndex], size: 2.3 })
  }

  // Third orbit
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + 0.6
    const x = centerX + Math.cos(angle) * 26
    const y = centerY + Math.sin(angle) * 26
    const colorIndex = Math.floor((i / 24) * gradientColors.length)
    particles.push({ x, y, color: gradientColors[colorIndex], size: 2.1 })
  }

  // Fourth orbit
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + 0.9
    const x = centerX + Math.cos(angle) * 18
    const y = centerY + Math.sin(angle) * 18
    const colorIndex = Math.floor((i / 18) * gradientColors.length)
    particles.push({ x, y, color: gradientColors[colorIndex], size: 1.9 })
  }

  // Inner orbit - smallest ring
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + 1.2
    const x = centerX + Math.cos(angle) * 10
    const y = centerY + Math.sin(angle) * 10
    const colorIndex = Math.floor((i / 12) * gradientColors.length)
    particles.push({ x, y, color: gradientColors[colorIndex], size: 1.7 })
  }

  // Group particles by orbit for rotation
  const orbitGroups = [
    { particles: particles.slice(0, 36), radius: 42, duration: 20 }, // Outer orbit
    { particles: particles.slice(36, 66), radius: 34, duration: 15 }, // Second orbit
    { particles: particles.slice(66, 90), radius: 26, duration: 12 }, // Third orbit
    { particles: particles.slice(90, 108), radius: 18, duration: 10 }, // Fourth orbit
    { particles: particles.slice(108, 120), radius: 10, duration: 8 }, // Inner orbit
  ]

  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 450 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`coreGradient-${uniqueId}`}>
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#FF6F00" />
        </radialGradient>
        {/* Text gradient: blue-900 → blue-500 → blue-400 */}
        <linearGradient id={`textGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />   {/* blue-900 */}
          <stop offset="50%" stopColor="#3b82f6" />  {/* blue-500 */}
          <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400 */}
        </linearGradient>
        
        {/* Shine gradient for text - animated highlight effect */}
        <linearGradient id={`textShine-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="30%" stopColor="transparent" />
          <stop offset="40%" stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="52%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.6" />
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="transparent" />
          <animate
            attributeName="x1"
            values="-100%;200%"
            dur="3s"
            repeatCount="indefinite"
            calcMode="linear"
          />
          <animate
            attributeName="x2"
            values="0%;300%"
            dur="3s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </linearGradient>
        
        {/* Animation definitions */}
        <style>{`
          @keyframes orbit-rotate-${uniqueId} {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .orbit-group-${uniqueId} {
            transform-origin: 70px 70px;
            animation: orbit-rotate-${uniqueId} linear infinite;
          }
        `}</style>
      </defs>

      {/* Particle orbits with rotation */}
      {orbitGroups.map((group, groupIndex) => (
        <g
          key={groupIndex}
          className={`orbit-group-${uniqueId}`}
          style={{
            animationDuration: `${group.duration}s`,
          }}
        >
          {group.particles.map((particle, i) => {
            const globalIndex = orbitGroups
              .slice(0, groupIndex)
              .reduce((sum, g) => sum + g.particles.length, 0) + i
            return (
              <circle
                key={globalIndex}
                cx={particle.x}
                cy={particle.y}
                r={particle.size}
                fill={particle.color}
                opacity="0.85"
              />
            )
          })}
        </g>
      ))}

      {/* Center core with pulse animation */}
      <circle
        cx="70"
        cy="70"
        r="4"
        fill={`url(#coreGradient-${uniqueId})`}
        opacity="0.9"
        style={{
          animation: `pulse-${uniqueId} 2s ease-in-out infinite`,
        }}
      />
      <style>{`
        @keyframes pulse-${uniqueId} {
          0%, 100% {
            opacity: 0.9;
            r: 4;
          }
          50% {
            opacity: 1;
            r: 5;
          }
        }
      `}</style>

      {/* Company name with base gradient and animated shine overlay */}
      {/* Base text with static gradient (blue-900 → blue-500 → blue-400) */}
      <text
        x="128"
        y="85"
        fontFamily="'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="48"
        fontWeight="700"
        fill={`url(#textGradient-${uniqueId})`}
      >
        FairBacksy
      </text>
      {/* Animated shine overlay - smooth moving highlight effect */}
      <text
        x="128"
        y="85"
        fontFamily="'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="48"
        fontWeight="700"
        fill={`url(#textShine-${uniqueId})`}
        opacity="0.8"
      >
        FairBacksy
      </text>
    </svg>
  )
}

