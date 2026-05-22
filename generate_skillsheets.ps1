# generate_skillsheets.ps1 - Skill sheet auto-generation script

. "$PSScriptRoot\config.ps1"

$ScriptDir = $PSScriptRoot
$OutputDir = Join-Path $ScriptDir $Config.OutputFolder

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Find Excel files (exclude OLD folders)
Write-Host "Searching for Excel files..."
$excelFiles = Get-ChildItem -Path $Config.InputFolder -Recurse -Include "*.xlsx","*.xls" -ErrorAction SilentlyContinue |
    Where-Object {
        $path = $_.FullName
        $excluded = $false
        foreach ($excl in $Config.ExcludeFolders) {
            if ($path -match "\\$excl\\") { $excluded = $true; break }
        }
        -not $excluded
    }

Write-Host "Found $($excelFiles.Count) Excel files`n"

# Initialize Excel COM
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
        # Read Excel file
        $wb = $excel.Workbooks.Open($file.FullName, 0, $true)
        $excelText = "Filename: $($file.Name)`n`n"

        foreach ($ws in $wb.Sheets) {
            $excelText += "=== Sheet: $($ws.Name) ===`n"
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

        # Call Claude API
        $prompt = "The following data is from a Japanese engineer skill sheet Excel file. Please organize it into a well-formatted Markdown document in Japanese. Use only the information present in the data. Leave fields blank if data is missing.`n`nOutput format:`n# スキルシート：[氏名]`n`n## 基本情報`n| 項目 | 内容 |`n|------|------|`n| 氏名 | |`n| 職種 | |`n| 経験年数 | |`n| 希望業務 | |`n`n## スキル`n| 分類 | 技術・ツール | レベル |`n|------|------------|--------|`n`n## 経験プロジェクト`n### [プロジェクト名]`n- 期間：`n- 役割：`n- 使用技術：`n- 担当内容：`n`n## 資格・その他`n-`n`n---`n`nExcel data:`n`n" + $excelText

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

        # Save output
        $outputName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + ".md"
        $outputPath = Join-Path $OutputDir $outputName
        [System.IO.File]::WriteAllText($outputPath, $markdownContent, [System.Text.Encoding]::UTF8)

        Write-Host "  -> Done: $outputName" -ForegroundColor Green
        $successCount++

        Start-Sleep -Milliseconds 300

    } catch {
        Write-Host "  -> Error: $_" -ForegroundColor Red
        $errorCount++
        if ($null -ne $wb) { try { $wb.Close($false) } catch {} }
    }
}

# Quit Excel
try {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {}

Write-Host "`nDone: $successCount succeeded / $errorCount errors"

# Push to GitHub
Write-Host "`nPushing to GitHub..."
Set-Location $ScriptDir
git add "skill-sheets/"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "skill sheet update $timestamp"
git push origin claude/investigate-code-behavior-BWOrh

Write-Host "`nComplete! Pushed to GitHub." -ForegroundColor Green
