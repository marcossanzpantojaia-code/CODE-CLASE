#!/usr/bin/env bash
# Auditoría de entorno (solo lectura) para AI_CINEMATIC_VIDEO_ENGINE — Linux/macOS.
# No instala nada ni modifica configuración. Las pruebas de encoder se hacen
# contra "-f null -", así que no escribe ficheros.
#
# Uso:  bash scripts/audit-env.sh [--network] > reports/env-audit.txt
#   --network  comprueba también la conectividad con registros y hosts de ficheros.

set -u
CHECK_NETWORK=0
[ "${1:-}" = "--network" ] && CHECK_NETWORK=1

section() { printf '\n=== %s ===\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

section "FECHA"
date -u '+%Y-%m-%dT%H:%M:%SZ'

section "SISTEMA"
uname -srm
[ -r /etc/os-release ] && . /etc/os-release && echo "$PRETTY_NAME"
echo "CPU lógicas: $(getconf _NPROCESSORS_ONLN 2>/dev/null || echo '?')"
if have lscpu; then lscpu | grep -m1 'Model name' | sed 's/  */ /g'; fi
if have free; then free -h | awk 'NR<=2'; fi
df -h . | awk 'NR==1 || NR==2'

section "GPU"
if [ -d /dev/dri ]; then ls /dev/dri; else echo "/dev/dri: no existe (sin VAAPI/QSV)"; fi
if have nvidia-smi; then nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
else echo "nvidia-smi: no encontrado (sin GPU NVIDIA visible)"; fi

section "HERRAMIENTAS"
for t in ffmpeg ffprobe node npm python3 pip3 git git-lfs convert sox blender resolve; do
  if have "$t"; then printf '%-10s %s\n' "$t" "$(command -v "$t")"; else printf '%-10s NO ENCONTRADO\n' "$t"; fi
done
have node && echo "node $(node --version)"
have python3 && python3 --version

if have ffmpeg; then
  section "FFMPEG"
  ffmpeg -hide_banner -version | head -1

  echo "-- Encoders necesarios"
  for e in libx264 aac libx265 prores_ks h264_nvenc h264_qsv h264_vaapi; do
    if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q " $e "; then printf '%-12s compilado\n' "$e"; else printf '%-12s NO\n' "$e"; fi
  done

  # Que un encoder de hardware esté compilado no significa que haya hardware:
  # se prueba a codificar un fotograma real.
  echo "-- Prueba funcional de encoders (1 fotograma)"
  for e in libx264 h264_nvenc h264_qsv; do
    if ffmpeg -hide_banner -loglevel error -f lavfi -i color=c=black:s=256x256:d=0.1 \
         -frames:v 1 -c:v "$e" -f null - >/dev/null 2>&1; then
      printf '%-12s FUNCIONA\n' "$e"
    else
      printf '%-12s no utilizable\n' "$e"
    fi
  done
  if [ -e /dev/dri/renderD128 ]; then
    if ffmpeg -hide_banner -loglevel error -vaapi_device /dev/dri/renderD128 \
         -f lavfi -i color=c=black:s=256x256:d=0.1 -vf 'format=nv12,hwupload' \
         -frames:v 1 -c:v h264_vaapi -f null - >/dev/null 2>&1; then
      echo "h264_vaapi   FUNCIONA"
    else
      echo "h264_vaapi   no utilizable"
    fi
  else
    echo "h264_vaapi   no utilizable (sin /dev/dri/renderD128)"
  fi

  echo "-- Filtros que usará el pipeline"
  filters=$(ffmpeg -hide_banner -filters 2>/dev/null)
  for f in zscale tonemap lut3d scdet blackdetect freezedetect silencedetect ebur128 loudnorm \
           signalstats xfade drawtext minterpolate vidstabdetect zoompan tile; do
    if printf '%s\n' "$filters" | grep -qE "^ [.A-Z]{3} $f "; then printf '%-14s sí\n' "$f"; else printf '%-14s NO\n' "$f"; fi
  done
fi

section "PYTHON (bibliotecas de análisis)"
if have python3; then
  python3 - <<'PY'
import importlib.util as u
for m in ["numpy", "librosa", "soundfile", "cv2", "scenedetect", "PIL"]:
    print(f"{m:12s} {'instalado' if u.find_spec(m) else 'NO'}")
PY
fi

section "NAVEGADOR HEADLESS (para Remotion)"
found=0
for p in /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell \
         "$HOME"/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell; do
  if [ -x "$p" ]; then echo "$p -> $("$p" --version 2>/dev/null)"; found=1; fi
done
[ "$found" = 0 ] && echo "Ninguno encontrado (Remotion lo descargará en la Fase 2)"

if [ "$CHECK_NETWORK" = 1 ]; then
  section "RED (código HTTP; 000 = bloqueado o sin resolución DNS)"
  for u in https://registry.npmjs.org https://pypi.org https://storage.googleapis.com \
           https://remotion.media https://www.remotion.dev https://github.com \
           https://media.githubusercontent.com https://drive.usercontent.google.com \
           https://www.dropbox.com https://onedrive.live.com; do
    printf '%-40s %s\n' "$u" "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 -I "$u" 2>/dev/null)"
  done
fi
