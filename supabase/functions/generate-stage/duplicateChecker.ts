function tokens(value: string) {
  return new Set(value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter((x) => x.length > 1));
}

export function fingerprint(stage: any) {
  const components = stage.scenarioFingerprintComponents ?? [stage.title, stage.contextSummary, stage.hiddenEmotion, stage.hiddenNeed, stage.messages?.[0]?.text ?? ""];
  return components.map((x: string) => x.trim().toLowerCase()).join("|");
}

export function similarity(a: string, b: string) {
  const left = tokens(a); const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let intersection = 0; for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}
