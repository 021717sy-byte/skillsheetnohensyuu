import { extractionPrompt, extractionJsonSchema, normalizeExtraction } from "./extraction.ts";

export interface AppConfig { apiKey: string; model: string; password: string }
type Dependencies = { fetcher?: typeof fetch; sleep?: (ms: number) => Promise<void> };
const MAX_BODY = 11 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

class RequestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

async function boundedForm(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new RequestError("PDFをフォームから送信してください。");
  if (Number(request.headers.get("content-length")) > MAX_BODY) throw new RequestError("ファイルが大きすぎます。10MB以下のPDFを選択してください。", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("PDFが送信されていません。");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw new RequestError("ファイルが大きすぎます。", 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData(); }
  catch { throw new RequestError("アップロードを読み取れません。PDFを選び直してください。"); }
}

async function passwordMatches(provided: string, expected: string) {
  const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [a, b] = await Promise.all([digest(provided), digest(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export function createGenerateHandler(getConfig: () => AppConfig, dependencies: Dependencies = {}) {
  const fetcher = dependencies.fetcher ?? fetch;
  const sleep = dependencies.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  let active = 0;
  let windowStart = 0;
  let used = 0;
  return async function POST(request: Request) {
    const requestId = crypto.randomUUID();
    let admitted = false;
    try {
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) throw new RequestError("この画面から操作してください。", 403);
      const config = getConfig();
      if (!config.apiKey || !config.model || !config.password) throw new RequestError("AI接続が未設定です。管理者にAPIキー・モデル・利用パスワードの設定を依頼してください。", 503);
      if (!await passwordMatches(request.headers.get("X-App-Password") ?? "", config.password)) throw new RequestError("利用パスワードを確認してください。", 401);
      if (active >= 2) throw new RequestError("他の処理が実行中です。少し待ってから再度お試しください。", 429);
      if (Date.now() - windowStart >= 3600000) { windowStart = Date.now(); used = 0; }
      if (used >= 20) throw new RequestError("一時的な利用上限に達しました。時間をおいてからお試しください。", 429);
      // Hold the concurrency slot while reading uploads as well as during AI processing.
      active++; admitted = true;
      const form = await boundedForm(request);
      if (form.get("consent") !== "yes") throw new RequestError("OpenAIへの送信とAPI利用料をご確認ください。");
      const affiliation = form.get("affiliation");
      if (!["正社員", "契約社員", "弊社協力会社"].includes(String(affiliation))) throw new RequestError("所属を選択してください。");
      const original = form.get("original") ?? "";
      if (typeof original !== "string" || original.length > 20000) throw new RequestError("元紹介文は20,000文字以内にしてください。");
      const bp = affiliation === "弊社協力会社";
      if (bp && !original.trim()) throw new RequestError("協力会社の元紹介文を入力してください。");
      const pdf = form.get("pdf");
      if (!(pdf instanceof File) || form.getAll("pdf").length !== 1 || !/\.pdf$/i.test(pdf.name) || pdf.size === 0 || pdf.size > MAX_PDF) throw new RequestError("1人分の10MB以下のPDFをアップロードしてください。");
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new RequestError("PDFとして読み取れません。ファイルを確認してください。");
      const payload = {
        model: config.model, store: false, max_output_tokens: 6500,
        instructions: extractionPrompt,
        input: [{ role: "user", content: [
          { type: "input_text", text: JSON.stringify({ affiliation, originalIntroduction: bp ? original : "" }) },
          { type: "input_file", filename: "skillsheet.pdf", file_data: `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}` },
        ] }],
        text: { format: { type: "json_schema", name: "engineer_profile", strict: true, schema: extractionJsonSchema } },
      };
      used++;
      let response: Response | undefined;
      // Only retry an explicit transient HTTP error, never an ambiguous timeout.
      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetcher("https://api.openai.com/v1/responses", {
          method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(60000),
        });
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          await response.body?.cancel(); await sleep(1000); continue;
        }
        break;
      }
      if (!response?.ok) {
        console.warn(JSON.stringify({ event: "generation_failed", requestId, upstreamStatus: response?.status }));
        const status = response?.status;
        if (status === 401 || status === 403) throw new RequestError("AIサービスの認証に失敗しました。管理者にAPIキーをご確認ください。", 502);
        if (status === 429) throw new RequestError("AIサービスの利用上限です。時間をおくか、管理者に残高をご確認ください。", 429);
        if (status === 400 || status === 404) throw new RequestError("PDFまたはAIモデルを読み込めません。暗号化されていないPDFと対応モデルをご確認ください。", 422);
        throw new RequestError("AIサービスに接続できません。少し待ってから再度お試しください。", 502);
      }
      const data = await response.json() as { status?: string; output?: { content?: unknown[] }[]; usage?: { input_tokens?: number; output_tokens?: number } };
      if (data.status !== "completed") throw new RequestError("紹介文の生成が完了しませんでした。PDFの内容・ページ数をご確認ください。", 502);
      const contents = (Array.isArray(data.output) ? data.output : []).flatMap((item: { content?: unknown[] }) => Array.isArray(item.content) ? item.content : []) as { type?: string; text?: string }[];
      if (contents.some(item => item.type === "refusal")) throw new RequestError("このPDFの読み取りに対応できませんでした。内容をご確認ください。", 422);
      const resultText = contents.filter(item => item.type === "output_text").map(item => item.text ?? "").join("");
      let parsed;
      try { parsed = normalizeExtraction(JSON.parse(resultText), bp); }
      catch (e) {
        if (e instanceof Error && e.message.startsWith("1人分")) throw new RequestError(e.message, 422);
        throw new RequestError("AIの回答形式を確認できませんでした。再度お試しください。", 502);
      }
      console.info(JSON.stringify({ event: "generation_completed", requestId, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens }));
      return json({ ...parsed, requestId });
    } catch (error) {
      if (error instanceof RequestError) return json({ error: error.message, requestId }, error.status);
      console.warn(JSON.stringify({ event: "generation_error", requestId, type: error instanceof Error ? error.name : "unknown" }));
      const timeout = error instanceof Error && /Timeout|Abort/.test(error.name);
      return json({ error: timeout ? "AIの読み取りがタイムアウトしました。ページ数を減らして再度お試しください。" : "通信または処理に失敗しました。再度お試しください。", requestId }, timeout ? 504 : 502);
    } finally { if (admitted) active--; }
  };
}
