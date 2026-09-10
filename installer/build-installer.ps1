$ErrorActionPreference = "Stop"

Write-Host "==============================================="
Write-Host "  Building AI Rewrite Anywhere Release Package "
Write-Host "==============================================="

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

# 1. Publish Release binary
Write-Host "`n[1/3] Publishing .NET Release application..." -ForegroundColor Cyan
$dotnetCmd = if (Test-Path "$env:USERPROFILE\.dotnet\dotnet.exe") { "$env:USERPROFILE\.dotnet\dotnet.exe" } else { "dotnet" }
& $dotnetCmd publish src/AIRewriteAnywhere/AIRewriteAnywhere.csproj -c Release -r win-x64 --self-contained false -o dist

# 2. Locate ISCC.exe
Write-Host "`n[2/3] Locating Inno Setup Compiler..." -ForegroundColor Cyan
$isccCandidates = @(
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
)

$isccPath = $null
foreach ($candidate in $isccCandidates) {
    if (Test-Path $candidate -PathType Leaf) {
        $isccPath = $candidate
        break
    }
}

if (-not $isccPath) {
    $cmd = Get-Command iscc -ErrorAction SilentlyContinue
    if ($cmd) {
        $isccPath = $cmd.Source
    }
}

if (-not $isccPath) {
    throw "Inno Setup Compiler (ISCC.exe) was not found in common paths or PATH."
}

Write-Host "Found ISCC at: $isccPath" -ForegroundColor Green

# 3. Compile Installer
Write-Host "`n[3/3] Compiling Windows Installer (AI-Rewrite-Anywhere-Setup.exe)..." -ForegroundColor Cyan
& "$isccPath" "installer\setup.iss"
if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup Compiler failed with exit code $LASTEXITCODE"
}

$setupExe = Join-Path $rootDir "installer\AI-Rewrite-Anywhere-Setup.exe"
if (Test-Path $setupExe) {
    $item = Get-Item $setupExe
    $sizeMb = [math]::Round($item.Length / 1048576, 2)
    Write-Host ""
    Write-Host "[OK] Installer created successfully at: $setupExe (${sizeMb} MB)" -ForegroundColor Green

    # 4. Refresh installer.zip in workspace root
    Write-Host "`n[4/4] Updating installer.zip in root..." -ForegroundColor Cyan
    $zipPath = Join-Path $rootDir "installer.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path (Join-Path $rootDir "installer\*") -DestinationPath $zipPath -Force
    Write-Host "[OK] installer.zip refreshed successfully." -ForegroundColor Green
} else {
    throw "Installer generation failed."
}
