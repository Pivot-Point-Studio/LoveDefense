import { getLockedPhrases } from "./dialogueDiversity.js"
import { getStageSensitivity } from "./stageDifficulty.js"

export function buildPatternContext(context) {
  const stagePattern = context.turn.patternContext ?? context.stage.patternContext ?? {}
  const diversity = context.diversityState ?? {}
  const messagePartnerResponses = (context.recentMessages ?? []).filter((message) => message.sender === "partner").map((message) => message.text).reverse()
  const recentPartnerResponses = [...new Set([...(diversity.recentPartnerResponses ?? []), ...messagePartnerResponses])].slice(0, 10)
  return {
    casePatternId: stagePattern.casePatternId ?? context.stage.id,
    attachmentStyle: stagePattern.attachmentStyle ?? context.stage.attachmentType?.type ?? "secure",
    behaviorTypeId: stagePattern.behaviorTypeId ?? context.character?.characterProfile?.characterId ?? "unknown",
    location: stagePattern.location ?? { id: "unknown", displayName: "현재 장소", currentDetails: [] },
    trigger: stagePattern.trigger ?? { id: "unknown", summary: context.stage.contextSummary, currentEscalation: context.turn.situationContext },
    narrativeArcPhase: stagePattern.narrativeArcPhase ?? "development",
    allowedEndingModes: stagePattern.allowedEndingModes ?? [],
    discouragedEndingModes: stagePattern.discouragedEndingModes ?? [],
    recentEndings: (diversity.recentEndingHistory ?? []).slice(0, 10).map((item) => ({ endingMode: item.endingMode, finalClause: item.finalClause })),
    lockedPhrases: getLockedPhrases(diversity),
    recentPartnerResponses,
    speechPatternHints: stagePattern.speechPatternHints ?? [],
    behaviorPatternHints: stagePattern.behaviorPatternHints ?? [],
  }
}

export function buildDialoguePayload(input, evaluation, context) {
  const patternContext = buildPatternContext(context)
  const scenario = context.currentScenario ?? {
    id: context.stage.id,
    title: context.stage.title,
    contextSummary: context.stage.contextSummary,
    location: context.stage.location ?? patternContext.location.displayName,
    timeContext: context.stage.timeContext ?? "현재 시점",
    conflictCause: context.stage.conflictCause ?? patternContext.trigger.summary,
    hiddenEmotion: context.stage.hiddenEmotion?.primary ?? context.stage.hiddenEmotion,
    hiddenNeed: context.stage.hiddenNeed?.primary ?? context.stage.hiddenNeed,
    userRole: context.stage.userRole ?? "연인",
    partnerRole: context.stage.partnerRole ?? "연인",
    goal: context.stage.goal ?? "현재 갈등을 같은 상황 안에서 해결하기",
  }
  if (scenario.id !== context.stage.id) throw new Error("현재 STAGE의 scenarioId가 일치하지 않습니다.")
  const recentMessages = (context.recentMessages ?? []).slice(-16)
  return { stageNumber: context.stage.stageNumber, turnNumber: context.turn.turnNumber, maxTurns: context.stageDifficulty.turnCount, scenarioId: scenario.id, scenarioTitle: scenario.title, contextSummary: scenario.contextSummary, location: scenario.location, timeContext: scenario.timeContext, conflictCause: scenario.conflictCause, hiddenEmotion: scenario.hiddenEmotion, hiddenNeed: scenario.hiddenNeed, userRole: scenario.userRole, partnerRole: scenario.partnerRole, stageGoal: scenario.goal, resolutionState: context.resolutionState ?? "unresolved", stageSensitivity: getStageSensitivity(context.stage.stageNumber), gameState: context.gameState, character: context.character, attachmentType: context.stage.attachmentType, communicationAxes: context.stage.communicationAxes, userInput: input, evaluation, reactionDirection: evaluation.reactionDirection, recentMessages, conversationHistory: recentMessages, recentPartnerDialogues: patternContext.recentPartnerResponses, recentSuggestedResponses: (context.diversityState?.recentSuggestedResponses ?? context.previousAdvice ?? []).slice(-10), previousStageSummary: context.previousStageSummary ?? "", patternContext, recentDialogueEndings: patternContext.recentEndings }
}
