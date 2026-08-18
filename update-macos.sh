#!/bin/bash
# Vector Toolbox - macOS Auto-Updater Script
# Pulls latest master or downloads zip from GitHub

echo "========================================================"
echo "  Vector Toolbox - macOS 自动更新程序"
echo "========================================================"
echo ""

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -d ".git" ]; then
    echo "检测到 Git 仓库，正在从 GitHub 拉取最新 master 分支..."
    git pull origin master
    if [ $? -eq 0 ]; then
        echo ""
        echo "[✓ 成功] 已通过 Git 自动同步最新代码！"
        exit 0
    fi
fi

echo "正在从 GitHub 下载最新版本..."
TMP_ZIP="/tmp/vector-toolbox-latest.zip"
TMP_DIR="/tmp/vt_extract"

curl -L -s "https://github.com/wynleywu/vector-toolbox/archive/refs/heads/master.zip" -o "$TMP_ZIP"

if [ ! -f "$TMP_ZIP" ]; then
    echo "[× 失败] 下载更新包失败，请检查网络连接。"
    exit 1
fi

echo "正在解压并更新本地文件..."
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"
unzip -q -o "$TMP_ZIP" -d "$TMP_DIR"
cp -R "$TMP_DIR/vector-toolbox-master/"* "$DIR/"

rm -rf "$TMP_DIR" "$TMP_ZIP"

echo ""
echo "========================================================"
echo "  🎉 Vector Toolbox 更新已完成！"
echo "  请在 Illustrator 工具箱底部点击【↻ 刷新】即刻体验新特性。"
echo "========================================================"
echo ""
