import test from "node:test"
import assert from "node:assert/strict"
import { buildRuleBasedHints, createRuleFallbackEvaluation, fallbackReaction } from "./turnEvaluator.js"
import { stageDefinitions } from "./stageModel.js"
import { validateOpenAIEvaluation, validatePartnerDialogue } from "./aiResultValidation.js"
import { retryAIRequest } from "./aiRequestRetry.js"
import { buildDialoguePayload } from "./stagePromptContext.js"

test("규칙 분석은 OpenAI 참고 힌트를 구조화한다", () => {
  const hints = buildRuleBasedHints("서운했구나. 네 마음을 더 말해줄래?")
  assert.equal(hints.hasEmpathy, true)
  assert.equal(hints.hasQuestion, true)
  assert.ok(Array.isArray(hints.insults))
})

test("fallback 평가는 출처와 실패 이유를 기록한다", () => {
  const stage = stageDefinitions[0]
  const hints = buildRuleBasedHints("네 마음을 이해해")
  const result = createRuleFallbackEvaluation("네 마음을 이해해", stage, stage.turns[0], hints, "timeout", 2)
  assert.equal(result.metadata.source, "rule_fallback")
  assert.equal(result.metadata.openaiAttemptCount, 2)
  assert.equal(result.metadata.fallbackReason, "timeout")
})

test("상대방 fallback은 내부 지침을 출력하지 않는다", () => {
  const dialogue = fallbackReaction("negative", { tendency: "솔직한 편" }, [])
  assert.doesNotMatch(dialogue, /방어적으로 반응하고 거리를 둔다/)
})

test("OpenAI 런타임 평가 및 대사 검증", () => {
  const result = { dimensionScores: { emotionRecognition: 70, needSatisfaction: 70, communicationFit: 70, attachmentSafety: 70, conflictAppropriateness: 70, relationshipRepair: 70 }, rawScore: 70, detectedIntent: "감정 확인", reactionDirection: "partial", strengths: [], weaknesses: [], riskExpressions: [], detectedEmotionRecognition: [], detectedNeedResponse: [], suggestedBetterResponse: "네 마음을 더 듣고 싶어.", stabilityDelta: 2, trustDelta: 2, evaluationConfidence: .8 }
  assert.equal(validateOpenAIEvaluation(result), result)
  assert.equal(validatePartnerDialogue({ partnerDialogue: "조금 더 이야기해줘서 고마워." }), "조금 더 이야기해줘서 고마워.")
  assert.throws(() => validatePartnerDialogue({ partnerDialogue: "방어적으로 반응하고 거리를 둔다." }))
  assert.throws(() => validateOpenAIEvaluation({ ...result, riskExpressions: [{ type: "위험", target: "unknown", severity: 1, evidence: "문맥" }] }))
  assert.throws(() => validatePartnerDialogue({ partnerDialogue: "첫 문장. 둘째 문장. 셋째 문장." }))
})

test("OpenAI 요청은 한 번 재시도하고 두 번 실패하면 오류 횟수를 남긴다", async () => {
  let calls = 0
  const success = await retryAIRequest(async () => { calls += 1; if (calls === 1) throw new Error("network"); return { result: { ok: true } } }, (value) => value)
  assert.equal(success.attempts, 2)
  assert.equal(calls, 2)
  await assert.rejects(() => retryAIRequest(async () => { throw new Error("invalid json") }, () => { throw new Error("invalid") }), (error) => error.attempts === 2)
})

test("상대방 반응 요청은 현재 STAGE의 고정 시나리오 정보를 매번 전달한다", () => {
  const stage = stageDefinitions[0]
  const currentScenario = { id: stage.id, title: stage.title, contextSummary: stage.contextSummary, location: "카페", timeContext: "늦은 밤", conflictCause: "정서적 지지 부족", hiddenEmotion: "불안", hiddenNeed: "공감", userRole: "연인", partnerRole: "연인", goal: "감정 확인" }
  const payload = buildDialoguePayload("네 마음을 이해해.", { reactionDirection: "positive" }, { stage, turn: stage.turns[0], stageDifficulty: { turnCount: 6 }, currentScenario, resolutionState: "resolved", gameState: { relationshipHp: 80, conflictLevel: 20 }, userProfile: { nickname: "비공개", mbti: "INFP", tendency: "감정을 천천히 말하는 편" }, partnerProfile: { nickname: "비공개 상대", mbti: "INFJ", tendency: "마음을 오래 참는 편" }, character: {}, recentMessages: [], diversityState: {}, previousAdvice: [] })
  assert.equal(payload.scenarioId, currentScenario.id)
  assert.equal(payload.location, "카페")
  assert.equal(payload.timeContext, "늦은 밤")
  assert.equal(payload.conflictCause, "정서적 지지 부족")
  assert.equal(payload.resolutionState, "resolved")
  assert.equal(payload.maxTurns, 6)
  assert.deepEqual(payload.conversationHistory, [])
  assert.deepEqual(payload.userProfile, { mbti: "INFP", tendency: "감정을 천천히 말하는 편", expressionStyle: "", desiredResponse: "", conflictStyle: "", relationshipNeed: "" })
  assert.equal(payload.partnerProfile.tendency, "마음을 오래 참는 편")
  assert.equal("nickname" in payload.userProfile, false)
})
