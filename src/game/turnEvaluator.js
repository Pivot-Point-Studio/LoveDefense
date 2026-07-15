import { clamp } from "./stageModel.js"

const words = {
  empathy: ["미안", "서운", "속상", "불안", "힘들", "이해", "마음", "그랬구나", "고마워"],
  need: ["곁", "함께", "관심", "확인", "안심", "기다리", "말해줘", "챙길"],
  question: ["?", "어때", "어떻게", "무슨", "괜찮", "말해줘"],
  blame: ["네가", "너는", "항상", "맨날", "대체 왜", "너 때문"],
  advice: ["앞으로", "해야지", "해결", "약속", "그럼", "바꾸면"],
  avoidance: ["모르겠어", "할 말이 없어", "됐어", "상관없어", "몰라"],
  validation: ["그럴 수", "이해해", "그렇게 느꼈", "당연", "네 마음"],
  support: ["사랑", "소중", "같이", "곁에", "포기하지"],
}

const hasAny = (text, list) => list.some((word) => text.includes(word))
const matched = (text, list) => list.filter((word) => text.includes(word))

export function buildRuleBasedHints(input) {
  const text = String(input)
  const partnerInsults = [...text.matchAll(/(멍청|바보|한심|재수s*없|싫어|최악|병신|개같)/g)].map((match) => ({ text: match[0], target: "partner", severity: 5 }))
  const situationInsults = [...text.matchAll(/(?:상황|이게|진짜)\s*(짜증|개망할)/g)].map((match) => ({ text: match[0], target: "situation", severity: 2 }))
  const hasEmpathy = hasAny(text, words.empathy)
  const hasValidation = hasAny(text, words.validation)
  const hasBlame = hasAny(text, words.blame)
  const hasAvoidance = hasAny(text, words.avoidance)
  return {
    detectedEmotionTerms: matched(text, words.empathy),
    detectedNeedTerms: matched(text, words.need),
    hasQuestion: hasAny(text, words.question),
    hasAdvice: hasAny(text, words.advice),
    hasEmpathy,
    hasValidation,
    hasAvoidance,
    hasBlame,
    insults: [...partnerInsults, ...situationInsults],
    possibleStrengths: [...(hasEmpathy ? ["감정 관련 표현이 있음"] : []), ...(hasValidation ? ["상대 경험을 인정하는 표현이 있음"] : []), ...(hasAny(text, words.need) ? ["관계 욕구에 반응하는 표현이 있음"] : [])],
    possibleRisks: [...(hasBlame ? ["책임을 상대에게 돌릴 가능성"] : []), ...(hasAvoidance ? ["대화를 닫을 가능성"] : []), ...(partnerInsults.length ? ["상대 대상 모욕 표현"] : [])],
  }
}

export function isSafetyBlocked(hints, input) {
  return hints.insults.some((item) => item.severity >= 5) || /(죽고 싶|자해|죽여버|강제로 성폭행|미성년자)/.test(String(input))
}

export function ruleAnalyze(input, stage, turn, hints = buildRuleBasedHints(input)) {
  const scores = {
    emotionRecognition: clamp(25 + (hints.hasEmpathy ? 55 : 0)),
    needSatisfaction: clamp(25 + (hints.detectedNeedTerms.length ? 55 : 0)),
    communicationFit: clamp(45 + (hints.hasQuestion ? 25 : 0) - (hints.hasAdvice ? 8 : 0)),
    attachmentSafety: clamp(48 + (hints.hasValidation ? 30 : 0) - (hints.hasBlame ? 35 : 0)),
    conflictAppropriateness: clamp(48 + (hints.hasEmpathy ? 25 : 0) - (hints.hasBlame ? 40 : 0)),
    relationshipRepair: clamp(35 + (hints.detectedNeedTerms.length ? 35 : 0) + (hasAny(String(input), words.support) ? 20 : 0)),
  }
  const riskExpressions = hints.insults.map((item) => ({ type: "모욕 표현", target: item.target, severity: item.severity, evidence: item.text }))
  if (hints.hasBlame) riskExpressions.push({ type: "비난", target: "partner", severity: 2, evidence: "상대에게 책임을 돌리는 표현" })
  if (hints.hasAvoidance) riskExpressions.push({ type: "회피", target: "none", severity: 1, evidence: "대화를 닫는 표현" })
  return {
    detectedIntent: hints.hasQuestion ? "대화 이어가기" : hints.hasAdvice ? "해결책 제안" : "감정 반응",
    detectedEmotionRecognition: hints.detectedEmotionTerms.length ? [stage.hiddenEmotion.primary] : [],
    detectedNeedResponse: hints.detectedNeedTerms.length ? [stage.hiddenNeed.primary] : [],
    communicationStyle: "일상적인 말투",
    dimensionScores: scores,
    riskExpressions,
    strengths: hints.possibleStrengths.map((item) => `${item}.`),
    weaknesses: hints.possibleRisks.map((item) => `${item}.`),
    suggestedBetterResponse: `그렇게 느꼈구나. ${turn.evaluationFocus.preferredResponses[0]} 네 마음을 조금 더 듣고 싶어.`,
    stabilityDelta: clamp((hints.hasValidation ? 8 : 0) + (hints.hasBlame ? -10 : 0), -15, 15),
    trustDelta: clamp((hints.detectedNeedTerms.length ? 8 : 0) + (hints.hasBlame ? -12 : 0), -15, 15),
    reactionDirection: hints.hasBlame || hints.hasAvoidance ? "negative" : hints.hasEmpathy && hints.hasValidation ? "positive" : "partial",
    evaluationConfidence: .65,
  }
}

export function calculateScore(analysis, stage) {
  const weighted = Object.entries(stage.evaluationWeights).reduce((sum, [key, weight]) => sum + (analysis.dimensionScores[key] ?? 0) * (Number(weight) > 1 ? Number(weight) / 100 : Number(weight)), 0)
  const riskPenalty = analysis.riskExpressions.reduce((sum, item) => sum + item.severity * (item.target === "partner" ? 4 : 1), 0)
  return clamp(Math.round(weighted - riskPenalty))
}

export function createRuleFallbackEvaluation(input, stage, turn, hints, fallbackReason, attempts = 0) {
  const analysis = ruleAnalyze(input, stage, turn, hints)
  const rawScore = calculateScore(analysis, stage)
  return { ...analysis, rawScore, metadata: { source: "rule_fallback", openaiAttemptCount: attempts, fallbackReason }, analysisSource: "rule_fallback" }
}

export function judgment(score) { return score >= 90 ? "매우 적절함" : score >= 75 ? "적절함" : score >= 55 ? "부분적으로 적절함" : score >= 35 ? "아쉬움" : score >= 15 ? "부적절함" : "매우 부적절함" }

const reactionTemplates = {
  positive: ["그렇게 말해줘서 조금 안심돼. 내 마음도 천천히 더 이야기해볼게.", "내 마음을 알아주려고 한 게 느껴져. 우리 이야기를 조금 더 해보고 싶어."],
  partial: ["네가 노력한 건 알겠어. 그래도 내 마음이 바로 가라앉지는 않아서 조금 더 듣고 싶어.", "고마워. 아직은 조심스럽지만 우리 이야기를 계속해볼게."],
  negative: ["지금은 네 말이 잘 들어오지 않아. 조금 진정한 다음에 다시 이야기하고 싶어.", "내 마음이 더 닫히는 것 같아. 당장은 조금 거리를 두고 싶어."],
}

function styleReaction(text, partner = {}) {
  const style = `${partner.tendency ?? ""} ${partner.speechStyle ?? ""} ${partner.characterProfile?.speechStyle ?? ""}`
  if (/직접|단호|솔직/.test(style)) return text.replace("조금", "솔직히 조금")
  if (/짧|간결/.test(style)) return `${text.split(". ")[0]}.`
  return text
}

export function fallbackReaction(direction, partner = {}, recentMessages = []) {
  const candidates = reactionTemplates[direction] ?? reactionTemplates.partial
  const recent = new Set(recentMessages.filter((message) => message.sender === "partner").map((message) => message.text))
  return styleReaction(candidates.find((text) => !recent.has(text)) ?? candidates[0], partner)
}
