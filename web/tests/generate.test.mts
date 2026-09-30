import test from "node:test";
import assert from "node:assert/strict";
import { createGenerateHandler } from "../lib/generate-handler.ts";
import { emptyProfile } from "../lib/introduction.ts";

// Synthetic fixtures only. No PDF or personal information from plugin.zip is committed.
const config = { apiKey: "test-only-not-a-real-key", model: "test-model", password: "test-only-password" };
function request(options: { affiliation?: string; original?: string; password?: string; pdf?: string; origin?: string; consent?: string } = {}) {
  const form = new FormData();
  form.set("pdf", new File([options.pdf ?? "%PDF-1.7 synthetic fixture"], "test.pdf", { type: "application/pdf" }));
  form.set("affiliation", options.affiliation ?? "正社員");
  form.set("original", options.original ?? "");
  form.set("consent", options.consent ?? "yes");
  return new Request("http://localhost/api/generate", { method: "POST", body: form, headers: { "X-App-Password": options.password ?? config.password, Origin: options.origin ?? "http://localhost" } });
}
function successfulResponse() {
  return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ candidateCount: 1, profile: { ...emptyProfile, name: "検証用", rate: "65万円" }, markedProcesses: [], warnings: [] }) }] }], usage: { input_tokens: 1, output_tokens: 1 } });
}
test("未設定ではAPIを呼ばない", async () => {
  const handler = createGenerateHandler(() => ({ ...config, apiKey: "" }), { fetcher: async () => { throw new Error("must not call"); } });
  assert.equal((await handler(request())).status, 503);
});
test("パスワード・同意・PDF実体・所属・BP原文をサーバーでも検証", async () => {
  let calls = 0;
  const handler = createGenerateHandler(() => config, { fetcher: async () => { calls++; return successfulResponse(); } });
  for (const [options, status] of [[{ password: "wrong" }, 401], [{ origin: "https://other.test" }, 403], [{ consent: "no" }, 400], [{ pdf: "not a pdf" }, 400], [{ affiliation: "unknown" }, 400], [{ affiliation: "弊社協力会社" }, 400]] as const) assert.equal((await handler(request(options))).status, status);
  assert.equal(calls, 0);
});
test("PDFの画像情報を渡す形式・固定スキーマ・store:falseでAPIを呼ぶ", async () => {
  const handler = createGenerateHandler(() => config, { fetcher: async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.equal(body.text.format.strict, true);
    assert.match(body.input[0].content[1].file_data, /^data:application\/pdf;base64,/);
    assert.equal(body.input[0].content[1].filename, "skillsheet.pdf");
    return successfulResponse();
  } });
  const response = await handler(request({ affiliation: "弊社協力会社", original: "単価65万円" }));
  assert.equal(response.status, 200);
  const body = await response.json() as { profile: { rate: string; processes: string } };
  assert.equal(body.profile.rate, "");
  assert.equal(body.profile.processes, "");
});
test("明示された一時エラーだけ1回再試行する", async () => {
  let calls = 0;
  const handler = createGenerateHandler(() => config, { fetcher: async () => ++calls === 1 ? new Response("", { status: 503 }) : successfulResponse(), sleep: async () => {} });
  assert.equal((await handler(request())).status, 200);
  assert.equal(calls, 2);
});
test("タイムアウト・不完全な回答・不正JSONは成功扱いにしない", async () => {
  for (const mode of ["timeout", "incomplete", "invalid", "refusal"]) {
    let calls = 0;
    const handler = createGenerateHandler(() => config, { fetcher: async () => {
      calls++;
      if (mode === "timeout") throw new DOMException("timeout", "TimeoutError");
      if (mode === "incomplete") return Response.json({ status: "incomplete", output: [] });
      return Response.json({ status: "completed", output: [{ content: [{ type: mode === "refusal" ? "refusal" : "output_text", text: "invalid-json" }] }] });
    } });
    const response = await handler(request());
    assert.equal(response.status, mode === "timeout" ? 504 : mode === "refusal" ? 422 : 502);
    assert.equal(calls, 1);
  }
});
test("不正なmultipart・11MB超の要求を拒否する", async () => {
  const handler = createGenerateHandler(() => config);
  const req = new Request("http://localhost/api/generate", { method: "POST", body: "invalid", headers: { "X-App-Password": config.password, "Content-Type": "multipart/form-data; boundary=x", "Content-Length": String(12 * 1024 * 1024) } });
  assert.equal((await handler(req)).status, 413);
});
