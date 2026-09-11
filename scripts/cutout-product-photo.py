#!/usr/bin/env python3
"""Flood-fill studio backgrounds and crop hardware to a transparent PNG."""
from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def color_dist(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    d = a.astype(np.float32) - b.astype(np.float32)
    return np.sqrt((d * d).sum(axis=-1))


def flood_alpha(rgb: np.ndarray, threshold: float) -> np.ndarray:
    h, w, _ = rgb.shape
    samples = [
        rgb[0, 0], rgb[0, w // 2], rgb[0, -1],
        rgb[h // 2, 0], rgb[h // 2, -1],
        rgb[-1, 0], rgb[-1, w // 2], rgb[-1, -1],
    ]
    bg = np.median(np.stack(samples), axis=0)
    close = color_dist(rgb, bg) <= threshold

    # Also treat near-white / near-navy / near-black edges as background
    lum = rgb.astype(np.float32).mean(axis=-1)
    sat = rgb.astype(np.float32).max(axis=-1) - rgb.astype(np.float32).min(axis=-1)
    extra = (lum >= 248) | ((lum <= 42) & (sat <= 45)) | ((lum <= 70) & (sat <= 28) & (rgb[:, :, 2] >= rgb[:, :, 0]))
    seed = close | extra

    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if seed[0, x]:
            q.append((0, x)); visited[0, x] = True
        if seed[h - 1, x]:
            q.append((h - 1, x)); visited[h - 1, x] = True
    for y in range(h):
        if seed[y, 0] and not visited[y, 0]:
            q.append((y, 0)); visited[y, 0] = True
        if seed[y, w - 1] and not visited[y, w - 1]:
            q.append((y, w - 1)); visited[y, w - 1] = True

    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if ny < 0 or nx < 0 or ny >= h or nx >= w or visited[ny, nx]:
                continue
            if not seed[ny, nx]:
                continue
            visited[ny, nx] = True
            q.append((ny, nx))

    alpha = np.where(visited, 0, 255).astype(np.uint8)
    # Leftover studio plates (navy pedestals) are often disconnected from the edge flood.
    r = rgb[:, :, 0].astype(np.int16)
    g = rgb[:, :, 1].astype(np.int16)
    b = rgb[:, :, 2].astype(np.int16)
    lum = (r + g + b) / 3.0
    navy = (b > r + 18) & (b > g + 10) & (lum < 120)
    alpha[navy] = 0
    return alpha


def crop_alpha(arr: np.ndarray, pad: int = 16) -> np.ndarray:
    a = arr[:, :, 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return arr
    y0, y1 = max(0, ys.min() - pad), min(arr.shape[0], ys.max() + 1 + pad)
    x0, x1 = max(0, xs.min() - pad), min(arr.shape[1], xs.max() + 1 + pad)
    return arr[y0:y1, x0:x1]


def cutout(src: Path, dest: Path, threshold: float, max_edge: int) -> None:
    Image.MAX_IMAGE_PIXELS = None
    im = Image.open(src).convert("RGBA")
    if max(im.size) > max_edge * 2:
        im.thumbnail((max_edge * 2, max_edge * 2), Image.Resampling.LANCZOS)
    arr = np.array(im)
    arr[:, :, 3] = flood_alpha(arr[:, :, :3], threshold)
    arr = crop_alpha(arr)
    out = Image.fromarray(arr)
    if max(out.size) > max_edge:
        out.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "PNG", optimize=True)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("src")
    p.add_argument("dest")
    p.add_argument("--threshold", type=float, default=36)
    p.add_argument("--max-edge", type=int, default=1400)
    args = p.parse_args()
    cutout(Path(args.src), Path(args.dest), args.threshold, args.max_edge)


if __name__ == "__main__":
    main()
