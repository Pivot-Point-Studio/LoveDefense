import test from "node:test"
import assert from "node:assert/strict"
import { relationshipLocations, locationTriggerLibrary } from "../data/location-trigger-library.js"
import { attachmentDialogueProfiles } from "../data/attachment-dialogue-patterns.js"
import { realWorldBehaviorProfiles } from "../data/real-world-behavior-profiles.js"
import { buildGameStages, buildScenarioCandidates } from "./relationshipScenarioService.js"

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

test("한 조합으로 Stage 1~5와 6·7·8·9·10턴 서사가 만들어진다", () => {
  const game = buildGameStages({ partnerGender: "male" })
  assert.equal(game.stages.length, 5)
  assert.deepEqual(game.stages.map((stage) => stage.turns.length), [6, 7, 8, 9, 10])
  assert.equal(game.stages[0].scenarioCombination.triggerId, game.stages[4].scenarioCombination.triggerId)
  assert.ok(game.stages.every((stage) => stage.patternContext.location.displayName))
  assert.ok(game.stages[4].patternContext.trigger.currentEscalation)
})
