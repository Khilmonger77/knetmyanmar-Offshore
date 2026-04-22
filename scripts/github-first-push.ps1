# First-time push to GitHub: powershell -File scripts/github-first-push.ps1
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
if (-not (Test-Path "package.json")) {
  Write-Error "Expected package.json in $repoRoot"
  exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git is not in PATH. Install Git for Windows from https://git-scm.com/download/win then reopen the terminal."
  exit 1
}

$originUrl = "https://github.com/Khilmonger77/knetmyanmar-Offshore.git"

if (-not (Test-Path ".git")) {
  git init
}

git add -A
if ([string]::IsNullOrWhiteSpace((git status --porcelain))) {
  Write-Host "Nothing new to commit."
} else {
  git commit -m "Initial commit"
}

$existing = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
  git remote set-url origin $originUrl
  Write-Host "Updated existing remote origin -> $originUrl"
} else {
  git remote add origin $originUrl
  Write-Host "Added remote origin -> $originUrl"
}

git branch -M main
Write-Host "Pushing to origin main (you may be prompted to sign in)..."
git push -u origin main
