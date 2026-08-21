import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Surfaced in the UI rather than thrown, so the card still loads if env is missing.
export const supabaseReady = Boolean(url && anonKey)

export const supabase = supabaseReady
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        // Keep the socket alive and recover quickly after a sleep/network
        // drop, otherwise a backgrounded tab can sit silently disconnected.
        params: { eventsPerSecond: 20 },
        heartbeatIntervalMs: 15000,
        reconnectAfterMs: (tries) => Math.min(1000 * 2 ** tries, 10000),
      },
    })
  : null

// The realtime socket authenticates separately from REST. Without this it
// connects with the anon key alone, so RLS filters out every row an
// anonymous user cannot see — which is all orders. That is why the admin
// queue only updated on a manual refresh.
if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) supabase.realtime.setAuth(data.session.access_token)
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    // also re-applied on TOKEN_REFRESHED, or the socket keeps using a token
    // that has since expired
    supabase.realtime.setAuth(session?.access_token ?? anonKey)
  })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/order` },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}
