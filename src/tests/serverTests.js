import { supabase } from "../services/supabaseClient"
import { initializeAuth } from "../services/authService"
import { getProfile, upsertProfile } from "../repositories/profileRepository"
export async function runServerTests() { if (!supabase) throw new Error("Supabase 설정 필요"); const auth = await initializeAuth(); console.assert(!auth.error, "anonymous auth"); const marker = `test-${Date.now()}`; const write = await upsertProfile({ nickname: marker }); console.assert(!write.error, "profile upsert"); const read = await getProfile(); console.assert(read.data?.nickname === marker, "profile read"); console.info("기본 서버 저장 테스트 통과. 테스트 프로필은 SQL Editor에서 현재 익명 user_id로 삭제하세요.") }
window.runServerTests = runServerTests
