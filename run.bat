@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo スキルシート自動生成を開始します...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0generate_skillsheets.ps1"
echo.
echo 何かキーを押すと閉じます。
pause >nul
