import { useEffect, useState } from 'react'

/**
 * Generic fading line rotator — cycles through `lines`, crossfading
 * every `interval` ms. Styling comes entirely from the caller.
 */
export default function Rotator({ lines, interval = 3000, className = '', textClassName = '' }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % lines.length), interval)
    return () => clearInterval(t)
  }, [lines.length, interval])
  return (
    <div className={`relative flex items-center overflow-hidden ${className}`}>
      <p key={i} className={`quote-fade ${textClassName}`}>
        {lines[i]}
      </p>
    </div>
  )
}
