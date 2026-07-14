import { createScenarioProvider, generateWithFallback } from "./scenarioProviderFactory";
import { isDuplicate, loadRecentStages, rememberStage } from "./scenarioDuplicateChecker";
import { saveScenarioHistory } from "../repositories/scenarioHistoryRepository";

const factory = createScenarioProvider();
export async function generateStage(request, onStatus) {
  const recent = loadRecentStages();
  let stage = await generateWithFallback(factory, { ...request, recentScenariosToAvoid: recent.slice(0, 10) }, onStatus);
  for (let attempt = 0; attempt < 2 && isDuplicate(stage, recent); attempt += 1) stage = await generateWithFallback(factory, { ...request, recentScenariosToAvoid: [...recent, stage].slice(0, 10), regeneration: attempt + 1 }, onStatus);
  rememberStage(stage);
  if (factory.primary && stage.provider === "openai") saveScenarioHistory({ scenario_id: stage.id, mode: request.mode ?? "practice", difficulty: request.difficulty ?? "normal", blame_side: request.blameSide ?? "partner", category_tags: request.categoryTags ?? [], title: stage.title, context_summary: stage.contextSummary ?? stage.summary, opening_line: stage.openingLine, fingerprint: stage.fingerprint }).catch(() => {});
  return stage;
}
