import { Cross, Pill, HeartPulse } from 'lucide-react'

export default function Background() {
  return (
    <>
      <div className="aurora" aria-hidden="true" />
      {/* subtle grid texture — clean clinical feel */}
      <div className="plus-grid" aria-hidden="true" />

      {/* Floating medical motifs OVER the card (pointer-events none
          so they never block taps). Gentle bobbing, never distracting. */}
      <div className="float-layer" aria-hidden="true">
        <div className="med-float med-float-a">
          <Cross size={26} strokeWidth={1.5} />
        </div>
        <div className="med-float med-float-b">
          <Pill size={24} strokeWidth={1.5} />
        </div>
        <div className="med-float med-float-c">
          <HeartPulse size={22} strokeWidth={1.5} />
        </div>
      </div>
    </>
  )
}
