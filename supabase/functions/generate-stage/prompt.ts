import { OptionBlueprint } from "./optionBlueprints.ts";

export function buildPrompt(request: Record<string, unknown>, blueprints: OptionBlueprint[]) {
  return `Create one relationship communication game stage in Korean. Return only the requested JSON.
The program owns correctness, scoring, distance, and all c/e/u/p coefficients. Never invent or return them.
Write exactly one natural option for each blueprint slot, preserving each slot verbatim. Do not reorder or omit slots.
The partner's reaction is spoken dialogue, never an instruction, summary, stage direction, or emotional label. Internal reaction guidance such as "be defensive and create distance" may guide the dialogue but must never be copied into partnerReaction or any message.
Use the supplied partner gender, character profile, tendency, and speech style only to create a coherent individual voice; do not use stereotypes. Keep the user and partner clearly distinguishable by speaker.
Use recent conversation and previous advice as continuity context. Do not repeat a recent partner line or a previous suggestedBetterResponse. The suggested better response is coaching text for the user, not the partner's dialogue.
Blueprints: ${JSON.stringify(blueprints.map(({ slot, label }) => ({ slot, label })))}
Request: ${JSON.stringify(request)}
Generate title, contextSummary, hiddenEmotion, hiddenNeed, messages, four options with slot/text/partnerReaction/feedback, successFeedback, recommendedExpression, and five fingerprint components: title, summary, hidden emotion, hidden need, opening line.`;
}
