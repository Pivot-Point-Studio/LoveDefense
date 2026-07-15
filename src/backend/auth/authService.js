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
export const isAnonymousUser = (user = currentUser) => Boolean(user?.is_anonymous || user?.app_metadata?.provider === "anonymous")
export const ensureAuthenticatedUser = initializeAuth
export const onAuthStateChanged = (callback) => supabase?.auth.onAuthStateChange((_event, session) => { currentUser = session?.user ?? null; callback(currentUser) })
export async function signOutCurrentUser() { if (!supabase) return result(null); const { error } = await supabase.auth.signOut(); currentUser = null; return result(null, error) }
export async function upgradeAnonymousAccount() {
  if (!supabase) return result(null, { code: "CONFIG_MISSING", message: "Supabase 설정이 없습니다." })
  if (!currentUser) {
    const initialized = await initializeAuth()
    if (initialized.error) return initialized
  }
  const session = await supabase.auth.getSession()
  if (session.error) return result(null, session.error)
  currentUser = session.data.session?.user ?? currentUser
  if (!currentUser) return result(null, { code: "AUTH_SESSION_MISSING", message: "로그인 세션을 찾을 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해주세요." })
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { data, error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } })
  if (error) return result(null, { code: error.code ?? "GOOGLE_LINK_FAILED", message: error.message ?? "Google 계정 연결에 실패했습니다." })
  if (data?.url) window.location.assign(data.url)
  if (!data?.url) return result(null, { code: "GOOGLE_REDIRECT_MISSING", message: "Google 로그인 주소를 생성하지 못했습니다. Supabase Google Provider 설정을 확인해주세요." })
  return result(data)
}
export const linkEmailAccount = upgradeAnonymousAccount
export const linkOAuthAccount = upgradeAnonymousAccount
