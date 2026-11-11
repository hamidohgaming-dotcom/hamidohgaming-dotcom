# Deploy Helper Script for hamidohgaming-dotcom
# Run this script in PowerShell to initialize and push your repository to GitHub

param(
    [string]$RemoteUrl = "https://github.com/hamidohgaming-dotcom/hamidohgaming-dotcom.git"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  HAMIDOH GAMING - REPO DEPLOY HELPER   " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Initialize Git repository if needed
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Initializing new Git repository..." -ForegroundColor Green
    git init
} else {
    Write-Host "[1/4] Git repository already initialized." -ForegroundColor Green
}

# 2. Stage all files
Write-Host "[2/4] Staging files..." -ForegroundColor Green
git add .

# 3. Commit files
Write-Host "[3/4] Committing changes..." -ForegroundColor Green
git commit -m "feat: initial release of Hamidoh Gaming profile showcase" -q

# 4. Set main branch and remote
Write-Host "[4/4] Setting main branch and remote target..." -ForegroundColor Green
git branch -M main

$existingRemote = git remote get-url origin 2>$null
if ($null -eq $existingRemote) {
    git remote add origin $RemoteUrl
    Write-Host "Remote 'origin' set to: $RemoteUrl" -ForegroundColor Cyan
} else {
    git remote set-url origin $RemoteUrl
    Write-Host "Updated remote 'origin' to: $RemoteUrl" -ForegroundColor Cyan
}

Write-Host "`nReady to push! Run the command below when you're ready:" -ForegroundColor Yellow
Write-Host "    git push -u origin main" -ForegroundColor White
Write-Host "`nTo publish GitHub Pages: Navigate to Repo Settings > Pages > Build and deployment > GitHub Actions.`n" -ForegroundColor Green
