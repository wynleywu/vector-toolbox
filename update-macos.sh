#!/bin/bash
# Vector Toolbox - macOS Auto-Updater Script

set -u

echo "========================================================"
echo "  Vector Toolbox - macOS 自动更新程序"
echo "========================================================"
echo ""

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
DOWNLOAD_URL="${VT_DOWNLOAD_URL:-https://github.com/wynleywu/vector-toolbox/releases/latest/download/Vector-Toolbox.zip}"
cd "$ROOT_DIR" || exit 1

if [ -d ".git" ]; then
    echo "检测到 Git 仓库，正在从 GitHub 拉取最新 master 分支..."
    if git pull origin master; then
        echo ""
        echo "Vector Toolbox 更新已完成。"
        exit 0
    fi
    echo "[!] Git 更新失败，将尝试 Release 安装包。"
fi

echo "正在下载最新 Release 安装包..."
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vector-toolbox-update.XXXXXX")" || exit 1
TEMP_ZIP="$TEMP_DIR/Vector-Toolbox.zip"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

if [ -f "$DOWNLOAD_URL" ]; then
    cp -f "$DOWNLOAD_URL" "$TEMP_ZIP" || exit 1
else
    if ! curl -fL -sS "$DOWNLOAD_URL" -o "$TEMP_ZIP"; then
        echo "[!] 下载更新包失败，请检查网络连接。"
        exit 1
    fi
fi

if ! unzip -q -o "$TEMP_ZIP" -d "$TEMP_DIR"; then
    echo "[!] 无法解压 Release 安装包。"
    exit 1
fi

PAYLOAD_DIR="$TEMP_DIR/VectorToolbox"
if [ ! -f "$PAYLOAD_DIR/Vector-Toolbox.jsx" ]; then
    echo "[!] Release 安装包结构无效。"
    exit 1
fi

if ! cp -R "$PAYLOAD_DIR/." "$ROOT_DIR/"; then
    echo "[!] 无法写入安装目录。"
    exit 1
fi

echo ""
echo "========================================================"
echo "  Vector Toolbox 更新已完成。"
echo "  请在 Illustrator 工具箱底部点击刷新以载入新版本。"
echo "========================================================"
