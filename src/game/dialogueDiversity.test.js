import test from "node:test"
import assert from "node:assert/strict"
import { buildThreeFactorSignatures, classifyEndingMode, createEmptyDiversityState, getLockedPhrases, hasThreeFactorCollision, isPhraseLocked, recordGameCombination, recordPartnerDialogue, recordSuggestedResponse, validateDialogueDiversity } from "./dialogueDiversity.js"
import { cooldownPhrases } from "../data/phrase-variation-library.js"

test("종결 방식은 질문 외 진술·감정·경계를 구분한다", () => {
  assert.equal(classifyEndingMode("오늘은 여기까지 할게."), "boundary_setting")
  assert.equal(classifyEndingMode("내가 먼저 날카롭게 말해서 미안해."), "apology")
  assert.equal(classifyEndingMode("다음엔 미리 말할게."), "action_promise")
  assert.equal(classifyEndingMode("정말 잘도 하네."), "sarcasm")
})

test("최근 종결 반복과 질문 streak를 차단한다", () => {
  const recent = ["오늘은 여기까지 할게.", "다음엔 미리 말할게."]
  assert.equal(validateDialogueDiversity("오늘은 여기까지 할게.", { recentPartnerResponses: recent, recentEndings: [{ endingMode: "boundary_setting" }, { endingMode: "action_promise" }], endingMode: "boundary_setting" }).valid, false)
  const questions = Array.from({ length: 5 }, () => ({ endingMode: "direct_question" }))
  assert.equal(validateDialogueDiversity("오늘은 그냥 생각할게?", { recentEndings: questions, endingMode: "direct_question" }).valid, false)
})

test("고정 문장은 첫 사용 후 상대방 발화 10회 동안 잠긴다", () => {
  let state = createEmptyDiversityState("test-user")
  state = recordPartnerDialogue(state, cooldownPhrases[0].exactText, "plain_statement")
  assert.equal(state.partnerUtteranceCount, 1)
  assert.equal(isPhraseLocked(state, cooldownPhrases[0].phraseId, 10), true)
  assert.equal(isPhraseLocked(state, cooldownPhrases[0].phraseId, 11), true)
  assert.equal(isPhraseLocked(state, cooldownPhrases[0].phraseId, 12), false)
  assert.equal(getLockedPhrases(state, 10).includes(cooldownPhrases[0].exactText), true)
})

test("추천 표현도 접근 방식과 최근 문장을 저장한다", () => {
  const state = recordSuggestedResponse(createEmptyDiversityState("test-user"), "다음 약속에서는 계산 기준을 미리 정하자.", "money_boundary")
  assert.equal(state.recentSuggestedResponses[0].approach, "money_boundary")
  assert.equal(state.recentSuggestedResponses[0].text, "다음 약속에서는 계산 기준을 미리 정하자.")
})

test("세 요소가 같은 조합은 제외하고 두 요소만 같으면 허용한다", () => {
  const base = { locationId: "cafe", attachmentStyle: "anxious", behaviorType: "queen_bee_female", triggerId: "money_balance" }
  assert.equal(hasThreeFactorCollision(base, [{ combination: base, signatures: buildThreeFactorSignatures(base) }]), true)
  assert.equal(hasThreeFactorCollision({ ...base, behaviorType: "avoidant_male", triggerId: "other_trigger" }, [{ combination: base, signatures: buildThreeFactorSignatures(base) }]), false)
})

test("최근 게임 조합은 사용자별로 7개만 유지한다", () => {
  let state = createEmptyDiversityState("test-user")
  for (let index = 0; index < 8; index += 1) state = recordGameCombination(state, `conversation-${index}`, { locationId: `location-${index}`, attachmentStyle: "secure", behaviorType: "avoidant_male", triggerId: `trigger-${index}` })
  assert.equal(state.recentGameCombinations.length, 7)
  assert.equal(state.recentGameCombinations[0].conversationId, "conversation-7")
  assert.equal(state.recentGameCombinations.at(-1).conversationId, "conversation-1")
})
