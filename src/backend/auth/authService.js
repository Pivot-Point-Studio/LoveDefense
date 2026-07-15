import { supabase, result } from "../client/supabaseClient"

let currentUser = null

export async function initializeAuth() {
  if (!supabase) return result(null, { code: "CONFIG_MISSING", message: "Supabase 설정이 없습니다." })
  const { data, error } = await supabase.auth.getSession()
  if (error) return result(null, error)
  if (data.session?.user) { currentUser = data.session.user; return result(currentUser) }
  const anonymous = await supabase.auth.signInAnonymously()
  if (anonymous.error) return result(null, anonymous.error)
  currentUser = anonymous.data.user
  return result(currentUser)
}

export const getCurrentUser = () => currentUser
export const getCurrentUserId = () => currentUser?.id ?? null
export const ensureAuthenticatedUser = initializeAuth
export const onAuthStateChanged = (callback) => supabase?.auth.onAuthStateChange((_event, session) => { currentUser = session?.user ?? null; callback(currentUser) })
export async function signOutCurrentUser() { if (!supabase) return result(null); const { error } = await supabase.auth.signOut(); currentUser = null; return result(null, error) }
export async function upgradeAnonymousAccount() { return result(null, { code: "NOT_IMPLEMENTED", message: "정식 로그인 연결 준비 자리입니다." }) }
export const linkEmailAccount = upgradeAnonymousAccount
export const linkOAuthAccount = upgradeAnonymousAccount
