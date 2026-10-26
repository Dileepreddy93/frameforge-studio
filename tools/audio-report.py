"""Compare an episode's re-voiced audio with an earlier snapshot of it, line by line.

  .venv/bin/python -I tools/audio-report.py <before-dir> projects/<id>.frameforge.json <out-dir>

<before-dir> holds the old lines (shot-NN.wav, lines.json), mix.mp3 and project.json. The new audio is read from
audio/<id>/. Writes <out-dir>/report.json, report.md, after/ (copies of the new lines and mixes) and ab-lines.wav
(every line, old then new, with a short gap) to judge by ear.
Pitch is the median f0 of the voiced frames (autocorrelation, 60-400 Hz); loudness and true peak come from ffmpeg's
ebur128 filter.
"""
import json
import os
import re
import shutil
import subprocess
import sys

import numpy as np
import soundfile

FPS = 30


def ebur128(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    summary = r.stderr[r.stderr.rfind("Summary:"):]
    integrated = float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summary).group(1))
    peak = float(re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summary).group(1))
    return integrated, peak


def median_f0(path):
    audio, rate = soundfile.read(path, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    frame, hop = int(rate * 0.04), int(rate * 0.01)
    lo, hi = int(rate / 400), int(rate / 60)
    level = np.sqrt(np.mean(audio ** 2)) if len(audio) else 0
    f0s = []
    for start in range(0, len(audio) - frame, hop):
        x = audio[start:start + frame]
        if np.sqrt(np.mean(x ** 2)) < level * 0.5:
            continue
        x = x - x.mean()
        ac = np.correlate(x, x, "full")[frame - 1:]
        if ac[0] <= 0:
            continue
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] / ac[0] > 0.5:
            f0s.append(rate / lag)
    return float(np.median(f0s)) if f0s else None


def semitones(a, b):
    return 12 * np.log2(b / a) if a and b else None


def cue_times(project):
    """Each music cue's start, as tools/build-audio.mjs places it, with the shot it belongs to."""
    clock, at = 0.0, {}
    for s in project["shots"]:
        lead = s.get("timing", {}).get("lead", 0.15)
        seconds = s.get("voice", {}).get("seconds", 0)
        at[s["id"]] = {"start": clock, "end": clock + s["duration"], "lineEnd": clock + lead + seconds}
        clock = round((clock + s["duration"]) * FPS) / FPS
    out = []
    for c in project["audio"].get("music", {}).get("cues", []):
        p = at[c["shot"]]
        start = p["lineEnd"] + 0.1 if c.get("at") == "afterLine" else p["start"]
        out.append({"shot": c["shot"], "style": c["style"], "at": c.get("at", "shotStart"), "start": start,
                    "shotStart": p["start"], "shotEnd": p["end"], "lineEnd": p["lineEnd"]})
    return out, at


def main(before, project_file, out):
    project = json.load(open(project_file))
    old_project = json.load(open(os.path.join(before, "project.json")))
    pid = project["id"]
    new_dir = os.path.join("audio", pid)
    old_lines = {l["shot"]: l for l in json.load(open(os.path.join(before, "lines.json")))["lines"]}
    new_lines = {l["shot"]: l for l in json.load(open(os.path.join(new_dir, "lines", "lines.json")))["lines"]}
    os.makedirs(os.path.join(out, "after"), exist_ok=True)

    rows, ab, rate = [], [], 48000
    for s in project["shots"]:
        o, n = old_lines[s["id"]], new_lines[s["id"]]
        of, nf = os.path.join(before, o["file"]), os.path.join(new_dir, "lines", n["file"])
        shutil.copy(nf, os.path.join(out, "after", n["file"]))
        oi, op = ebur128(of)
        ni, np_ = ebur128(nf)
        o0, n0 = median_f0(of), median_f0(nf)
        old_shot = next(x for x in old_project["shots"] if x["id"] == s["id"])
        rows.append({"shot": s["id"], "speaker": s["speaker"], "voice": n["voice"], "emotion": n.get("emotion", "neutral"),
                     "text": s["dialogue"], "oldSeconds": o["seconds"], "newSeconds": n["seconds"],
                     "deltaSeconds": round(n["seconds"] - o["seconds"], 3),
                     "oldShot": old_shot["duration"], "newShot": s["duration"],
                     "oldLufs": oi, "newLufs": ni, "deltaLu": round(ni - oi, 1),
                     "oldF0": o0 and round(o0, 1), "newF0": n0 and round(n0, 1),
                     "deltaSemitones": None if semitones(o0, n0) is None else round(semitones(o0, n0), 2)})
        for f in (of, nf):
            a, r = soundfile.read(f, dtype="float32")
            assert r == rate, f
            ab += [a if a.ndim == 1 else a.mean(axis=1), np.zeros(int(rate * (0.35 if f == of else 0.9)), np.float32)]
    soundfile.write(os.path.join(out, "ab-lines.wav"), np.concatenate(ab), rate, subtype="PCM_16")
    for f in ("mix.mp3", "voice.mp3"):
        shutil.copy(os.path.join(new_dir, f), os.path.join(out, "after", f))

    masters = {"old": ebur128(os.path.join(before, "mix.mp3")), "new": ebur128(os.path.join(new_dir, "mix.mp3"))}
    old_cues, _ = cue_times(old_project)
    new_cues, at = cue_times(project)
    cues = [{**n, "oldStart": round(o["start"], 2), "start": round(n["start"], 2),
             "inShot": n["shotStart"] <= n["start"] < n["shotEnd"],
             "afterLine": n["at"] != "afterLine" or n["start"] >= n["lineEnd"]} for o, n in zip(old_cues, new_cues)]
    sfx = [{"shot": s["id"], "cue": c["cue"], "at": c["at"], "shotDuration": s["duration"],
            "lineEndsAt": round(s.get("timing", {}).get("lead", 0.15) + s["voice"]["seconds"], 2),
            "inShot": c["at"] < s["duration"]} for s in project["shots"] for c in s.get("sfx", [])]
    report = {"project": pid, "oldSeconds": round(sum(x["duration"] for x in old_project["shots"]), 2),
              "newSeconds": round(sum(x["duration"] for x in project["shots"]), 2),
              "master": {k: {"lufs": v[0], "truePeak": v[1]} for k, v in masters.items()},
              "lines": rows, "musicCues": cues, "sfx": sfx}
    json.dump(report, open(os.path.join(out, "report.json"), "w"), indent=1)

    md = [f"### {pid}: {report['oldSeconds']} s → {report['newSeconds']} s",
          f"Master (mix.mp3): {masters['old'][0]} → **{masters['new'][0]} LUFS**, "
          f"true peak {masters['old'][1]} → **{masters['new'][1]} dBTP**.", "",
          "| shot | who | emotion | line | old s | new s | Δ s | shot old → new | Δ LU | Δ pitch (st) |",
          "|---|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        st = "" if r["deltaSemitones"] is None else f"{r['deltaSemitones']:+.1f}"
        md.append(f"| {r['shot'][-2:]} | {r['speaker']} | {r['emotion']} | {r['text']} | {r['oldSeconds']:.2f} | "
                  f"{r['newSeconds']:.2f} | {r['deltaSeconds']:+.2f} | {r['oldShot']:.2f} → {r['newShot']:.2f} | "
                  f"{r['deltaLu']:+.1f} | {st} |")
    md += ["", "| music cue | shot | when | old start | new start | in its shot | after the line |", "|---|---|---|---|---|---|---|"]
    for c in cues:
        md.append(f"| {c['style']} | {c['shot'][-2:]} | {c['at']} | {c['oldStart']:.2f} | {c['start']:.2f} | "
                  f"{'yes' if c['inShot'] else 'NO'} | {'yes' if c['afterLine'] else 'NO'} |")
    md += ["", "| sound | shot | at (s into shot) | line ends at | shot length | inside the shot |", "|---|---|---|---|---|---|"]
    for x in sfx:
        md.append(f"| {x['cue']} | {x['shot'][-2:]} | {x['at']:.2f} | {x['lineEndsAt']:.2f} | {x['shotDuration']:.2f} | "
                  f"{'yes' if x['inShot'] else 'NO'} |")
    open(os.path.join(out, "report.md"), "w").write("\n".join(md) + "\n")
    print("\n".join(md))


if __name__ == "__main__":
    main(*sys.argv[1:4])
