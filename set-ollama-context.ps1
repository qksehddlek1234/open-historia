# Pin a model's context window so nothing can quietly undercut it.
#
# Why this exists: Ollama's OpenAI-compatible endpoint (/v1/chat/completions),
# which Open Historia talks to, has no field for context size — Ollama's own docs
# say so, and recommend exactly this. So the context is whatever the SERVER was
# started with, and there are three things that decide that:
#
#   1. A Modelfile "PARAMETER num_ctx"  <- this script. Travels with the model.
#   2. OLLAMA_CONTEXT_LENGTH            <- only applies to a server you started
#                                          yourself, in the window you set it in.
#   3. The Ollama desktop app's own setting (db.sqlite), which is powers of two
#      only and overrides #2 when the app is what started the server.
#
# Baking it into the model means it holds however the server was started.

param(
  [string]$Model   = "gemma4:12b",
  [int]   $Context = 40960,
  [string]$NewName = ""
)

$ErrorActionPreference = "Stop"

# Resolve the EXECUTABLE, never the bare name.
#
# `& ollama` failed on the author's machine with "Cannot run a document in the
# middle of a pipeline: C:\WINDOWS\system32\ollama". There is an extensionless
# file called `ollama` sitting in System32, and System32 comes before the real
# Ollama directory on PATH. cmd.exe skips it because PATHEXT says an executable
# needs an extension; PowerShell has no such rule and will happily try to invoke
# a file with no extension, decide it is a document, and stop. So ask for
# ollama.exe by name, and fall back to where it is actually installed.
function Resolve-Ollama {
  $candidates = @()
  $onPath = Get-Command "ollama.exe" -CommandType Application -ErrorAction SilentlyContinue
  if ($onPath) { $candidates += $onPath.Source }
  $candidates += Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
  $candidates += Join-Path $env:ProgramFiles "Ollama\ollama.exe"
  $candidates += Join-Path ${env:ProgramFiles(x86)} "Ollama\ollama.exe"
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) { return $candidate }
  }
  return $null
}

$ollama = Resolve-Ollama
if (-not $ollama) {
  Write-Host ""
  Write-Host "Could not find ollama.exe." -ForegroundColor Red
  Write-Host "Looked on PATH and in:"
  Write-Host "  $env:LOCALAPPDATA\Programs\Ollama\ollama.exe"
  Write-Host "  $env:ProgramFiles\Ollama\ollama.exe"
  exit 1
}

if (-not $NewName) {
  $base = $Model.Split(":")[0]
  $tag  = if ($Model.Contains(":")) { $Model.Split(":")[1] } else { "latest" }
  $NewName = "$base-oh:$tag"
}

Write-Host ""
Write-Host "  ollama.exe   : $ollama"
Write-Host "  Source model : $Model"
Write-Host "  New model    : $NewName"
Write-Host "  Context      : $Context tokens"
Write-Host ""

# Not piped, and not $ErrorActionPreference's business: a non-zero exit from a
# native program is not a PowerShell error, so check the code by hand.
$list = & $ollama list 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
  Write-Host "Ollama is not reachable. Start it (the desktop app, or 'ollama serve') and run this again." -ForegroundColor Red
  Write-Host $list
  exit 1
}

if ($list -notmatch [regex]::Escape($Model.Split(":")[0])) {
  Write-Host "  Note: '$Model' was not in the model list. Installed models:" -ForegroundColor Yellow
  Write-Host $list
  $answer = Read-Host "  Carry on anyway? [y/N]"
  if ($answer -ne "y" -and $answer -ne "Y") { exit 1 }
}

$trained = $null
try {
  $show = & $ollama show $Model 2>&1 | Out-String
  if ($show -match "context length\s+(\d+)") { $trained = [int]$Matches[1] }
} catch { }

if ($trained) {
  Write-Host "  $Model was trained for $trained tokens."
  if ($Context -gt $trained) {
    Write-Host ""
    Write-Host "  $Context is ABOVE that. Going over the trained length degrades quality" -ForegroundColor Yellow
    Write-Host "  rather than failing, so it is worth stepping back to $trained." -ForegroundColor Yellow
    Write-Host ""
    $answer = Read-Host "  Use $trained instead? [Y/n]"
    if ($answer -ne "n" -and $answer -ne "N") { $Context = $trained }
  }
}

$modelfile = Join-Path $env:TEMP "oh-modelfile-$([System.Guid]::NewGuid().ToString('N')).txt"
@"
FROM $Model
PARAMETER num_ctx $Context
"@ | Set-Content -Path $modelfile -Encoding ASCII

Write-Host ""
Write-Host "  Building $NewName ..."
& $ollama create $NewName -f $modelfile
$created = $LASTEXITCODE
Remove-Item $modelfile -ErrorAction SilentlyContinue

if ($created -ne 0) {
  Write-Host "ollama create failed (exit $created)." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "  Done." -ForegroundColor Green
Write-Host ""
Write-Host "  Two things left, both in the game:"
Write-Host "    1. Settings -> AI provider: change the model to  $NewName"
Write-Host "    2. Settings -> Model context window: set it to  $Context"
Write-Host ""
Write-Host "  The second one is not cosmetic. It is what the prompt budget spends"
Write-Host "  against, and budgeting for more than the server has is what makes a"
Write-Host "  busy turn come back unparseable."
Write-Host ""
Write-Host "  To check it took, run a turn and look in the Ollama log for:"
Write-Host "    llama_context: n_ctx = $Context"
Write-Host ""
