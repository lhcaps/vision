param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDocx,

  [Parameter(Mandatory = $true)]
  [string]$TargetPdf
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Log {
  param([string]$Message)
  Write-Host "[pdf-convert] $Message"
}

function Quote-Arg {
  param([string]$Value)
  return '"' + ($Value.Replace('"', '\"')) + '"'
}

function Copy-FileShared {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  $sourceStream = $null
  $destStream = $null

  try {
    $sourceStream = [System.IO.File]::Open(
      $Source,
      [System.IO.FileMode]::Open,
      [System.IO.FileAccess]::Read,
      [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete
    )

    $destStream = [System.IO.File]::Open(
      $Destination,
      [System.IO.FileMode]::Create,
      [System.IO.FileAccess]::Write,
      [System.IO.FileShare]::None
    )

    $sourceStream.CopyTo($destStream)
  } finally {
    if ($null -ne $destStream) { $destStream.Dispose() }
    if ($null -ne $sourceStream) { $sourceStream.Dispose() }
  }
}

if (-not (Test-Path -LiteralPath $SourceDocx)) {
  throw "Source DOCX not found: $SourceDocx"
}

$TargetDir = Split-Path -Parent $TargetPdf
if (-not (Test-Path -LiteralPath $TargetDir)) {
  New-Item -ItemType Directory -Force $TargetDir | Out-Null
}

$RunStamp = Get-Date -Format "yyyyMMdd-HHmmss-ffff"
$WorkDir = "C:\QVKSTemplateConvertTemp\pdf-convert-$PID-$RunStamp"
$InputDir = Join-Path $WorkDir "input"
$OutputDir = Join-Path $WorkDir "output"
$ValidateDir = Join-Path $WorkDir "validate"
$LoProfile = Join-Path $WorkDir "lo-profile"

New-Item -ItemType Directory -Force $InputDir | Out-Null
New-Item -ItemType Directory -Force $OutputDir | Out-Null
New-Item -ItemType Directory -Force $ValidateDir | Out-Null
New-Item -ItemType Directory -Force $LoProfile | Out-Null

$StagedDocx = Join-Path $InputDir "input.docx"
$StagedPdf = Join-Path $OutputDir "input.pdf"

Write-Log "Source DOCX: $SourceDocx"
Write-Log "Target PDF: $TargetPdf"
Write-Log "WorkDir: $WorkDir"

Copy-FileShared -Source $SourceDocx -Destination $StagedDocx

if (-not (Test-Path -LiteralPath $StagedDocx)) {
  throw "Failed to stage DOCX: $StagedDocx"
}

# Validate DOCX ZIP structure.
Add-Type -AssemblyName System.IO.Compression.FileSystem

$ValidateZip = Join-Path $ValidateDir "input.zip"
Copy-Item -LiteralPath $StagedDocx -Destination $ValidateZip -Force

try {
  [System.IO.Compression.ZipFile]::ExtractToDirectory($ValidateZip, $ValidateDir)
} catch {
  throw "Invalid DOCX zip structure. WorkDir=$WorkDir. Error=$($_.Exception.Message)"
}

foreach ($Part in @("[Content_Types].xml", "_rels\.rels", "word\document.xml")) {
  $PartPath = Join-Path $ValidateDir $Part

  if (-not (Test-Path -LiteralPath $PartPath)) {
    throw "Invalid DOCX. Missing part: $Part. WorkDir=$WorkDir"
  }
}

$LibreOfficeOk = $false
$SofficeCandidates = @(
  "C:\Program Files\LibreOffice\program\soffice.exe",
  "C:\Program Files (x86)\LibreOffice\program\soffice.exe"
)

$Soffice = $SofficeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if ($null -ne $Soffice) {
  try {
    Write-Log "Trying LibreOffice: $Soffice"

    $SofficeDir = Split-Path -Parent $Soffice
    $LoProfileUri = "file:///" + ($LoProfile.Replace("\", "/"))

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Soffice
    $psi.WorkingDirectory = $SofficeDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    foreach ($envName in @("PYTHONHOME", "PYTHONPATH", "UNO_PATH")) {
      if ($psi.EnvironmentVariables.ContainsKey($envName)) {
        $psi.EnvironmentVariables.Remove($envName)
      }
    }

    $args = @(
      "-env:UserInstallation=$LoProfileUri",
      "--headless",
      "--nologo",
      "--nofirststartwizard",
      "--norestore",
      "--convert-to",
      "pdf",
      "--outdir",
      (Quote-Arg $OutputDir),
      (Quote-Arg $StagedDocx)
    )

    $psi.Arguments = $args -join " "

    $p = [System.Diagnostics.Process]::Start($psi)
    $completed = $p.WaitForExit(45000)

    if (-not $completed) {
      try { $p.Kill() } catch {}
      Write-Log "LibreOffice timeout after 45s. Fallback to Word COM."
    } else {
      $stdout = $p.StandardOutput.ReadToEnd()
      $stderr = $p.StandardError.ReadToEnd()

      [System.IO.File]::WriteAllText((Join-Path $WorkDir "libreoffice.stdout.log"), $stdout, [System.Text.UTF8Encoding]::new($false))
      [System.IO.File]::WriteAllText((Join-Path $WorkDir "libreoffice.stderr.log"), $stderr, [System.Text.UTF8Encoding]::new($false))

      if ($p.ExitCode -eq 0 -and (Test-Path -LiteralPath $StagedPdf)) {
        $LibreOfficeOk = $true
        Write-Log "LibreOffice OK."
      } else {
        Write-Log "LibreOffice failed. exitCode=$($p.ExitCode); stderr=$stderr"
      }
    }
  } catch {
    Write-Log "LibreOffice exception: $($_.Exception.Message)"
  }
} else {
  Write-Log "LibreOffice not found. Skip."
}

if (-not $LibreOfficeOk) {
  Write-Log "Trying Microsoft Word COM fallback..."

  $word = $null
  $doc = $null

  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $doc = $word.Documents.Open(
      $StagedDocx,
      $false,
      $false,
      $false
    )

    $doc.Repaginate()

    # 17 = wdExportFormatPDF
    $doc.ExportAsFixedFormat(
      $StagedPdf,
      17
    )

    Write-Log "Word COM OK."
  } catch {
    throw "Word COM conversion failed. WorkDir=$WorkDir. Error=$($_.Exception.Message)"
  } finally {
    if ($null -ne $doc) {
      try { $doc.Close($false) } catch {}
    }

    if ($null -ne $word) {
      try { $word.Quit() } catch {}
    }

    if ($null -ne $doc) {
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc)
    }

    if ($null -ne $word) {
      [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }

    $doc = $null
    $word = $null

    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  }
}

if (-not (Test-Path -LiteralPath $StagedPdf)) {
  throw "PDF conversion failed. No staged PDF. WorkDir=$WorkDir"
}

$pdfSize = (Get-Item -LiteralPath $StagedPdf).Length
if ($pdfSize -le 0) {
  throw "PDF conversion produced empty PDF. WorkDir=$WorkDir"
}

Copy-Item -LiteralPath $StagedPdf -Destination $TargetPdf -Force

if (-not (Test-Path -LiteralPath $TargetPdf)) {
  throw "Failed to copy PDF to target: $TargetPdf. WorkDir=$WorkDir"
}

Write-Log "PDF created: $TargetPdf"