import { createClient } from "@supabase/supabase-js"
import { SUPABASE_CONFIG, isSupabaseConfigured } from "../config/supabaseConfig"

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null

export const result = (data = null, error = null) => ({
  data,
  error: error ? { code: error.code ?? "UNKNOWN", message: error.message ?? String(error) } : null,
})

export function friendlyError(error) {
  if (!error) return ""
  if (!isSupabaseConfigured) return "Supabase 설정이 없습니다. .env 파일의 공개용 키를 확인해주세요."
  if (!navigator.onLine) return "인터넷 연결이 없어 임시 보관했습니다. 연결되면 다시 동기화됩니다."
  return "서버에 저장하지 못했습니다. 잠시 후 다시 시도해주세요."
}
