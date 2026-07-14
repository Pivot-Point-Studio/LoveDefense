import { getCurrentUserId } from "./authService"
import { supabase } from "./supabaseClient"
import { saveProfile } from "../repositories/profileRepository"
import { saveExpression } from "../repositories/expressionRepository"
import { createGameSession, finalizeGameSession } from "../repositories/gameRepository"

const VERSION_KEY = "loveDefense.serverMigrationVersion"
const BACKUP_SUFFIX = ".backup.v1"
const keys = ["loveDefense.userProfile", "loveDefense.gameHistory", "loveDefense.savedExpressions"]
const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback)) } catch { return fallback } }

export async function migrateLocalDataOnce() {
  if (!supabase || !getCurrentUserId() || localStorage.getItem(VERSION_KEY) === "1") return { data: { migrated: false }, error: null }
  const user = parse(keys[0], null); const history = parse(keys[1], []); const expressions = parse(keys[2], [])
  for (const key of keys) { const value = localStorage.getItem(key); if (value !== null && !localStorage.getItem(`${key}${BACKUP_SUFFIX}`)) localStorage.setItem(`${key}${BACKUP_SUFFIX}`, value) }
  if (user) { const profile = await saveProfile({ nickname: user.nickname ?? "별이", mbti: user.mbti, expression_style: user.expression === "직접 표현형" ? "direct" : "indirect", relationship_duration: user.relationshipLength }); if (profile.error) return profile }
  for (const item of expressions) { const saved = await saveExpression({ expression_text: typeof item === "string" ? item : item.expression_text, scenario_title: item.scenario }); if (saved.error && saved.error.code !== "23505") return saved }
  for (const item of history) { const clientId = crypto.randomUUID(); const session = await createGameSession({ client_session_id: clientId, mode: "practice", difficulty: "normal", blame_side: "partner", started_at: item.createdAt ?? new Date().toISOString(), total_score: Number(item.score) || 0, cleared_stages: Number(item.stage) || 0, total_stages_played: Number(item.stage) || 0, is_completed: Boolean(item.success), ended_at: item.createdAt ?? new Date().toISOString(), end_reason: item.success ? "completed" : "hp_zero" }); if (session.error) return session; const final = await finalizeGameSession(session.data.id, {}); if (final.error) return final }
  localStorage.setItem(VERSION_KEY, "1")
  return { data: { migrated: true }, error: null }
}
