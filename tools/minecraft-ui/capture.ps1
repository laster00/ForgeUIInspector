[CmdletBinding()]
param(
    [ValidateSet(2, 3)]
    [int]$GuiScale = 2,
    [ValidateSet('F7', 'F8', 'F9', 'F10', 'F11')]
    [string]$PreviewKey = 'F7',
    [ValidateSet('normal', 'empty', 'many', 'other')]
    [string]$Fixture = 'normal',
    [ValidateSet('ja', 'en')]
    [string]$Locale = 'ja',
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
    "lang:$(if ($Locale -eq 'en') { 'en_us' } else { 'ja_jp' })",
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

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT
    {
        public int X;
        public int Y;
    }

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool GetClientRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool ClientToScreen(IntPtr hWnd, ref POINT point);

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
    [ForgeUiInspectorNativeWindow+POINT]$origin = New-Object ForgeUiInspectorNativeWindow+POINT
    if (-not [ForgeUiInspectorNativeWindow]::GetClientRect($Handle, [ref]$rect) -or -not [ForgeUiInspectorNativeWindow]::ClientToScreen($Handle, [ref]$origin)) {
        throw 'Minecraftクライアント領域を取得できませんでした。'
    }

    $width = $rect.Right - $rect.Left
    $height = $rect.Bottom - $rect.Top
    if ($width -le 0 -or $height -le 0) {
        throw "Minecraftウィンドウのサイズが不正です: ${width}x${height}"
    }

    $bitmap = [System.Drawing.Bitmap]::new($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.CopyFromScreen($origin.X, $origin.Y, 0, 0, $bitmap.Size)
        $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
    }

    [pscustomobject]@{
        left = $origin.X
        top = $origin.Y
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
$previewContract = switch ($PreviewKey) {
    'F7' { [pscustomobject]@{ previewId = 'currency'; screen = 'currency_stash'; logicalWidth = 474; logicalHeight = 326; variant = $null; alignment = 'production-derived'; source = 'emulator/contracts/cte2-stash.json' } }
    'F8' { [pscustomobject]@{ previewId = 'map'; screen = 'map_stash'; logicalWidth = 474; logicalHeight = 326; variant = $null; alignment = 'production-derived'; source = 'emulator/contracts/cte2-stash.json' } }
    'F9' { [pscustomobject]@{ previewId = 'master'; screen = 'master_stash'; logicalWidth = 650; logicalHeight = 350; variant = 'rail_dual'; alignment = 'production-derived'; source = 'MasterStashPreviewScreen rail/dual geometry' } }
    'F10' { [pscustomobject]@{ previewId = 'profession'; screen = 'profession_workshop'; logicalWidth = 620; logicalHeight = 340; variant = $null; alignment = 'approximate'; source = 'ProfessionWorkshopPreviewScreen' } }
    'F11' { [pscustomobject]@{ previewId = 'advanced_salvage'; screen = 'advanced_salvage'; logicalWidth = 960; logicalHeight = 540; variant = $null; alignment = 'approximate'; source = 'AdvancedSalvagePreviewScreen' } }
}
$variantToken = if ($null -eq $previewContract.variant) { 'default' } else { $previewContract.variant }
$stem = "forge__cte2__$($previewContract.screen)__${Fixture}__normal__${Locale}__${variantToken}__$($previewContract.logicalWidth)x$($previewContract.logicalHeight)__viewport${Width}x${Height}__scale$GuiScale"
$capturePath = Join-Path $OutputDirectory "$stem.png"
$metadataPath = [System.IO.Path]::ChangeExtension($capturePath, '.json')
$gradleLog = Join-Path $runDirectory 'capture-gradle.log'
$gradleErrorLog = Join-Path $runDirectory 'capture-gradle-error.log'

try {
    $minecraftArgs = "--width $Width --height $Height"
    # Both the repository and the isolated run directory have no spaces. Keeping
    # the wrapper path unquoted avoids cmd.exe treating the nested --args quotes
    # as the end of the /c command.
    $gradleCommand = "$wrapper -PforgeUiRunDir=run-ui -PforgeUiPreview=$($previewContract.previewId) -PforgeUiFixture=$Fixture runClient --args=`"$minecraftArgs`""
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
    $pairKey = "cte2:$($previewContract.screen):${Fixture}:normal:${Locale}:${variantToken}:$($previewContract.logicalWidth)x$($previewContract.logicalHeight):scale$GuiScale"
    [pscustomobject]@{
        schema = 'forge-ui-inspector.capture'
        version = 1
        kind = 'forge'
        project = 'cte2'
        screen = $previewContract.screen
        fixture = $Fixture
        state = 'normal'
        locale = $Locale
        variant = $previewContract.variant
        alignment = [pscustomobject]@{ status = $previewContract.alignment; source = $previewContract.source }
        logicalSize = [pscustomobject]@{ width = $previewContract.logicalWidth; height = $previewContract.logicalHeight }
        pixelSize = [pscustomobject]@{ width = $rect.width; height = $rect.height }
        guiScale = $GuiScale
        image = [System.IO.Path]::GetFileName($capturePath)
        pairKey = $pairKey
        previewKey = $PreviewKey
        requestedWidth = $Width
        requestedHeight = $Height
        window = $rect
        runDirectory = $runDirectory
        limitations = @('Forge capture proves Minecraft rendering for this local fixture only; it does not prove server, NBT, menu, or production interaction behavior.')
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
