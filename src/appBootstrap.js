import { isSupabaseConfigured } from "./backend/config/supabaseConfig"
import { initializeAuth } from "./backend/auth/authService"
import { migrateLocalDataOnce } from "./backend/services/localDataMigrationService"
export async function bootstrapApp(pageName = "app") {
  if (!isSupabaseConfigured) return { user: null, configured: false, error: { message: "Supabase URL과 공개용 키를 설정해주세요." } }
  const auth = await initializeAuth(); if (auth.error) return { user: null, configured: true, error: auth.error }
  await migrateLocalDataOnce()
  return { user: auth.data, configured: true, pageName, error: null }
}
