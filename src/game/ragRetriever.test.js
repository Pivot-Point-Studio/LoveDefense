import test from "node:test"
import assert from "node:assert/strict"
import { buildCoachingRetrievalQuery, retrieveCoachingKnowledge } from "../../supabase/functions/evaluate-turn/ragRetriever.js"

test("답장 지연과 불안 문맥에 맞는 코칭 카드를 검색한다", () => {
  const retrieval = retrieveCoachingKnowledge({
    userProfile: { tendency: "해결책부터 말하는 편" },
    partnerProfile: { tendency: "답장이 늦으면 불안해지는 편" },
    conflictCause: "연락과 답장 지연",
    hiddenEmotion: "불안",
    hiddenNeed: "관계 확인",
    userInput: "바빴다니까 왜 자꾸 연락해?",
  })
  assert.equal(retrieval.metadata.applied, true)
  assert.equal(retrieval.metadata.strategy, "curated_metadata_keyword_rag_v1")
  assert.ok(retrieval.metadata.sources.some((item) => item.knowledgeId === "delayed_reply_reassurance"))
  assert.ok(retrieval.promptContext.every((item) => item.guidance && item.avoid))
})

test("금전 갈등은 숫자와 일정 합의 카드를 우선 검색한다", () => {
  const retrieval = retrieveCoachingKnowledge({ contextSummary: "데이트 비용과 빌린 돈을 갚지 않은 문제", userInput: "이번 주까지 정확히 갚아줄 수 있어?" })
  assert.equal(retrieval.metadata.sources[0].knowledgeId, "money_fairness")
})

test("검색 메타데이터는 사용자 원문 대신 지문만 노출한다", () => {
  const privateInput = "외부에 그대로 노출하면 안 되는 대화 원문"
  const retrieval = retrieveCoachingKnowledge({ userInput: privateInput })
  assert.doesNotMatch(JSON.stringify(retrieval.metadata), new RegExp(privateInput))
  assert.match(retrieval.metadata.queryFingerprint, /^rq-[0-9a-f]{8}$/)
  assert.ok(buildCoachingRetrievalQuery({ userInput: privateInput }).includes(privateInput.toLowerCase()))
})
