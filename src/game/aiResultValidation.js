function validateScores(scores) {
  const keys = ["emotionRecognition", "needSatisfaction", "communicationFit", "attachmentSafety", "conflictAppropriateness", "relationshipRepair"]
  return scores && keys.every((key) => Number.isFinite(scores[key]) && scores[key] >= 0 && scores[key] <= 100)
}

const dialogueEndingModes = new Set(["direct_question", "indirect_question", "plain_statement", "emotional_disclosure", "short_reply", "silence", "ellipsis", "boundary_setting", "action_promise", "concrete_request", "apology", "responsibility_acknowledgment", "topic_shift", "sarcasm", "irritated_close", "avoidant_withdrawal", "unresolved_close", "delayed_response_style", "relationship_confirmation", "behavioral_observation"])

const isStringArray = (value, maxItems, maxLength) => Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === "string" && [...item].length <= maxLength)
const validRiskTargets = new Set(["partner", "situation", "self", "other", "none"])

export function validateOpenAIEvaluation(value) {
  if (!value || !validateScores(value.dimensionScores) || !Number.isFinite(value.rawScore) || value.rawScore < 0 || value.rawScore > 100) throw new Error("OpenAI 평가 스키마가 올바르지 않습니다.")
  if (!["positive", "partial", "negative"].includes(value.reactionDirection)) throw new Error("OpenAI 반응 방향이 올바르지 않습니다.")
  if (typeof value.detectedIntent !== "string" || [...value.detectedIntent].length > 120 || !isStringArray(value.strengths, 6, 160) || !isStringArray(value.weaknesses, 6, 160) || !isStringArray(value.detectedEmotionRecognition, 8, 80) || !isStringArray(value.detectedNeedResponse, 8, 80) || !Array.isArray(value.riskExpressions) || value.riskExpressions.length > 10 || !value.riskExpressions.every((risk) => risk && typeof risk.type === "string" && [...risk.type].length <= 80 && validRiskTargets.has(risk.target) && Number.isFinite(risk.severity) && risk.severity >= 0 && risk.severity <= 5 && typeof risk.evidence === "string" && [...risk.evidence].length <= 160)) throw new Error("OpenAI 평가 배열 형식이 올바르지 않습니다.")
  if (typeof value.suggestedBetterResponse !== "string" || [...value.suggestedBetterResponse].length > 200 || value.suggestedBetterResponse.split(/[.!?]+/).filter((part) => part.trim()).length > 2) throw new Error("OpenAI 피드백 형식이 올바르지 않습니다.")
  if (!Number.isFinite(value.stabilityDelta) || value.stabilityDelta < -15 || value.stabilityDelta > 15 || !Number.isFinite(value.trustDelta) || value.trustDelta < -15 || value.trustDelta > 15 || !Number.isFinite(value.evaluationConfidence) || value.evaluationConfidence < 0 || value.evaluationConfidence > 1) throw new Error("OpenAI 변화량 형식이 올바르지 않습니다.")
  return value
}

export function validatePartnerDialogue(value) {
  const dialogue = value?.partnerDialogue?.trim()
  const sentenceCount = dialogue?.split(/[.!?。！？]+/).filter((part) => part.trim()).length ?? 0
  if (!dialogue || [...dialogue].length > 300 || sentenceCount > 2 || /[（(][^）)]*[）)]/.test(dialogue) || /(방어적으로 반응|거리를 둔다|긴장이 풀린다|감정이 상했다|사용자의 답변|점수)/.test(dialogue)) throw new Error("상대방 대사 형식이 올바르지 않습니다.")
  return dialogue
}

export function validateCombinedTurnResult(value) {
  validateOpenAIEvaluation(value)
  const partnerDialogue = validatePartnerDialogue(value)
  if (!dialogueEndingModes.has(value.endingMode)) throw new Error("OpenAI 종결 방식이 올바르지 않습니다.")
  return { ...value, partnerDialogue, endingMode: value.endingMode }
}
