param(
  [string]$BacklogPath = "docs/backlog-issues.md",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
$ghPath = $null
$commonGhPath = "C:\Program Files\GitHub CLI\gh.exe"

if ($ghCommand) {
  $ghPath = $ghCommand.Source
} elseif (Test-Path -LiteralPath $commonGhPath) {
  $ghPath = $commonGhPath
}

if (-not $DryRun -and -not $ghPath) {
  throw "GitHub CLI (gh) nao encontrado. Instale e autentique com 'gh auth login' antes de criar issues."
}

if (-not (Test-Path -LiteralPath $BacklogPath)) {
  throw "Arquivo de backlog nao encontrado: $BacklogPath"
}

$content = Get-Content -LiteralPath $BacklogPath -Raw
$pattern = '(?ms)^### (?<title>.+?)\r?\n\r?\n```md\r?\n(?<body>.*?)\r?\n```'
$matches = [regex]::Matches($content, $pattern)

if ($matches.Count -eq 0) {
  throw "Nenhuma issue encontrada no formato esperado."
}

foreach ($match in $matches) {
  $title = $match.Groups["title"].Value.Trim()
  $body = $match.Groups["body"].Value.Trim()
  $labels = @()

  $labelMatch = [regex]::Match($body, '(?ms)^## Labels\r?\n(?<labels>.+?)$')
  if ($labelMatch.Success) {
    $rawLabels = $labelMatch.Groups["labels"].Value
    $labels = [regex]::Matches($rawLabels, '`([^`]+)`') | ForEach-Object { $_.Groups[1].Value }
    $body = [regex]::Replace($body, '(?ms)\r?\n## Labels\r?\n.+?$', '').Trim()
  }

  if ($title -like "Epic *") {
    $labels = @("epic") + $labels
  }

  $labels = $labels | Select-Object -Unique

  if ($DryRun) {
    Write-Host "DRY RUN: $title"
    if ($labels.Count -gt 0) {
      Write-Host "Labels: $($labels -join ', ')"
    }
    continue
  }

  $args = @("issue", "create", "--title", $title, "--body", $body)
  foreach ($label in $labels) {
    $args += @("--label", $label)
  }

  & $ghPath @args
}
