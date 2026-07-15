import { supabase } from "../client/supabaseClient.js"
import { validateCombinedTurnResult, validateOpenAIEvaluation, validatePartnerDialogue } from "../../game/aiResultValidation.js"
import { retryAIRequest } from "../../game/aiRequestRetry.js"

const TIMEOUT_MS = 20000

async function invokeWithRetry(requestType, payload, requestId, validate) {
  if (!supabase) throw Object.assign(new Error("Supabase 또는 OpenAI 환경변수가 설정되지 않았습니다."), { attempts: 0 })
  return retryAIRequest(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-turn", { body: { requestType, requestId, ...payload }, signal: controller.signal })
      if (error) throw error
      if (!data?.result || data.provider !== "openai") throw new Error("OpenAI 응답이 비어 있습니다.")
      return { result: data.result, model: data.model }
    } finally {
      clearTimeout(timer)
    }
  }, validate, (error, attempt) => { if (import.meta.env.DEV) console.warn(`[OpenAI] ${requestType} ${attempt}/2 실패`, error) })
}

export async function evaluateUserInputWithOpenAI(payload, requestId) {
  return invokeWithRetry("evaluate_user_input", payload, requestId, validateOpenAIEvaluation)
}

export async function generatePartnerDialogueWithOpenAI(payload, requestId) {
  return invokeWithRetry("generate_partner_dialogue", payload, requestId, (value) => ({ partnerDialogue: validatePartnerDialogue(value) }))
}

export async function evaluateAndGenerateTurnWithOpenAI(payload, requestId) {
  return invokeWithRetry("evaluate_and_generate_turn", payload, requestId, validateCombinedTurnResult)
}
