import { useState } from 'react'
import { Lock, ShieldAlert } from 'lucide-react'
import { primeAudio } from '../lib/sound.js'

// Front-door gate for /ADMIN. This is a convenience lock, NOT security:
// anything checked in the browser is readable in the bundle. Real enforcement
// lives in Postgres RLS (see supabase/schema.sql) which keys off profiles.is_admin.
const USER = import.meta.env.VITE_ADMIN_USER ?? 'SYSTEM'
const PASS = import.meta.env.VITE_ADMIN_PASS ?? 'SYSTEM'
const KEY = 'relief_admin_gate'

export const gatePassed = () => sessionStorage.getItem(KEY) === '1'

export default function AdminGate({ onPass }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (u.trim().toUpperCase() === USER && p.trim().toUpperCase() === PASS) {
      primeAudio() // this click is our chance to unlock audio for later chimes
      sessionStorage.setItem(KEY, '1') // cleared when the tab closes
      onPass()
    } else {
      setErr('Incorrect username or password.')
      setP('')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#e2f7f2] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-card bg-white p-8 shadow-lg"
      >
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Lock size={22} />
        </div>
        <h1 className="font-display mb-1 text-center text-xl font-semibold text-primary">
          Admin Login
        </h1>
        <p className="mb-6 text-center text-sm text-ink-soft">
          Relief Medical — staff access only
        </p>

        <label className="mb-1 block text-xs font-semibold text-ink-soft">Username</label>
        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          autoFocus
          autoComplete="off"
          className="mb-3 w-full rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs font-semibold text-ink-soft">Password</label>
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          className="mb-4 w-full rounded-btn border border-hairline px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        {err && (
          <p className="mb-3 flex items-center gap-1.5 rounded-btn bg-red-50 p-2.5 text-xs text-red-600">
            <ShieldAlert size={14} /> {err}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white shadow-md transition hover:brightness-110 active:scale-[.98]"
        >
          Log in
        </button>
      </form>
    </div>
  )
}
