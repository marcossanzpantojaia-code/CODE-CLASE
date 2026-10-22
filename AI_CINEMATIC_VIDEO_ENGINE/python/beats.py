"""Análisis rítmico de una pista con librosa: tempo, beats, onsets y energía.

Uso: python -I python/beats.py <audio>    (JSON por stdout)

Parámetros elegidos midiendo contra un click track de tiempos conocidos
(docs/FASE_2_INFRAESTRUCTURA.md): hop de 64 muestras a 22050 Hz y onsets sin
backtrack (error medio 3.3 ms, máximo 4.8 ms). beat_track solo aporta la rejilla
de tempo: sus tiempos se ajustan al onset más cercano en TypeScript.
"""
import json
import sys

import librosa
import numpy as np

SR = 22050
HOP = 64


def analyze(path: str) -> dict:
    y, sr = librosa.load(path, sr=SR, mono=True)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
    tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=HOP, units="time", trim=False)
    onset_frames = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=HOP, units="frames")
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=HOP)
    strength = env[onset_frames] / (env.max() or 1.0)
    rms = librosa.feature.rms(y=y, hop_length=HOP * 8)[0]
    return {
        "tool": f"librosa {librosa.__version__}",
        "params": {"sr": SR, "hop": HOP},
        "durationSec": float(len(y) / sr),
        "tempoBpm": float(np.atleast_1d(tempo)[0]),
        "beats": [round(float(t), 4) for t in beats],
        "onsets": [{"t": round(float(t), 4), "strength": round(float(s), 3)} for t, s in zip(onset_times, strength)],
        "rms": {"hopSec": HOP * 8 / sr, "values": [round(float(v), 4) for v in rms]},
    }


if __name__ == "__main__":
    json.dump(analyze(sys.argv[1]), sys.stdout)
