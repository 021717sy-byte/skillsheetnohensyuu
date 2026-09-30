export const BP_MARKUP_YEN = 100000;
export type PriceResult = { baseYen: number | null; sellingYen: number | null; message: string; source: "manual" | "original" | "unknown" };
const unknown = (message: string): PriceResult => ({ baseYen: null, sellingYen: null, message, source: "unknown" });
export function displayYen(yen: number) { return `${yen / 10000}万円`; }
export function resolvePrice(original: string, manual = ""): PriceResult {
  if (manual.trim()) {
    if (!/^\d+(?:\.\d{1,2})?$/.test(manual.trim())) return unknown("元単価は小数点以下2桁までの万円で入力してください。");
    const yen = Math.round(Number(manual) * 10000);
    if (yen <= 0 || yen > 10000000) return unknown("元単価は0より大きく、1,000万円以下で入力してください。");
    return { baseYen: yen, sellingYen: yen + BP_MARKUP_YEN, message: "入力した元単価を優先しています。", source: "manual" };
  }
  const normalized = original.normalize("NFKC");
  const lines = normalized.split(/\r?\n/).filter(line => /単\s*価|金\s*額|月\s*額|希望\s*額/.test(line));
  if (!lines.length) return unknown("「単価：65万円」のように金額のある行を貼り付けるか、元の月額単価を入力してください。");
  const candidates: number[] = [];
  for (const line of lines) {
    // Ambiguous ranges, units and multiple amounts require an explicit choice.
    if (/時給|日給|時\s*間\s*単価|日\s*単価|\/(?:h|時|日|人日)|[〜～~]|[-–−ー]\s*\d|以上|以下|から|まで|程度|前後|上限|下限|税抜.*税込|税込.*税抜/i.test(line)) return unknown("金額に幅・条件があります。元の月額単価を確認して入力してください。");
    const amounts = [...line.matchAll(/([0-9][0-9,]*(?:\.[0-9]+)?)\s*(万円|万|円)/g)];
    if (amounts.length !== 1) return unknown("元単価を一つに特定できません。元の月額単価を入力してください。");
    const amount = amounts[0];
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amount[1])) return unknown("金額の区切りを確認して入力してください。");
    const yen = Number(amount[1].replaceAll(",", "")) * (amount[2] === "円" ? 1 : 10000);
    if (!Number.isSafeInteger(yen) || yen <= 0 || yen > 10000000) return unknown("金額の表記を確認し、元の月額単価を入力してください。");
    candidates.push(yen);
  }
  const unique = [...new Set(candidates)];
  if (unique.length !== 1) return unknown("複数の金額が見つかりました。採用する元の月額単価を入力してください。");
  return { baseYen: unique[0], sellingYen: unique[0] + BP_MARKUP_YEN, message: "元紹介文から自動計算しています。", source: "original" };
}
