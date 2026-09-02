---
name: fluid-ink-figure
description: Create or transform a standalone interactive WebGL ink-wash figure whose pigments are advected by Stable Fluids and recover toward a hidden artwork attractor. Use for fluid shuimo paintings, interactive ink illustrations, or reference-to-fluid-figure conversions; do not use for scroll storytelling, general webpage redesign, or static ink images.
---

# Fluid Ink Figure

Create a recognizable ink artwork that genuinely moves as fluid. The production result is an embeddable figure plus a minimal standalone demo, not a scrollytelling page.

## Route the input

- **Direct transformation:** When the user supplies a target image, preserve the requested subject and composition while translating it into fluid pigment. Treat user-provided assets as authorized for the requested transformation; do not add an unsolicited rights audit.
- **Reference synthesis:** When the user supplies several references, extract subject anatomy, composition, palette, abstraction, and brush behavior, then make an original blueprint rather than copying one source.
- **Text-only creation:** When the user supplies only a description, research visual references on the web. Choose the number and type of sources dynamically from the task. Prefer useful, attributable art or museum sources and primary technical documentation; record what each source contributes before making an original blueprint.

Read [references/intake.md](references/intake.md) before interviewing the user. Ask at most one compact round of six unresolved questions; infer anything already visible in the references or project. If the user says to use recommendations, apply the defaults in that file.

## Required workflow

1. Inspect the destination project, renderer, interaction boundaries, viewport, and supplied references.
2. Produce a visible composition blueprint that establishes subject hierarchy, negative space, crop safety, pigment families, and abstraction. Show it for approval before fluid implementation.
3. Convert the approved blueprint into a hidden attractor atlas or equivalent structure field. Read [references/attractor-atlas.md](references/attractor-atlas.md) for channel design and background handling. Use the bundled scripts when working with a raster atlas.
4. Build or adapt a Stable Fluids pipeline. Read [references/fluid-architecture.md](references/fluid-architecture.md). Prefer the bundled starter under `assets/fluid-ink-figure-template/` for a new project; integrate surgically when a project already has a renderer.
5. Show the first real GPU fluid frame for a second approval gate. Tune material, mixing, recovery, and scale there; do not approve from the blueprint alone.
6. Remove every direct blueprint or atlas contribution from the final composite. Keep the hidden attractor active so displaced pigment can reconstruct the artwork.
7. Verify the result against [references/verification.md](references/verification.md) before reporting completion.

## Non-negotiable rendering invariants

- Use one continuous fluid system with velocity advection, curl/vorticity, divergence, pressure solve, humidity, wet pigment, deposition, and final paper composite. A blurred image, CSS filter, expanding circle, or static PNG overlay is not the requested effect.
- The atlas defines where pigment tends to return; it is never sampled to paint fixed-position color in the final composite. Final pixels come only from advected wet pigment, deposit, humidity, edge behavior, and paper material.
- Model pigments as semantic channels sharing velocity and humidity. Do not hard-code a universal channel count. Pack channels into RGBA banks, allocate banks from device capability and memory budget, and merge only low-priority or perceptually close colors when necessary. Report any merge or quality reduction.
- Implement adjustable attraction. Default to a gentle 3–6 second recovery; allow attraction strength zero for permanent displacement.
- Clicking deposits the selected pigment and water. Dragging injects directional velocity continuously; it must not look like a dotted stamp trail.
- Default mixing preserves pigment identity while allowing wet-edge blending. Avoid immediate gray mud unless the user asks for strong mixing.
- Use pigment density, dilution, hue family, wet/dry transfer, capillary edges, flying-white gaps, and paper absorption as form-making detail. Do not rely on silhouette alone.
- Keep the artwork legible at rest and visibly fluid during interaction. Neither rigid image-locking nor uncontrolled dissipation passes.

## Interaction and delivery boundaries

- Expose component options for palette, selected pigment, attraction strength, recovery delay, mixing, reset, wash, pause, quality, and pointer enablement. Visible controls are optional and off by default.
- In a standalone figure, enable pointer and touch interaction. When embedded in a scrollable mobile page, do not capture page scrolling until the user explicitly enters an interaction state.
- Provide WebGL2 as the full path. Probe actual render-target support; degrade resolution, pressure iterations, and pigment-bank count before falling back to a static approved artwork.
- Never claim GPU appearance or frame rate was verified when the test environment could not create the required WebGL context.
