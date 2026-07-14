import { supabase, result } from "../services/supabaseClient"; import { getCurrentUserId } from "../services/authService"
export async function getPartnerProfile() { const r = await supabase.from("partner_profiles").select("*").eq("user_id", getCurrentUserId()).maybeSingle(); return result(r.data, r.error) }
export async function upsertPartnerProfile(profile) { const r = await supabase.from("partner_profiles").upsert({ ...profile, user_id: getCurrentUserId() }, { onConflict: "user_id" }).select().single(); return result(r.data, r.error) }
export async function deletePartnerProfile() { const r = await supabase.from("partner_profiles").delete().eq("user_id", getCurrentUserId()); return result(null, r.error) }
