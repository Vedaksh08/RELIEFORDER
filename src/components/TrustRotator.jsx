import { useEffect, useState } from 'react'
import { TRUST_LINES } from '../data/siteData.js'

/** Rotating trust lines — fades to the next line every few seconds. */
export default function TrustRotator({ className = '' }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % TRUST_LINES.length), 3800)
    return () => clearInterval(t)
  }, [])
  return (
    <div
      className={`quote-box relative flex min-h-[3rem] items-center justify-center overflow-hidden rounded-2xl px-4 py-2.5 text-center ${className}`}
    >
      <p
        key={i}
        className="quote-fade font-display text-[13.5px] font-semibold leading-normal text-emerald-800"
      >
        {TRUST_LINES[i]}
      </p>
    </div>
  )
}
