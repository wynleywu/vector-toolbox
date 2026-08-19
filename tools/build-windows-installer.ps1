[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$PayloadArchive,

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [string]$OutputDirectory = "dist"
)

$ErrorActionPreference = "Stop"
$archivePath = [IO.Path]::GetFullPath($PayloadArchive)
if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
    throw "Windows 安装器缺少发布载荷: $archivePath"
}
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    throw "Windows 安装器版本号无效: $Version"
}

$outputPath = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($outputPath) | Out-Null

$compilerCandidates = @(
    "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)
$compilerPath = $compilerCandidates |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
    Select-Object -First 1
if (-not $compilerPath) {
    throw "当前 Windows 系统缺少 .NET Framework 4.x C# 编译器"
}

$temporaryBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$temporaryRoot = Join-Path $temporaryBase (
    "VectorToolboxInstaller-" + [guid]::NewGuid().ToString("N")
)
$resolvedTemporaryRoot = [IO.Path]::GetFullPath($temporaryRoot)
if (-not $resolvedTemporaryRoot.StartsWith(
    $temporaryBase,
    [StringComparison]::OrdinalIgnoreCase
)) {
    throw "临时构建目录超出系统临时目录: $resolvedTemporaryRoot"
}

$installerPath = Join-Path $outputPath "Vector-Toolbox-Setup.exe"
$checksumPath = "$installerPath.sha256"
$stagedArchivePath = Join-Path $temporaryRoot "Vector-Toolbox.zip"
$sourcePath = Join-Path $temporaryRoot "VectorToolboxInstaller.cs"
$manifestPath = Join-Path $temporaryRoot "VectorToolboxInstaller.manifest"
$payloadResourceName = "VectorToolbox.Payload.zip"

$source = @'
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Vector Toolbox Setup")]
[assembly: AssemblyDescription("One-click installer for Vector Toolbox")]
[assembly: AssemblyProduct("Vector Toolbox")]
[assembly: AssemblyVersion("__ASSEMBLY_VERSION__")]
[assembly: AssemblyFileVersion("__ASSEMBLY_VERSION__")]

namespace VectorToolbox.Installer
{
    internal static class Program
    {
        private const string PayloadResourceName = "VectorToolbox.Payload.zip";

        [STAThread]
        private static int Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string temporaryRoot = Path.Combine(
                Path.GetTempPath(),
                "VectorToolboxSetup-" + Guid.NewGuid().ToString("N")
            );

            try
            {
                string extractionRoot = Path.Combine(temporaryRoot, "payload");
                string archivePath = Path.Combine(temporaryRoot, "Vector-Toolbox.zip");
                Directory.CreateDirectory(extractionRoot);

                using (Stream resource = Assembly.GetExecutingAssembly()
                    .GetManifestResourceStream(PayloadResourceName))
                {
                    if (resource == null)
                    {
                        throw new InvalidOperationException("安装程序缺少内嵌载荷。");
                    }
                    using (FileStream archive = File.Create(archivePath))
                    {
                        resource.CopyTo(archive);
                    }
                }

                ZipFile.ExtractToDirectory(archivePath, extractionRoot);
                string installerPath = Path.Combine(
                    extractionRoot,
                    "VectorToolbox",
                    "install-windows.bat"
                );
                if (!File.Exists(installerPath))
                {
                    throw new FileNotFoundException(
                        "安装载荷缺少 install-windows.bat。",
                        installerPath
                    );
                }

                ProcessStartInfo startInfo = new ProcessStartInfo();
                startInfo.FileName = "cmd.exe";
                startInfo.Arguments = "/d /s /c \"\"" + installerPath +
                    "\" --elevated --no-pause\"";
                startInfo.WorkingDirectory = Path.GetDirectoryName(installerPath);
                startInfo.UseShellExecute = false;
                startInfo.CreateNoWindow = true;

                using (Process installer = Process.Start(startInfo))
                {
                    if (installer == null)
                    {
                        throw new InvalidOperationException("无法启动 Windows 安装脚本。");
                    }
                    installer.WaitForExit();
                    if (installer.ExitCode != 0)
                    {
                        throw new InvalidOperationException(
                            "Windows 安装脚本返回错误码 " + installer.ExitCode + "。"
                        );
                    }
                }

                string cleanupWarning = TryDeleteDirectory(temporaryRoot);
                string successMessage =
                    "安装完成。请完全退出并重启 Illustrator，然后从“文件 > 脚本 > Vector-Toolbox”启动。";
                if (cleanupWarning != null)
                {
                    successMessage += "\n\n临时文件未能自动删除：" + cleanupWarning;
                }
                MessageBox.Show(
                    successMessage,
                    "Vector Toolbox 安装程序",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
                return 0;
            }
            catch (Exception error)
            {
                string cleanupWarning = TryDeleteDirectory(temporaryRoot);
                string message = "安装失败。\n\n" + error.Message;
                if (cleanupWarning != null)
                {
                    message += "\n\n临时文件未能自动删除：" + cleanupWarning;
                }
                MessageBox.Show(
                    message,
                    "Vector Toolbox 安装程序",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return 1;
            }
        }

        private static string TryDeleteDirectory(string path)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, true);
                }
                return null;
            }
            catch (Exception error)
            {
                return error.Message;
            }
        }
    }
}
'@
$source = $source.Replace("__ASSEMBLY_VERSION__", "$Version.0")

$manifest = @'
<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="VectorToolbox.Setup" />
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
'@

try {
    [IO.Directory]::CreateDirectory($temporaryRoot) | Out-Null
    Copy-Item -LiteralPath $archivePath -Destination $stagedArchivePath -Force
    [IO.File]::WriteAllText(
        $sourcePath,
        $source,
        [Text.UTF8Encoding]::new($true)
    )
    [IO.File]::WriteAllText(
        $manifestPath,
        $manifest,
        [Text.UTF8Encoding]::new($false)
    )

    if (Test-Path -LiteralPath $installerPath) {
        Remove-Item -LiteralPath $installerPath -Force
    }

    $compilerArguments = @(
        "/nologo",
        "/target:winexe",
        "/platform:anycpu",
        "/optimize+",
        "/win32manifest:$manifestPath",
        "/resource:$stagedArchivePath,$payloadResourceName",
        "/reference:System.dll",
        "/reference:System.Core.dll",
        "/reference:System.Windows.Forms.dll",
        "/reference:System.IO.Compression.dll",
        "/reference:System.IO.Compression.FileSystem.dll",
        "/out:$installerPath",
        $sourcePath
    )
    & $compilerPath @compilerArguments
    if ($LASTEXITCODE -ne 0) {
        throw "Windows 安装程序编译失败，错误码: $LASTEXITCODE"
    }
    if (-not (Test-Path -LiteralPath $installerPath -PathType Leaf)) {
        throw "编译器未生成安装程序: $installerPath"
    }

    $installer = Get-Item -LiteralPath $installerPath
    $installerBytes = [IO.File]::ReadAllBytes($installerPath)
    if ($installer.Length -le (Get-Item -LiteralPath $archivePath).Length) {
        throw "生成的安装程序大小异常"
    }
    if ($installerBytes[0] -ne 0x4D -or $installerBytes[1] -ne 0x5A) {
        throw "生成的安装程序不是有效的 Windows PE 文件"
    }

    $assembly = [Reflection.Assembly]::LoadFile($installer.FullName)
    $resourceStream = $assembly.GetManifestResourceStream($payloadResourceName)
    if (-not $resourceStream) {
        throw "生成的安装程序缺少内嵌 ZIP 载荷"
    }
    try {
        $sha256 = [Security.Cryptography.SHA256]::Create()
        try {
            $embeddedHashBytes = $sha256.ComputeHash($resourceStream)
        } finally {
            $sha256.Dispose()
        }
    } finally {
        $resourceStream.Dispose()
    }
    $embeddedHash = [BitConverter]::ToString($embeddedHashBytes).Replace("-", "").ToLowerInvariant()
    $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($embeddedHash -ne $archiveHash) {
        throw "安装程序内嵌载荷与发布 ZIP 不一致"
    }

    $hash = (Get-FileHash -LiteralPath $installerPath -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText(
        $checksumPath,
        "$hash  $($installer.Name)`n",
        [Text.UTF8Encoding]::new($false)
    )

    [pscustomobject]@{
        Installer = $installer.FullName
        Size = $installer.Length
        SHA256 = $hash
    }
} finally {
    if (Test-Path -LiteralPath $resolvedTemporaryRoot) {
        Remove-Item -LiteralPath $resolvedTemporaryRoot -Recurse -Force
    }
}
