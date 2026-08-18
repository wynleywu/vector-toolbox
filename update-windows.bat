@echo off
chcp 65001 >nul
echo ========================================================
echo   Vector Toolbox - Windows 自动更新程序
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"

cd /d "%ROOT_DIR%"

if exist ".git" (
    echo 检测到 Git 仓库，正在从 GitHub 拉取最新 master 分支...
    git pull origin master
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [√ 成功] 已通过 Git 自动同步最新代码！
        goto :Done
    )
)

echo 正在从 GitHub 下载最新版本压缩包...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://github.com/wynleywu/vector-toolbox/archive/refs/heads/master.zip', '%TEMP%\vector-toolbox-latest.zip')"

if not exist "%TEMP%\vector-toolbox-latest.zip" (
    echo [× 失败] 下载更新包失败，请检查网络连接。
    pause
    exit /b 1
)

echo 正在解压并更新本地文件...
powershell -Command "Expand-Archive -Path '%TEMP%\vector-toolbox-latest.zip' -DestinationPath '%TEMP%\vt_extract' -Force"
xcopy "%TEMP%\vt_extract\vector-toolbox-master\*" "%ROOT_DIR%\" /E /Y /Q

rem Clean up temporary files
rd /s /q "%TEMP%\vt_extract" 2>nul
del /f /q "%TEMP%\vector-toolbox-latest.zip" 2>nul

:Done
echo.
echo ========================================================
echo   🎉 Vector Toolbox 更新已完成！
echo   请在 Illustrator 工具箱底部点击【↻ 刷新】即刻体验新特性。
echo ========================================================
echo.
pause
