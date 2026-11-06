'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { mergeStores, migrate, type Store } from './logic'

export const syncConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

type SetStore = (fn: (s: Store | null) => Store | null) => void

export function useSync(store: Store | null, setStore: SetStore) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [lastSync, setLastSync] = useState('')
  const [error, setError] = useState('')
  const storeRef = useRef<Store | null>(null)
  const lastPushed = useRef('')
  const ready = useRef(false)

  useEffect(() => { storeRef.current = store }, [store])

  // Session (le lien magique ramène sur la page avec la session dans l'URL)
  useEffect(() => {
    if (!syncConfigured) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  const push = useCallback(async (s: Store, uid: string) => {
    const json = JSON.stringify(s)
    const { error: e } = await supabase.from('coach_state').upsert({ user_id: uid, data: s, updated_at: new Date().toISOString() })
    if (e) throw e
    lastPushed.current = json
  }, [])

  const syncNow = useCallback(async () => {
    const cur = storeRef.current
    if (!user || !cur) return
    setStatus('syncing'); setError('')
    try {
      const { data, error: e } = await supabase.from('coach_state').select('data').eq('user_id', user.id).maybeSingle()
      if (e) throw e
      const merged = data?.data ? mergeStores(cur, migrate(data.data)) : cur
      setStore(s => (s ? mergeStores(s, merged) : merged))
      await push(merged, user.id)
      ready.current = true
      setStatus('ok')
      setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erreur de synchro (table coach_state créée ? voir le README)')
    }
  }, [user, push, setStore])

  // Premier pull à la connexion + au retour sur l'onglet
  const hasStore = !!store
  useEffect(() => {
    if (!user || !hasStore) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncNow()
    const onVis = () => { if (document.visibilityState === 'visible') syncNow() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [user, hasStore, syncNow])

  // Envoi automatique (anti-rebond) à chaque changement
  useEffect(() => {
    if (!user || !store || !ready.current) return
    if (JSON.stringify(store) === lastPushed.current) return
    const t = setTimeout(() => {
      push(store, user.id)
        .then(() => { setStatus('ok'); setLastSync(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })) })
        .catch(() => { setStatus('error'); setError('Envoi impossible (hors ligne ?). Réessaie plus tard.') })
    }, 2500)
    return () => clearTimeout(t)
  }, [store, user, push])

  const sendLink = async (email: string) => {
    setError('')
    const { error: e } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin + '/coach' } })
    if (e) { setError(e.message); return false }
    return true
  }
  const verifyCode = async (email: string, token: string) => {
    setError('')
    const { error: e } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
    if (e) setError(e.message)
  }
  const signOut = async () => { await supabase.auth.signOut(); ready.current = false; setStatus('idle') }

  return { configured: syncConfigured, user, status, lastSync, error, syncNow, sendLink, verifyCode, signOut }
}
