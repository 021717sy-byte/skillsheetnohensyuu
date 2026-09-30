"use client";
import { useEffect, useRef } from "react";

type Status = { affiliation: string; hasPdf: boolean; hasIntroduction: boolean; sellingYen: number | null; needsRegeneration: boolean };
type ModelContext = { registerTool: (tool: {
  name: string; description: string; inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => Status;
}, options: { signal: AbortSignal }) => void | Promise<void> };

/** Optional, read-only browser tool; never exposes PDF data, names or passwords. */
export function useIntroductionStatusTool(status: Status) {
  const current = useRef(status);
  useEffect(() => { current.current = status; }, [status]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(context.registerTool({
        name: "get_introduction_status",
        description: "紹介文画面の現在の所属、PDF選択有無、提案単価、再作成の必要性を読み取る。個人情報・PDF・原文・パスワードは返さず、生成も実行しない。",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute(input) {
          if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) throw new Error("空のオブジェクトを指定してください。");
          return { ...current.current };
        },
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch { /* Unsupported browsers keep the standard UI. */ }
    return () => lifecycle.abort();
  }, []);
}
