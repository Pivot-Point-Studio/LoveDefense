import { evaluateUserInputWithOpenAI, generatePartnerDialogueWithOpenAI } from "../services/aiTurnService.js"
import { adjustScore, getStageSensitivity } from "./stageDifficulty.js"
import { buildRuleBasedHints, createRuleFallbackEvaluation, fallbackReaction, isSafetyBlocked } from "./turnEvaluator.js"

export async function evaluateTurn(input, context) {
  const hints = buildRuleBasedHints(input)
  if (isSafetyBlocked(hints, input)) return { blocked: true, hints }
  const requestId = `${context.conversationId}:${context.stage.stageNumber}:${context.turn.turnNumber}:evaluation`
  let evaluation
  try {
    const response = await evaluateUserInputWithOpenAI({
      stage: context.stage,
      turn: context.turn,
      userInput: input,
      ruleBasedHints: hints,
      recentMessages: context.recentMessages.slice(-12),
      previousAdvice: context.previousAdvice.slice(-5),
      character: context.character,
      gameState: context.gameState,
      stageSensitivity: getStageSensitivity(context.stage.stageNumber),
    }, requestId)
    evaluation = { ...response.result, metadata: { source: "openai", openaiAttemptCount: response.attempts, model: response.model }, analysisSource: "openai" }
    if (import.meta.env.DEV) console.info("[OpenAI] turn evaluation", evaluation.metadata)
  } catch (error) {
    if (import.meta.env.DEV) console.error("[OpenAI] 평가 실패로 rule_fallback 사용", error)
    evaluation = createRuleFallbackEvaluation(input, context.stage, context.turn, hints, error.message, error.attempts ?? 0)
  }
  const rawScore = evaluation.rawScore
  return {
    ...evaluation,
    rawScore,
    adjustedScore: adjustScore(rawScore, context.stage.stageNumber),
    stageSensitivityPower: context.stageDifficulty.sensitivityPower,
  }
}

export async function generatePartnerReaction(input, evaluation, context) {
  const requestId = `${context.conversationId}:${context.stage.stageNumber}:${context.turn.turnNumber}:dialogue`
  try {
    const response = await generatePartnerDialogueWithOpenAI({
      stageNumber: context.stage.stageNumber,
      turnNumber: context.turn.turnNumber,
      stageSensitivity: getStageSensitivity(context.stage.stageNumber),
      gameState: context.gameState,
      character: context.character,
      attachmentType: context.stage.attachmentType,
      communicationAxes: context.stage.communicationAxes,
      hiddenEmotion: context.stage.hiddenEmotion,
      hiddenNeed: context.stage.hiddenNeed,
      userInput: input,
      evaluation,
      reactionDirection: evaluation.reactionDirection,
      recentMessages: context.recentMessages.slice(-12),
      recentPartnerDialogues: context.recentMessages.filter((message) => message.sender === "partner").slice(-5).map((message) => message.text),
      previousStageSummary: context.previousStageSummary ?? "",
    }, requestId)
    if (import.meta.env.DEV) console.info("[OpenAI] partner dialogue", { source: "openai", attempts: response.attempts, model: response.model })
    return { dialogue: response.result.partnerDialogue, metadata: { source: "openai", openaiAttemptCount: response.attempts, model: response.model } }
  } catch (error) {
    if (import.meta.env.DEV) console.error("[OpenAI] 대사 생성 실패로 자연어 fallback 사용", error)
    return { dialogue: fallbackReaction(evaluation.reactionDirection, context.character, context.recentMessages), metadata: { source: "rule_fallback", openaiAttemptCount: error.attempts ?? 0, fallbackReason: error.message } }
  }
}
