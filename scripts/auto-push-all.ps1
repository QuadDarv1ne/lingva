param(
    [switch]$CheckOnly
)

$ErrorActionPreference = 'Stop'

$root = 'M:\GitHub'
$repos = Get-ChildItem -Path $root -Directory | Sort-Object Name

foreach ($repo in $repos) {
    $repoPath = $repo.FullName
    $gitDir = Join-Path $repoPath '.git'

    if (-not (Test-Path $gitDir)) {
        Write-Host "[SKIP] $repoPath (not a git repo)"
        continue
    }

    try {
        Push-Location $repoPath
        $status = git status --short

        if (-not $status) {
            Write-Host "[OK] $repoPath (clean)"
            continue
        }

        if ($CheckOnly) {
            Write-Host "[CHANGED] $repoPath (needs commit/push)"
            continue
        }

        git add .
        $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        $message = "chore: auto-commit $timestamp"
        git commit -m $message

        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARN] $repoPath (commit skipped)"
            continue
        }

        git push

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[PUSHED] $repoPath"
        } else {
            Write-Host "[FAIL] $repoPath (push failed)"
        }
    }
    catch {
        Write-Host "[ERROR] $repoPath -> $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
}

Write-Host "All repositories processed."
