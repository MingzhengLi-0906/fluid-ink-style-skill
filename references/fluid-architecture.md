# Stable Fluids architecture for ink figures

## State

Use a shared incompressible velocity field and shared paper moisture field. Store pigments as a dynamic list of semantic channels:

- velocity: half-float ping-pong RG texture or RGBA target;
- curl and divergence: single render targets;
- pressure: nearest-filter half-float ping-pong target;
- humidity/clear water: ping-pong target;
- wet pigment: one RGBA ping-pong bank per four logical channels;
- dry deposit: one RGBA ping-pong bank per four logical channels;
- hidden attractor: one RGBA texture bank per four logical channels;
- composite accumulator: ping-pong target used to add pigment banks without a compile-time sampler-array limit.

The logical channel count is not globally fixed. Determine runtime capacity from WebGL2 render-target support, maximum texture size, texture units, viewport, estimated memory, and measured frame time. Prefer packing and sequential passes. When capacity is exceeded, merge perceptually close, low-priority channels or lower simulation resolution, and tell the user what changed.

## Frame order

Use this dependency order:

1. apply queued click/drag/wash splats;
2. advect velocity;
3. compute curl and apply vorticity confinement;
4. compute divergence;
5. solve pressure with Jacobi iterations;
6. subtract pressure gradient;
7. advect and diffuse humidity;
8. advect each wet-pigment bank;
9. transfer wet pigment into persistent deposit using humidity, edges, paper absorption, and time;
10. apply the hidden attractor after the recovery delay, with adjustable strength;
11. accumulate every wet/deposit bank into display pigment colors;
12. composite accumulated pigment, moisture, capillary edge, fibres, grain, and vignette over paper.

Clamp the simulation delta, typically to `1/30`, so a suspended tab does not explode on resume. Keep velocity resolution much lower than pigment resolution. Use 10–20 pressure iterations according to quality tier and measured behavior.

## Recovery

Recovery is a continuous force toward the hidden density target, not a crossfade to a picture. A useful exponential rate is:

```text
rate = 1 - exp(-attractionStrength * delta)
next = mix(currentOutsideDecay, targetEquilibrium, rate * recoveryMask)
```

`recoveryMask` should remain near zero while a recent pointer force is active, then rise after `recoveryDelay`. The default should visually reconstruct the subject in roughly 3–6 seconds. `attractionStrength = 0` leaves disturbance permanent.

Do not clamp directly to the target every frame; that makes the artwork rigid. Do not remove the attractor after initialization; that makes the subject dissipate and prevents reliable reconstruction.

## Multi-pigment mixing

All channels move through the shared velocity and humidity fields. Keep channel mass separate through advection and deposition. Create perceived mixing in the accumulator/composite by combining channel colors according to their local densities and a `mixing` parameter.

- Low mixing: optical translucent layering, strong channel identity.
- Controlled/default: modest subtractive hue interaction at wet overlapping edges; avoid global averaging.
- Strong: wider diffusion and stronger subtractive interaction, accepting possible mud.

Shade within a pigment family from actual wet/deposit density. Never use fixed atlas coordinates to assign the final hue.

## Pointer behavior

- Click/tap: deposit selected pigment plus humidity with a compact non-uniform bloom.
- Drag: derive force from pointer displacement divided by elapsed time, clamp spikes, and inject velocity along the full segment. Add only a restrained amount of pigment unless the brief requests brush painting.
- Wash: inject clear water and locally reduce wet pigment while preserving some deposit.
- Convert pointer coordinates from the figure bounds, not the window.
- Use pointer capture only after accepting a gesture.

For an embedded mobile figure, let vertical page scrolling win until an explicit interaction mode is active. For a standalone figure, `touch-action: none` is acceptable inside the canvas.

## Paper composite

Combine low-frequency paper tone, directional fibres, fine grain, absorption variation, a restrained vignette, humidity lift, wet capillary edges, dry deposit, and flying-white holes. The ink should appear absorbed into paper rather than alpha-blended above it.

The composite receives only simulated textures and time/viewport/material parameters. It does not receive the attractor atlas.

## Integration and API

Prefer adapting an existing renderer over creating a second WebGL canvas. For a new project, start from `assets/fluid-ink-figure-template/` and expose at least:

```js
setPalette(pigments)
setSelectedPigment(id)
setAttractionStrength(value)
setRecoveryDelay(seconds)
setMixing(value)
setInteractionEnabled(value)
splat({ point, pigmentId, amount, water, radius })
push({ from, to, force })
wash({ point, amount, radius })
reset()
pause(value)
dispose()
```

Keep visible controls optional. A useful component should work from props/options alone.
