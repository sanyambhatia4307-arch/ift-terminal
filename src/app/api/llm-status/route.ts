import { handle } from "@/lib/api-route";
import { getPaidBudgetStatus } from "@/lib/analysis/llm";

export const dynamic = "force-dynamic";

/** Paid-tier LLM budget status — check spend headroom at a glance. */
export function GET() {
  return handle(async () => {
    const budget = getPaidBudgetStatus();
    return {
      provider: process.env.OPENROUTER_API_KEY ? "openrouter" : "none",
      freeModel: process.env.OPENROUTER_FREE_MODEL ?? null,
      paidModel: process.env.OPENROUTER_PAID_MODEL ?? null,
      paidBudget: {
        ...budget,
        remaining: Math.max(0, budget.limit - budget.tokensUsed),
        usedPct: Math.round((budget.tokensUsed / budget.limit) * 100),
      },
    };
  });
}
