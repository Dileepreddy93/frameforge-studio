"""Generate one clean voice file per dialogue line with local Kokoro TTS.

Each line is synthesised, delivered with its speaker's emotion in that shot (src/voice-emotion.js,
through tools/voice-emotion.mjs: the same code as the studio's browser voices), trimmed of
leading/trailing silence, gained to -18 LUFS (plus the emotion's offset) with a peak limiter
(about -2 dBTP) and given a 60 ms lead-in and 100 ms tail, as a 48 kHz mono WAV, so the line's
real length can drive the shot timing.

  .venv/bin/python -I tools/voice_lines.py episode projects/zero-latency.frameforge.json audio/zero-latency
  .venv/bin/python -I tools/voice_lines.py audition dev am_michael,am_adam "Line one." "Line two." --out DIR [--emotion worried]

Voices come from characters[].voice.kokoro = {"voice": "am_michael", "speed": 1.0}.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import soundfile
from kokoro_onnx import Kokoro

CACHE = os.path.expanduser("~/.cache/hyperframes/tts")
MODEL = os.environ.get("KOKORO_MODEL", CACHE + "/models/kokoro-v1.0.onnx")
VOICES = os.environ.get("KOKORO_VOICES", CACHE + "/voices/voices-v1.0.bin")
TARGET_LUFS, TRUE_PEAK = -18.0, -2.0
LEAD_IN, TAIL = 0.06, 0.10  # seconds of silence kept around each line; the voice starts at LEAD_IN
TRIM = "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.02"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMOTION_TOOL = os.path.join(ROOT, "tools", "voice-emotion.mjs")


def run_ffmpeg(*args):
    return subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-y", *args],
                          check=True, capture_output=True, text=True)


def deliveries():
    """Every emotion's delivery settings, from src/voice-emotion.js."""
    out = subprocess.run(["node", EMOTION_TOOL, "--delivery"], check=True, capture_output=True, text=True).stdout
    return json.loads(out)["emotions"]


DELIVERY = deliveries()


def line_emotion(shot):
    """The speaker's emotion in this shot (older files kept DEV's in acting.devEmotion)."""
    cast = (shot.get("cast") or {}).get(shot["speaker"]) or {}
    legacy = (shot.get("acting") or {}).get("devEmotion") if shot["speaker"] == "dev" else None
    return cast.get("emotion") or legacy or "neutral"


def clean(raw_wav, out_wav, gain=0.0):
    """Trim both ends, gain to a fixed speech level with a peak limiter, add a short lead-in and tail."""
    trim = f"{TRIM},areverse,{TRIM},areverse,afade=t=in:d=0.005"
    probe = run_ffmpeg("-i", raw_wav, "-af", f"{trim},loudnorm=print_format=json", "-f", "null", "-")
    measured = float(json.loads(probe.stderr[probe.stderr.rindex("{"):])["input_i"])
    limit = 10 ** ((TRUE_PEAK - 0.5) / 20)  # sample-peak ceiling leaves headroom for true peak
    run_ffmpeg("-i", raw_wav, "-af",
               f"{trim},aresample=48000,volume={TARGET_LUFS + gain - measured:.2f}dB,"
               f"alimiter=limit={limit:.3f}:attack=3:release=40:level=disabled,"
               f"adelay={int(LEAD_IN * 1000)}:all=1,apad=pad_dur={TAIL}",
               "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", out_wav)
    return soundfile.info(out_wav).duration


def synth(kokoro, text, voice, speed, out_wav, emotion="neutral"):
    d = DELIVERY[emotion]
    samples, rate = kokoro.create(text, voice=voice, speed=speed * d["speed"], lang="en-us")
    with tempfile.NamedTemporaryFile(suffix=".wav") as raw:
        if emotion == "neutral":  # exactly as before emotions
            soundfile.write(raw.name, samples, rate)
        else:
            soundfile.write(raw.name, samples, rate, subtype="FLOAT")
            subprocess.run(["node", EMOTION_TOOL, raw.name, emotion], check=True)
        return clean(raw.name, out_wav, d["gain"])


def episode(args, kokoro):
    project = json.load(open(args.project))
    voices = {c["id"]: c["voice"].get("kokoro") for c in project["characters"]}
    missing = sorted({s["speaker"] for s in project["shots"] if not voices.get(s["speaker"])})
    if missing:
        sys.exit("No voice.kokoro set for: " + ", ".join(missing))
    os.makedirs(args.out, exist_ok=True)
    manifest = {"project": project["id"], "lufs": TARGET_LUFS, "truePeak": TRUE_PEAK, "lines": []}
    for shot in project["shots"]:
        v, emotion = voices[shot["speaker"]], line_emotion(shot)
        path = os.path.join(args.out, shot["id"] + ".wav")
        seconds = synth(kokoro, shot["dialogue"], v["voice"], v.get("speed", 1.0), path, emotion)
        manifest["lines"].append({"shot": shot["id"], "speaker": shot["speaker"], "voice": v["voice"],
                                  "speed": v.get("speed", 1.0), "emotion": emotion, "text": shot["dialogue"],
                                  "file": os.path.basename(path), "seconds": round(seconds, 3)})
        print(f"{shot['id']}  {v['voice']:<11} {emotion:<9} {seconds:5.2f}s  {shot['dialogue']}")
    with open(os.path.join(args.out, "lines.json"), "w") as f:
        json.dump(manifest, f, indent=1)


def audition(args, kokoro):
    os.makedirs(args.out, exist_ok=True)
    for voice in args.voices.split(","):
        parts = []
        for i, text in enumerate(args.lines):
            part = os.path.join(args.out, f".{args.character}-{voice}-{i}.wav")
            synth(kokoro, text, voice, args.speed, part, args.emotion)
            parts.append(part)
        # Join the lines with a 0.6 s pause so one file shows the voice's range.
        inputs = sum((["-i", p] for p in parts), [])
        chain = "".join(f"[{i}]apad=pad_dur=0.6[a{i}];" for i in range(len(parts)))
        chain += "".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1"
        out = os.path.join(args.out, f"{args.character}-{voice}.wav")
        run_ffmpeg(*inputs, "-filter_complex", chain, out)
        for p in parts:
            os.remove(p)
        print(out, f"{soundfile.info(out).duration:.2f}s")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="mode", required=True)
    e = sub.add_parser("episode")
    e.add_argument("project")
    e.add_argument("out")
    a = sub.add_parser("audition")
    a.add_argument("character")
    a.add_argument("voices")
    a.add_argument("lines", nargs="+")
    a.add_argument("--out", required=True)
    a.add_argument("--speed", type=float, default=1.0)
    a.add_argument("--emotion", choices=sorted(DELIVERY), default="neutral")
    args = parser.parse_args()
    kokoro = Kokoro(MODEL, VOICES)
    (episode if args.mode == "episode" else audition)(args, kokoro)


if __name__ == "__main__":
    main()
