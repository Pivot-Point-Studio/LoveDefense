import { supabase, result } from "../services/supabaseClient"; import { getCurrentUserId } from "../services/authService"
export async function saveScenarioHistory(history) { const r = await supabase.from("scenario_history").upsert({ ...history, user_id: getCurrentUserId() }, { onConflict: "user_id,fingerprint" }).select().single(); return result(r.data, r.error) }
export async function getRecentScenarioHistory(limit = 30) { const r = await supabase.from("scenario_history").select("*").eq("user_id", getCurrentUserId()).order("created_at", { ascending: false }).limit(limit); return result(r.data ?? [], r.error) }
export const fetchRecentScenarioHistory = getRecentScenarioHistory
