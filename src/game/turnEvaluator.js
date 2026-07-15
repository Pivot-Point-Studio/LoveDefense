import { clamp } from "./stageModel.js"

const words = { empathy: ["미안", "서운", "속상", "불안", "힘들", "이해", "느꼈", "듣고 싶", "고마워"], need: ["곁", "함께", "관심", "확인", "안심", "기다릴", "말해줘", "챙길"], question: ["?", "어때", "어떻게", "무슨", "괜찮아", "말해줄"], blame: ["네가", "너는", "항상", "맨날", "어쩌라고", "예민"], solution: ["앞으로", "해야지", "해결", "약속", "그럼", "바꾸자"], avoidance: ["모르겠어", "할 말이 없어", "됐어", "상관없어", "몰라"], support: ["사랑", "소중", "같이", "옆에", "포기하지"] }
const hasAny = (text, list) => list.some((word) => text.includes(word))
const sentenceTone = (text) => ({ polite: /요\b|습니다|세요/.test(text), casual: /야\b|어\b|지\b/.test(text) ? "casual" : "neutral" })

export function ruleAnalyze(input, stage, turn) {
  const text = String(input)
  const partnerInsult = /너\s*(미쳤|바보|멍청|짜증|싫어|한심)|등신|개새|병신/.test(text)
  const situationSwear = /(상황|이게|진짜)\s*(짜증|엿|망할)/.test(text)
  const risk = /(죽고 싶|자살|해치고 싶|죽여버|강제로|성폭행|미성년자).*/.test(text)
  const detectedEmotionRecognition = hasAny(text, words.empathy) ? [stage.hiddenEmotion.primary] : []
  const detectedNeedResponse = hasAny(text, words.need) ? [stage.hiddenNeed.primary] : []
  const scores = { emotionRecognition: clamp(25 + (detectedEmotionRecognition.length ? 55 : 0)), needSatisfaction: clamp(25 + (detectedNeedResponse.length ? 55 : 0)), communicationFit: clamp(45 + (hasAny(text, words.question) ? 25 : 0) - (hasAny(text, words.solution) ? 8 : 0)), attachmentSafety: clamp(48 + (detectedEmotionRecognition.length ? 30 : 0) - (hasAny(text, words.blame) ? 35 : 0)), conflictAppropriateness: clamp(48 + (detectedEmotionRecognition.length ? 25 : 0) - (hasAny(text, words.blame) ? 40 : 0)), relationshipRepair: clamp(35 + (detectedNeedResponse.length ? 35 : 0) + (hasAny(text, words.support) ? 20 : 0)) }
  const riskExpressions = []
  if (partnerInsult) riskExpressions.push({ type: "인격 모욕", target: "partner", severity: 5, evidence: "상대방을 향한 공격 표현" })
  if (situationSwear) riskExpressions.push({ type: "상황 욕설", target: "situation", severity: 2, evidence: "상황에 대한 거친 표현" })
  if (hasAny(text, words.blame)) riskExpressions.push({ type: "비난", target: "partner", severity: 2, evidence: "상대에게 책임을 돌리는 표현" })
  if (hasAny(text, words.avoidance)) riskExpressions.push({ type: "회피", target: "none", severity: 1, evidence: "대화를 닫는 표현" })
  return { detectedIntent: hasAny(text, words.question) ? "대화 이어가기" : "감정 반응", detectedEmotionRecognition, detectedNeedResponse, communicationStyle: sentenceTone(text).polite ? "존중하는 말투" : "일상적인 말투", dimensionScores: scores, riskExpressions, strengths: [...(detectedEmotionRecognition.length ? ["상대의 감정을 알아차렸어요."] : []), ...(detectedNeedResponse.length ? ["상대가 원하는 연결감을 건드렸어요."] : [])], weaknesses: [...(hasAny(text, words.solution) && !detectedEmotionRecognition.length ? ["감정 확인 전에 해결책을 앞세웠어요."] : []), ...(hasAny(text, words.blame) ? ["상대에게 책임을 돌리는 표현이 섞였어요."] : [])], suggestedBetterResponse: `그렇게 느꼈구나. ${turn.evaluationFocus.preferredResponses[0]} 조금 더 듣고 싶어.`, stabilityDelta: clamp((detectedEmotionRecognition.length ? 8 : 0) + (hasAny(text, words.blame) ? -10 : 0), -15, 15), trustDelta: clamp((detectedNeedResponse.length ? 8 : 0) + (hasAny(text, words.blame) ? -12 : 0), -15, 15), evaluationConfidence: .7, safetyBlocked: risk }
}

export function calculateScore(analysis, stage) {
  const weights = stage.evaluationWeights
  const values = analysis.dimensionScores
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + (values[key] ?? 0) * (Number(weight) > 1 ? Number(weight) / 100 : Number(weight)), 0)
  const riskPenalty = analysis.riskExpressions.reduce((sum, item) => sum + item.severity * (item.target === "partner" ? 4 : 1), 0)
  return clamp(Math.round(weighted - riskPenalty))
}

export function scoreDeltas(score) {
  if (score >= 90) return [20, -20]
  if (score >= 75) return [10, -10]
  if (score >= 55) return [3, -3]
  if (score >= 35) return [-5, 5]
  if (score >= 15) return [-15, 15]
  return [-25, 25]
}

export function judgment(score) { return score >= 90 ? "매우 적절함" : score >= 75 ? "적절함" : score >= 55 ? "부분적으로 적절함" : score >= 35 ? "아쉬움" : score >= 15 ? "부적절함" : "매우 부적절함" }

export function fallbackReaction(turn, analysis, score) { const direction = score >= 75 ? "positive" : score >= 45 ? "partial" : "negative"; return turn.reactionGuidelines[direction] ?? "상대가 잠시 생각할 시간을 갖는다." }

export async function evaluateTurn(input, stage, turn) {
  const rules = ruleAnalyze(input, stage, turn)
  if (rules.safetyBlocked) return { blocked: true, rules }
  return { ...rules, score: calculateScore(rules, stage), analysisSource: "rule_fallback" }
}
