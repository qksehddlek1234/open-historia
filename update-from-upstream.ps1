# Open Historia — pull the official repo's newest work into your modified copy.
#
# This is the double-click version of:
#     git fetch upstream          (download what's new — changes nothing yet)
#     git merge upstream/main     (actually combine it with your work)
#
# It never overwrites your modifications. If the same lines were changed on both
# sides it stops and shows you which files, and you can always undo with
# "git merge --abort".

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Step($t) { Write-Host "`n=== $t ===" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  OK  $t" -ForegroundColor Green }
function Info($t) { Write-Host "  $t" -ForegroundColor Gray }
function Warn($t) { Write-Host "  !!  $t" -ForegroundColor Yellow }
function Die($t)  { Write-Host "`nSTOPPED: $t" -ForegroundColor Red; Read-Host "`nPress Enter to close"; exit 1 }

Step "Checks"
if (-not (Test-Path ".git")) { Die "This folder is not a git repository." }
if (-not (@(git remote) -contains "upstream")) { Die "No 'upstream' remote. Run 'Link My Fork.bat' first." }
$branch = (git rev-parse --abbrev-ref HEAD)
Ok "branch: $branch"

# Uncommitted work (files I sent you that you have not committed yet) has to be
# saved first — git refuses to merge on top of a half-edited folder.
$dirty = @(git status --porcelain)
if ($dirty.Count -gt 0) {
  Warn "$($dirty.Count) file(s) changed but not yet committed:"
  $dirty | Select-Object -First 12 | ForEach-Object { Info "    $_" }
  if ($dirty.Count -gt 12) { Info "    ... and $($dirty.Count - 12) more" }
  Write-Host ""
  $answer = Read-Host "Commit these first so the merge is safe? (Y/N)"
  if ($answer -notmatch '^[Yy]') { Die "Nothing was changed. Commit or discard them, then run this again." }
  git add -A
  git commit -q -m "Local changes before pulling upstream"
  if ($LASTEXITCODE -ne 0) { Die "The commit failed. Nothing was changed." }
  Ok "committed — from here everything is recoverable"
} else {
  Ok "working folder is clean"
}

Step "Downloading what is new upstream (nothing on disk changes yet)"
git fetch upstream
if ($LASTEXITCODE -ne 0) { Die "Could not reach GitHub. Check your connection." }
$incoming = @(git --no-pager log --oneline HEAD..upstream/main)
if ($incoming.Count -eq 0) {
  Ok "already up to date — no upstream changes to merge"
  Read-Host "`nPress Enter to close"
  exit 0
}
Ok "$($incoming.Count) new upstream commit(s):"
$incoming | ForEach-Object { Info "    $_" }

Step "Merging them into your work"
git merge upstream/main --no-edit
if ($LASTEXITCODE -eq 0) {
  Ok "merged cleanly"
} else {
  $conflicts = @(git diff --name-only --diff-filter=U)
  Write-Host ""
  Warn "Conflicts in $($conflicts.Count) file(s) — upstream and you changed the same lines:"
  $conflicts | ForEach-Object { Warn "    $_" }
  Write-Host ""
  Warn "NOTHING is lost. Two options:"
  Warn "  1) undo the merge and stay exactly where you were:   git merge --abort"
  Warn "  2) send me the file list above and I'll resolve it for you"
  Read-Host "`nPress Enter to close"
  exit 2
}

Step "Result"
git --no-pager log --oneline -5
Write-Host ""
Ok "Next: run  npx vite build  before starting the game."
Info "(and GitHub Desktop -> Push origin, to back the result up to your fork)"
Read-Host "`nPress Enter to close"
