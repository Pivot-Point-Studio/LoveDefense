export const STAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "contextSummary", "hiddenEmotion", "hiddenNeed", "messages", "options", "successFeedback", "recommendedExpression", "scenarioFingerprintComponents"],
  properties: {
    title: { type: "string", minLength: 2, maxLength: 120 },
    contextSummary: { type: "string", minLength: 2, maxLength: 300 },
    hiddenEmotion: { type: "string", minLength: 1, maxLength: 80 },
    hiddenNeed: { type: "string", minLength: 1, maxLength: 80 },
    messages: { type: "array", minItems: 2, maxItems: 6, items: { type: "object", additionalProperties: false, required: ["speaker", "text"], properties: { speaker: { type: "string", enum: ["partner", "me"] }, text: { type: "string", minLength: 1, maxLength: 300 } } } },
    options: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", additionalProperties: false, required: ["slot", "text", "partnerReaction", "feedback"], properties: { slot: { type: "string" }, text: { type: "string", minLength: 2, maxLength: 300 }, partnerReaction: { type: "string", minLength: 1, maxLength: 300 }, feedback: { type: "string", minLength: 1, maxLength: 300 } } } },
    successFeedback: { type: "string", minLength: 1, maxLength: 300 },
    recommendedExpression: { type: "string", minLength: 1, maxLength: 240 },
    scenarioFingerprintComponents: { type: "array", minItems: 5, maxItems: 5, items: { type: "string", minLength: 1, maxLength: 160 } },
  },
} as const;

export function validateStageShape(value: unknown): asserts value is Record<string, any> {
  if (!value || typeof value !== "object") throw new Error("Structured output was not an object");
  const stage = value as Record<string, any>;
  for (const field of STAGE_SCHEMA.required) if (!(field in stage)) throw new Error(`Missing field: ${field}`);
  if (!Array.isArray(stage.messages) || stage.messages.length < 2 || !Array.isArray(stage.options) || stage.options.length !== 4) throw new Error("Invalid stage arrays");
  if (!Array.isArray(stage.scenarioFingerprintComponents) || stage.scenarioFingerprintComponents.length !== 5) throw new Error("Invalid fingerprint components");
  for (const option of stage.options) if (!option.slot || !option.text || !option.partnerReaction || !option.feedback) throw new Error("Invalid option");
}
