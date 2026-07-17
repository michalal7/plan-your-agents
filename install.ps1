# plan-your-agents — installs the setup-agents skill + knowledge base into ~/.claude
# so /setup-agents works in every project. Run from the repo root:  ./install.ps1

$ErrorActionPreference = "Stop"
$claudeHome = Join-Path $HOME ".claude"

New-Item -ItemType Directory -Force -Path (Join-Path $claudeHome "skills")    | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $claudeHome "knowledge") | Out-Null

Copy-Item -Recurse -Force ".claude\skills\setup-agents"     (Join-Path $claudeHome "skills\setup-agents")
Copy-Item -Recurse -Force ".claude\knowledge\claude-agents" (Join-Path $claudeHome "knowledge\claude-agents")

Write-Host "Installed setup-agents + knowledge base into $claudeHome"
Write-Host "Open a project, run 'claude', then: /setup-agents ."
