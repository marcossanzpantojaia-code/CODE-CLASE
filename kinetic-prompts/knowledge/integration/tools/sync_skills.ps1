<#
sync_skills.ps1 — copia las 4 Skills de la biblioteca a la carpeta .claude\skills de UN PROYECTO DE PRUEBA.
Estado: PROPUESTO. NO EJECUTADO. Ejecutar solo con autorización expresa del usuario.

Cambios de seguridad (lote 12) respecto a la versión anterior:
- Ya NO usa robocopy /MIR (que borra en el destino todo lo que no esté en el origen).
- Por defecto es una SIMULACIÓN: no escribe nada salvo que se pase -Apply.
- Por defecto escribe en <Proyecto>\.claude\skills (ámbito de proyecto), nunca en la carpeta personal
  %USERPROFILE%\.claude\skills; esta última se rechaza siempre.
- Se niega a escribir en un destino que ya exista y no tenga la marca .web-library-skill
  (protege Skills ajenas con el mismo nombre) y en cualquier destino que sea una unión/enlace (junction o symlink).
- Copia con Copy-Item (sin purgar) y comprueba errores; se detiene ante el primero.

Uso:
  pwsh -File sync_skills.ps1 -Library C:\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY -Project C:\sandbox\wel-test           # simulación
  pwsh -File sync_skills.ps1 -Library C:\knowledge\WEB_ENGINEERING_KNOWLEDGE_LIBRARY -Project C:\sandbox\wel-test -Apply    # copia real

Alternativa sin copiar nada (recomendada para la prueba mínima): claude --add-dir <Library> (ver integration/MINIMAL_INTEGRATION_TEST.md).
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Library,
  [Parameter(Mandatory = $true)][string]$Project,
  [switch]$Apply
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$skills = @('web-library-router', 'web-commercial-site', 'web-cinematic-site', 'web-qa-validation')
$marker = '.web-library-skill'

function Fail([string]$msg) { Write-Error $msg; exit 1 }

try {
  $libFull = (Resolve-Path -LiteralPath $Library).Path
  $projFull = (Resolve-Path -LiteralPath $Project).Path
} catch { Fail "Ruta inexistente: $($_.Exception.Message)" }

if (-not (Test-Path -LiteralPath (Join-Path $libFull 'KNOWLEDGE_INDEX.md'))) { Fail "No parece la biblioteca (falta KNOWLEDGE_INDEX.md): $libFull" }

$personal = Join-Path $env:USERPROFILE '.claude'
if ($projFull.TrimEnd('\') -ieq $env:USERPROFILE.TrimEnd('\') -or $projFull -like "$personal*") {
  Fail "Destino rechazado: no se escribe en la configuración personal ($personal). Usa una carpeta de proyecto de prueba."
}
if ($projFull -like "$libFull*") { Fail "Destino rechazado: el proyecto no puede estar dentro de la biblioteca." }

$dstRoot = Join-Path $projFull '.claude\skills'
Write-Output ("Modo: " + ($(if ($Apply) { 'APLICAR' } else { 'SIMULACIÓN (no se escribe nada)' })))
Write-Output "Origen:  $libFull\skills"
Write-Output "Destino: $dstRoot"

foreach ($s in $skills) {
  $src = Join-Path $libFull "skills\$s"
  $dst = Join-Path $dstRoot $s
  if (-not (Test-Path -LiteralPath (Join-Path $src 'SKILL.md'))) { Fail "Falta $src\SKILL.md" }

  if (Test-Path -LiteralPath $dst) {
    $item = Get-Item -LiteralPath $dst -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { Fail "Destino es una unión o enlace simbólico; no se toca: $dst" }
    if (-not (Test-Path -LiteralPath (Join-Path $dst $marker))) { Fail "Ya existe $dst y no es una copia de esta biblioteca (sin $marker). No se sobrescribe." }
    $accion = 'actualizar (copia previa de la biblioteca)'
  } else {
    $accion = 'crear'
  }
  Write-Output "[$s] $accion"

  if ($Apply) {
    try {
      New-Item -ItemType Directory -Force -Path $dst | Out-Null
      Copy-Item -LiteralPath (Join-Path $src 'SKILL.md') -Destination (Join-Path $dst 'SKILL.md') -Force
      Set-Content -LiteralPath (Join-Path $dst $marker) -Value "origen=$src`nfecha=$(Get-Date -Format o)" -Encoding UTF8
    } catch { Fail "Error copiando $s : $($_.Exception.Message)" }
  }
}
if (-not $Apply) { Write-Output 'Simulación terminada. Repite con -Apply para copiar.' } else { Write-Output 'Copia terminada.' }
