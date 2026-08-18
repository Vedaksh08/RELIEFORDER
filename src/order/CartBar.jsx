import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import { useCart } from '../lib/CartContext.jsx'
import { inr } from './Shell.jsx'

/**
 * Blinkit-style sticky cart bar. Sits above the fold at the bottom of the
 * screen the moment anything is in the cart, so checkout is always one tap
 * away instead of a trip to the header icon.
 */
export default function CartBar({ hide = false }) {
  const { items, count, total } = useCart()

  if (hide || count === 0) return null

  return createPortal(
    <div className="cart-bar">
      <Link to="/cart" className="cart-bar-inner">
        <span className="cart-bar-icon">
          <ShoppingCart size={18} strokeWidth={2.4} />
          <span className="cart-bar-badge">{count}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/75">
            {count} item{count > 1 ? 's' : ''}
            {items.length > 1 && ` · ${items.length} products`}
          </span>
          <span className="font-display block truncate text-[15px] font-bold text-white">
            {inr(total)}
          </span>
        </span>

        <span className="cart-bar-cta">
          View cart
          <ChevronRight size={16} strokeWidth={2.8} />
        </span>
      </Link>
    </div>,
    document.body,
  )
}
