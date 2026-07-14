import { createContext, useCallback, useContext, useState } from 'react'
import { Sparkles } from 'lucide-react'

const ToastCtx = createContext(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const show = useCallback((message, opts = {}) => {
    setToast({ message, icon: opts.icon })
    clearTimeout(show._t)
    show._t = setTimeout(() => setToast(null), opts.duration || 2200)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-[300] flex justify-center px-4">
          <div
            className="glass-strong flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-2xl"
            style={{ animation: 'toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            {toast.icon ?? <Sparkles size={16} className="text-accent" />}
            {toast.message}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  )
}
