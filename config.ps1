# config.ps1 - Edit this file with your settings

$Config = @{
    # Claude API key (get from https://console.anthropic.com/)
    ApiKey = "sk-ant-ここにAPIキーを入力"

    # Folder containing Excel skill sheet files
    InputFolder = "X:\01.営業連携\営業連携2026\01_第一"

    # Output folder name (inside this repository)
    OutputFolder = "skill-sheets"

    # Folder names to exclude (partial match)
    ExcludeFolders = @("OLD", "old")

    # Claude model to use
    Model = "claude-haiku-4-5-20251001"
}
