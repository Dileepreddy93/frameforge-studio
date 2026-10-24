#!/usr/bin/env python3
"""FrameForge P0 exact-byte timestamped frame evidence generator. No overwrites."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def command(*args):
    result = subprocess.run(args, capture_output=True, text=True, check=True, timeout=180)
    return result.stdout


def evidence(source, output, timestamps, allow_own=False):
    source = source.resolve()
    if not source.is_file():
        raise ValueError('Source video not found: ' + str(source))
    if not allow_own and source.name != 'git-blame.mp4':
        raise ValueError('The exact filename git-blame.mp4 is required; use --allow-own for FrameForge QA only')
    probe = json.loads(command('ffprobe', '-v', 'error', '-count_frames',
                     '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,channels',
                     '-of', 'json', str(source)))
    duration = float(probe['format']['duration'])
    if not timestamps or len(timestamps) > 24 or any(t < 0 or t >= duration for t in timestamps):
        raise ValueError('Choose 1 to 24 timestamps strictly within source duration')
    if len(set(timestamps)) != len(timestamps):
        raise ValueError('Timestamps must be unique')
    output.mkdir(parents=True, exist_ok=False)
    frames = []
    for index, second in enumerate(timestamps, 1):
        filename = f'frame-{index:02d}-{int(round(second * 1000)):07d}ms.png'
        target = output / filename
        command('ffmpeg', '-nostdin', '-hide_banner', '-v', 'error', '-i', str(source),
                '-ss', f'{second:.3f}', '-frames:v', '1', '-an', '-y', str(target))
        if target.stat().st_size < 1000:
            raise ValueError('Empty or malformed extracted PNG: ' + str(target))
        frames.append({'timestamp_s': second, 'path': filename,
                       'size_bytes': target.stat().st_size, 'sha256': sha256(target)})
    result = {'schema': 'frameforge.reference-evidence/1',
              'source_name': source.name,
              'source_size_bytes': source.stat().st_size,
              'source_sha256': sha256(source),
              'identity_verified_against_publisher': False,
              'streams': probe['streams'],
              'duration_s': duration, 'frames': frames,
              'artistic_audio_caption_review': 'NOT DONE; inspect and listen to actual film manually',
              'extraction_method': 'ffmpeg accurate seek after input to native PNG; no interpolation/resizing'}
    (output / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print('PHASE0_REFERENCE_FRAME_CAPTURE_PASS ' + json.dumps({
        'source': source.name, 'frames': len(frames),
        'source_sha256': result['source_sha256'], 'output': str(output)}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--times', required=True, help='Comma-delimited second offsets (e.g. 0.8,3,7.95)')
    parser.add_argument('--allow-own', action='store_true', help='Allow an original FrameForge sample for pipeline QA')
    args = parser.parse_args()
    times = [float(t.strip()) for t in args.times.split(',')]
    evidence(args.source, args.out, times, args.allow_own)


if __name__ == '__main__':
    main()
