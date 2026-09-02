#!/usr/bin/env python3
"""Inspect an attractor atlas for alpha, background, bounds, and crop risks."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from PIL import Image, ImageStat
except ImportError as exc:
    raise SystemExit("Pillow is required. Install it with: python -m pip install Pillow") from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero for an opaque likely-background or edge-touching paint.",
    )
    parser.add_argument("--edge-margin", type=float, default=0.015)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.is_file():
        raise SystemExit(f"Input image does not exist: {args.input}")

    original = Image.open(args.input)
    image = original.convert("RGBA")
    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    total = max(1, image.width * image.height)
    alpha_min, alpha_max = alpha.getextrema()
    alpha_bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    opaque_fraction = histogram[255] / total
    transparent_fraction = histogram[0] / total

    corner = max(1, min(image.size) // 24)
    boxes = (
        (0, 0, corner, corner),
        (image.width - corner, 0, image.width, corner),
        (0, image.height - corner, corner, image.height),
        (image.width - corner, image.height - corner, image.width, image.height),
    )
    corner_pixels = []
    for box in boxes:
        corner_pixels.extend(image.crop(box).convert("RGB").getdata())
    corner_luminance = sum(
        0.2126 * red + 0.7152 * green + 0.0722 * blue
        for red, green, blue in corner_pixels
    ) / (255.0 * max(1, len(corner_pixels)))
    corner_chroma = sum(max(pixel) - min(pixel) for pixel in corner_pixels) / (
        255.0 * max(1, len(corner_pixels))
    )

    warnings = []
    likely_opaque_light_background = (
        alpha_min == 255 and corner_luminance > 0.82 and corner_chroma < 0.12
    )
    if likely_opaque_light_background:
        warnings.append("opaque light neutral background likely baked into the image")

    touches_edge = False
    if alpha_bbox:
        left, top, right, bottom = alpha_bbox
        x_margin = image.width * args.edge_margin
        y_margin = image.height * args.edge_margin
        touches_edge = (
            left <= x_margin
            or top <= y_margin
            or right >= image.width - x_margin
            or bottom >= image.height - y_margin
        )
        if touches_edge:
            warnings.append("painted content touches the crop-safety margin")
    else:
        warnings.append("no painted alpha content detected")

    stats = ImageStat.Stat(image)
    report = {
        "path": str(args.input.resolve()),
        "source_mode": original.mode,
        "width": image.width,
        "height": image.height,
        "alpha_min": alpha_min,
        "alpha_max": alpha_max,
        "opaque_fraction": round(opaque_fraction, 6),
        "transparent_fraction": round(transparent_fraction, 6),
        "painted_bbox": alpha_bbox,
        "corner_luminance": round(corner_luminance, 6),
        "corner_chroma": round(corner_chroma, 6),
        "mean_rgba": [round(value, 3) for value in stats.mean],
        "warnings": warnings,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.strict and (likely_opaque_light_background or touches_edge or alpha_bbox is None):
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
