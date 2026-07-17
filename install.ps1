# plan-your-agents — installs the setup-*-agents skills + knowledge base into ~/.claude
# so /setup-dev-agents and /setup-task-agents work in every project. Run from the repo
# root:  ./install.ps1
# (Prefer the plugin install for versioned updates — see README "Install as a plugin".)

$ErrorActionPreference = "Stop"
$claudeHome = Join-Path $HOME ".claude"

New-Item -ItemType Directory -Force -Path (Join-Path $claudeHome "skills")    | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $claudeHome "knowledge") | Out-Null

Copy-Item -Recurse -Force ".claude\skills\setup-dev-agents"  (Join-Path $claudeHome "skills\setup-dev-agents")
Copy-Item -Recurse -Force ".claude\skills\setup-task-agents" (Join-Path $claudeHome "skills\setup-task-agents")
Copy-Item -Recurse -Force ".claude\skills\_shared"           (Join-Path $claudeHome "skills\_shared")
Copy-Item -Recurse -Force ".claude\knowledge\claude-agents"  (Join-Path $claudeHome "knowledge\claude-agents")

Write-Host "Installed setup-dev-agents + setup-task-agents + knowledge base into $claudeHome"
Write-Host "Open a project, run 'claude', then: /setup-dev-agents .   or   /setup-task-agents ."
