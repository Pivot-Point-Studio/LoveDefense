import { OPTION_SLOTS } from "./optionBlueprints.ts";
import { validateStageShape } from "./schema.ts";

export function validateAndNormalize(value: unknown) {
  validateStageShape(value);
  const stage = value as any;
  const internalGuidance = /(방어적으로 반응하고 거리를 둔다|긴장이 조금 풀리고|일부는 공감받았지만|이해받지 못했다고 느껴|반응하고 거리를 둔다|대화를 줄인다)/;
  const dialogueFields = [...stage.messages.map((message: any) => message.text), ...stage.options.map((option: any) => option.partnerReaction)];
  if (dialogueFields.some((text: string) => internalGuidance.test(text))) throw new Error("Partner dialogue contains internal reaction guidance");
  const slots = stage.options.map((option: any) => option.slot);
  if (new Set(slots).size !== 4 || slots.some((slot: string) => !OPTION_SLOTS.includes(slot as any))) throw new Error("Invalid or duplicate option slots");
  return stage;
}
