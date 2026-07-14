export const OPTION_SLOTS = [
  "best",
  "emotionMismatch",
  "contextMismatch",
  "communicationMismatch",
  "excessiveLeap",
  "defensive",
  "prematureSolution",
  "avoidance",
] as const;

export type OptionSlot = (typeof OPTION_SLOTS)[number];

export type OptionBlueprint = {
  slot: OptionSlot;
  label: string;
  c: number;
  e: number;
  u: number;
  p: number;
};

export const DEFAULT_BLUEPRINTS: OptionBlueprint[] = [
  { slot: "best", label: "emotion-first validation", c: 1, e: 1, u: 1, p: 1 },
  { slot: "emotionMismatch", label: "solution before empathy", c: 1, e: 0, u: 1, p: 0 },
  { slot: "contextMismatch", label: "misses the immediate context", c: 0, e: 1, u: 0, p: 0 },
  { slot: "communicationMismatch", label: "unclear or indirect communication", c: 0, e: 0, u: 1, p: 0 },
];

export function normalizeBlueprints(input: unknown): OptionBlueprint[] {
  if (!Array.isArray(input) || input.length < 4) return DEFAULT_BLUEPRINTS;
  const allowed = new Set<string>(OPTION_SLOTS);
  const result = input.slice(0, 4).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  if (result.length !== 4 || result.some((item) => !allowed.has(String(item.slot)))) return DEFAULT_BLUEPRINTS;
  return result.map((item) => ({
    slot: String(item.slot) as OptionSlot,
    label: String(item.label ?? item.slot),
    c: Number(item.c) || 0,
    e: Number(item.e) || 0,
    u: Number(item.u) || 0,
    p: Number(item.p) || 0,
  }));
}
