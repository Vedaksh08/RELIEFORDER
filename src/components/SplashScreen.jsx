import { useEffect, useState } from 'react'
import { BUSINESS } from '../data/siteData.js'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 350)
    const t2 = setTimeout(() => setPhase('out'), 1850)
    const t3 = setTimeout(() => onDone(), 2300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg,#ECFDF7 0%,#E2F7F2 45%,#E8FFFB 100%)',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.45s ease' : 'none',
      }}
    >
      <div
        className="flex flex-col items-center gap-5"
        style={{
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'scale(0.82)' : 'scale(1)',
          transition:
            'opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className="logo-glow relative">
          <span className="pulse-ring absolute inset-0 rounded-3xl bg-primary-2/25" />
          <div className="logo-surface relative grid h-28 w-28 place-items-center overflow-hidden rounded-3xl p-2 shadow-2xl ring-1 ring-black/5">
            <img src={BUSINESS.logo} alt={BUSINESS.fullName} className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-brand text-2xl font-bold">{BUSINESS.fullName}</p>
          <p className="mt-1.5 text-[13px] font-semibold tracking-wide text-teal-600">
            {BUSINESS.tagline}
          </p>
        </div>

        <div className="mt-1 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="splash-dot h-1.5 w-1.5 rounded-full bg-primary/50"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
