export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ ready: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL && process.env.APP_ACCESS_PASSWORD), requiresPassword: true }, { headers: { "Cache-Control": "no-store" } });
}
