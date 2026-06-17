$ErrorActionPreference = "Stop"

$Code = "BM-054"

$DocxDir = "C:\LUẬT\QUANLYVKS\storage\generated\cases\VKS-2026-0001\docx"
$PdfDir  = "C:\LUẬT\QUANLYVKS\storage\generated\cases\VKS-2026-0001\pdf"

Get-Process |
  Where-Object { $_.ProcessName -match 'WINWORD|AcroRd32|msedge|chrome|wps|wpp|et|soffice|soffice.bin' } |
  Stop-Process -Force -ErrorAction SilentlyContinue

$LatestDocx = Get-ChildItem $DocxDir -File |
  Where-Object { $_.Name -like "$Code*" } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $LatestDocx) {
  throw "Không tìm thấy DOCX mới nhất cho $Code trong $DocxDir"
}

New-Item -ItemType Directory -Force $PdfDir | Out-Null

$PdfPath = Join-Path $PdfDir ($LatestDocx.BaseName + "_WORD-COM.pdf")

if (Test-Path $PdfPath) {
  Remove-Item -LiteralPath $PdfPath -Force
}

Write-Host "DOCX source: $($LatestDocx.FullName)" -ForegroundColor Cyan
Write-Host "PDF output : $PdfPath" -ForegroundColor Cyan

$Word = $null
$Doc = $null

try {
  $Word = New-Object -ComObject Word.Application
  $Word.Visible = $false
  $Word.DisplayAlerts = 0

  # Tắt Protected View / prompt cơ bản nếu Word cho phép.
  try {
    $Word.Options.SaveNormalPrompt = $false
    $Word.Options.UpdateLinksAtOpen = $false
  } catch {}

  # Open(FileName, ConfirmConversions, ReadOnly, AddToRecentFiles)
  $Doc = $Word.Documents.Open(
    [string]$LatestDocx.FullName,
    $false,
    $true,
    $false
  )

  # wdExportFormatPDF = 17
  # ExportAsFixedFormat(OutputFileName, ExportFormat)
  # Không dùng [ref], không dùng SaveAs2.
  $Doc.ExportAsFixedFormat(
    [string]$PdfPath,
    17
  )

  $Doc.Close($false)
  $Doc = $null

  Start-Sleep -Seconds 1

  if (-not (Test-Path $PdfPath)) {
    throw "Word COM chạy xong nhưng không tạo PDF: $PdfPath"
  }

  $PdfFile = Get-Item $PdfPath

  if ($PdfFile.Length -le 0) {
    throw "PDF tạo ra nhưng dung lượng = 0 byte: $PdfPath"
  }

  Write-Host "PASS: PDF created by Microsoft Word COM." -ForegroundColor Green
  $PdfFile | Select-Object FullName, Length, LastWriteTime | Format-List

  Invoke-Item -LiteralPath $PdfPath
}
catch {
  Write-Host "FAIL: Convert bằng Word COM lỗi." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  throw
}
finally {
  if ($Doc -ne $null) {
    try { $Doc.Close($false) } catch {}
  }

  if ($Word -ne $null) {
    try { $Word.Quit() } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($Word) | Out-Null } catch {}
  }

  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
