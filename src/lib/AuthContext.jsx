import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from './supabase.js'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (uid) => {
    if (!uid) return setProfile(null)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const u = data.session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u?.id)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = {
    user,
    profile,
    loading,
    isAdmin: Boolean(profile?.is_admin),
    refreshProfile: () => loadProfile(user?.id),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
