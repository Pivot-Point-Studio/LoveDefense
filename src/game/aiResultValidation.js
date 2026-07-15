function validateScores(scores) {
  const keys = ["emotionRecognition", "needSatisfaction", "communicationFit", "attachmentSafety", "conflictAppropriateness", "relationshipRepair"]
  return scores && keys.every((key) => Number.isFinite(scores[key]) && scores[key] >= 0 && scores[key] <= 100)
}

export function validateOpenAIEvaluation(value) {
  if (!value || !validateScores(value.dimensionScores) || !Number.isFinite(value.rawScore) || value.rawScore < 0 || value.rawScore > 100) throw new Error("OpenAI 평가 스키마가 올바르지 않습니다.")
  if (!["positive", "partial", "negative"].includes(value.reactionDirection)) throw new Error("OpenAI 반응 방향이 올바르지 않습니다.")
  if (!Array.isArray(value.strengths) || !Array.isArray(value.weaknesses) || !Array.isArray(value.riskExpressions) || !Array.isArray(value.detectedEmotionRecognition) || !Array.isArray(value.detectedNeedResponse)) throw new Error("OpenAI 평가 배열 형식이 올바르지 않습니다.")
  if (typeof value.suggestedBetterResponse !== "string" || [...value.suggestedBetterResponse].length > 200 || value.suggestedBetterResponse.split(/[.!?]+/).filter((part) => part.trim()).length > 2) throw new Error("OpenAI 피드백 형식이 올바르지 않습니다.")
  if (!Number.isFinite(value.stabilityDelta) || value.stabilityDelta < -15 || value.stabilityDelta > 15 || !Number.isFinite(value.trustDelta) || value.trustDelta < -15 || value.trustDelta > 15 || !Number.isFinite(value.evaluationConfidence) || value.evaluationConfidence < 0 || value.evaluationConfidence > 1) throw new Error("OpenAI 변화량 형식이 올바르지 않습니다.")
  return value
}

export function validatePartnerDialogue(value) {
  const dialogue = value?.partnerDialogue?.trim()
  if (!dialogue || [...dialogue].length > 300 || /[（(][^）)]*[）)]/.test(dialogue) || /(방어적으로 반응|거리를 둔다|긴장이 풀린다|감정이 상했다|사용자의 답변|점수)/.test(dialogue)) throw new Error("상대방 대사 형식이 올바르지 않습니다.")
  return dialogue
}
