import { useEffect, useRef } from 'react'
import { BRANDS } from '../data/siteData.js'

/**
 * Continuously auto-scrolling brand carousel.
 * - Infinite loop (the list is doubled; position wraps at the halfway point)
 * - Pauses on hover (desktop) and while dragging (touch friendly)
 * - Sub-pixel accumulator keeps the motion silky at any frame rate
 */
export default function BrandMarquee() {
  const sliderRef = useRef(null)
  const dragRef = useRef({ down: false, moved: false, startX: 0, startLeft: 0 })
  const hoverRef = useRef(false)
  const posRef = useRef(0)
  const loop = [...BRANDS, ...BRANDS]

  useEffect(() => {
    const slider = sliderRef.current
    if (!slider) return

    const SPEED = 0.55 // px per frame (~33px/s at 60fps)
    let frame = 0
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(now - last, 50) // cap for tab-switches
      last = now
      const cycle = slider.scrollWidth / 2 // one full set of brands

      if (cycle > 0 && !dragRef.current.down && !hoverRef.current) {
        posRef.current += SPEED * (dt / 16.67)
        if (posRef.current >= cycle) posRef.current -= cycle
        slider.scrollLeft = posRef.current
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const onPointerDown = (e) => {
    const slider = sliderRef.current
    if (!slider) return
    dragRef.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startLeft: slider.scrollLeft,
      pointerId: e.pointerId,
    }
  }

  const onPointerMove = (e) => {
    const slider = sliderRef.current
    const drag = dragRef.current
    if (!slider || !drag.down) return
    const delta = e.clientX - drag.startX
    if (!drag.moved && Math.abs(delta) > 8) {
      drag.moved = true
      slider.setPointerCapture?.(drag.pointerId)
    }
    if (drag.moved) {
      slider.scrollLeft = drag.startLeft - delta * 1.6
      posRef.current = slider.scrollLeft
    }
  }

  const onPointerUp = (e) => {
    const slider = sliderRef.current
    const wasMoved = dragRef.current.moved
    dragRef.current.down = false
    if (slider) posRef.current = slider.scrollLeft
    if (wasMoved) slider?.releasePointerCapture?.(e.pointerId)
    requestAnimationFrame(() => {
      dragRef.current.moved = false
    })
  }

  return (
    <div className="relative -mx-3">
      <div
        ref={sliderRef}
        className="brand-scroll no-scrollbar flex gap-2.5 overflow-x-auto px-3 py-1.5"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => (hoverRef.current = true)}
        onPointerLeave={() => (hoverRef.current = false)}
      >
        {loop.map((brand, i) => (
          <div
            key={`${brand.name}-${i}`}
            className="brand-chip glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: brand.color }}
            />
            <span className="whitespace-nowrap text-[10.5px] font-bold tracking-wide text-[#12305E]">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
