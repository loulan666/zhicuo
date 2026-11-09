param([int]$ExistingDownloadPid = 0)
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $project
$installer = Join-Path $project 'work/DockerDesktopInstaller.exe'
$log = Join-Path $project 'work/docker-install-status.txt'
function Status($message) { (Get-Date -Format 's') + ' ' + $message | Add-Content -LiteralPath $log }
try {
    Status 'Waiting for active official download.'
    if ($ExistingDownloadPid -gt 0) { Wait-Process -Id $ExistingDownloadPid -ErrorAction SilentlyContinue }
    $signature = Get-AuthenticodeSignature -FilePath $installer -ErrorAction SilentlyContinue
    if ($signature.Status -ne 'Valid') {
        Status 'Resuming official Docker download.'
        & curl.exe -L --fail --retry 3 --retry-all-errors --connect-timeout 20 --max-time 7200 -C - -o $installer 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' 2>> 'work/docker-download.log'
        if ($LASTEXITCODE -ne 0) { throw 'Download failed. See work/docker-download.log.' }
        $signature = Get-AuthenticodeSignature -FilePath $installer
    }
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Docker') { throw 'Installer signature verification failed; installer was not run.' }
    Status 'Verified official Docker signature. Starting installer without automatic license acceptance or reboot.'
    $install = Start-Process -FilePath $installer -ArgumentList @('install','--quiet','--backend=wsl-2') -WindowStyle Hidden -PassThru -Wait
    Status "Installer exited: $($install.ExitCode)."
    if ($install.ExitCode -ne 0) { throw 'Installer requires attention; review Docker installation logs and WSL requirements.' }
    Status 'Installation completed. User must start Docker Desktop, handle any first-run license, and restart Windows if requested. Then run scripts/setup-runtimes.ps1.'
} catch { Status "BLOCKED: $($_.Exception.Message)"; exit 1 }
