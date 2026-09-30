"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Upload, Copy, Check, Download, LoaderCircle, Building2, PencilLine } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { formatIntroduction, emptyProfile, fieldLabels, type Profile, type Affiliation } from "@/lib/introduction";
import { resolvePrice, displayYen } from "@/lib/pricing";
import { useIntroductionStatusTool } from "@/lib/use-introduction-status-tool";

export default function Home() {
  const [affiliation, setAffiliation] = useState<Affiliation>("正社員");
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState("");
  const [base, setBase] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [stale, setStale] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const bp = affiliation === "弊社協力会社";
  const price = bp ? resolvePrice(original, base) : null;
  const text = formatIntroduction(profile ?? emptyProfile, affiliation, price?.sellingYen ?? null, bp);
  useIntroductionStatusTool({ affiliation, hasPdf: Boolean(file), hasIntroduction: Boolean(profile), sellingYen: price?.sellingYen ?? null, needsRegeneration: stale });

  useEffect(() => {
    fetch("/api/status", { cache: "no-store" }).then(r => {
      if (!r.ok) throw new Error();
      return r.json() as Promise<{ ready: boolean; requiresPassword: boolean }>;
    }).then(d => { setReady(d.ready); setRequiresPassword(d.requiresPassword); })
      .catch(() => setError("接続状況を確認できません。ページを再読み込みしてください。"))
      .finally(() => setChecking(false));
  }, []);

  function selectFile(next: File | null) {
    if (busy) return;
    setError(""); setNotice("");
    setFile(null); setProfile(null); setWarnings([]); setEditing(false); setStale(false);
    if (next && (!/\.pdf$/i.test(next.name) || next.size > 10 * 1024 * 1024 || next.size === 0)) {
      setError("空でない10MB以下のPDFを選択してください。");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(next); setProfile(null); setWarnings([]); setEditing(false); setStale(false);
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy || !consent || !ready) return;
    setBusy(true); setError(""); setNotice("");
    const form = new FormData();
    form.set("pdf", file); form.set("affiliation", affiliation);
    form.set("original", bp ? original : ""); form.set("consent", "yes");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150000);
    try {
      const response = await fetch("/api/generate", {
        method: "POST", body: form, signal: controller.signal,
        headers: password ? { "X-App-Password": password } : {},
      });
      const data = await response.json() as { error?: string; profile: Profile; warnings: string[] };
      if (!response.ok) throw new Error(data.error || "紹介文を作成できませんでした。");
      setProfile(data.profile); setWarnings(data.warnings); setStale(false); setEditing(false);
      setNotice("紹介文を作成しました。内容を確認してからコピーしてください。");
    } catch (e) {
      setError(e instanceof Error && e.name === "AbortError" ? "処理が時間内に完了しませんでした。PDFのページ数を減らして再度お試しください。" : e instanceof Error ? e.message : "通信に失敗しました。");
    } finally { clearTimeout(timeout); setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(text); setNotice("提案用の紹介文をコピーしました。BPの元紹介文は含まれません。"); }
    catch { setError("コピーできませんでした。紹介文を選択して手動でコピーしてください。"); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "要員紹介文.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-icon"><FileText size={21}/></span><span>紹介文スタジオ<small>SKILL SHEET WORKSPACE</small></span></div><span className="header-note">SES 営業サポート</span></header>
    <main>
      <div className="page-heading"><div><p className="eyebrow">スキルシートから、提案へ</p><h1>要員紹介文を作成</h1><p>PDFを読み取り、いつものフォーマットに整えます。</p></div><span className="step-label">01 入力 <span>／</span> 02 確認・コピー</span></div>
      {!checking && !ready && <div className="setup-notice"><Building2 size={20}/><div><strong>AI接続の設定待ちです</strong><p>所属の選択・BP金額の計算・出力形式を確認できます。PDFからの自動入力には、管理者によるAI接続設定が必要です。</p></div></div>}
      <div className="workspace">
        <form className="input-panel" onSubmit={generate}>
          <div className="section-title"><span className="number">01</span><h2>入力情報</h2></div>
          <fieldset disabled={busy} className="form-fields">
            <legend className="sr-only">紹介文の入力情報</legend>
            <label className="field-label" id="affiliation-label">所属 <span className="required">必須</span></label>
            <RadioGroup aria-labelledby="affiliation-label" value={affiliation} onValueChange={v => { setAffiliation(v as Affiliation); setStale(!!profile); }} className="affiliations" disabled={busy}>
              {(["正社員", "契約社員", "弊社協力会社"] as Affiliation[]).map(v => <label className={affiliation === v ? "affiliation selected" : "affiliation"} key={v}><RadioGroupItem value={v}/><span>{v === "弊社協力会社" ? "BP（協力会社）" : v}</span></label>)}
            </RadioGroup>
            <div className="field-label upload-label">スキルシート <span className="required">必須</span></div>
            <label className={file ? "dropzone has-file" : "dropzone"} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length !== 1) setError("PDFは1人分ずつ選択してください。"); else selectFile(e.dataTransfer.files[0]); }}>
              <input ref={fileInput} type="file" accept=".pdf,application/pdf" aria-label="スキルシートPDFを選択" onChange={e => selectFile(e.target.files?.[0] ?? null)}/>
              <span className="upload-icon">{file ? <FileText size={27}/> : <Upload size={27}/>}</span>
              <strong>{file?.name ?? "PDFをここにドロップ"}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB ・クリックで変更` : "またはクリックしてファイルを選択"}</span><small>PDF ／ 1人分 ／ 最大10MB</small>
            </label>
            {bp && <div className="bp-block">
              <label className="field-label" htmlFor="original">協力会社からの元紹介文 <span className="required">必須</span></label>
              <textarea id="original" value={original} onChange={e => { setOriginal(e.target.value); setBase(""); setStale(!!profile); }} maxLength={20000} required rows={6} placeholder={"協力会社の紹介文をそのまま貼り付け\n例：【単価】65万円 ※応相談"}/>
              <p className="help">元紹介文はこの画面で参照できます。提案用のコピーには含めません。</p>
              <div className="price-summary"><div><span>元の月額単価</span><strong>{price?.baseYen ? displayYen(price.baseYen) : "要確認"}</strong></div><span className="markup">＋10万円</span><div><span>提案する月額単価</span><strong className="selling">{price?.sellingYen ? displayYen(price.sellingYen) : "要確認"}</strong></div></div>
              {price?.message && <p className="help price-message">{price.message}</p>}
              <label htmlFor="base-price" className="field-label small-label">元の月額単価を指定・修正（万円）</label>
              <input id="base-price" inputMode="decimal" type="number" min="0.01" max="1000" step="0.01" value={base} onChange={e => setBase(e.target.value)} placeholder="自動判定が合わない場合に入力"/>
              <p className="help">税の扱い・精算条件は元紹介文に合わせて確認してください。</p>
            </div>}
            {requiresPassword && <><label className="field-label" htmlFor="access-password">利用パスワード</label><input type="password" id="access-password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required/></>}
            <label className="consent"><Checkbox checked={consent} onCheckedChange={v => setConsent(v === true)} disabled={busy}/><span>PDF{bp ? "と元紹介文" : ""}をOpenAIへ送信して作成することを確認しました。生成ごとにAPI利用料がかかります。</span></label>
          </fieldset>
          <button className="primary-button" type="submit" disabled={busy || !ready || !file || !consent || (bp && !original.trim())}>{busy ? <><LoaderCircle className="spin" size={19}/>PDFを読み取り中…</> : <><FileText size={19}/>紹介文を作成</>}</button>
          <p className="privacy-note">アプリにはPDF・紹介文の履歴を保存しません。</p>
        </form>
        <section className="output-panel" aria-labelledby="output-heading">
          <div className="output-top"><div className="section-title"><span className="number">02</span><h2 id="output-heading">紹介文</h2></div><span className="output-status">{profile ? "確認・編集できます" : "フォーマット見本"}</span></div>
          <div className="output-toolbar"><span>提案用テキスト</span><div><button type="button" disabled={!profile || busy} onClick={() => setEditing(!editing)}><PencilLine size={16}/>{editing ? "編集を閉じる" : "項目を編集"}</button><button type="button" onClick={download} disabled={!profile || busy || stale} aria-label="紹介文をダウンロード"><Download size={17}/></button></div></div>
          {stale && <p className="inline-warning">入力情報が変わりました。再作成して内容を確認してください。</p>}
          {editing && profile && <div className="editor">{Object.entries(fieldLabels).filter(([key]) => !bp || key !== "rate").map(([key, label]) => <label key={key}>{label}<textarea rows={key === "remarks" ? 4 : 2} value={profile[key as keyof Profile]} onChange={e => setProfile({ ...profile, [key]: e.target.value })}/></label>)}<p className="help">工程を直す場合はPDFのチェック位置を確認してください。</p></div>}
          <pre className={profile ? "paper" : "paper template"}>{text}</pre>
          {warnings.length > 0 && <div className="warnings"><strong>確認が必要な項目</strong><ul>{warnings.map((w,i) => <li key={i}>{w}</li>)}</ul></div>}
          {!profile && <p className="empty-note">PDFをアップロードすると、各項目が自動で入力されます。</p>}
          <div className="output-footer"><span><Check size={16}/>原文を確認してからご利用ください</span><button className="copy-button" type="button" onClick={copy} disabled={!profile || busy || stale}><Copy size={17}/>紹介文をコピー</button></div>
        </section>
      </div>
      <div className="feedback" aria-live="polite">{error && <p role="alert" className="error">{error}</p>}{notice && <p className="success">{notice}</p>}</div>
      <footer className="page-footer"><span>紹介文スタジオ</span><span>工程のチェック・不明項目を確認して、正確な提案へ。</span></footer>
    </main>
  </div>;
}
