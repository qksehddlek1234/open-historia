# Open Historia — one-time migration from a ZIP install to a real git repository.
#
# What it does, in order:
#   1. turns this folder into a git repo whose history starts at the exact
#      upstream commit your ZIP release was built from (df3dab4, 2026-07-26),
#   2. commits everything you and I have changed on top of it as one commit on a
#      branch called "modded" — after this step nothing can be lost,
#   3. merges the 12 upstream commits released since then.
#
# It never deletes anything and never touches your saves (server/data is
# gitignored). If the merge goes wrong, "git merge --abort" restores step 2.

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

# The upstream commit the app-stable ZIP in this folder was built from.
$BaseCommit = "df3dab48bf7af35ce269011011646368aac2e836"
$RepoUrl    = "https://github.com/Open-Historia/open-historia.git"
# The only file both upstream and we changed. Upstream's change to it (the
# chat-delete fix, ae00384) is ALREADY ported into our copy, so on a conflict
# our side is the correct, complete resolution.
$OursOnConflict = "src/Game/AI/gameplay.js"

function Step($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Ok($text)   { Write-Host "  OK  $text" -ForegroundColor Green }
function Warn($text) { Write-Host "  !!  $text" -ForegroundColor Yellow }
function Die($text)  { Write-Host "`nSTOPPED: $text" -ForegroundColor Red; Read-Host "`nPress Enter to close"; exit 1 }

Step "Checks"
try { $v = (git --version) } catch { Die "git is not installed. Get it from https://git-scm.com/download/win, then run this again." }
Ok $v
if (Test-Path ".git") { Die "This folder is already a git repository. Nothing to migrate." }
if (-not (Test-Path "package.json")) { Die "Run this from inside the Open-Historia folder." }
Ok "no .git yet, package.json found"

Step "Creating the repository"
git init -b modded | Out-Null
git remote add origin $RepoUrl
Ok "git init + remote -> $RepoUrl"

Step "Fetching upstream history (this downloads a few hundred commits, ~1-2 min)"
git fetch origin main
if ($LASTEXITCODE -ne 0) { Die "Could not reach GitHub. Check your connection and run this again." }
git cat-file -e "$BaseCommit^{commit}" 2>$null
if ($LASTEXITCODE -ne 0) { Die "The base commit $BaseCommit is missing from the fetch." }
Ok "upstream history fetched"

Step "Anchoring your install to its release commit"
# Point the branch at the release commit and refresh the index from it WITHOUT
# touching a single file on disk — so everything you changed shows up as a diff.
git update-ref refs/heads/modded $BaseCommit
git reset --quiet
$changed = @(git diff --name-only).Count
$added   = @(git ls-files --others --exclude-standard).Count
Ok "base = $BaseCommit (upstream 2026-07-26)"
Ok "$changed modified file(s), $added new file(s) detected"

Step "Committing your modifications"
git add -A
git -c user.name="Open Historia (local)" -c user.email="local@openhistoria.invalid" commit -q -m "Local modifications: personal fork (UI parity, turn-generation reliability, Korean output)"
if ($LASTEXITCODE -ne 0) { Die "The commit failed. Nothing has been changed on disk." }
Ok "committed on branch 'modded' — from here everything is recoverable"

Step "Merging the 12 upstream commits released since your ZIP"
git merge origin/main --no-edit
if ($LASTEXITCODE -eq 0) {
  Ok "merged cleanly"
} else {
  $conflicts = @(git diff --name-only --diff-filter=U)
  Write-Host "  conflicting file(s): $($conflicts -join ', ')" -ForegroundColor Yellow
  if ($conflicts.Count -eq 1 -and $conflicts[0] -eq $OursOnConflict) {
    git checkout --ours -- $OursOnConflict
    git add -- $OursOnConflict
    git -c user.name="Open Historia (local)" -c user.email="local@openhistoria.invalid" commit -q --no-edit
    Ok "resolved the expected conflict in $OursOnConflict (our copy already contains upstream's change)"
  } else {
    Warn "Unexpected conflicts. NOTHING is lost — your work is committed."
    Warn "Either run:  git merge --abort     (to undo the merge and stay where you were)"
    Warn "or send me the file list above and I'll resolve them."
    Read-Host "`nPress Enter to close"
    exit 2
  }
}

Step "Done"
git --no-pager log --oneline -3
Write-Host ""
Ok "Next: run  npx vite build   and start the game as usual."
Write-Host "From now on, updating is:  git fetch origin main  then  git merge origin/main" -ForegroundColor Gray
Write-Host "(conflicts get shown instead of silently overwriting your work)" -ForegroundColor Gray
Read-Host "`nPress Enter to close"
