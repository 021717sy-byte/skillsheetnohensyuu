import { createGenerateHandler } from "@/lib/generate-handler";
export const dynamic = "force-dynamic";
export const maxDuration = 150;
export const POST = createGenerateHandler(() => ({
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_MODEL ?? "",
  password: process.env.APP_ACCESS_PASSWORD ?? "",
}));
