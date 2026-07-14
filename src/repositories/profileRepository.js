import { supabase, result } from "../services/supabaseClient"
import { getCurrentUserId } from "../services/authService"
export async function getProfile() { if (!supabase) return result(null); const r = await supabase.from("profiles").select("*").eq("user_id", getCurrentUserId()).maybeSingle(); return result(r.data, r.error) }
export async function saveProfile(profile) { if (!supabase) return result(null, { message: "not configured" }); const r = await supabase.from("profiles").upsert({ ...profile, user_id: getCurrentUserId() }, { onConflict: "user_id" }).select().single(); return result(r.data, r.error) }
export const upsertProfile = saveProfile
export async function deleteProfile() { const r = await supabase.from("profiles").delete().eq("user_id", getCurrentUserId()); return result(null, r.error) }
