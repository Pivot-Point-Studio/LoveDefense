import { evaluateAndGenerateTurnWithOpenAI, evaluateUserInputWithOpenAI, generatePartnerDialogueWithOpenAI } from "../backend/integrations/aiTurnService.js"
import { adjustScore, getStageSensitivity } from "./stageDifficulty.js"
import { buildRuleBasedHints, createRuleFallbackEvaluation, fallbackReaction, isSafetyBlocked } from "./turnEvaluator.js"
import { classifyEndingMode, getLockedPhrases, validateDialogueDiversity } from "./dialogueDiversity.js"

function buildPatternContext(context) {
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
    behaviorPatternHints: stagePattern.behaviorPatternHints ?? []
  }
}

function dialoguePayload(input, evaluation, context) {
  const patternContext = buildPatternContext(context)
  return { stageNumber: context.stage.stageNumber, turnNumber: context.turn.turnNumber, stageSensitivity: getStageSensitivity(context.stage.stageNumber), gameState: context.gameState, character: context.character, attachmentType: context.stage.attachmentType, communicationAxes: context.stage.communicationAxes, hiddenEmotion: context.stage.hiddenEmotion, hiddenNeed: context.stage.hiddenNeed, userInput: input, evaluation, reactionDirection: evaluation.reactionDirection, recentMessages: context.recentMessages.slice(-16), recentPartnerDialogues: patternContext.recentPartnerResponses, recentSuggestedResponses: (context.diversityState?.recentSuggestedResponses ?? context.previousAdvice ?? []).slice(-10), previousStageSummary: context.previousStageSummary ?? "", patternContext, recentDialogueEndings: patternContext.recentEndings }
}

export async function evaluateTurn(input, context) {
  const hints = buildRuleBasedHints(input)
  if (isSafetyBlocked(hints, input)) return { blocked: true, hints }
  const requestId = `${context.conversationId}:${context.stage.stageNumber}:${context.turn.turnNumber}:turn`
  let evaluation
  try {
    const response = await evaluateAndGenerateTurnWithOpenAI({ ...dialoguePayload(input, { reactionDirection: "partial" }, context), requestType: "evaluate_and_generate_turn", ruleBasedHints: hints, stage: context.stage, turn: context.turn, previousAdvice: context.previousAdvice.slice(-10), stageSensitivity: getStageSensitivity(context.stage.stageNumber) }, requestId)
    const patternContext = buildPatternContext(context)
    const generatedCheck = validateDialogueDiversity(response.result.partnerDialogue, { recentPartnerResponses: patternContext.recentPartnerResponses, recentEndings: patternContext.recentEndings, endingMode: response.result.endingMode, lockedPhrases: patternContext.lockedPhrases })
    evaluation = { ...response.result, partnerDialogue: generatedCheck.valid ? response.result.partnerDialogue : "", dialogueEndingMode: generatedCheck.valid ? response.result.endingMode : null, dialogueRegenerationReason: generatedCheck.valid ? null : generatedCheck.reason, metadata: { source: "openai_combined", openaiAttemptCount: response.attempts, model: response.model }, analysisSource: "openai_combined" }
  } catch (combinedError) {
    if (import.meta.env.DEV) console.warn("[OpenAI] 통합 턴 요청 실패, 평가 호환 경로 사용", combinedError)
    try {
      const response = await evaluateUserInputWithOpenAI({ stage: context.stage, turn: context.turn, userInput: input, ruleBasedHints: hints, recentMessages: context.recentMessages.slice(-16), previousAdvice: context.previousAdvice.slice(-10), character: context.character, gameState: context.gameState, stageSensitivity: getStageSensitivity(context.stage.stageNumber), patternContext: buildPatternContext(context) }, `${requestId}:evaluation`)
      evaluation = { ...response.result, metadata: { source: "openai", openaiAttemptCount: response.attempts, model: response.model }, analysisSource: "openai" }
    } catch (error) {
      if (import.meta.env.DEV) console.error("[OpenAI] 평가 실패로 rule_fallback 사용", error)
      evaluation = createRuleFallbackEvaluation(input, context.stage, context.turn, hints, error.message, error.attempts ?? combinedError.attempts ?? 0)
    }
  }
  return { ...evaluation, rawScore: evaluation.rawScore, adjustedScore: adjustScore(evaluation.rawScore, context.stage.stageNumber), stageSensitivityPower: context.stageDifficulty.sensitivityPower }
}

export async function generatePartnerReaction(input, evaluation, context) {
  const patternContext = buildPatternContext(context)
  const payload = dialoguePayload(input, evaluation, context)
  const requestId = `${context.conversationId}:${context.stage.stageNumber}:${context.turn.turnNumber}:dialogue`
  const generate = async (suffix = "") => generatePartnerDialogueWithOpenAI({ ...payload, regenerationReason: suffix }, `${requestId}${suffix ? ":regen" : ""}`)
  try {
    let response = await generate(evaluation.dialogueRegenerationReason ?? "")
    let validation = validateDialogueDiversity(response.result.partnerDialogue, { recentPartnerResponses: patternContext.recentPartnerResponses, recentEndings: patternContext.recentEndings, endingMode: classifyEndingMode(response.result.partnerDialogue), lockedPhrases: patternContext.lockedPhrases })
    if (!validation.valid) {
      response = await generate(`이전 결과가 ${validation.reason} 규칙을 위반했다. 질문형 종결을 강제하지 말고 최근 ending mode와 문구를 피하라.`)
      validation = validateDialogueDiversity(response.result.partnerDialogue, { recentPartnerResponses: patternContext.recentPartnerResponses, recentEndings: patternContext.recentEndings, endingMode: classifyEndingMode(response.result.partnerDialogue), lockedPhrases: patternContext.lockedPhrases })
    }
    if (!validation.valid) throw new Error(`대화 다양성 검사 실패: ${validation.reason}`)
    return { dialogue: response.result.partnerDialogue, endingMode: classifyEndingMode(response.result.partnerDialogue), metadata: { source: "openai", openaiAttemptCount: response.attempts, model: response.model } }
  } catch (error) {
    if (import.meta.env.DEV) console.error("[OpenAI] 대사 생성 실패로 다양화 fallback 사용", error)
    const dialogue = fallbackReaction(evaluation.reactionDirection, context.character, context.recentMessages, { recentEndings: patternContext.recentEndings, lockedPhrases: patternContext.lockedPhrases })
    return { dialogue, endingMode: classifyEndingMode(dialogue), metadata: { source: "rule_fallback", openaiAttemptCount: error.attempts ?? 0, fallbackReason: error.message } }
  }
}
