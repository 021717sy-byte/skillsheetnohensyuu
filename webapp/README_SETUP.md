# エンジニア管理システム セットアップガイド

## 1. Google Cloud プロジェクトとサービスアカウントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセスし、プロジェクトを作成（または既存のものを選択）
2. 左メニューから **「APIとサービス」 > 「ライブラリ」** を開く
3. **「Google Sheets API」** を検索して有効化する
4. 左メニューから **「APIとサービス」 > 「認証情報」** を開く
5. **「認証情報を作成」 > 「サービスアカウント」** をクリック
6. サービスアカウント名を入力（例: `engineer-sheet-access`）して作成
7. 作成されたサービスアカウントをクリックし、**「キー」タブ > 「鍵を追加」 > 「新しい鍵を作成」**
8. 形式は **JSON** を選択して「作成」 — JSONファイルがダウンロードされる

## 2. JSONキーから認証情報を取得

ダウンロードした JSON ファイルを開き、以下の値を取り出す:

```json
{
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",  // GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"  // GOOGLE_PRIVATE_KEY
}
```

## 3. スプレッドシートをサービスアカウントと共有する

1. Google スプレッドシートを開く（または新規作成）
2. 右上の **「共有」** ボタンをクリック
3. サービスアカウントのメールアドレス（`client_email` の値）を入力
4. 権限を **「編集者」** に設定して「送信」
5. スプレッドシートのURLから **スプレッドシートID** を取得する

   例: `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`**`/edit`

   太字部分が `GOOGLE_SPREADSHEET_ID` になる

## 4. ヘッダー行の設定（初回のみ）

スプレッドシートの1行目に以下のヘッダーを手動で入力するか、
アプリ起動後に最初のデータ追加時に自動で設定される:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 氏名 | カナ | 生年月日 | 雇用形態 | パートナー名 | 顧客 | 案件名 | 業務内容 | スキル | 終了見込み | 営業担当 | 参画日 | 契約単位 | 有期(雇用期間) | 案件契約期間 | 契約金額 | 給料 | 原価 | 部署 | 場所 | 担当者名 | 貸出 |

## 5. .env.local の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて以下の値を設定:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...(省略)...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SHEET_NAME=Sheet1
```

> **注意**: `GOOGLE_PRIVATE_KEY` の改行は `\n` のまま（実際の改行にしない）。
> 値全体をダブルクォートで囲む。

## 6. アプリの起動

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## 7. 算出フィールドについて

以下のフィールドはスプレッドシートに保存されず、表示時に自動計算されます:

| フィールド | 計算式 |
|-----------|--------|
| 年齢 | 生年月日から現在の年齢を算出 |
| 年代 | 年齢を10年単位で丸める（例: 30代） |
| 粗利-16 | 契約金額 × (1 - 0.16) - 原価 |
| 粗利-10 | 契約金額 × (1 - 0.10) - 原価 |
| 粗利+30 | 契約金額 × (1 + 0.30) - 原価 |

## 8. 主な機能

- **インライン編集**: セルをクリックして直接編集。Enter で保存、Escape でキャンセル
- **エンジニア追加**: 右上の「エンジニアを追加」ボタンからモーダルで入力
- **削除**: 各行の「削除」ボタン（確認ダイアログあり）
- **検索**: キーワードで全フィールドを横断検索
- **フィルター**: 雇用形態・部署・営業担当でフィルタリング
- **ソート**: 列ヘッダーをクリックして昇順/降順ソート
- **列の表示/非表示**: 右上のトグルボタンで各列を制御
- **粗利の色分け**: 正値は緑、負値は赤で表示
