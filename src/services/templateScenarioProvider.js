import { ScenarioProvider } from "./scenarioProvider";
import { scenarios } from "../data/scenarios";

export class TemplateScenarioProvider extends ScenarioProvider {
  async generateStage(request = {}) {
    const pool = scenarios.filter((item) => !request.categoryTags?.length || item.tags.some((tag) => request.categoryTags.includes(tag)));
    const candidates = pool.length ? pool : scenarios;
    const index = Number(request.stage ?? 0) % candidates.length;
    const source = candidates[index];
    return { ...source, provider: "template", contextSummary: source.summary, openingLine: source.messages?.[0]?.text ?? "", successFeedback: "상대의 감정을 먼저 확인하고 마음을 이어갔어요.", recommendedExpression: source.options.find((option) => option.correct)?.text ?? "", fingerprint: [source.title, source.summary, source.messages?.[0]?.text].join("|") };
  }
}
