[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string[]] $Codes = @(),
  [switch] $Force
)

$ErrorActionPreference = "Stop"

function Convert-ToPortableRelativePath {
  param(
    [Parameter(Mandatory = $true)] [string] $Root,
    [Parameter(Mandatory = $true)] [string] $Path
  )

  $rootUri = [Uri]((Resolve-Path -LiteralPath $Root).Path.TrimEnd('\') + '\')
  $pathUri = [Uri](Resolve-Path -LiteralPath $Path).Path
  return [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString())
}

function Get-SourceScore {
  param(
    [Parameter(Mandatory = $true)] [string] $RelativePath,
    [Parameter(Mandatory = $true)] [string] $Extension
  )

  $score = 0
  if ($RelativePath -like "*/Full/*") { $score += 100 }
  if ($RelativePath -like "*0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC*") { $score += 50 }
  if ($RelativePath -like "*/Biểu mẫu/Biểu mẫu/*") { $score += 20 }
  if ($Extension -ieq ".docx") { $score += 5 }
  return $score
}

function Get-TemplateSourceCandidates {
  param(
    [Parameter(Mandatory = $true)] [string] $RepoRoot
  )

  $docsRoot = Join-Path $RepoRoot "docs"
  if (-not (Test-Path -LiteralPath $docsRoot)) {
    return @()
  }

  $items = Get-ChildItem -LiteralPath $docsRoot -Recurse -File |
    Where-Object {
      ($_.Extension -ieq ".doc" -or $_.Extension -ieq ".docx") -and
      -not $_.Name.StartsWith('~$') -and
      $_.Name -match '^(\d{1,3})(?=[-.\s]|$)'
    }

  foreach ($item in $items) {
    if ($item.Name -notmatch '^(\d{1,3})(?=[-.\s]|$)') {
      continue
    }

    $number = [int]$Matches[1]
    $code = "BM-{0:D3}" -f $number
    $relativePath = Convert-ToPortableRelativePath -Root $RepoRoot -Path $item.FullName

    [pscustomobject]@{
      Code = $code
      SourcePath = $item.FullName
      RelativePath = $relativePath
      Extension = $item.Extension.ToLowerInvariant()
      Score = Get-SourceScore -RelativePath $relativePath -Extension $item.Extension
    }
  }
}

function Get-CanonicalTemplateSources {
  param(
    [Parameter(Mandatory = $true)] [string] $RepoRoot,
    [string[]] $Codes = @()
  )

  $wanted = @{}
  foreach ($code in $Codes) {
    if ($code) { $wanted[$code.ToUpperInvariant()] = $true }
  }

  $candidates = Get-TemplateSourceCandidates -RepoRoot $RepoRoot
  if ($wanted.Count -gt 0) {
    $candidates = $candidates | Where-Object { $wanted.ContainsKey($_.Code) }
  }

  $candidates |
    Group-Object Code |
    ForEach-Object {
      $_.Group |
        Sort-Object @{ Expression = "Score"; Descending = $true }, RelativePath |
        Select-Object -First 1
    } |
    Sort-Object Code
}

function Copy-DocxSource {
  param(
    [Parameter(Mandatory = $true)] [string] $SourcePath,
    [Parameter(Mandatory = $true)] [string] $TargetPath
  )

  Copy-Item -LiteralPath $SourcePath -Destination $TargetPath -Force
}

function Convert-DocSourceWithWord {
  param(
    [Parameter(Mandatory = $true)] $Word,
    [Parameter(Mandatory = $true)] [string] $SourcePath,
    [Parameter(Mandatory = $true)] [string] $TargetPath
  )

  $document = $null
  try {
    $document = $Word.Documents.Open($SourcePath, $false, $true)
    $document.SaveAs2($TargetPath, 16)
  } finally {
    if ($null -ne $document) {
      $document.Close($false)
    }
  }
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$normalizedRoot = Join-Path $repoRoot "storage\templates\normalized-docx"
$sources = @(Get-CanonicalTemplateSources -RepoRoot $repoRoot -Codes $Codes)

if ($sources.Count -eq 0) {
  Write-Output "[normalize] no template sources found."
  exit 0
}

$needsWord = $sources | Where-Object { $_.Extension -ieq ".doc" } | Select-Object -First 1
$word = $null

try {
  if ($null -ne $needsWord) {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
  }

  $converted = 0
  $copied = 0
  $skipped = 0

  foreach ($source in $sources) {
    $targetDir = Join-Path $normalizedRoot $source.Code
    $targetPath = Join-Path $targetDir "$($source.Code)_normalized.docx"

    if ((Test-Path -LiteralPath $targetPath) -and -not $Force) {
      Write-Output "[normalize] skip $($source.Code): normalized DOCX already exists."
      $skipped += 1
      continue
    }

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

    if ($PSCmdlet.ShouldProcess($source.RelativePath, "write $targetPath")) {
      if ($source.Extension -ieq ".docx") {
        Copy-DocxSource -SourcePath $source.SourcePath -TargetPath $targetPath
        $copied += 1
      } else {
        Convert-DocSourceWithWord -Word $word -SourcePath $source.SourcePath -TargetPath $targetPath
        $converted += 1
      }

      if (-not (Test-Path -LiteralPath $targetPath)) {
        throw "Normalized DOCX was not created for $($source.Code): $targetPath"
      }

      Write-Output "[normalize] ready $($source.Code): $($source.RelativePath)"
    }
  }

  Write-Output "[normalize] done: converted=$converted copied=$copied skipped=$skipped total=$($sources.Count)"
} finally {
  if ($null -ne $word) {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }
}
