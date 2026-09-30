import test from "node:test";
import assert from "node:assert/strict";
import { resolvePrice } from "../lib/pricing.ts";
import { formatIntroduction, emptyProfile } from "../lib/introduction.ts";
import { normalizeExtraction } from "../lib/extraction.ts";

test("BPの明確な月額を円・万円・全角・小数から計算する", () => {
  for (const [input, selling] of [["【単価】65万円 ※応相談", 750000], ["単価：650,000円", 750000], ["単 価：６５．５万円", 755000], ["単価：65万", 750000]] as const) assert.equal(resolvePrice(input).sellingYen, selling);
});
test("幅・複数候補・時間単価・負数・欠損を勝手に確定しない", () => {
  for (const input of ["単価：60〜70万円", "単価：60-70万円", "単価：65万円以上", "単価：65万円前後", "単価：4,000円/h", "日単価：40,000円", "単価：4万円/人日", "単価：65万円\n金額：70万円", "単価：税抜65万円／税込71.5万円", "単価：-65万円", "単価：6,5万円", "単価：0円", "単価：応相談", "交通費：1万円"]) assert.equal(resolvePrice(input).sellingYen, null, input);
});
test("手動指定は元単価、上乗せは一度だけ", () => {
  assert.equal(resolvePrice("単価60〜70万円", "65").sellingYen, 750000);
  assert.equal(resolvePrice("単価65万円", "65.01").sellingYen, 750100);
  for (const value of ["-1", "0", "1e2", "65.001", "1001"]) assert.equal(resolvePrice("", value).sellingYen, null);
});
test("BPコピー文に原価・元紹介文を混入させず元フォーマットを保つ", () => {
  const text = formatIntroduction({ ...emptyProfile, name: "検証用", rate: "65万円" }, "弊社協力会社", 750000, true);
  assert.match(text, /【所　属】弊社協力会社/);
  assert.match(text, /【単　価】75万円/);
  assert.doesNotMatch(text, /65万円|【資　格】/);
  assert.match(text, /・工程　：要確認/);
});
test("正社員と契約社員の単価には加算しない", () => {
  for (const affiliation of ["正社員", "契約社員"] as const) assert.match(formatIntroduction({ ...emptyProfile, rate: "65万円（税込）" }, affiliation, null, false), /【単　価】65万円（税込）/);
});
test("本文で推測された工程を捨て、チェックがあるものだけを固定順で出す", () => {
  const result = normalizeExtraction({ candidateCount: 1, profile: { ...emptyProfile, processes: "要件定義、予算管理" }, markedProcesses: [
    { name: "運用保守", mark: "○", page: 1, evidence: "業務Aの運用保守列" },
    { name: "実装製造", mark: "✔", page: 2, evidence: "業務Bの実装製造列" },
    { name: "運用保守", mark: "〇", page: 2, evidence: "業務Bの運用保守列" },
  ], warnings: [] }, false);
  assert.equal(result.profile.processes, "実装製造、運用保守");
  assert.equal(result.profile.parallel, "");
});
test("チェックなし・資格なしは推測補完しない", () => {
  const result = normalizeExtraction({ candidateCount: 1, profile: { ...emptyProfile, processes: "設計" }, markedProcesses: [], warnings: [] }, false);
  assert.equal(result.profile.processes, "");
  assert.ok(result.warnings.some(w => w.includes("工程のチェック")));
});
test("複数人は混ぜない", () => {
  assert.throws(() => normalizeExtraction({ candidateCount: 2, profile: emptyProfile, markedProcesses: [], warnings: [] }, true), /1人分/);
});
