export const dynamic = "force-dynamic";

/** Lightweight health / version probe · reports the exact deployed commit. */
export function GET() {
  return Response.json({
    ok: true,
    service: "ift-terminal",
    commit: process.env.RENDER_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    deployedAt: new Date().toISOString(),
    node: process.version,
  });
}
