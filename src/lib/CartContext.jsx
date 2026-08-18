import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const KEY = 'relief_cart_v1'

export function CartProvider({ children }) {
  // Persisted so the cart survives the Google OAuth redirect round-trip.
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const api = useMemo(() => {
    const add = (med, qty = 1) =>
      setItems((cur) => {
        const found = cur.find((i) => i.id === med.id)
        // never let the cart exceed what's on the shelf
        const cap = med.stock ?? Infinity
        if (found) {
          return cur.map((i) =>
            i.id === med.id ? { ...i, qty: Math.min(i.qty + qty, cap) } : i,
          )
        }
        return [
          ...cur,
          {
            id: med.id,
            name: med.name,
            brand: med.brand,
            price: Number(med.price),
            stock: med.stock,
            qty: Math.min(qty, cap),
          },
        ]
      })

    const setQty = (id, qty) =>
      setItems((cur) =>
        qty <= 0
          ? cur.filter((i) => i.id !== id)
          : cur.map((i) =>
              i.id === id ? { ...i, qty: Math.min(qty, i.stock ?? Infinity) } : i,
            ),
      )

    const remove = (id) => setItems((cur) => cur.filter((i) => i.id !== id))
    const clear = () => setItems([])
    return { add, setQty, remove, clear }
  }, [])

  const count = items.reduce((n, i) => n + i.qty, 0)
  const total = items.reduce((n, i) => n + i.qty * Number(i.price), 0)

  return (
    <CartContext.Provider value={{ items, count, total, ...api }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
