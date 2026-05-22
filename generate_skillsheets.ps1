# generate_skillsheets.ps1 - スキルシート自動生成スクリプト

. "$PSScriptRoot\config.ps1"

$ScriptDir  = $PSScriptRoot
$OutputDir  = Join-Path $ScriptDir $Config.OutputFolder

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Excelファイル検索（OLDフォルダ除外）
Write-Host "Excelファイルを検索中..."
$excelFiles = Get-ChildItem -Path $Config.InputFolder -Recurse -Include "*.xlsx","*.xls" -ErrorAction SilentlyContinue |
    Where-Object {
        $path = $_.FullName
        $excluded = $false
        foreach ($excl in $Config.ExcludeFolders) {
            if ($path -match "\\$excl\\") { $excluded = $true; break }
        }
        -not $excluded
    }

Write-Host "$($excelFiles.Count)件のExcelファイルを処理します`n"

# Excel COM初期化
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$successCount = 0
$errorCount   = 0
$index        = 0

foreach ($file in $excelFiles) {
    $index++
    Write-Host "[$index/$($excelFiles.Count)] $($file.Name)"

    $wb = $null
    try {
        # Excel読み取り
        $wb = $excel.Workbooks.Open($file.FullName, 0, $true)
        $excelText = "ファイル名: $($file.Name)`n`n"

        foreach ($ws in $wb.Sheets) {
            $excelText += "=== シート: $($ws.Name) ===`n"
            $usedRange = $ws.UsedRange
            if ($null -eq $usedRange) { continue }

            $maxRow = [Math]::Min($usedRange.Rows.Count, 150)
            $maxCol = [Math]::Min($usedRange.Columns.Count, 20)

            for ($r = 1; $r -le $maxRow; $r++) {
                $cells = @()
                for ($c = 1; $c -le $maxCol; $c++) {
                    $val = $ws.Cells.Item($r, $c).Text
                    if ($val -ne "") { $cells += $val }
                }
                if ($cells.Count -gt 0) {
                    $excelText += ($cells -join " | ") + "`n"
                }
            }
            $excelText += "`n"
        }

        $wb.Close($false)
        $wb = $null

        # Claude API呼び出し
        $prompt = @"
以下のExcelデータから、エンジニアのスキルシートをMarkdown形式で整理してください。
データにある情報のみ使用し、不明な項目は空欄にしてください。

$excelText

出力フォーマット：

# スキルシート：[氏名]

## 基本情報
| 項目 | 内容 |
|------|------|
| 氏名 | |
| 職種 | |
| 経験年数 | |
| 希望業務 | |

## スキル
| 分類 | 技術・ツール | レベル |
|------|------------|--------|

## 経験プロジェクト
### [プロジェクト名]
- 期間：
- 役割：
- 使用技術：
- 担当内容：

## 資格・その他
-
"@

        $requestBody = @{
            model      = $Config.Model
            max_tokens = 4096
            messages   = @(@{ role = "user"; content = $prompt })
        } | ConvertTo-Json -Depth 10 -Compress

        $response = Invoke-RestMethod `
            -Uri "https://api.anthropic.com/v1/messages" `
            -Method POST `
            -Headers @{
                "x-api-key"         = $Config.ApiKey
                "anthropic-version" = "2023-06-01"
                "content-type"      = "application/json"
            } `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($requestBody)) `
            -TimeoutSec 60

        $markdownContent = $response.content[0].text

        # 保存
        $outputName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".md"
        $outputPath = Join-Path $OutputDir $outputName
        [System.IO.File]::WriteAllText($outputPath, $markdownContent, [System.Text.Encoding]::UTF8)

        Write-Host "  → 完了: $outputName" -ForegroundColor Green
        $successCount++

        Start-Sleep -Milliseconds 300

    } catch {
        Write-Host "  → エラー: $_" -ForegroundColor Red
        $errorCount++
        if ($null -ne $wb) { try { $wb.Close($false) } catch {} }
    }
}

# Excel終了
try {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {}

Write-Host "`n処理完了: 成功 $successCount 件 / エラー $errorCount 件"

# GitHubへプッシュ
Write-Host "`nGitHubへプッシュ中..."
Set-Location $ScriptDir
git add "skill-sheets/"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "スキルシート自動更新 $timestamp"
git push origin main

Write-Host "`n完了！GitHubへプッシュしました。" -ForegroundColor Green
