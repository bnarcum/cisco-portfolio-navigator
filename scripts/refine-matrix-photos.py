#!/usr/bin/env python3
"""Download matrix device cutouts, defringe on white, and save retina PNGs."""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BRIDGE = ROOT / "matrix-bridge.json"
OUT_DIR = ROOT / "assets" / "matrix-photos"
CDN = "https://bnarcum.github.io/collaboration-device-matrix/devices/img-{}.webp"


def refine(img: Image.Image, *, feather: float = 1.0, alpha_cut: int = 20, scale: int = 2) -> Image.Image:
    img = img.convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    rgb = arr[..., :3]
    alpha = arr[..., 3]

    # Drop near-transparent dark specks that cause spiky halos on white.
    speck = (alpha > 0) & (alpha < alpha_cut) & (rgb.sum(axis=-1) < 210)
    arr[speck, 3] = 0
    arr[speck, :3] = 255

    a = arr[..., 3] / 255.0
    bg = 255.0
    edge = (a > 0) & (a < 1)
    for c in range(3):
        ch = arr[..., c]
        ch[edge] = np.clip((ch[edge] - bg * (1 - a[edge])) / np.maximum(a[edge], 0.08), 0, 255)

    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    r, g, b, alpha_ch = out.split()
    alpha_arr = np.array(alpha_ch, dtype=np.float32)
    h, w = alpha_arr.shape
    boundary = np.zeros((h, w), dtype=bool)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        shifted = np.roll(np.roll(alpha_arr, dy, axis=0), dx, axis=1)
        boundary |= (alpha_arr > 0) & (shifted == 0)
        boundary |= (alpha_arr > 0) & (shifted > 0) & (np.abs(alpha_arr - shifted) > 40)
    if feather > 0 and boundary.any():
        blurred = alpha_ch.filter(ImageFilter.GaussianBlur(feather))
        blur_arr = np.array(blurred, dtype=np.float32)
        mixed = alpha_arr.copy()
        mixed[boundary] = blur_arr[boundary]
        alpha_ch = Image.fromarray(np.clip(mixed, 0, 255).astype(np.uint8), "L")
    out = Image.merge("RGBA", (r, g, b, alpha_ch))

    if scale > 1:
        out = out.resize((out.width * scale, out.height * scale), Image.Resampling.LANCZOS)
    return out


def main() -> int:
    bridge = json.loads(BRIDGE.read_text())
    hashes = sorted({
        e["hash"]
        for e in bridge.get("products", {}).values()
        if e.get("hash") and not e.get("image")
    })
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0
    for h in hashes:
        dest = OUT_DIR / f"img-{h}.png"
        try:
            raw = urlopen(CDN.format(h), timeout=30).read()
            img = refine(Image.open(io.BytesIO(raw)))
            img.save(dest, optimize=True)
            print(f"ok  {h} -> {dest.name} ({img.width}x{img.height})")
            ok += 1
        except Exception as exc:
            print(f"err {h}: {exc}", file=sys.stderr)
    print(f"refined {ok}/{len(hashes)}")
    return 0 if ok == len(hashes) else 1


if __name__ == "__main__":
    raise SystemExit(main())
