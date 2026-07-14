import { isSupabaseConfigured } from "./config/supabaseConfig"
import { initializeAuth } from "./services/authService"
import { migrateLocalDataOnce } from "./services/localDataMigrationService"
export async function bootstrapApp(pageName = "app") {
  if (!isSupabaseConfigured) return { user: null, configured: false, error: { message: "Supabase URL과 공개용 키를 설정해주세요." } }
  const auth = await initializeAuth(); if (auth.error) return { user: null, configured: true, error: auth.error }
  await migrateLocalDataOnce()
  return { user: auth.data, configured: true, pageName, error: null }
}
