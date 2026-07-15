import test from "node:test"
import assert from "node:assert/strict"
import { adjustScore, calculateStageDeltas, getStageClearResult, getStageDifficulty, normalizeConversationDifficulty, resolveStageInitialState, STAGE_COUNT } from "./stageDifficulty.js"
import { stageDefinitions } from "./stageModel.js"

test("게임은 정확히 다섯 Stage이고 턴 수는 6~10이다", () => {
  assert.equal(STAGE_COUNT, 5)
  assert.equal(stageDefinitions.length, 5)
  assert.deepEqual(stageDefinitions.map((stage) => getStageDifficulty(stage.stageNumber).turnCount), [6, 7, 8, 9, 10])
  assert.ok(stageDefinitions.every((stage) => stage.turns.length >= getStageDifficulty(stage.stageNumber).turnCount))
})

test("Stage 종료 결과를 실패 원인별로 구분한다", () => {
  assert.equal(getStageClearResult(0, 0, 3), "failed_hp_zero")
  assert.equal(getStageClearResult(54, 40, 3), "failed_required_hp")
  assert.equal(getStageClearResult(60, 56, 3), "failed_conflict")
  assert.equal(getStageClearResult(50, 60, 3), "failed_both")
  assert.equal(getStageClearResult(55, 55, 3), "cleared")
  assert.equal(getStageClearResult(75, 35, 5), "cleared")
})

test("민감도 보정은 높은 Stage에서 중간 점수를 더 낮추고 100은 유지한다", () => {
  assert.ok(adjustScore(70, 5) < adjustScore(70, 1))
  for (let stage = 1; stage <= 5; stage += 1) assert.equal(adjustScore(100, stage), 100)
})

test("높은 Stage는 피해가 크고 회복은 작으며 cap을 지킨다", () => {
  const lowDamage = calculateStageDeltas(20, 1)
  const highDamage = calculateStageDeltas(20, 5)
  const lowRecovery = calculateStageDeltas(95, 1)
  const highRecovery = calculateStageDeltas(95, 5)
  assert.ok(Math.abs(highDamage.hpDelta) > Math.abs(lowDamage.hpDelta))
  assert.ok(Math.abs(highDamage.conflictDelta) > Math.abs(lowDamage.conflictDelta))
  assert.ok(highRecovery.hpDelta < lowRecovery.hpDelta)
  assert.ok(Math.abs(highRecovery.conflictDelta) < Math.abs(lowRecovery.conflictDelta))
  for (let stage = 1; stage <= 5; stage += 1) {
    const config = getStageDifficulty(stage)
    const damage = calculateStageDeltas(0, stage)
    const recovery = calculateStageDeltas(100, stage)
    assert.ok(damage.hpDelta >= -config.maxHpDamagePerTurn)
    assert.ok(damage.conflictDelta <= config.maxConflictIncreasePerTurn)
    assert.ok(recovery.hpDelta <= config.maxHpRecoveryPerTurn)
    assert.ok(recovery.conflictDelta >= -config.maxConflictDecreasePerTurn)
  }
})

test("구형 저장은 현재 턴을 유지하고 새 총 턴 수를 적용한다", () => {
  const legacy = normalizeConversationDifficulty({ currentStageNumber: 1, currentTurn: 4, messages: [{ sender: "partner", stageNumber: 1 }] })
  assert.equal(legacy.currentTurn, 4)
  assert.equal(legacy.currentStageTurnCount, 6)
  assert.equal(legacy.stageIntroAcknowledged, true)
  const unopened = normalizeConversationDifficulty({ currentStageNumber: 2, currentTurn: 1, messages: [] })
  assert.equal(unopened.stageIntroAcknowledged, false)
  assert.equal(unopened.stageIntro.isOpen, true)
})

test("Stage 초기 HP와 갈등은 권장 범위 안에서 기존 값을 유지하거나 clamp한다", () => {
  const kept = resolveStageInitialState({ initialState: { relationshipHp: 60, conflictLevel: 50, stability: 40, trust: 40 } }, 3)
  assert.equal(kept.relationshipHp, 60)
  assert.equal(kept.conflictLevel, 50)
  const clamped = resolveStageInitialState({ initialState: { relationshipHp: 95, conflictLevel: 10 } }, 5)
  assert.equal(clamped.relationshipHp, 55)
  assert.equal(clamped.conflictLevel, 65)
})
