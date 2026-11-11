$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Install Node.js 22+ and add it to PATH.' }
$existing = $null
try { $existing = Invoke-RestMethod 'http://127.0.0.1:3180/api/status' -TimeoutSec 3 } catch {}
if ($null -ne $existing -and $null -ne $existing.ai) {
    Write-Output 'Already running: http://127.0.0.1:3180/ (restart after changing .env or backend source).'
    exit 0
}
& $node.Source scripts/build.mjs
if ($LASTEXITCODE -ne 0) { throw 'Build failed; run npm ci first.' }
New-Item -ItemType Directory -Force work | Out-Null
Start-Process -FilePath $node.Source -ArgumentList @('--env-file-if-exists=.env','server.mjs') -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput 'work/server.log' -RedirectStandardError 'work/server-error.log'
$ready = $false
for ($attempt = 0; $attempt -lt 10; $attempt++) {
    Start-Sleep -Milliseconds 300
    try { $result = Invoke-RestMethod 'http://127.0.0.1:3180/api/status' -TimeoutSec 2; if ($null -ne $result.ai) { $ready = $true; break } } catch {}
}
if (-not $ready) { throw 'Server did not become ready. Check work/server-error.log and port 3180.' }
Write-Output 'Ready: http://127.0.0.1:3180/'
