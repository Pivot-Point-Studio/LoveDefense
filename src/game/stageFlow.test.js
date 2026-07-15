import test from "node:test"
import assert from "node:assert/strict"
import { buildStageScenario } from "./relationshipScenarioService.js"
import { canAcknowledgeStage, canSubmitTurn, createScenarioSnapshot, createStageTransition, openStageIntro, RESOLUTION_STATE, resolveConversationState, SCENARIO_ENDED_MESSAGE, SCENARIO_STARTED_MESSAGE, STAGE_STATUS, STAGE_TRANSITION_DURATION_MS } from "./stageFlow.js"

test("STAGE 전환은 3초 팝업 뒤 안내 확인 상태로 열린다", () => {
  const startedAt = 1000
  const transition = { id: "game-1", status: "active", currentStageNumber: 1, ...createStageTransition(2, startedAt) }
  assert.equal(transition.transitionOverlay.readyAt, startedAt + STAGE_TRANSITION_DURATION_MS)
  assert.equal(canAcknowledgeStage(transition), false)
  const intro = openStageIntro(transition)
  assert.equal(intro.stageStatus, STAGE_STATUS.INTRO)
  assert.equal(intro.stageIntro.isOpen, true)
  assert.equal(canAcknowledgeStage(intro), true)
  assert.equal(canAcknowledgeStage({ ...intro, isGeneratingScenario: true }), false)
})

test("입력은 확인 완료된 현재 scenarioId에서만 허용된다", () => {
  const base = { status: "active", stageStatus: STAGE_STATUS.PLAYING, stageIntroAcknowledged: true, currentStageId: "scenario-1", currentScenario: { id: "scenario-1" } }
  assert.equal(canSubmitTurn(base), true)
  assert.equal(canSubmitTurn({ ...base, stageStatus: STAGE_STATUS.INTRO }), false)
  assert.equal(canSubmitTurn({ ...base, currentScenario: { id: "scenario-other" } }), false)
})

test("시나리오 스냅샷은 Stage 동안 고정할 배경 정보를 모두 보존한다", () => {
  const { stage } = buildStageScenario({ partnerGender: "male", stageNumber: 2 })
  const scenario = createScenarioSnapshot(stage)
  assert.equal(scenario.id, stage.id)
  assert.equal(scenario.location, stage.location)
  assert.equal(scenario.timeContext, stage.timeContext)
  assert.equal(scenario.conflictCause, stage.conflictCause)
  assert.equal(scenario.hiddenEmotion, stage.hiddenEmotion.primary)
  assert.equal(scenario.hiddenNeed, stage.hiddenNeed.primary)
  const afterFiveStateChanges = Array.from({ length: 5 }).reduce((state, _, turn) => ({ ...state, currentTurn: turn + 1, relationshipHp: state.relationshipHp + 1, conflictLevel: state.conflictLevel - 1 }), { currentScenario: scenario, relationshipHp: 70, conflictLevel: 30 })
  assert.equal(afterFiveStateChanges.currentScenario.id, scenario.id)
  assert.deepEqual(afterFiveStateChanges.currentScenario, scenario)
})

test("조기 해결은 새 시나리오가 아니라 resolved 상태로만 표현된다", () => {
  assert.equal(resolveConversationState({ adjustedScore: 90, relationshipHp: 80, conflictLevel: 20, requiredEndHp: 45, maximumEndConflict: 65 }), RESOLUTION_STATE.RESOLVED)
  assert.equal(resolveConversationState({ adjustedScore: 65, relationshipHp: 40, conflictLevel: 70, requiredEndHp: 45, maximumEndConflict: 65 }), RESOLUTION_STATE.IMPROVING)
  assert.equal(resolveConversationState({ adjustedScore: 20, relationshipHp: 40, conflictLevel: 70, requiredEndHp: 45, maximumEndConflict: 65 }), RESOLUTION_STATE.WORSENED)
})

test("필수 시스템 메시지 문구를 유지한다", () => {
  assert.equal(SCENARIO_ENDED_MESSAGE, "📍 [System] 현재 시나리오가 종료되었습니다.")
  assert.equal(SCENARIO_STARTED_MESSAGE, "📍 [System] 새로운 시나리오가 시작됩니다.")
})
