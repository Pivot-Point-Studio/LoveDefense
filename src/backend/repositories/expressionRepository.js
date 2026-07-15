import { supabase, result } from "../client/supabaseClient"; import { getCurrentUserId } from "../auth/authService"
export async function saveExpression(expression) { const r = await supabase.from("saved_expressions").upsert({ ...expression, user_id: getCurrentUserId() }, { onConflict: "user_id,expression_text" }).select().single(); return result(r.data, r.error) }
export async function getSavedExpressions() { const r = await supabase.from("saved_expressions").select("*").eq("user_id", getCurrentUserId()).order("created_at", { ascending: false }); return result(r.data ?? [], r.error) }
export async function updateExpression(id, changes) { const r = await supabase.from("saved_expressions").update(changes).eq("id", id).eq("user_id", getCurrentUserId()).select().single(); return result(r.data, r.error) }
export async function deleteExpression(id) { const r = await supabase.from("saved_expressions").delete().eq("id", id).eq("user_id", getCurrentUserId()); return result(null, r.error) }
