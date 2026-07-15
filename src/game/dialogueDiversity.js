import { cooldownPhrases } from "../data/phrase-variation-library.js"

export const DIALOGUE_DIVERSITY_VERSION = 1
export const QUESTION_ENDING_MODES = new Set(["direct_question", "indirect_question"])
const DIVERSITY_KEY = "loveDefense.dialogueDiversity"
const MAX_ENDINGS = 10
const MAX_RECENT_RESPONSES = 10

export function normalizeDialogue(text = "") {
  return String(text).toLowerCase().replace(/[\s\u200b]+/g, "").replace(/[.,!?。！？…~'"“”‘’`]/g, "").trim()
}

export function tokenize(text = "") {
  return new Set(String(text).toLowerCase().replace(/[^가-힣a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 1))
}

export function jaccardSimilarity(left, right) {
  const a = tokenize(left); const b = tokenize(right)
  if (!a.size || !b.size) return 0
  const intersection = [...a].filter((word) => b.has(word)).length
  return intersection / new Set([...a, ...b]).size
}

export function isQuestionLike(text = "", endingMode = "") {
  return QUESTION_ENDING_MODES.has(endingMode) || /[?？]|(어때|어떨까|할까|할래|괜찮아|맞아|알겠어|말해줘|어떻게 해야|어떻게 할까)[.!?？]*$/.test(String(text).trim())
}

export function classifyEndingMode(text = "") {
  const value = String(text).trim()
  if (!value) return "silence"
  if (/…$|\.\.\.$/.test(value)) return "ellipsis"
  if (/[?？]$|(?:어때|어떨까|할까|할래|괜찮아|말해줘)[.!?？]*$/.test(value)) return /(?:어때|어떨까|할까|할래|괜찮아|말해줘)/.test(value) ? "direct_question" : "indirect_question"
  if (/(미안|미안해|사과할게)/.test(value)) return "apology"
  if (/(내가 잘못|내 책임|인정할게|내가 놓쳤어)/.test(value)) return "responsibility_acknowledgment"
  if (/(지금은|시간이 필요|여기까지|말하기 어렵)/.test(value)) return "boundary_setting"
  if (/(다음엔|앞으로|할게|하자)/.test(value)) return "action_promise"
  if (/(모르겠|응\.|알겠어\.|그래\.|됐어)/.test(value) && value.length < 24) return "short_reply"
  if (/(다른 얘기|그건 말고|일단 밥|영화|집에 가자)/.test(value)) return "topic_shift"
  if (/(참 대단|잘도|예민하시네|그렇게까지)/.test(value)) return "sarcasm"
  if (/(짜증|그만하자|지겹|또 시작)/.test(value)) return "irritated_close"
  if (/(나중에|답할게|읽고|생각해보고)/.test(value)) return "delayed_response_style"
  if (/(우리 관계|포기하고 싶지|계속 만나)/.test(value)) return "relationship_confirmation"
  if (/(네가 한 말|계속|반복|보니까|행동)/.test(value)) return "behavioral_observation"
  return "plain_statement"
}

export function getLocalProfileId() {
  const key = "loveDefense.localProfileId"
  let id = null
  try { id = localStorage.getItem(key) } catch { /* SSR/test */ }
  if (id) return id
  id = `local-${crypto.randomUUID()}`
  try { localStorage.setItem(key, id) } catch { /* memory-only fallback */ }
  return id
}

export function createEmptyDiversityState(userId = getLocalProfileId()) {
  return { version: DIALOGUE_DIVERSITY_VERSION, userId, partnerUtteranceCount: 0, phraseCooldowns: cooldownPhrases.map((phrase) => ({ ...phrase, lastUsedPartnerUtteranceIndex: null, unlockAtPartnerUtteranceIndex: 0 })), recentEndingHistory: [], recentPartnerResponses: [], recentSuggestedResponses: [], recentGameCombinations: [], updatedAt: new Date().toISOString() }
}

export function normalizeDiversityState(value, userId = getLocalProfileId()) {
  const base = createEmptyDiversityState(userId)
  const source = value && typeof value === "object" ? value : {}
  const phraseMap = new Map((source.phraseCooldowns ?? []).map((item) => [item.phraseId, item]))
  return { ...base, ...source, version: DIALOGUE_DIVERSITY_VERSION, userId: source.userId ?? userId, partnerUtteranceCount: Math.max(0, Number(source.partnerUtteranceCount) || 0), phraseCooldowns: base.phraseCooldowns.map((item) => ({ ...item, ...(phraseMap.get(item.phraseId) ?? {}) })), recentEndingHistory: Array.isArray(source.recentEndingHistory) ? source.recentEndingHistory.slice(0, MAX_ENDINGS) : [], recentPartnerResponses: Array.isArray(source.recentPartnerResponses) ? source.recentPartnerResponses.slice(0, MAX_RECENT_RESPONSES) : [], recentSuggestedResponses: Array.isArray(source.recentSuggestedResponses) ? source.recentSuggestedResponses.slice(0, MAX_RECENT_RESPONSES) : [], recentGameCombinations: Array.isArray(source.recentGameCombinations) ? source.recentGameCombinations.slice(0, 7) : [], updatedAt: source.updatedAt ?? new Date().toISOString() }
}

export function loadDiversityState(userId = getLocalProfileId()) {
  try { return normalizeDiversityState(JSON.parse(localStorage.getItem(`${DIVERSITY_KEY}.${userId}`) ?? "null"), userId) } catch { return createEmptyDiversityState(userId) }
}

export function saveDiversityState(value, userId = value?.userId ?? getLocalProfileId()) {
  const state = normalizeDiversityState(value, userId); state.updatedAt = new Date().toISOString()
  try { localStorage.setItem(`${DIVERSITY_KEY}.${state.userId}`, JSON.stringify(state)) } catch { /* caller still keeps session state */ }
  return state
}

export function buildThreeFactorSignatures(combination) {
  const { locationId, attachmentStyle, behaviorType, triggerId } = combination
  return [`location:${locationId}|attachment:${attachmentStyle}|behavior:${behaviorType}`, `location:${locationId}|attachment:${attachmentStyle}|trigger:${triggerId}`, `location:${locationId}|behavior:${behaviorType}|trigger:${triggerId}`, `attachment:${attachmentStyle}|behavior:${behaviorType}|trigger:${triggerId}`]
}

export function hasThreeFactorCollision(combination, recent = []) {
  const signatures = new Set(buildThreeFactorSignatures(combination))
  return recent.some((item) => (item.signatures ?? buildThreeFactorSignatures(item.combination ?? item)).some((signature) => signatures.has(signature)))
}

export function isPhraseLocked(state, phraseIdOrText, currentIndex = (state?.partnerUtteranceCount ?? 0) + 1) {
  const item = (state?.phraseCooldowns ?? []).find((phrase) => phrase.phraseId === phraseIdOrText || phrase.exactText === phraseIdOrText)
  return Boolean(item && currentIndex < Number(item.unlockAtPartnerUtteranceIndex ?? 0))
}

export function getLockedPhrases(state, currentIndex = (state?.partnerUtteranceCount ?? 0) + 1) {
  return (state?.phraseCooldowns ?? []).filter((phrase) => currentIndex < Number(phrase.unlockAtPartnerUtteranceIndex ?? 0)).map((phrase) => phrase.exactText)
}

export function recordPartnerDialogue(value, text, endingMode = classifyEndingMode(text)) {
  const state = normalizeDiversityState(value)
  const nextIndex = state.partnerUtteranceCount + 1
  const normalized = normalizeDialogue(text)
  const entry = { messageId: crypto.randomUUID(), partnerUtteranceIndex: nextIndex, endingMode, normalizedEnding: normalized, finalClause: String(text).trim().slice(-80), createdAt: new Date().toISOString() }
  const phraseCooldowns = state.phraseCooldowns.map((phrase) => phrase.exactText === text ? { ...phrase, lastUsedPartnerUtteranceIndex: nextIndex, unlockAtPartnerUtteranceIndex: nextIndex + 11 } : phrase)
  return saveDiversityState({ ...state, partnerUtteranceCount: nextIndex, phraseCooldowns, recentEndingHistory: [entry, ...state.recentEndingHistory].slice(0, MAX_ENDINGS), recentPartnerResponses: [text, ...state.recentPartnerResponses].slice(0, MAX_RECENT_RESPONSES) })
}

export function recordSuggestedResponse(value, text, approach = "general_empathy", endingMode = classifyEndingMode(text)) {
  const state = normalizeDiversityState(value)
  return saveDiversityState({ ...state, recentSuggestedResponses: [{ approach, endingMode, opening: String(text).trim().slice(0, 20), coreVerb: String(text).match(/[가-힣]{2,}/)?.[0] ?? "", text, createdAt: new Date().toISOString() }, ...state.recentSuggestedResponses].slice(0, MAX_RECENT_RESPONSES) })
}

export function recordGameCombination(value, conversationId, combination, signatures = buildThreeFactorSignatures(combination), completedAt = new Date().toISOString()) {
  const state = normalizeDiversityState(value)
  return saveDiversityState({ ...state, recentGameCombinations: [{ conversationId, combination, signatures, completedAt }, ...state.recentGameCombinations].slice(0, 7) })
}

export function validateDialogueDiversity(text, { recentPartnerResponses = [], recentEndings = [], endingMode = classifyEndingMode(text), lockedPhrases = [], maxSimilarity = .72 } = {}) {
  const normalized = normalizeDialogue(text)
  if (!normalized || lockedPhrases.some((phrase) => normalized.includes(normalizeDialogue(phrase)))) return { valid: false, reason: "locked_phrase" }
  if (recentPartnerResponses.some((recent) => normalizeDialogue(recent) === normalized)) return { valid: false, reason: "normalized_exact_match" }
  if (recentPartnerResponses.some((recent) => normalized.slice(0, 12) && normalizeDialogue(recent).slice(0, 12) === normalized.slice(0, 12))) return { valid: false, reason: "same_opening" }
  if (recentPartnerResponses.some((recent) => normalized.slice(-12) && normalizeDialogue(recent).slice(-12) === normalized.slice(-12))) return { valid: false, reason: "same_ending" }
  if (recentPartnerResponses.some((recent) => jaccardSimilarity(text, recent) >= maxSimilarity)) return { valid: false, reason: "similarity" }
  const recentModes = recentEndings.map((item) => item.endingMode)
  if (recentModes.slice(0, 2).every((mode) => mode && mode === endingMode)) return { valid: false, reason: "ending_mode_repeat" }
  if (recentEndings.slice(0, 5).filter((item) => QUESTION_ENDING_MODES.has(item.endingMode)).length >= 5 && QUESTION_ENDING_MODES.has(endingMode)) return { valid: false, reason: "question_streak" }
  if (/^(?:심리|상대방은|방어적으로|거리를 둔다|감정이 상했다|사용자의 답변|유형명|점수)/.test(String(text).trim())) return { valid: false, reason: "meta_text" }
  return { valid: true, reason: null }
}
