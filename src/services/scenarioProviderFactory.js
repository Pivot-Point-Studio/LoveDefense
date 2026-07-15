import { OpenAiScenarioProvider } from "../backend/integrations/openAiScenarioProvider";
import { TemplateScenarioProvider } from "./templateScenarioProvider";
import { isSupabaseConfigured } from "../backend/config/supabaseConfig";

export function createScenarioProvider() { return { primary: isSupabaseConfigured ? new OpenAiScenarioProvider() : null, fallback: new TemplateScenarioProvider() }; }
export async function generateWithFallback(factory, request, onStatus = () => {}) {
  if (factory.primary) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { onStatus(attempt ? "다시 생성하는 중…" : "AI 시나리오를 준비하는 중…"); return await factory.primary.generateStage(request); } catch { onStatus("AI 연결에 실패해 로컬 시나리오로 전환합니다."); }
    }
  }
  return factory.fallback.generateStage(request);
}
