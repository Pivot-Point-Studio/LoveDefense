const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : 0))

export const STAGE_COUNT = 5

export const STAGE_DIFFICULTY = Object.freeze({
  1: { stageNumber: 1, turnCount: 6, requiredEndHp: 35, maximumEndConflict: 75, sensitivityPower: 1, damageMultiplier: 1, recoveryMultiplier: 1, maxHpDamagePerTurn: 25, maxHpRecoveryPerTurn: 25, maxConflictIncreasePerTurn: 25, maxConflictDecreasePerTurn: 25, initialHpRange: { min: 75, max: 90 }, initialConflictRange: { min: 25, max: 45 } },
  2: { stageNumber: 2, turnCount: 7, requiredEndHp: 45, maximumEndConflict: 65, sensitivityPower: 1.05, damageMultiplier: 1.15, recoveryMultiplier: .95, maxHpDamagePerTurn: 30, maxHpRecoveryPerTurn: 23, maxConflictIncreasePerTurn: 30, maxConflictDecreasePerTurn: 23, initialHpRange: { min: 65, max: 80 }, initialConflictRange: { min: 35, max: 55 } },
  3: { stageNumber: 3, turnCount: 8, requiredEndHp: 55, maximumEndConflict: 55, sensitivityPower: 1.12, damageMultiplier: 1.35, recoveryMultiplier: .9, maxHpDamagePerTurn: 36, maxHpRecoveryPerTurn: 21, maxConflictIncreasePerTurn: 36, maxConflictDecreasePerTurn: 21, initialHpRange: { min: 55, max: 70 }, initialConflictRange: { min: 45, max: 65 } },
  4: { stageNumber: 4, turnCount: 9, requiredEndHp: 65, maximumEndConflict: 45, sensitivityPower: 1.22, damageMultiplier: 1.6, recoveryMultiplier: .85, maxHpDamagePerTurn: 43, maxHpRecoveryPerTurn: 19, maxConflictIncreasePerTurn: 43, maxConflictDecreasePerTurn: 19, initialHpRange: { min: 45, max: 60 }, initialConflictRange: { min: 55, max: 75 } },
  5: { stageNumber: 5, turnCount: 10, requiredEndHp: 75, maximumEndConflict: 35, sensitivityPower: 1.35, damageMultiplier: 1.9, recoveryMultiplier: .8, maxHpDamagePerTurn: 52, maxHpRecoveryPerTurn: 17, maxConflictIncreasePerTurn: 52, maxConflictDecreasePerTurn: 17, initialHpRange: { min: 35, max: 55 }, initialConflictRange: { min: 65, max: 85 } },
})

const sensitivityLabels = ["낮음", "약간 높음", "중간", "높음", "매우 높음"]

export function getStageDifficulty(stageNumber) {
  const safe = clamp(Math.trunc(stageNumber), 1, STAGE_COUNT)
  return STAGE_DIFFICULTY[safe]
}

export function getStageSensitivity(stageNumber) {
  const safe = clamp(Math.trunc(stageNumber), 1, STAGE_COUNT)
  return {
    stageNumber: safe,
    sensitivityLabel: sensitivityLabels[safe - 1],
    toleratedAmbiguity: [90, 72, 54, 34, 18][safe - 1],
    reactionIntensity: [25, 40, 58, 78, 94][safe - 1],
    accumulatedFatigue: [5, 22, 45, 70, 92][safe - 1],
  }
}

export function adjustScore(rawScore, stageNumber) {
  const config = getStageDifficulty(stageNumber)
  return clamp(Math.round(100 * Math.pow(clamp(rawScore) / 100, config.sensitivityPower)))
}

export function baseScoreDeltas(adjustedScore) {
  if (adjustedScore >= 90) return [20, -20]
  if (adjustedScore >= 75) return [10, -10]
  if (adjustedScore >= 55) return [3, -3]
  if (adjustedScore >= 35) return [-5, 5]
  if (adjustedScore >= 15) return [-15, 15]
  return [-25, 25]
}

export function calculateStageDeltas(adjustedScore, stageNumber) {
  const config = getStageDifficulty(stageNumber)
  const [baseHpDelta, baseConflictDelta] = baseScoreDeltas(adjustedScore)
  const multiplier = baseHpDelta >= 0 ? config.recoveryMultiplier : config.damageMultiplier
  const hp = Math.round(baseHpDelta * multiplier)
  const conflict = Math.round(baseConflictDelta * multiplier)
  return {
    baseHpDelta,
    baseConflictDelta,
    hpDelta: clamp(hp, -config.maxHpDamagePerTurn, config.maxHpRecoveryPerTurn),
    conflictDelta: clamp(conflict, -config.maxConflictDecreasePerTurn, config.maxConflictIncreasePerTurn),
  }
}

export function resolveStageInitialState(stage, stageNumber) {
  const config = getStageDifficulty(stageNumber)
  const hp = stage?.initialState?.relationshipHp
  const conflict = stage?.initialState?.conflictLevel
  return {
    relationshipHp: clamp(Number.isFinite(hp) ? hp : (config.initialHpRange.min + config.initialHpRange.max) / 2, config.initialHpRange.min, config.initialHpRange.max),
    conflictLevel: clamp(Number.isFinite(conflict) ? conflict : (config.initialConflictRange.min + config.initialConflictRange.max) / 2, config.initialConflictRange.min, config.initialConflictRange.max),
    stability: clamp(stage?.initialState?.stability ?? 50),
    trust: clamp(stage?.initialState?.trust ?? 50),
  }
}

export function getStageClearResult(relationshipHp, conflictLevel, stageNumber, immediate = false) {
  if (immediate || relationshipHp <= 0) return "failed_hp_zero"
  const config = getStageDifficulty(stageNumber)
  const failedHp = relationshipHp < config.requiredEndHp
  const failedConflict = conflictLevel > config.maximumEndConflict
  if (failedHp && failedConflict) return "failed_both"
  if (failedHp) return "failed_required_hp"
  if (failedConflict) return "failed_conflict"
  return "cleared"
}

export function normalizeConversationDifficulty(conversation) {
  if (!conversation) return conversation
  const stageNumber = clamp(conversation.currentStageNumber ?? 1, 1, STAGE_COUNT)
  const config = getStageDifficulty(stageNumber)
  const acknowledged = conversation.stageIntroAcknowledged ?? Boolean(conversation.messages?.some((message) => message.stageNumber === stageNumber && message.sender === "partner"))
  return {
    ...conversation,
    currentStageNumber: stageNumber,
    currentTurn: clamp(conversation.currentTurn ?? 1, 1, config.turnCount),
    currentStageTurnCount: config.turnCount,
    currentStageDifficulty: config,
    stageIntroAcknowledged: acknowledged,
    stageIntro: { stageNumber, isOpen: !acknowledged, acknowledged },
    stageResults: conversation.stageResults ?? [],
  }
}
