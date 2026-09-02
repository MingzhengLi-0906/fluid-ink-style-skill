# Verification contract

Do not call the figure complete until the relevant checks pass.

## Visual checks

- At rest, the primary subject is recognizable at the intended display size.
- Composition, negative space, subject hierarchy, palette, and abstraction match the approved blueprint.
- Dense core, diluted wash, dry/flying-white gaps, capillary edges, and paper fibres are distinguishable.
- Color and density reveal internal structure; subjects are not single-value silhouettes.
- No static blueprint/atlas layer, fixed-position tint, baked checkerboard, watermark, or extraction halo is visible.
- Pale subordinate marks remain subordinate and do not become high-contrast geometry.

## Motion checks

- Click/tap creates a localized wet pigment deposit rather than a CSS-like expanding disc.
- Slow and fast drags move ink in the pointer direction and create continuous streamlines rather than dotted stamps.
- Pigments share fluid motion but retain the mixing behavior selected in the brief.
- With attraction enabled, a strongly disturbed region visibly reforms on the agreed timescale.
- With attraction zero, the same region does not secretly snap back.
- Reset, wash, pause, and disposal behave deterministically.

## Technical checks

- Verify the real GPU path, not only DOM or fallback output.
- Probe half-float framebuffer completeness before allocating the full simulation.
- Check at least one desktop and one mobile-sized viewport; ensure no crop of protected subjects.
- For embedded mobile use, confirm ordinary page scrolling is not captured before interaction mode is active.
- Test reduced motion if the host project supports it.
- Verify resource cleanup after unmount/remount: render targets, textures, materials, geometry, events, and animation frames.
- Run the host project's lint/build/tests and check console/WebGL errors.

## Performance checks

Measure rather than infer:

- stable frame rate during idle recovery and vigorous dragging;
- GPU target count and estimated memory at each quality tier;
- time to first complete fluid frame;
- resize behavior and context restoration;
- runtime pigment channels, packed banks, and any merged colors.

If the environment has no working WebGL context, report only the fallback/DOM checks as verified and leave GPU visual/performance acceptance explicitly pending.

## Evidence

Capture a still at rest, a still or short recording during disturbance, and a later frame after recovery. Compare all three at the same viewport. The evidence should prove fluid displacement and reconstruction, not merely show different animation timestamps.
