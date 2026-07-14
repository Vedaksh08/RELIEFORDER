import { useCallback } from 'react'

/**
 * A button/anchor with a material-style ripple + premium press feedback.
 * Pass `as="a"` to render an anchor (href, target, rel pass through).
 */
export default function RippleButton({
  as = 'button',
  className = '',
  children,
  onClick,
  ...rest
}) {
  const Tag = as

  const handleClick = useCallback(
    (e) => {
      const el = e.currentTarget
      const circle = document.createElement('span')
      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      circle.className = 'ripple'
      circle.style.width = circle.style.height = `${size}px`
      circle.style.left = `${e.clientX - rect.left - size / 2}px`
      circle.style.top = `${e.clientY - rect.top - size / 2}px`
      el.appendChild(circle)
      setTimeout(() => circle.remove(), 650)
      onClick?.(e)
    },
    [onClick]
  )

  return (
    <Tag className={`btn ${className}`} onClick={handleClick} {...rest}>
      {children}
    </Tag>
  )
}
