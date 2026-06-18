#!/usr/bin/env pwsh
# ---------------------------------------------------------
# free-ports.ps1 - Giải phóng cổng 3000 (Next.js) và 3001 (NestJS)
# trước khi `pnpm dev`.  Cross-platform cho Windows / *nix (PowerShell 7+).
# ---------------------------------------------------------
[CmdletBinding()]
param(
    [int[]]$Ports = @(3000, 3001)
)

$ErrorActionPreference = 'SilentlyContinue'

function Get-PortOwners {
    param([int[]]$PortList)
    $pids = @()
    foreach ($p in $PortList) {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            if ($c.OwningProcess -and $c.OwningProcess -ne 0) {
                $pids += [pscustomobject]@{ Port = $p; Pid = $c.OwningProcess }
            }
        }
    }
    $pids | Sort-Object Pid -Unique
}

function Get-ProcessInfo {
    param([int]$Pid)
    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$Pid" -ErrorAction SilentlyContinue
    if ($proc) {
        [pscustomobject]@{ Pid = $Pid; Name = $proc.Name; CommandLine = $proc.CommandLine }
    } else {
        [pscustomobject]@{ Pid = $Pid; Name = '?'; CommandLine = '' }
    }
}

function Test-IsCriticalPid {
    param([int]$Pid)
    if ($Pid -eq $PID) { return $true }
    if ($Pid -eq 0 -or $Pid -eq 4) { return $true }
    $proc = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if (-not $proc) { return $false }
    $name = $proc.ProcessName.ToLowerInvariant()
    return ($name -in @('explorer', 'svchost', 'csrss', 'wininit', 'lsass', 'services', 'dwm'))
}

$owners = Get-PortOwners -PortList $Ports
if (-not $owners) {
    Write-Host "[free-ports] Nothing listening on $($Ports -join ', '). OK." -ForegroundColor Green
    exit 0
}

Write-Host "[free-ports] Occupied ports detected:" -ForegroundColor Yellow
foreach ($o in $owners) {
    $info = Get-ProcessInfo -Pid $o.Pid
    Write-Host ("  - port {0,5}  pid {1,6}  {2}" -f $o.Port, $info.Pid, $info.Name)
}

$failed = @()
foreach ($o in $owners) {
    if (Test-IsCriticalPid -Pid $o.Pid) {
        Write-Host "[free-ports] Skipping critical pid $($o.Pid)." -ForegroundColor DarkYellow
        continue
    }
    try {
        Stop-Process -Id $o.Pid -Force -ErrorAction Stop
        Write-Host "[free-ports] Killed pid $($o.Pid) (port $($o.Port))." -ForegroundColor Cyan
    } catch {
        $failed += $o.Pid
        Write-Host "[free-ports] Could not kill pid $($o.Pid): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Verify
Start-Sleep -Milliseconds 400
$stillOccupied = Get-PortOwners -PortList $Ports
if ($stillOccupied) {
    Write-Host "[free-ports] WARN: ports still occupied: $($stillOccupied.Port -join ', ')" -ForegroundColor Red
    if ($failed.Count -gt 0) { exit 2 }
    exit 1
}

Write-Host "[free-ports] All target ports are free." -ForegroundColor Green
exit 0
