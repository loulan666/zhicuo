$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$docker = 'C:/Program Files/Docker/Docker/resources/bin/docker.exe'
$node = (Get-Command node).Source
$log = Join-Path $project 'work/runtime-setup-status.txt'
New-Item -ItemType Directory -Force work | Out-Null
function Status($text) { "$(Get-Date -Format s) $text" | Add-Content -LiteralPath $log }
try {
    Status 'Waiting up to 30 minutes for user-started Docker engine.'
    $deadline = (Get-Date).AddMinutes(30)
    $ready = $false
    while ((Get-Date) -lt $deadline) {
        & $docker info --format '{{.ServerVersion}}' *> 'work/docker-ready.log'
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 10
    }
    if (-not $ready) { throw 'Docker engine did not become ready. Run this script again after starting Docker Desktop.' }
    foreach ($image in @('python:3.12-alpine','node:24-alpine','eclipse-temurin:17-jdk-alpine','gcc:14','golang:1.24-alpine')) {
        & $docker image inspect $image *> $null
        if ($LASTEXITCODE -eq 0) { Status "$image already present."; continue }
        $downloaded = $false
        for ($attempt=1; $attempt -le 3; $attempt++) {
            Status "Downloading $image, attempt $attempt."
            & $docker pull $image >> 'work/runtime-download.log' 2>&1
            if ($LASTEXITCODE -eq 0) { $downloaded=$true; break }
            Start-Sleep -Seconds 5
        }
        if (-not $downloaded) { throw "Download failed: $image. Check work/runtime-download.log." }
    }
    Status 'All images available. Running real seven-language integration checks.'
    & $node scripts/verify-runtimes.mjs *> 'work/runtime-verification.log'
    if ($LASTEXITCODE -ne 0) { throw 'Integration checks failed. See work/runtime-verification.log.' }
    Status 'COMPLETE: all seven language integration checks passed.'
} catch { Status "BLOCKED: $($_.Exception.Message)"; exit 1 }
