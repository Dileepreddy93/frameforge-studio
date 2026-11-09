"""M5.3: light options side by side with the reference, with luma numbers (Pillow only, no numpy).

  python3 -I tools/light-options-sheet.py --frames DIR --project zero-latency --variants base,A,B,C \
     --rows "DEV close-up=1.58,ORANGE close-up=10.24,Wide=12.59,Screen=14.89" --out sheet.jpg \
     [--ref-video ~/Desktop/Animate/git-blame.mp4 --ref-times 1.5,14.2,33.6,43.5]

Frames come from tools/light-options.cjs (MASK=1 for the cast-only numbers). Luma is Pillow's 'L' (Rec.601) on the
whole frame, captions included, as in M4.3; 'cast' is the pixels that change when the cast is hidden. Reference
frames are extracted to <frames>/ref/ with ffmpeg; keep them out of the repo.
"""
import argparse, json, os, subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('--frames', required=True); ap.add_argument('--project', required=True)
ap.add_argument('--variants', required=True); ap.add_argument('--rows', required=True)
ap.add_argument('--out', required=True); ap.add_argument('--ref-video'); ap.add_argument('--ref-times')
ap.add_argument('--labels', default='{}', help='JSON {variant: "caption"}')
a = ap.parse_args()
variants = a.variants.split(','); rows = [r.split('=') for r in a.rows.split(',')]
labels = json.loads(a.labels)

def pct(hist, p):
    n = sum(hist); k = p / 100 * (n - 1); c = 0
    for v, h in enumerate(hist):
        c += h
        if c > k: return v
    return 255
def stats(img, mask=None):
    h = img.convert('L').histogram(mask)
    n = sum(h)
    if not n: return None
    return [pct(h, 5), sum(v * c for v, c in enumerate(h)) / n, pct(h, 95)]
def cast_mask(im, nc):
    d = ImageChops.difference(im.convert('RGB'), nc.convert('RGB')).split()
    m = ImageChops.lighter(ImageChops.lighter(d[0], d[1]), d[2])
    return m.point(lambda v: 255 if v > 10 else 0)

refs = {}
if a.ref_video:
    os.makedirs(os.path.join(a.frames, 'ref'), exist_ok=True)
    for (name, _), t in zip(rows, a.ref_times.split(',')):
        f = os.path.join(a.frames, 'ref', f'ref_{float(t):.2f}.png')
        if not os.path.exists(f):
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', os.path.expanduser(a.ref_video), '-frames:v', '1', f], check=True)
        refs[name] = (f, t)

TW, TH, LH = 270, 480, 58
cols = (['reference'] if refs else []) + variants
W, H = 175 + TW * len(cols), 40 + (TH + LH) * len(rows)
sheet = Image.new('RGB', (W, H), '#0b0a12'); dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 15); bold = ImageFont.truetype('DejaVuSans-Bold.ttf', 17)
except OSError:
    font = bold = ImageFont.load_default()
for j, c in enumerate(cols):
    dr.text((175 + j * TW + 8, 10), labels.get(c, c), fill='#ffffff', font=bold)
out = {}
for i, (name, t) in enumerate(rows):
    y = 40 + i * (TH + LH)
    dr.text((8, y + TH // 2), name, fill='#ffffff', font=bold)
    for j, c in enumerate(cols):
        if c == 'reference':
            f, rt = refs[name]; im = Image.open(f).convert('RGB'); s = stats(im); cs = None; tag = f'ref {rt} s'
        else:
            f = os.path.join(a.frames, f'{a.project}_{c}_{float(t):.2f}.png'); im = Image.open(f).convert('RGB')
            s = stats(im); nf = f[:-4] + '_nocast.png'; cs = None
            if os.path.exists(nf):
                m = cast_mask(im, Image.open(nf))
                if m.histogram()[255] > 0: cs = stats(im, m)
            tag = f'{t} s'
        out[f'{name}|{c}'] = {'frame': s, 'cast': cs, 'file': os.path.basename(f)}
        sheet.paste(im.resize((TW - 6, TH - 6)), (175 + j * TW + 3, y + 3))
        dr.text((175 + j * TW + 6, y + TH + 4), f'frame {s[0]:.0f} / {s[1]:.0f} / {s[2]:.0f}', fill='#ffffff', font=font)
        dr.text((175 + j * TW + 6, y + TH + 22), (f'cast  {cs[0]:.0f} / {cs[1]:.0f} / {cs[2]:.0f}' if cs else 'cast  —') + f'   ({tag})', fill='#a7a1c7', font=font)
sheet.save(a.out, quality=90)
json.dump(out, open(os.path.splitext(a.out)[0] + '.json', 'w'), indent=1)
for k, v in out.items():
    print(f"{k:32s} frame {v['frame'][0]:4.0f} {v['frame'][1]:6.1f} {v['frame'][2]:4.0f}" + (f"   cast {v['cast'][0]:4.0f} {v['cast'][1]:6.1f} {v['cast'][2]:4.0f}" if v['cast'] else ''))
