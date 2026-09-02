# Hidden attractor atlas

The visible blueprint is an art-direction artifact. The production attractor is a persistent hidden structure field sampled during simulation. It is not a picture layer and must not appear in the final composite.

## Build the production atlas

1. Start from the approved blueprint or a directly transformed user image.
2. Remove unrelated background, framing, UI, text, and composition guides.
3. Preserve meaningful pale washes and flying-white holes. Do not reduce every subject to a binary silhouette.
4. Normalize the artwork into the destination aspect ratio with explicit crop-safe padding.
5. Encode semantic pigment targets into RGBA banks: channels `0–3` in bank 0, `4–7` in bank 1, and so on. Store density, not final display color.
6. Represent core ink, diluted wash, dry brush, negative cuts, and subordinate marks through density and auxiliary masks. A subject may use multiple densities in the same semantic channel rather than consuming a channel per shade.

Keep a manifest beside the atlas with:

- channel index and pigment name;
- display color and mixing family;
- subject/region responsibility;
- target density range;
- visual priority for runtime merging;
- whether the channel may merge with another on lower-tier devices.

Use `assets/fluid-ink-figure-template/attractor-manifest.example.json` as the starting schema.

## Color is structural

Use value, opacity, and restrained hue changes to reveal volume and depth:

- dense spine/head/branch cores use the darkest density;
- belly, petal, mist, fin, and leaf edges use diluted wash;
- paper-white eyes, gaps, veins, and flying-white remain actual absence of target pigment;
- related hues may share a channel when density alone carries their distinction;
- pigments needing independent motion or mixing require separate semantic channels.

Do not bake lighting, gradients, or final paper color into the target merely to make the atlas look finished.

## Alpha and neutral-background failure

Never infer transparency from a checkerboard preview. Inspect the file mode and alpha values. A 24-bit RGB PNG has no alpha even when its preview appears transparent.

Use `scripts/validate_attractor.py` first. If a light neutral background is baked into the raster, use `scripts/prepare_attractor.py` to derive alpha from luminance plus chroma, then visually inspect pale strokes. Automatic extraction can erase legitimate mist or gray washes; tune the threshold and softness rather than claiming perfect removal.

Suggested commands:

```bash
python scripts/validate_attractor.py input.png
python scripts/prepare_attractor.py input.png output.png --background light --threshold 0.94 --softness 0.16 --max-side 2048
python scripts/validate_attractor.py output.png --strict
```

Use the same Python interpreter for Pillow installation and execution.

## Simulation use

Sample the atlas only in the attraction pass. For each semantic pigment density `p` and target density `t`, approach an equilibrium over time rather than stamping the target every frame. Modulate attraction with recovery delay and local velocity so an active drag can pull pigment away before it reforms.

The final paper composite must not receive atlas textures, atlas UVs, fixed subject masks, or fixed-position palette lookups. If removing the atlas uniform from the final material changes subject color at fixed coordinates, the design still contains a static picture layer.
