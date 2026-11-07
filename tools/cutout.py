"""Cut sprites out of a generated sheet with a flat background.

Usage: python tools/cutout.py <sheet.png> <out_dir> <prefix> [--min 1500] [--tol 26] [--keep-bg]

1. Samples the background colour from the sheet's border.
2. Flood-fills from the border through pixels within `tol` of it -> transparent
   (interior pixels of the same grey inside a sprite are kept).
3. Feathers the edge by one pixel.
4. Splits the remaining pixels into connected blobs, drops blobs smaller than `min`
   pixels, and writes each blob, cropped with a 4 px margin, as <prefix>-<n>.png,
   numbered left to right, top to bottom.
With --keep-bg it writes the whole sheet with the background removed instead.
Game-independent: works on any flat-background sheet.
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def main():
    args = sys.argv[1:]
    sheet, out_dir, prefix = args[0], args[1], args[2]
    opt = lambda name, d: int(args[args.index(name) + 1]) if name in args else d
    min_px, tol, keep = opt('--min', 1500), opt('--tol', 26), '--keep-bg' in args

    im = Image.open(sheet).convert('RGBA')
    a = np.asarray(im).astype(np.int16)
    h, w = a.shape[:2]
    border = np.concatenate([a[0, :, :3], a[-1, :, :3], a[:, 0, :3], a[:, -1, :3]])
    bg = np.median(border, axis=0)
    near = np.abs(a[:, :, :3] - bg).max(axis=2) <= tol

    # Flood fill from every border pixel through near-background pixels.
    bgmask = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near[y, x] and not bgmask[y, x]: bgmask[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near[y, x] and not bgmask[y, x]: bgmask[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and not bgmask[ny, nx]:
                bgmask[ny, nx] = True; q.append((ny, nx))

    alpha = Image.fromarray(np.where(bgmask, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    out = np.asarray(im).copy()
    out[:, :, 3] = np.minimum(out[:, :, 3], np.asarray(alpha))
    if keep:
        Image.fromarray(out).save(f'{out_dir}/{prefix}.png'); print(f'{prefix}.png'); return

    # Connected components (4-neighbour) on the foreground.
    fg = ~bgmask
    label = np.zeros((h, w), np.int32)
    blobs = []
    n = 0
    for sy in range(h):
        row = fg[sy]
        for sx in np.nonzero(row & (label[sy] == 0))[0]:
            if label[sy, sx]: continue
            n += 1; label[sy, sx] = n; q = deque([(sy, sx)]); cnt = 0
            y0, y1, x0, x1 = sy, sy, sx, sx
            while q:
                y, x = q.popleft(); cnt += 1
                y0, y1, x0, x1 = min(y0, y), max(y1, y), min(x0, x), max(x1, x)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not label[ny, nx]:
                        label[ny, nx] = n; q.append((ny, nx))
            if cnt >= min_px: blobs.append((y0, y1, x0, x1, n, cnt))
    # Order: rows (by centre y, banded), then x.
    blobs.sort(key=lambda b: (round(((b[0] + b[1]) / 2) / (h / 4)), b[2]))
    for i, (y0, y1, x0, x1, lab, cnt) in enumerate(blobs, 1):
        m = 4
        y0, y1, x0, x1 = max(0, y0 - m), min(h - 1, y1 + m), max(0, x0 - m), min(w - 1, x1 + m)
        crop = out[y0:y1 + 1, x0:x1 + 1].copy()
        keepmask = label[y0:y1 + 1, x0:x1 + 1] == lab
        # keep feathered edge pixels next to the blob, drop other blobs
        grown = np.asarray(Image.fromarray((keepmask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
        crop[:, :, 3] = np.where(grown, crop[:, :, 3], 0)
        name = f'{prefix}-{i}.png'
        Image.fromarray(crop).save(f'{out_dir}/{name}')
        print(f'{name} {x1 - x0 + 1}x{y1 - y0 + 1} at ({x0},{y0}) px={cnt}')


if __name__ == '__main__':
    main()
