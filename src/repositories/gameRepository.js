import { supabase, result } from "../services/supabaseClient"; import { getCurrentUserId } from "../services/authService"
export async function createGameSession(session) { const r = await supabase.from("game_sessions").upsert({ ...session, user_id: getCurrentUserId() }, { onConflict: "user_id,client_session_id" }).select().single(); return result(r.data, r.error) }
export async function updateGameSession(id, changes) { const r = await supabase.from("game_sessions").update(changes).eq("id", id).eq("user_id", getCurrentUserId()).select().single(); return result(r.data, r.error) }
export async function saveStageResult(stage) { const r = await supabase.from("stage_results").upsert({ ...stage, user_id: getCurrentUserId() }, { onConflict: "session_id,stage_number" }).select().single(); return result(r.data, r.error) }
export async function finalizeGameSession(id, changes) { return updateGameSession(id, changes) }
export async function getRecentSessions(limit = 30) { const r = await supabase.from("game_sessions").select("*").eq("user_id", getCurrentUserId()).order("created_at", { ascending: false }).limit(limit); return result(r.data ?? [], r.error) }
export async function getSessionWithStages(id) { const r = await supabase.from("game_sessions").select("*, stage_results(*)").eq("id", id).eq("user_id", getCurrentUserId()).single(); return result(r.data, r.error) }
