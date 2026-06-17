param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDocx,

  [Parameter(Mandatory = $true)]
  [string]$TargetPdf
)

$ErrorActionPreference = "Stop"

$SourceDocx = [System.IO.Path]::GetFullPath($SourceDocx)
$TargetPdf = [System.IO.Path]::GetFullPath($TargetPdf)

if (-not (Test-Path -LiteralPath $SourceDocx)) {
  throw "Không tìm thấy DOCX nguồn: $SourceDocx"
}

$TargetDir = Split-Path -Parent $TargetPdf
New-Item -ItemType Directory -Force $TargetDir | Out-Null

if (Test-Path -LiteralPath $TargetPdf) {
  Remove-Item -LiteralPath $TargetPdf -Force
}

$Word = $null
$Doc = $null

try {
  $Word = New-Object -ComObject Word.Application
  $Word.Visible = $false
  $Word.DisplayAlerts = 0

  try {
    $Word.Options.SaveNormalPrompt = $false
    $Word.Options.UpdateLinksAtOpen = $false
  } catch {}

  # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles)
  $Doc = $Word.Documents.Open(
    [string]$SourceDocx,
    $false,
    $true,
    $false
  )

  # wdExportFormatPDF = 17
  # Dùng ExportAsFixedFormat để giữ shape/line tốt hơn LibreOffice.
  $Doc.ExportAsFixedFormat(
    [string]$TargetPdf,
    17
  )

  $Doc.Close($false)
  $Doc = $null

  Start-Sleep -Milliseconds 500

  if (-not (Test-Path -LiteralPath $TargetPdf)) {
    throw "Word COM chạy xong nhưng không tạo PDF: $TargetPdf"
  }

  $PdfFile = Get-Item -LiteralPath $TargetPdf

  if ($PdfFile.Length -le 0) {
    throw "Word COM tạo PDF rỗng: $TargetPdf"
  }

  Write-Output "WORD_COM_PDF_OK: $TargetPdf"
}
finally {
  if ($Doc -ne $null) {
    try { $Doc.Close($false) } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($Doc) | Out-Null } catch {}
  }

  if ($Word -ne $null) {
    try { $Word.Quit() } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($Word) | Out-Null } catch {}
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
