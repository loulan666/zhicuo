$ErrorActionPreference = 'Stop'
$images = @('python:3.12-alpine','node:24-alpine','eclipse-temurin:17-jdk-alpine','gcc:14','golang:1.24-alpine')
$docker = if (Get-Command docker -ErrorAction SilentlyContinue) { (Get-Command docker).Source } elseif (Test-Path 'C:/Program Files/Docker/Docker/resources/bin/docker.exe') { 'C:/Program Files/Docker/Docker/resources/bin/docker.exe' } else { throw 'Docker Desktop is not installed.' }
& $docker info | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop first.' }
foreach ($image in $images) {
    & $docker pull $image
    if ($LASTEXITCODE -ne 0) { throw "Failed to download $image" }
}
Write-Output 'All language images are ready.'
