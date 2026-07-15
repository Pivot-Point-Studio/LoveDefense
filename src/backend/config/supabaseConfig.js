export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL ?? "",
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
}

export const isSupabaseConfigured = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.publishableKey)
