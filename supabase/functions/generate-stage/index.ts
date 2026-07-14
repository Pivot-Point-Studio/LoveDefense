import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { buildPrompt } from "./prompt.ts";
import { STAGE_SCHEMA } from "./schema.ts";
import { validateAndNormalize } from "./validator.ts";
import { normalizeBlueprints } from "./optionBlueprints.ts";
import { fingerprint } from "./duplicateChecker.ts";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function callOpenAI(request: Record<string, unknown>, blueprints: ReturnType<typeof normalizeBlueprints>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY"); const model = Deno.env.get("OPENAI_MODEL");
  if (!apiKey || !model) throw new Error("OpenAI secrets are not configured");
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, input: [{ role: "system", content: [{ type: "input_text", text: buildPrompt(request, blueprints) }] }], text: { format: { type: "json_schema", name: "relationship_stage", strict: true, schema: STAGE_SCHEMA } } }) });
  if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
  const body = await response.json(); const raw = body.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === "output_text")?.text;
  if (!raw) throw new Error("OpenAI returned no structured output");
  return validateAndNormalize(JSON.parse(raw));
}

function attachProgramData(stage: any, blueprints: ReturnType<typeof normalizeBlueprints>) {
  const bySlot = new Map(blueprints.map((blueprint) => [blueprint.slot, blueprint]));
  return { ...stage, id: `ai-${crypto.randomUUID()}`, summary: stage.contextSummary, openingLine: stage.messages[0]?.text ?? "", fingerprint: fingerprint(stage), options: stage.options.map((option: any) => ({ ...option, correct: option.slot === "best", blueprint: bySlot.get(option.slot) })) };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const input = await request.json(); const blueprints = normalizeBlueprints(input.optionBlueprints);
    let stage: any; let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) { try { stage = await callOpenAI({ ...input, optionBlueprints: blueprints }, blueprints); break; } catch (error) { lastError = error; } }
    if (!stage) throw lastError ?? new Error("Generation failed");
    return new Response(JSON.stringify({ stage: attachProgramData(stage, blueprints), provider: "openai" }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Generation failed" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } }); }
});
