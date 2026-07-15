import { evaluateAndGenerateTurnWithOpenAI, evaluateUserInputWithOpenAI, generatePartnerDialogueWithOpenAI } from "../backend/integrations/aiTurnService.js"
import { adjustScore, getStageSensitivity } from "./stageDifficulty.js"
import { buildRuleBasedHints, createRuleFallbackEvaluation, fallbackReaction, isSafetyBlocked } from "./turnEvaluator.js"
import { classifyEndingMode, validateDialogueDiversity } from "./dialogueDiversity.js"
import { buildDialoguePayload, buildPatternContext } from "./stagePromptContext.js"

export async function evaluateTurn(input, context) {
  const hints = buildRuleBasedHints(input)
  if (isSafetyBlocked(hints, input)) return { blocked: true, hints }
  const requestId = `${context.conversationId}:${context.stage.stageNumber}:${context.turn.turnNumber}:turn`
  let evaluation
  try {
    const response = await evaluateAndGenerateTurnWithOpenAI({ ...buildDialoguePayload(input, { reactionDirection: "partial" }, context), requestType: "evaluate_and_generate_turn", ruleBasedHints: hints, stage: context.stage, turn: context.turn, previousAdvice: context.previousAdvice.slice(-10), stageSensitivity: getStageSensitivity(context.stage.stageNumber) }, requestId)
    const patternContext = buildPatternContext(context)
    const generatedCheck = validateDialogueDiversity(response.result.partnerDialogue, { recentPartnerResponses: patternContext.recentPartnerResponses, recentEndings: patternContext.recentEndings, endingMode: response.result.endingMode, lockedPhrases: patternContext.lockedPhrases })
    evaluation = { ...response.result, partnerDialogue: generatedCheck.valid ? response.result.partnerDialogue : "", dialogueEndingMode: generatedCheck.valid ? response.result.endingMode : null, dialogueRegenerationReason: generatedCheck.valid ? null : generatedCheck.reason, metadata: { source: "openai_combined", openaiAttemptCount: response.attempts, model: response.model, retrieval: response.retrieval }, analysisSource: "openai_combined" }
  } catch (combinedError) {
    if (import.meta.env.DEV) console.warn("[OpenAI] 통합 턴 요청 실패, 평가 호환 경로 사용", combinedError)
    try {
      const response = await evaluateUserInputWithOpenAI({ stage: context.stage, turn: context.turn, userInput: input, ruleBasedHints: hints, recentMessages: context.recentMessages.slice(-16), previousAdvice: context.previousAdvice.slice(-10), userProfile: context.userProfile, partnerProfile: context.partnerProfile, character: context.character, gameState: context.gameState, stageSensitivity: getStageSensitivity(context.stage.stageNumber), patternContext: buildPatternContext(context) }, `${requestId}:evaluation`)
      evaluation = { ...response.result, metadata: { source: "openai", openaiAttemptCount: response.attempts, model: response.model, retrieval: response.retrieval }, analysisSource: "openai" }
    } catch (error) {
      if (import.meta.env.DEV) console.error("[OpenAI] 평가 실패로 rule_fallback 사용", error)
      evaluation = createRuleFallbackEvaluation(input, context.stage, context.turn, hints, error.message, error.attempts ?? combinedError.attempts ?? 0)
    }
  }
  return { ...evaluation, rawScore: evaluation.rawScore, adjustedScore: adjustScore(evaluation.rawScore, context.stage.stageNumber), stageSensitivityPower: context.stageDifficulty.sensitivityPower }
}

export async function generatePartnerReaction(input, evaluation, context) {
  const patternContext = buildPatternContext(context)
  const payload = buildDialoguePayload(input, evaluation, context)
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
