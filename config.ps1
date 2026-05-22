# config.ps1 - 設定ファイル（このファイルだけ編集してください）

$Config = @{
    # Claude APIキー（https://console.anthropic.com/ で取得）
    ApiKey = "sk-ant-ここにAPIキーを入力"

    # スキルシートExcelがあるフォルダ
    InputFolder = "X:\01.営業連携\営業連携2026\01_第一"

    # 生成したMarkdownの保存先（リポジトリ内フォルダ名）
    OutputFolder = "skill-sheets"

    # 除外フォルダ名（部分一致）
    ExcludeFolders = @("OLD", "old")

    # 使用するClaudeモデル（変更不要）
    Model = "claude-haiku-4-5-20251001"
}
