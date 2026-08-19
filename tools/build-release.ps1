[CmdletBinding()]
param(
    [string]$OutputDirectory = "dist"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$versionFile = Join-Path $projectRoot "version.json"
$versionData = Get-Content -LiteralPath $versionFile -Raw -Encoding UTF8 |
    ConvertFrom-Json

if ($versionData.version -notmatch '^\d+\.\d+\.\d+$') {
    throw "version.json 中的版本号不是有效的语义版本: $($versionData.version)"
}

$requiredDirectories = @("config", "core", "docs", "scripts", "tools")
$requiredFiles = @(
    "Install-VectorToolbox.jsx",
    "LICENSE",
    "README.md",
    "README_CN.md",
    "Vector-Toolbox.jsx",
    "install-macos.sh",
    "install-windows.bat",
    "update-macos.sh",
    "update-windows.bat",
    "version.json"
)

foreach ($relativePath in $requiredDirectories + $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $relativePath))) {
        throw "发布内容缺少必需项: $relativePath"
    }
}

$outputPath = if ([IO.Path]::IsPathRooted($OutputDirectory)) {
    [IO.Path]::GetFullPath($OutputDirectory)
} else {
    [IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
}
[IO.Directory]::CreateDirectory($outputPath) | Out-Null

$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) (
    "VectorToolboxRelease-" + [guid]::NewGuid().ToString("N")
)
$payloadRoot = Join-Path $temporaryRoot "VectorToolbox"
$archivePath = Join-Path $outputPath "Vector-Toolbox.zip"
$checksumPath = "$archivePath.sha256"
$releaseManifestPath = Join-Path $outputPath "version.json"

try {
    [IO.Directory]::CreateDirectory($payloadRoot) | Out-Null

    foreach ($directory in $requiredDirectories) {
        Copy-Item -LiteralPath (Join-Path $projectRoot $directory) `
            -Destination $payloadRoot -Recurse -Force
    }
    foreach ($file in $requiredFiles) {
        Copy-Item -LiteralPath (Join-Path $projectRoot $file) `
            -Destination $payloadRoot -Force
    }

    if (Test-Path -LiteralPath $archivePath) {
        Remove-Item -LiteralPath $archivePath -Force
    }
    Compress-Archive -LiteralPath $payloadRoot -DestinationPath $archivePath `
        -CompressionLevel Optimal

    $archive = Get-Item -LiteralPath $archivePath
    if ($archive.Length -eq 0) {
        throw "生成的发布包为空"
    }

    $hash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText(
        $checksumPath,
        "$hash  $($archive.Name)`n",
        [Text.UTF8Encoding]::new($false)
    )
    Copy-Item -LiteralPath $versionFile -Destination $releaseManifestPath -Force

    $windowsInstaller = & (Join-Path $PSScriptRoot "build-windows-installer.ps1") `
        -PayloadArchive $archivePath `
        -Version $versionData.version `
        -OutputDirectory $outputPath

    [pscustomobject]@{
        Version = $versionData.version
        Archive = $archive.FullName
        Manifest = $releaseManifestPath
        Size = $archive.Length
        SHA256 = $hash
        WindowsInstaller = $windowsInstaller.Installer
        WindowsInstallerSize = $windowsInstaller.Size
        WindowsInstallerSHA256 = $windowsInstaller.SHA256
    }
} finally {
    if (Test-Path -LiteralPath $temporaryRoot) {
        Remove-Item -LiteralPath $temporaryRoot -Recurse -Force
    }
}
