[CmdletBinding()]
param(
    [string]$Repository = "wynleywu/vector-toolbox"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$versionData = Get-Content -LiteralPath (Join-Path $projectRoot "version.json") `
    -Raw -Encoding UTF8 | ConvertFrom-Json
$tag = "v$($versionData.version)"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "未找到 GitHub CLI。请先安装并登录 gh。"
}

$status = git -C $projectRoot status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw "无法读取 Git 状态"
}
if ($status) {
    throw "工作区不干净。请先提交当前版本，再发布。"
}

$head = git -C $projectRoot rev-parse HEAD
$tagCommit = git -C $projectRoot rev-list -n 1 $tag 2>$null
if ($LASTEXITCODE -ne 0 -or -not $tagCommit) {
    throw "缺少本地标签 $tag。请在已验证提交上创建并推送该标签。"
}
if ($head -ne $tagCommit) {
    throw "标签 $tag 未指向当前提交。"
}

git -C $projectRoot ls-remote --exit-code --tags origin "refs/tags/$tag" *> $null
if ($LASTEXITCODE -ne 0) {
    throw "远端缺少标签 $tag。请先推送标签。"
}

gh release view $tag --repo $Repository *> $null
if ($LASTEXITCODE -eq 0) {
    throw "Release $tag 已存在。为避免覆盖资产，脚本已停止。"
}

$package = & (Join-Path $PSScriptRoot "build-release.ps1")
$checksum = "$($package.Archive).sha256"

gh release create $tag $package.Archive $checksum $package.Manifest `
    --repo $Repository `
    --verify-tag `
    --title "Vector Toolbox $tag" `
    --generate-notes
if ($LASTEXITCODE -ne 0) {
    throw "GitHub Release 创建失败"
}

Write-Output "已发布 $tag，并附带安装包、版本清单与 SHA-256 校验文件。"
