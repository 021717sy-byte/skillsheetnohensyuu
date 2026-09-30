import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紹介文スタジオ | スキルシートから要員紹介文を作成",
  description: "PDFのスキルシートを読み取り、要員紹介文を作成。正社員・契約社員・BPに対応。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
