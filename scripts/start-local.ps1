$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Install Node.js 22+ and add it to PATH.' }
if (-not (Test-Path 'public/platform.js')) { & $node.Source scripts/build.mjs; if($LASTEXITCODE -ne 0){throw 'Build failed; install dependencies first.'} }
New-Item -ItemType Directory -Force work | Out-Null
Start-Process -FilePath $node.Source -ArgumentList @('--env-file-if-exists=.env','server.mjs') -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput 'work/server.log' -RedirectStandardError 'work/server-error.log'
Write-Output 'Open http://127.0.0.1:3180/'
