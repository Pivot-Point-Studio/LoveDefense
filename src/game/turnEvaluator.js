import { clamp } from "./stageModel.js"
import { classifyEndingMode, validateDialogueDiversity } from "./dialogueDiversity.js"

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
  positive: [
    ["네가 그 부분을 알아차린 건 고마워. 오늘은 이 정도면 마음이 조금 놓여.", "plain_statement"], ["내가 서운했던 이유를 가볍게 넘기지 않은 건 느껴졌어.", "emotional_disclosure"], ["다음 약속에서는 오늘 정한 방식대로 해보자.", "action_promise"], ["응, 그건 네 말이 맞아.", "short_reply"], ["내가 먼저 날카롭게 말한 부분은 미안해.", "apology"]
  ],
  partial: [
    ["네가 노력한 건 알겠어. 그래도 마음이 바로 가라앉지는 않아.", "emotional_disclosure"], ["고마워. 오늘은 여기까지 듣고 조금 정리하고 싶어.", "boundary_setting"], ["그 설명만으로는 아직 빈 곳이 남아 있어.", "unresolved_close"], ["일단 다음에 같은 상황이 오면 다르게 해보자.", "action_promise"], ["응. 알겠어.", "short_reply"]
  ],
  negative: [
    ["지금은 네 말이 잘 들어오지 않아.", "short_reply"], ["이 얘기는 오늘 더 하지 않을게.", "boundary_setting"], ["내가 왜 화났는지는 아직 그대로야.", "unresolved_close"], ["조금 진정한 다음에 다시 보자.", "avoidant_withdrawal"], ["그래, 네 입장에서는 그렇게 보였겠지.", "sarcasm"]
  ]
}

function styleReaction(text, partner = {}) {
  const style = `${partner.tendency ?? ""} ${partner.speechStyle ?? ""} ${partner.characterProfile?.speechStyle ?? ""}`
  if (/직접|단호|솔직/.test(style)) return text.replace("조금", "솔직히 조금")
  if (/짧|간결/.test(style)) return `${text.split(". ")[0]}.`
  return text
}

export function fallbackReaction(direction, partner = {}, recentMessages = [], diversityContext = {}) {
  const candidates = reactionTemplates[direction] ?? reactionTemplates.partial
  const recent = recentMessages.filter((message) => message.sender === "partner").map((message) => message.text)
  const recentEndings = diversityContext.recentEndings ?? []
  const scored = candidates.map(([text, endingMode], index) => {
    const check = validateDialogueDiversity(text, { recentPartnerResponses: recent, recentEndings, endingMode, lockedPhrases: diversityContext.lockedPhrases ?? [] })
    const repeatedMode = recentEndings.slice(0, 3).filter((item) => item.endingMode === endingMode).length
    return { text, endingMode, index, valid: check.valid, score: (check.valid ? 100 : 0) - repeatedMode * 30 - index }
  }).sort((a, b) => b.score - a.score)
  const selected = scored.find((item) => item.valid) ?? scored[0]
  return styleReaction(selected?.text ?? "지금은 조금 생각할 시간이 필요해.", partner)
}

export function fallbackEndingMode(text) { return classifyEndingMode(text) }
