import { supabase, result } from "../client/supabaseClient"
export async function submitRankedResult(resultPayload) { const r = await supabase.rpc("submit_game_result", { result_payload: resultPayload }); return result(r.data, r.error) }
export async function getLeaderboard(limit = 50, offset = 0) { const r = await supabase.rpc("get_leaderboard", { limit_count: limit, offset_count: offset }); return result(r.data ?? [], r.error) }
export async function getMyRank() { const r = await supabase.rpc("get_my_rank"); return result(r.data, r.error) }
export async function getMyBestScore() { const r = await supabase.from("leaderboard_entries").select("best_score").eq("user_id", (await supabase.auth.getUser()).data.user?.id).maybeSingle(); return result(r.data?.best_score ?? 0, r.error) }
