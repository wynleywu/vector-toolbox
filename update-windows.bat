@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul

set "NO_PAUSE=0"
for %%A in (%*) do if /i "%%~A"=="--no-pause" set "NO_PAUSE=1"

echo ========================================================
echo   Vector Toolbox - Windows 自动更新程序
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
if defined VT_DOWNLOAD_URL (
    set "DOWNLOAD_URL=%VT_DOWNLOAD_URL%"
) else (
    set "DOWNLOAD_URL=https://github.com/wynleywu/vector-toolbox/releases/latest/download/Vector-Toolbox.zip"
)

cd /d "%ROOT_DIR%"

if exist ".git" (
    echo 检测到 Git 仓库，正在从 GitHub 拉取最新 master 分支...
    git pull origin master
    if not errorlevel 1 goto :Done
    echo [!] Git 更新失败，将尝试 Release 安装包。
)

echo 正在下载最新 Release 安装包...
powershell -NoProfile -Command "$ErrorActionPreference = 'Stop'; $root = $env:ROOT_DIR; $temp = Join-Path ([IO.Path]::GetTempPath()) ('VectorToolboxUpdate-' + [guid]::NewGuid().ToString('N')); try { [IO.Directory]::CreateDirectory($temp) | Out-Null; $archive = Join-Path $temp 'Vector-Toolbox.zip'; if (Test-Path -LiteralPath $env:DOWNLOAD_URL) { Copy-Item -LiteralPath $env:DOWNLOAD_URL -Destination $archive } else { Invoke-WebRequest -UseBasicParsing -Uri $env:DOWNLOAD_URL -OutFile $archive }; Expand-Archive -LiteralPath $archive -DestinationPath $temp -Force; $payload = Join-Path $temp 'VectorToolbox'; if (-not (Test-Path -LiteralPath (Join-Path $payload 'Vector-Toolbox.jsx'))) { throw 'Release 安装包结构无效' }; Get-ChildItem -LiteralPath $payload -Force | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $root -Recurse -Force } } finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force } }"
if errorlevel 1 (
    echo [!] 更新失败，请检查网络连接或重新下载安装包。
    call :MaybePause
    exit /b 1
)

:Done
echo.
echo ========================================================
echo   Vector Toolbox 更新已完成。
echo   请在 Illustrator 工具箱底部点击刷新以载入新版本。
echo ========================================================
echo.
call :MaybePause
exit /b 0

:MaybePause
if "%NO_PAUSE%"=="0" pause
exit /b 0
