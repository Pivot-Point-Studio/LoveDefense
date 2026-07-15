import { attachmentDialogueProfiles, attachmentStyles } from "../data/attachment-dialogue-patterns.js"
import { relationshipCaseLibrary } from "../data/relationship-case-library.js"
import { relationshipDialoguePatterns } from "../data/relationship-dialogue-patterns.js"
import { relationshipLocations, locationTriggerLibrary } from "../data/location-trigger-library.js"
import { behaviorCandidatesForGender } from "../data/real-world-behavior-profiles.js"
import { buildThreeFactorSignatures, hasThreeFactorCollision } from "./dialogueDiversity.js"
import { getStageDifficulty } from "./stageDifficulty.js"

const choose = (items) => items[Math.floor(Math.random() * items.length)]
const phaseNames = ["setup", "development", "crisis", "climax", "resolution"]
const intensityForStage = [1, 2, 3, 4, 5]

export function buildScenarioCandidates({ partnerGender = "female", stageNumber = 1, recentGameCombinations = [], usedCombinations = [] } = {}) {
  const behaviors = behaviorCandidatesForGender(partnerGender)
  const allowedTriggers = locationTriggerLibrary.filter((trigger) => trigger.stageIntensity <= Math.max(1, Math.min(5, stageNumber + 1)))
  const candidates = []
  for (const trigger of allowedTriggers) for (const location of relationshipLocations.filter((item) => item.id === trigger.locationId)) for (const attachmentStyle of attachmentStyles) for (const behavior of behaviors) {
    const combination = { locationId: location.id, attachmentStyle, behaviorType: behavior.id, triggerId: trigger.id }
    if (hasThreeFactorCollision(combination, recentGameCombinations) || hasThreeFactorCollision(combination, usedCombinations)) continue
    candidates.push({ combination, location, trigger, behavior, attachment: attachmentDialogueProfiles[attachmentStyle], casePattern: relationshipCaseLibrary.find((item) => item.locationId === location.id && item.triggerId === trigger.id) })
  }
  return candidates.filter((candidate) => candidate.casePattern)
}

export function chooseScenarioCombination(options = {}) {
  let candidates = buildScenarioCandidates(options)
  let fallbackUsed = false
  if (!candidates.length && options.recentGameCombinations?.length) {
    const limitedRecent = options.recentGameCombinations.slice(0, -1)
    candidates = buildScenarioCandidates({ ...options, recentGameCombinations: limitedRecent })
    fallbackUsed = true
  }
  if (!candidates.length) throw new Error("현실적인 대화 조합을 만들 수 있는 후보가 없습니다.")
  const selected = choose(candidates)
  return { ...selected, signatures: buildThreeFactorSignatures(selected.combination), fallbackUsed }
}

function intentForStage(casePattern, stageNumber) {
  const text = `${casePattern.narrativeArc[phaseNames[stageNumber - 1]]} ${casePattern.hiddenNeed.join(" ")}`
  if (/돈|비용|채무/.test(text)) return "money_fairness"
  if (/친구|경계|질투|제3자/.test(text)) return "third_person_boundary"
  if (/안전|귀가|밤/.test(text)) return "safety_and_care"
  if (/사과|책임|합의|해결/.test(text)) return "repair_and_accountability"
  if (/거리|회피|중단|무거/.test(text)) return "distance_and_unresolved"
  return relationshipDialoguePatterns[(stageNumber - 1) % relationshipDialoguePatterns.length].id
}

function makeTurn({ stageNumber, turnNumber, casePattern, attachment, behavior, location, trigger }) {
  const intent = intentForStage(casePattern, stageNumber)
  const group = relationshipDialoguePatterns.find((item) => item.id === intent) ?? relationshipDialoguePatterns[0]
  const variants = group.variants.filter((variant) => !attachment.uncommonEndingModes.includes(variant.endingMode) && !behavior.unlikelyEndingModes.includes(variant.endingMode))
  const variant = variants[(turnNumber + stageNumber * 2) % variants.length] ?? group.variants[0]
  const phase = phaseNames[stageNumber - 1]
  const arcDetail = casePattern.narrativeArc[phase]
  return { turnNumber, partnerMessage: variant.textTemplate, situationContext: `${location.displayName}에서 ${arcDetail}`, evaluationFocus: { importantEmotions: casePattern.hiddenEmotion, importantNeeds: casePattern.hiddenNeed, preferredResponses: casePattern.calmingTriggers, harmfulResponses: casePattern.tabooExpressions }, reactionGuidelines: { positive: "상대의 감정과 사실을 함께 반영한다.", partial: "일부를 인정하지만 남은 감정이 있다.", negative: "대화를 닫거나 경계를 세운다." }, reactionRequirements: { preserveCharacterPersonality: true, preserveSpeechStyle: true, reflectUserWording: true, reflectUserTone: true, maxSentences: 2 }, patternContext: { casePatternId: casePattern.id, attachmentStyle: attachment.id, behaviorTypeId: behavior.id, location: { id: location.id, displayName: location.displayName, currentDetails: [...location.uniqueDialogueDetails, ...location.availableActions] }, trigger: { id: trigger.id, summary: trigger.summary, currentEscalation: trigger.escalation[stageNumber - 1] }, narrativeArcPhase: phase, speechPatternHints: [...attachment.speechHabits, ...behavior.speechHabits, ...casePattern.speechPatterns], behaviorPatternHints: [...attachment.confirmationBehaviors, ...behavior.observableBehaviors, ...casePattern.behaviorPatterns], allowedEndingModes: [...new Set([...attachment.commonEndingModes, ...behavior.preferredEndingModes, ...casePattern.suitableEndingModes])], discouragedEndingModes: [...new Set([...attachment.uncommonEndingModes, ...behavior.unlikelyEndingModes])] } }
}

export function buildGameStages({ partnerGender = "female", recentGameCombinations = [], usedCombinations = [] } = {}) {
  const selected = chooseScenarioCombination({ partnerGender, stageNumber: 1, recentGameCombinations, usedCombinations })
  const { combination, location, trigger, behavior, attachment, casePattern } = selected
  const stages = intensityForStage.map((stageNumber) => {
    const config = getStageDifficulty(stageNumber)
    const turns = Array.from({ length: config.turnCount }, (_, index) => makeTurn({ stageNumber, turnNumber: index + 1, casePattern, attachment, behavior, location, trigger }))
    return { id: `${casePattern.id}-${stageNumber}`, stageNumber, title: `${location.displayName} · ${trigger.summary.split(".")[0]}`, contextSummary: `${casePattern.narrativeArc[phaseNames[stageNumber - 1]]} (${trigger.escalation[stageNumber - 1]})`, characterProfile: { characterId: behavior.id, name: "연인", relationshipRole: "대화 상대", personalitySummary: `${behavior.observableBehaviors[0]} ${behavior.motivations[0]}`, speechStyle: behavior.speechHabits.join(", ") }, attachmentType: { type: attachment.id, intensity: 50 + stageNumber * 8, triggers: attachment.commonTriggers, calmingFactors: attachment.calmingPatterns }, communicationAxes: { expressionStyle: attachment.speechHabits[0], desiredResponse: attachment.coreNeeds[0], conflictResponse: behavior.conflictPatterns[0], relationshipNeed: attachment.coreNeeds.join(", ") }, evaluationWeights: { emotionRecognition: .24, needSatisfaction: .2, communicationFit: .16, attachmentSafety: .15, conflictAppropriateness: .12, relationshipRepair: .13 }, initialState: { relationshipHp: config.initialHpRange.max - 2, conflictLevel: config.initialConflictRange.min + 4, stability: 48 - stageNumber * 2, trust: 50 - stageNumber * 2 }, hiddenEmotion: { primary: casePattern.hiddenEmotion[0], secondary: casePattern.hiddenEmotion.slice(1), acceptedSimilarMeanings: casePattern.hiddenEmotion }, hiddenNeed: { primary: casePattern.hiddenNeed[0], secondary: casePattern.hiddenNeed.slice(1), acceptedSimilarMeanings: casePattern.hiddenNeed }, turns, branching: { positiveNextStageId: stageNumber < 5 ? `${casePattern.id}-${stageNumber + 1}` : null, partialNextStageId: stageNumber < 5 ? `${casePattern.id}-${stageNumber + 1}` : null, negativeNextStageId: stageNumber < 5 ? `${casePattern.id}-${stageNumber + 1}` : null }, scenarioCombination: combination, patternContext: turns[0].patternContext, narrativeArc: casePattern.narrativeArc, sourceMetadata: casePattern.sourceMetadata ?? null }
  })
  return { stages, combination, signatures: selected.signatures, fallbackUsed: selected.fallbackUsed, casePatternId: casePattern.id }
}
