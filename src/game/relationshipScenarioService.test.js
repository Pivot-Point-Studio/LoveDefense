import test from "node:test"
import assert from "node:assert/strict"
import { relationshipLocations, locationTriggerLibrary } from "../data/location-trigger-library.js"
import { attachmentDialogueProfiles } from "../data/attachment-dialogue-patterns.js"
import { realWorldBehaviorProfiles } from "../data/real-world-behavior-profiles.js"
import { buildGameStages, buildScenarioCandidates, buildStageScenario } from "./relationshipScenarioService.js"

test("7개 장소와 필수 장소 트리거가 데이터에 있다", () => {
  assert.equal(relationshipLocations.length, 7)
  for (const id of ["university_classroom", "cafe", "night_street", "crane_game_arcade", "restaurant", "parking_lot", "movie_theater"]) assert.ok(relationshipLocations.some((location) => location.id === id))
  assert.ok(locationTriggerLibrary.some((trigger) => trigger.id === "no_escort_home"))
  assert.ok(locationTriggerLibrary.some((trigger) => trigger.id === "feeding_friend"))
})

test("애착 스타일과 현실 행동 유형은 별도 축으로 조합된다", () => {
  assert.deepEqual(Object.keys(attachmentDialogueProfiles).sort(), ["anxious", "avoidant", "secure"])
  assert.ok(realWorldBehaviorProfiles.some((profile) => profile.internalLabel === "여왕벌형" && profile.genderContext === "female"))
  const candidates = buildScenarioCandidates({ partnerGender: "female", stageNumber: 1 })
  assert.ok(candidates.length > 0)
  assert.ok(candidates.every((candidate) => candidate.combination.attachmentStyle && candidate.combination.behaviorType))
})

test("각 Stage는 안내 확인 뒤 생성할 수 있는 독립 시나리오다", () => {
  const game = buildGameStages({ partnerGender: "male" })
  assert.equal(game.stages.length, 5)
  assert.deepEqual(game.stages.map((stage) => stage.turns.length), [6, 7, 8, 9, 10])
  assert.equal(new Set(game.stages.map((stage) => stage.id)).size, 5)
  assert.ok(game.stages.every((stage) => stage.patternContext.location.displayName))
  assert.ok(game.stages.every((stage) => stage.conflictCause && stage.timeContext && stage.goal))
})

test("한 Stage의 모든 턴은 같은 장소와 갈등 배경을 유지한다", () => {
  const { stage } = buildStageScenario({ partnerGender: "female", stageNumber: 3 })
  const locations = new Set(stage.turns.map((turn) => turn.patternContext.location.id))
  const triggers = new Set(stage.turns.map((turn) => turn.patternContext.trigger.id))
  const situations = new Set(stage.turns.map((turn) => turn.situationContext))
  assert.equal(locations.size, 1)
  assert.equal(triggers.size, 1)
  assert.equal(situations.size, 1)
  assert.ok(stage.id.startsWith("scenario-3-"))
})
