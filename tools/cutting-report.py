"""Cutting pace and camera life of a film, measured the way M4.3 measured the reference (Python + ffmpeg only).

  python3 -I tools/cutting-report.py <film.mp4> [--still 0.35] [--scene 0.22] [--json out.json]

- Cuts: ffmpeg scene detection, select=gt(scene,0.22). Shots = cuts + 1, mean shot = duration / shots.
- Motion: frames 1/15 s apart at 90x160 grey; frame change = mean absolute luma difference (0-255) between neighbours.
  Pairs that span a cut are left out. Reports the median change and the share of near-still pairs (change < --still).
  The default threshold 0.3 reproduces M4.3's 16% near-still on the M4 films (see docs/releases/M5_4_CUTTING.md).
"""
import argparse, json, re, statistics, subprocess

ap = argparse.ArgumentParser()
ap.add_argument('film'); ap.add_argument('--still', type=float, default=.3); ap.add_argument('--scene', type=float, default=.22)
ap.add_argument('--json')
a = ap.parse_args()

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.film],
                           capture_output=True, text=True, check=True).stdout)
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', a.film, '-an', '-vf', f"select='gt(scene,{a.scene})',showinfo", '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
cuts = [float(m) for m in re.findall(r'pts_time:([0-9.]+)', log)]

W, H, FPS = 90, 160, 15
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.film, '-an', '-vf', f'fps={FPS},scale={W}:{H}:flags=area,format=gray',
                      '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
n = len(raw) // (W * H)
frames = [raw[i * W * H:(i + 1) * W * H] for i in range(n)]
changes = []
for i in range(1, n):
    t0, t1 = (i - 1) / FPS, i / FPS
    if any(t0 - 1 / 30 < c <= t1 + 1 / 30 for c in cuts):
        continue
    p, q = frames[i - 1], frames[i]
    changes.append(sum(abs(x - y) for x, y in zip(p, q)) / (W * H))
shots = len(cuts) + 1
out = {'film': a.film, 'duration_s': round(dur, 2), 'cuts': len(cuts), 'shots': shots, 'mean_shot_s': round(dur / shots, 2),
       'median_change': round(statistics.median(changes), 2), 'near_still_pct': round(100 * sum(c < a.still for c in changes) / len(changes), 1),
       'still_threshold': a.still, 'pairs': len(changes), 'cut_times': [round(c, 2) for c in cuts]}
print(f"{a.film}: {shots} shots in {dur:.1f} s, mean {dur / shots:.2f} s; median change {out['median_change']}, "
      f"near-still {out['near_still_pct']}% (< {a.still})")
if a.json:
    json.dump(out, open(a.json, 'w'), indent=1)
