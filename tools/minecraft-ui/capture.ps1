[CmdletBinding()]
param(
    [ValidateSet(2, 3)]
    [int]$GuiScale = 2,
    [ValidateSet('F7', 'F8')]
    [string]$PreviewKey = 'F7',
    [int]$Width = 0,
    [int]$Height = 0,
    [ValidateRange(30, 600)]
    [int]$WaitSeconds = 120,
    [string]$OutputDirectory = '',
    [switch]$KeepRunning
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$wrapper = Join-Path $repoRoot 'gradlew.bat'
$runDirectory = Join-Path $repoRoot 'run-ui'

if ($Width -le 0) {
    $Width = if ($GuiScale -eq 3) { 1280 } else { 960 }
}
if ($Height -le 0) {
    $Height = if ($GuiScale -eq 3) { 720 } else { 540 }
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $OutputDirectory = Join-Path $PSScriptRoot 'captures'
} elseif (-not [System.IO.Path]::IsPathRooted($OutputDirectory)) {
    $OutputDirectory = Join-Path (Get-Location).Path $OutputDirectory
}

if (-not (Test-Path -LiteralPath $wrapper)) {
    throw "gradlew.bat が見つかりません: $wrapper"
}

New-Item -ItemType Directory -Force -Path $runDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

# The run-ui directory is intentionally separate from the normal Forge run directory.
# Rewriting this small file makes every capture start from the same client settings.
$options = @(
    'version:3465',
    'fullscreen:false',
    "guiScale:$GuiScale",
    'tutorialStep:none',
    'onboardAccessibility:false',
    'skipMultiplayerWarning:true',
    'skipRealms32bitWarning:true',
    'hideBundleTutorial:true'
)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines((Join-Path $runDirectory 'options.txt'), $options, $utf8NoBom)

if (-not ([System.Management.Automation.PSTypeName]'ForgeUiInspectorNativeWindow').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class ForgeUiInspectorNativeWindow
{
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT
    {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetWindowPos(
        IntPtr hWnd,
        IntPtr hWndInsertAfter,
        int x,
        int y,
        int width,
        int height,
        uint flags);
}
"@
}
Add-Type -AssemblyName System.Windows.Forms

function Get-MinecraftProcess {
    Get-Process | Where-Object {
        $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like 'Minecraft*'
    } | Select-Object -First 1
}

function Save-WindowScreenshot {
    param(
        [System.IntPtr]$Handle,
        [string]$Path
    )

    [ForgeUiInspectorNativeWindow+RECT]$rect = New-Object ForgeUiInspectorNativeWindow+RECT
    if (-not [ForgeUiInspectorNativeWindow]::GetWindowRect($Handle, [ref]$rect)) {
        throw 'Minecraftウィンドウの位置を取得できませんでした。'
    }

    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -le 0 -or $height -le 0) {
        throw "Minecraftウィンドウのサイズが不正です: ${width}x${height}"
    }

    $bitmap = [System.Drawing.Bitmap]::new($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
        $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }

    [pscustomobject]@{
        left = $rect.Left
        top = $rect.Top
        width = $width
        height = $height
    }
}

function Wait-ForMinecraftReady {
    param(
        [datetime]$Deadline,
        [System.Diagnostics.Process]$GradleProcess,
        [string]$LogPath,
        [System.Diagnostics.Process]$MinecraftProcess
    )

    do {
        if ($GradleProcess.HasExited -and $null -eq (Get-MinecraftProcess)) {
            $failure = if (Test-Path -LiteralPath $gradleErrorLog) { Get-Content -Raw -LiteralPath $gradleErrorLog } else { Get-Content -Raw -LiteralPath $LogPath }
            throw "Forgeクライアントが準備前に終了しました。$failure"
        }
        if (Test-Path -LiteralPath $LogPath) {
            $log = Get-Content -Raw -LiteralPath $LogPath
            if ($log -match 'Sound engine started' -or $log -match 'Created: .*textures/atlas') {
                return
            }
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $Deadline)

    throw "Minecraftのリソース読み込みが${WaitSeconds}秒以内に完了しませんでした。"
}

$existing = Get-MinecraftProcess
if ($null -ne $existing) {
    throw "Minecraftが既に起動しています。先に閉じてから実行してください: PID $($existing.Id)"
}

$javaRuntime = 'C:\Program Files (x86)\Minecraft Launcher\runtime\java-runtime-gamma\windows-x64\java-runtime-gamma'
if (-not (Test-Path -LiteralPath (Join-Path $javaRuntime 'bin\java.exe'))) {
    throw "Java 17ランタイムが見つかりません: $javaRuntime"
}

$oldJavaHome = $env:JAVA_HOME
$oldPath = $env:Path
$env:JAVA_HOME = $javaRuntime
$env:Path = "$javaRuntime\bin;$oldPath"

$gradleProcess = $null
$minecraft = $null
$capturePath = Join-Path $OutputDirectory "minecraft-$($PreviewKey.ToLowerInvariant())-gui$GuiScale-${Width}x${Height}.png"
$metadataPath = [System.IO.Path]::ChangeExtension($capturePath, '.json')
$gradleLog = Join-Path $runDirectory 'capture-gradle.log'
$gradleErrorLog = Join-Path $runDirectory 'capture-gradle-error.log'

try {
    $minecraftArgs = "--width $Width --height $Height"
    # Both the repository and the isolated run directory have no spaces. Keeping
    # the wrapper path unquoted avoids cmd.exe treating the nested --args quotes
    # as the end of the /c command.
    $previewId = if ($PreviewKey -eq 'F7') { 'currency' } else { 'map' }
    $gradleCommand = "$wrapper -PforgeUiRunDir=run-ui -PforgeUiPreview=$previewId runClient --args=`"$minecraftArgs`""
    $gradleProcess = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/d', '/c', $gradleCommand) -WorkingDirectory $repoRoot -PassThru -WindowStyle Normal -RedirectStandardOutput $gradleLog -RedirectStandardError $gradleErrorLog

    $deadline = (Get-Date).AddSeconds($WaitSeconds)
    do {
        $minecraft = Get-MinecraftProcess
        if ($null -ne $minecraft) { break }
        if ($gradleProcess.HasExited) {
            $failure = if (Test-Path -LiteralPath $gradleErrorLog) { Get-Content -Raw -LiteralPath $gradleErrorLog } else { Get-Content -Raw -LiteralPath $gradleLog }
            throw "Forgeクライアントの起動に失敗しました。$failure"
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)

    if ($null -eq $minecraft) {
        throw "Minecraftウィンドウが${WaitSeconds}秒以内に現れませんでした。Gradleログを確認してください。"
    }

    Wait-ForMinecraftReady -Deadline $deadline -GradleProcess $gradleProcess -LogPath $gradleLog -MinecraftProcess $minecraft

    # Keep the client window in a known position and size. The extra pixels account
    # for the normal Windows title bar and border; the screenshot uses the real rect.
    [ForgeUiInspectorNativeWindow]::SetForegroundWindow($minecraft.MainWindowHandle) | Out-Null
    [ForgeUiInspectorNativeWindow]::SetWindowPos(
        $minecraft.MainWindowHandle,
        [System.IntPtr]::Zero,
        80,
        80,
        ($Width + 16),
        ($Height + 39),
        0) | Out-Null
    Start-Sleep -Seconds 3

    Start-Sleep -Seconds 2

    $rect = Save-WindowScreenshot -Handle $minecraft.MainWindowHandle -Path $capturePath
    [pscustomobject]@{
        previewKey = $PreviewKey
        guiScale = $GuiScale
        requestedWidth = $Width
        requestedHeight = $Height
        window = $rect
        runDirectory = $runDirectory
        image = $capturePath
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $metadataPath -Encoding utf8

    Write-Output "CAPTURED $capturePath"
    Write-Output "METADATA $metadataPath"
} finally {
    if (-not $KeepRunning) {
        $current = Get-MinecraftProcess
        if ($null -ne $current) {
            try {
                [ForgeUiInspectorNativeWindow]::SetForegroundWindow($current.MainWindowHandle) | Out-Null
                [System.Windows.Forms.SendKeys]::SendWait('%{F4}')
                $closeDeadline = (Get-Date).AddSeconds(10)
                do {
                    Start-Sleep -Milliseconds 250
                    $current = Get-MinecraftProcess
                } while ($null -ne $current -and (Get-Date) -lt $closeDeadline)
            } catch {
                # Fall through to the scoped process cleanup below.
            }
            if ($null -ne $current) {
                Stop-Process -Id $current.Id -Force -ErrorAction SilentlyContinue
            }
        }

        if ($null -ne $gradleProcess -and -not $gradleProcess.HasExited) {
            try { Wait-Process -Id $gradleProcess.Id -Timeout 10 -ErrorAction Stop } catch { }
            if (-not $gradleProcess.HasExited) {
                Stop-Process -Id $gradleProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
    }

    if ($null -eq $oldJavaHome) { Remove-Item Env:JAVA_HOME -ErrorAction SilentlyContinue }
    else { $env:JAVA_HOME = $oldJavaHome }
    $env:Path = $oldPath
}
