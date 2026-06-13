import { handle } from "@/lib/api-route";
import { getPaidBudgetStatus, freeModel, paidModels } from "@/lib/analysis/llm";

export const dynamic = "force-dynamic";

/** Paid-tier LLM budget status · check spend headroom at a glance. */
export function GET() {
  return handle(async () => {
    const budget = getPaidBudgetStatus();
    return {
      provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "none",
      freeModel: process.env.OPENROUTER_API_KEY ? freeModel() : null,
      paidModels: process.env.OPENROUTER_API_KEY ? paidModels() : [],
      paidBudget: {
        ...budget,
        remaining: Math.max(0, budget.limit - budget.tokensUsed),
        usedPct: Math.round((budget.tokensUsed / budget.limit) * 100),
      },
    };
  });
}
