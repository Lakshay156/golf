# Phoenix Push Script for Golf Charity
# This script will initialize git, set the remote, and push your project to GitHub.

Write-Host "🚀 Starting Git Push Process..." -ForegroundColor Cyan

# 1. Check if git is installed
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Git is not installed on this system. Please install Git from https://git-scm.com/"
    exit
}

# 2. Check if .git exists
if (!(Test-Path .git)) {
    Write-Host "📦 Initializing new Git repository..."
    git init
}

# 3. Set the remote URL
$remoteUrl = "https://github.com/Akashojha6330/golf-charity.git"
Write-Host "🔗 Setting remote origin to $remoteUrl..."
if (git remote get-url origin -ErrorAction SilentlyContinue) {
    git remote set-url origin $remoteUrl
} else {
    git remote add origin $remoteUrl
}

# 4. Add files and Commit
Write-Host "📝 Staging files and creating commit..."
git add .
git commit -m "Pushing project to golf-charity repo"

# 5. Push to GitHub
Write-Host "📤 Pushing to main branch..."
git branch -M main
git push -u origin main

Write-Host "✅ Process Complete!" -ForegroundColor Green
pause
