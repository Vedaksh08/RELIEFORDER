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
        onClickCapture={(e) => {
          // a swipe through the carousel must never flip the card;
          // a genuine tap (no movement) still bubbles up and flips
          if (dragRef.current.moved) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
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
            className="brand-chip brand-tile flex h-[4.75rem] w-[9.25rem] shrink-0 items-center justify-center rounded-2xl px-3.5 py-2.5"
            aria-hidden={i >= BRANDS.length}
          >
            <img
              src={brand.src}
              alt={brand.name}
              title={brand.name}
              className="max-h-full max-w-full object-contain"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
