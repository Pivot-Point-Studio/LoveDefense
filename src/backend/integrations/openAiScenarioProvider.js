import { ScenarioProvider } from "../../services/scenarioProvider";
import { supabase } from "../client/supabaseClient";

const TIMEOUT_MS = 15000;
export class OpenAiScenarioProvider extends ScenarioProvider {
  async generateStage(request) {
    if (!supabase) throw new Error("Supabase is not configured");
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const { data, error } = await supabase.functions.invoke("generate-stage", { body: request, signal: controller.signal });
      if (error) throw error; if (!data?.stage) throw new Error("Stage response is empty");
      return { ...data.stage, provider: "openai" };
    } catch (error) { throw new Error(error?.name === "AbortError" ? "시나리오 생성 시간이 초과되었습니다." : error?.message ?? "시나리오 생성에 실패했습니다.", { cause: error }); } finally { clearTimeout(timer); }
  }
}
