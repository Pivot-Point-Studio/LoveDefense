export const STAGE_STATUS = Object.freeze({
  TRANSITION: "stage_transition",
  INTRO: "stage_intro",
  PLAYING: "playing",
  RESULT: "stage_result",
  GAME_RESULT: "game_result",
  GAME_OVER: "game_over",
})

export const RESOLUTION_STATE = Object.freeze({
  UNRESOLVED: "unresolved",
  IMPROVING: "improving",
  RESOLVED: "resolved",
  WORSENED: "worsened",
})

export const SCENARIO_ENDED_MESSAGE = "📍 [System] 현재 시나리오가 종료되었습니다."
export const SCENARIO_STARTED_MESSAGE = "📍 [System] 새로운 시나리오가 시작됩니다."
export const STAGE_TRANSITION_DURATION_MS = 3000

const primaryValue = (value) => typeof value === "string" ? value : value?.primary ?? ""

export function createScenarioSnapshot(stage) {
  if (!stage?.id) return null
  return {
    id: stage.id,
    title: stage.title ?? "",
    contextSummary: stage.contextSummary ?? "",
    location: stage.location ?? stage.patternContext?.location?.displayName ?? "현재 장소",
    timeContext: stage.timeContext ?? "현재 시점",
    conflictCause: stage.conflictCause ?? stage.patternContext?.trigger?.summary ?? stage.contextSummary ?? "",
    hiddenEmotion: primaryValue(stage.hiddenEmotion),
    hiddenNeed: primaryValue(stage.hiddenNeed),
    userRole: stage.userRole ?? "연인",
    partnerRole: stage.partnerRole ?? stage.characterProfile?.relationshipRole ?? "연인",
    goal: stage.goal ?? "현재 갈등을 이해하고 관계 회복의 실마리를 찾기",
    characterProfile: stage.characterProfile ?? null,
    attachmentType: stage.attachmentType ?? null,
    communicationAxes: stage.communicationAxes ?? null,
  }
}

export function createStageTransition(stageNumber, startedAt = Date.now()) {
  return {
    stageStatus: STAGE_STATUS.TRANSITION,
    pendingStageNumber: stageNumber,
    stageIntroAcknowledged: false,
    stageIntro: { stageNumber, isOpen: false, acknowledged: false },
    transitionOverlay: { stageNumber, readyAt: startedAt + STAGE_TRANSITION_DURATION_MS },
    isGeneratingScenario: false,
    scenarioGenerationError: "",
  }
}

export function openStageIntro(conversation) {
  if (!conversation || conversation.stageStatus !== STAGE_STATUS.TRANSITION) return conversation
  const stageNumber = conversation.pendingStageNumber ?? conversation.currentStageNumber
  return {
    ...conversation,
    stageStatus: STAGE_STATUS.INTRO,
    stageIntro: { stageNumber, isOpen: true, acknowledged: false },
    transitionOverlay: null,
  }
}

export function canAcknowledgeStage(conversation) {
  return Boolean(conversation && conversation.status === "active" && conversation.stageStatus === STAGE_STATUS.INTRO && !conversation.stageIntroAcknowledged && !conversation.isGeneratingScenario)
}

export function canSubmitTurn(conversation) {
  return Boolean(conversation && conversation.status === "active" && conversation.stageStatus === STAGE_STATUS.PLAYING && conversation.stageIntroAcknowledged && conversation.currentScenario?.id && conversation.currentScenario.id === conversation.currentStageId)
}

export function resolveConversationState({ adjustedScore, relationshipHp, conflictLevel, requiredEndHp, maximumEndConflict }) {
  if (adjustedScore >= 75 && relationshipHp >= requiredEndHp && conflictLevel <= maximumEndConflict) return RESOLUTION_STATE.RESOLVED
  if (adjustedScore >= 55) return RESOLUTION_STATE.IMPROVING
  if (adjustedScore < 35) return RESOLUTION_STATE.WORSENED
  return RESOLUTION_STATE.UNRESOLVED
}

export function scenarioSummaryText(scenario) {
  return `상황: ${scenario.title}\n\n${scenario.contextSummary}`
}
