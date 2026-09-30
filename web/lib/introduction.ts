export type Affiliation = "正社員" | "契約社員" | "弊社協力会社";
export const fieldLabels = {
  name: "氏名", gender: "性別", age: "年齢", station: "最寄駅", availability: "稼働時期",
  rate: "単価（BP以外）", languages: "言語", environments: "環境", tools: "ツール", databases: "DB",
  industries: "業種", processes: "工程", qualifications: "情報処理系資格", parallel: "並行状況", remarks: "備考",
};
export type Profile = Record<keyof typeof fieldLabels, string>;
export const emptyProfile: Profile = Object.fromEntries(Object.keys(fieldLabels).map(k => [k, ""])) as Profile;
export const processOrder = ["要件定義", "基本設計", "詳細設計", "実装製造", "単体試験", "結合試験", "総合試験", "運用保守", "顧客折衝", "要員管理", "予算管理"] as const;
const value = (s: string) => s.trim() || "要確認";
export function formatIntroduction(p: Profile, affiliation: Affiliation, sellingYen: number | null, bp: boolean) {
  const rate = bp ? (sellingYen ? `${sellingYen / 10000}万円　※応相談` : "要確認") : value(p.rate);
  return [
    "＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝",
    `【氏　名】${value(p.name)}／${value(p.gender)}／${value(p.age)}`,
    `【所　属】${affiliation}`, `【最　寄】${value(p.station)}`, `【時　期】${value(p.availability)}`,
    `【単　価】${rate}`, "【スキル】", `・言語　：${value(p.languages)}`, `・環境　：${value(p.environments)}`,
    `・ツール：${value(p.tools)}`, `・DB　　：${value(p.databases)}`, `・業種　：${value(p.industries)}`,
    `・工程　：${value(p.processes)}`, ...(p.qualifications.trim() ? [`【資　格】${p.qualifications.trim()}`] : []),
    `【並　行】${value(p.parallel)}`, "【備　考】", value(p.remarks),
    "＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝",
  ].join("\n");
}
