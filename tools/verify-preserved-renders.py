#!/usr/bin/env python3
"""Read-only handoff asset SHA-256 validator; uses no network or secrets."""
import hashlib
import json
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
d = json.loads((root / "docs/RENDER_ASSET_CATALOG.json").read_text())
assert d["schema"] == "frameforge.render-asset-catalog/1"
failures = []
seen = set()
for item in d["assets"]:
    path = item["path"]
    if path in seen:
        failures.append("Duplicate artifact: " + path)
        continue
    seen.add(path)
    file = root / path
    if not file.is_file():
        failures.append("Missing artifact: " + path)
        continue
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    if digest != item["actual_sha256"] or file.stat().st_size != item["size_bytes"]:
        failures.append("Artifact checksum/size mismatch: " + path)
    else:
        print("OK", path)
manifest = root / "docs/RENDER_FRAME_SHA256SUMS.txt"
if not manifest.is_file():
    failures.append("Missing 3D frame checksum manifest")
else:
    records = [x for x in manifest.read_text().splitlines() if x and not x.startswith("#")]
    if len(records) != 25:
        failures.append("Expected 25 3D-art evidence entries, got " + str(len(records)))
    for line in records:
        parts = line.split("  ", 1)
        if len(parts) != 2:
            failures.append("Malformed hash line: " + line[:50])
            continue
        digest, name = parts
        path = root / name
        if not path.is_file():
            failures.append("Missing frame: " + name)
        elif hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            failures.append("Frame hash mismatch: " + name)
        else:
            print("OK", name)
if failures:
    print("HANDOFF_MEDIA_VERIFICATION_FAILED", *failures, sep="\n- ", file=sys.stderr)
    sys.exit(1)
print("HANDOFF_MEDIA_VERIFICATION_PASS", len(seen), "catalog assets and 25 3D art evidence files")
