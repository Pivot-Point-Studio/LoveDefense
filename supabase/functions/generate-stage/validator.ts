import { OPTION_SLOTS } from "./optionBlueprints.ts";
import { validateStageShape } from "./schema.ts";

export function validateAndNormalize(value: unknown) {
  validateStageShape(value);
  const stage = value as any;
  const slots = stage.options.map((option: any) => option.slot);
  if (new Set(slots).size !== 4 || slots.some((slot: string) => !OPTION_SLOTS.includes(slot as any))) throw new Error("Invalid or duplicate option slots");
  return stage;
}
