#!/usr/bin/env python3
"""Prepare an RGBA artwork atlas for use as a hidden fluid attractor."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is required. Install it with: python -m pip install Pillow") from exc


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def detect_background(image: Image.Image) -> str:
    alpha = image.getchannel("A")
    extrema = alpha.getextrema()
    if extrema[0] < 250:
        return "alpha"

    width, height = image.size
    radius = max(1, min(width, height) // 24)
    boxes = (
        (0, 0, radius, radius),
        (width - radius, 0, width, radius),
        (0, height - radius, radius, height),
        (width - radius, height - radius, width, height),
    )
    samples = []
    for box in boxes:
        samples.extend(image.crop(box).convert("RGB").getdata())
    if not samples:
        return "none"

    mean_luminance = sum(
        0.2126 * red + 0.7152 * green + 0.0722 * blue
        for red, green, blue in samples
    ) / (255.0 * len(samples))
    mean_chroma = sum(max(pixel) - min(pixel) for pixel in samples) / (255.0 * len(samples))
    return "light" if mean_luminance > 0.82 and mean_chroma < 0.12 else "none"


def derive_light_background_alpha(
    image: Image.Image,
    threshold: float,
    softness: float,
    chroma_softness: float,
) -> Image.Image:
    pixels = []
    safe_softness = max(softness, 1e-6)
    safe_chroma = max(chroma_softness, 1e-6)
    for red, green, blue, source_alpha in image.getdata():
        red_f, green_f, blue_f = red / 255.0, green / 255.0, blue / 255.0
        luminance = 0.2126 * red_f + 0.7152 * green_f + 0.0722 * blue_f
        chroma = max(red_f, green_f, blue_f) - min(red_f, green_f, blue_f)
        darkness_gate = clamp01((threshold - luminance) / safe_softness)
        chroma_gate = clamp01(chroma / safe_chroma)
        # Chroma preserves pale cinnabar/green/blue washes that luminance-only
        # extraction would erase. Neutral mist still needs visual review.
        content_gate = max(darkness_gate, chroma_gate * 0.92)
        alpha = round(source_alpha * content_gate)
        pixels.append((red, green, blue, alpha))
    output = Image.new("RGBA", image.size)
    output.putdata(pixels)
    return output


def resize_to_max_side(image: Image.Image, max_side: int) -> Image.Image:
    if max_side <= 0 or max(image.size) <= max_side:
        return image
    scale = max_side / max(image.size)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def summarize(image: Image.Image, mode: str, source: Path, output: Path) -> dict:
    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    total = max(1, image.width * image.height)
    nonzero = total - histogram[0]
    return {
        "source": str(source.resolve()),
        "output": str(output.resolve()),
        "background_mode": mode,
        "width": image.width,
        "height": image.height,
        "alpha_min": alpha.getextrema()[0],
        "alpha_max": alpha.getextrema()[1],
        "painted_fraction": round(nonzero / total, 6),
        "painted_bbox": alpha.point(lambda value: 255 if value > 8 else 0).getbbox(),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--background",
        choices=("auto", "alpha", "light", "none"),
        default="auto",
        help="How to interpret the source background (default: auto).",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.94,
        help="Light-background luminance threshold in 0..1 (default: 0.94).",
    )
    parser.add_argument(
        "--softness",
        type=float,
        default=0.16,
        help="Width of the luminance transition (default: 0.16).",
    )
    parser.add_argument(
        "--chroma-softness",
        type=float,
        default=0.18,
        help="Chroma needed to preserve a pale colored wash (default: 0.18).",
    )
    parser.add_argument("--max-side", type=int, default=2048)
    parser.add_argument("--report", type=Path, help="Optional JSON metadata path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.is_file():
        raise SystemExit(f"Input image does not exist: {args.input}")
    if not 0.0 <= args.threshold <= 1.0:
        raise SystemExit("--threshold must be between 0 and 1")
    if args.softness <= 0 or args.chroma_softness <= 0:
        raise SystemExit("--softness and --chroma-softness must be positive")

    source = Image.open(args.input).convert("RGBA")
    source = resize_to_max_side(source, args.max_side)
    mode = detect_background(source) if args.background == "auto" else args.background
    prepared = derive_light_background_alpha(
        source,
        args.threshold,
        args.softness,
        args.chroma_softness,
    ) if mode == "light" else source

    args.output.parent.mkdir(parents=True, exist_ok=True)
    prepared.save(args.output, format="PNG", optimize=True)
    report = summarize(prepared, mode, args.input, args.output)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
