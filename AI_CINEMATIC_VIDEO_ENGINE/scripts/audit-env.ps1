# Auditoria de entorno (solo lectura) para AI_CINEMATIC_VIDEO_ENGINE - Windows.
# No instala nada, no modifica el registro ni la configuracion. Las pruebas de
# encoder codifican un fotograma contra "-f null -", sin escribir ficheros.
# Compatible con Windows PowerShell 5.1. El fichero es ASCII puro a proposito:
# PowerShell 5.1 lee los .ps1 sin BOM como Windows-1252 y algunos caracteres
# UTF-8 (raya, O acentuada) se convierten en comillas que rompen el parser.
#
# Uso (la politica de ejecucion se relaja solo para este proceso):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\audit-env.ps1 > env-audit-windows.txt
#
# ESTADO: NO VERIFICADO - escrito en un contenedor Linux sin PowerShell.

$ErrorActionPreference = 'Continue'

function Section($name) { ''; "=== $name ===" }

function Show-Path($label, $paths) {
    $hit = $null
    foreach ($p in $paths) {
        $found = Get-Item -Path $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $hit = $found; break }
    }
    if ($hit) { '{0,-28} {1}  (version: {2})' -f $label, $hit.FullName, $hit.VersionInfo.ProductVersion }
    else { '{0,-28} NO ENCONTRADO' -f $label }
}

Section 'FECHA'
(Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

Section 'SISTEMA'
$os = Get-CimInstance Win32_OperatingSystem
'{0} {1} (build {2}) {3}' -f $os.Caption, $os.Version, $os.BuildNumber, $os.OSArchitecture
Get-CimInstance Win32_Processor | ForEach-Object {
    'CPU: {0} - {1} nucleos / {2} hilos' -f $_.Name.Trim(), $_.NumberOfCores, $_.NumberOfLogicalProcessors
}
'RAM total: {0:N1} GB' -f ($os.TotalVisibleMemorySize / 1MB)
Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | ForEach-Object {
    'Disco {0} libre {1:N1} GB de {2:N1} GB' -f $_.DeviceID, ($_.FreeSpace / 1GB), ($_.Size / 1GB)
}
$longPaths = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
'Rutas largas (LongPathsEnabled): {0}' -f $(if ($longPaths -eq 1) { 'activado' } else { 'desactivado' })

Section 'GPU'
# AdapterRAM satura en 4 GB en WMI; la VRAM real sale de nvidia-smi si existe.
Get-CimInstance Win32_VideoController | ForEach-Object { '{0} - driver {1}' -f $_.Name, $_.DriverVersion }
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
    & nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
}

Section 'HERRAMIENTAS'
$present = @{}
foreach ($t in 'ffmpeg', 'ffprobe', 'node', 'npm', 'python', 'py', 'git', 'claude', 'wsl') {
    $cmd = Get-Command $t -ErrorAction SilentlyContinue | Select-Object -First 1
    $present[$t] = [bool]$cmd
    if ($cmd) { '{0,-10} {1}' -f $t, $cmd.Source } else { '{0,-10} NO ENCONTRADO' -f $t }
}
if ($present['node']) { 'node ' + (& node --version) }
# Si python apunta a WindowsApps\python.exe es el alias de la Microsoft Store, no un Python real.
if ($present['python']) { (& python --version 2>&1 | Out-String).Trim() }

if ($present['ffmpeg']) {
    Section 'FFMPEG'
    & ffmpeg -hide_banner -version | Select-Object -First 1

    $encoders = & ffmpeg -hide_banner -encoders 2>$null | Out-String
    '-- Encoders compilados'
    foreach ($e in 'libx264', 'aac', 'libx265', 'prores_ks', 'h264_nvenc', 'h264_qsv', 'h264_amf') {
        $state = if ($encoders -match " $e ") { 'compilado' } else { 'NO' }
        '{0,-12} {1}' -f $e, $state
    }

    # Compilado no significa utilizable: se codifica un fotograma real.
    '-- Prueba funcional de encoders (1 fotograma)'
    foreach ($e in 'libx264', 'h264_nvenc', 'h264_qsv', 'h264_amf') {
        & ffmpeg -hide_banner -loglevel error -f lavfi -i 'color=c=black:s=256x256:d=0.1' -frames:v 1 -c:v $e -f null - 2>$null | Out-Null
        $state = if ($LASTEXITCODE -eq 0) { 'FUNCIONA' } else { 'no utilizable' }
        '{0,-12} {1}' -f $e, $state
    }

    $filters = & ffmpeg -hide_banner -filters 2>$null | Out-String
    '-- Filtros que usara el pipeline'
    foreach ($f in 'zscale', 'tonemap', 'lut3d', 'scdet', 'blackdetect', 'silencedetect', 'ebur128', 'loudnorm', 'signalstats', 'xfade', 'drawtext', 'minterpolate', 'tile') {
        $state = if ($filters -match "(?m)^ [.A-Z]{3} $f ") { 'si' } else { 'NO' }
        '{0,-14} {1}' -f $f, $state
    }
}

if ($present['python']) {
    Section 'PYTHON (bibliotecas de analisis)'
    $py = @'
import importlib.util as u
for m in ["numpy", "librosa", "soundfile", "cv2", "scenedetect"]:
    print(f"{m:12s} {'instalado' if u.find_spec(m) else 'NO'}")
'@
    $py | & python -
}

Section 'APLICACIONES DE EDICION'
Show-Path 'DaVinci Resolve' @("$env:ProgramFiles\Blackmagic Design\DaVinci Resolve\Resolve.exe")
Show-Path 'Resolve scripting (modulos)' @("$env:ProgramData\Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting\Modules\DaVinciResolveScript.py")
Show-Path 'After Effects' @("$env:ProgramFiles\Adobe\Adobe After Effects *\Support Files\AfterFX.exe")
Show-Path 'After Effects aerender' @("$env:ProgramFiles\Adobe\Adobe After Effects *\Support Files\aerender.exe")
Show-Path 'CapCut' @("$env:LOCALAPPDATA\CapCut\Apps\CapCut.exe", "$env:ProgramFiles\CapCut\CapCut.exe")
Show-Path 'Chrome' @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe")
