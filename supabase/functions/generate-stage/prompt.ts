import { OptionBlueprint } from "./optionBlueprints.ts";

export function buildPrompt(request: Record<string, unknown>, blueprints: OptionBlueprint[]) {
  return `Create one relationship communication game stage in Korean. Return only the requested JSON.
The program owns correctness, scoring, distance, and all c/e/u/p coefficients. Never invent or return them.
Write exactly one natural option for each blueprint slot, preserving each slot verbatim. Do not reorder or omit slots.
Blueprints: ${JSON.stringify(blueprints.map(({ slot, label }) => ({ slot, label })))}
Request: ${JSON.stringify(request)}
Generate title, contextSummary, hiddenEmotion, hiddenNeed, messages, four options with slot/text/partnerReaction/feedback, successFeedback, recommendedExpression, and five fingerprint components: title, summary, hidden emotion, hidden need, opening line.`;
}
