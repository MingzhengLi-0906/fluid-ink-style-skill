# Adaptive intake and art direction

Ask only what cannot be inferred from the user's references, prose, or existing project. Use one compact round with no more than six questions. Do not repeat answered questions. If the user asks for recommendations, use the defaults below and begin.

## Question bank

Choose the smallest relevant subset:

1. **Subject hierarchy:** What must be recognized first, and what may be simplified or omitted?
2. **Composition fidelity:** Preserve the reference strictly, preserve relationships while rebalancing for the viewport (default), or use only its mood and create a new composition?
3. **Ink abstraction:** Recognizable and detailed, balanced xieyi (default), or highly abstract pigment gestures?
4. **Recovery:** Permanent displacement, gentle 3–6 second recovery (default), fast recovery, or user-adjustable? Always implement adjustable attraction; this answer selects its initial value.
5. **Mixing:** Low, controlled wet-edge blending (default), or strong mixing that creates obvious secondary colors and possible mud?
6. **Interaction strength:** Subtle local movement, visible but recoverable deformation (default), or dramatic dispersal?
7. **Palette:** Which pigment families are required, and which subjects map to them? If unspecified, extract a restrained palette from the references.
8. **Material emphasis:** Wet bloom, dense core, dry-brush/flying-white, or a subject-aware combination (default)?
9. **Background:** Warm xuan/washi paper (default), clean light field, transparency, or the existing site background?
10. **Environment:** Existing React/Three.js app, plain HTML, or no project? Capture target aspect ratios and crop-safe subjects.
11. **Mobile input:** Standalone touch interaction, explicit play-to-interact inside a scrolling page (default for embeds), or motion-only?
12. **Controls:** Hidden programmatic API (default) or a visible palette/reset/wash panel?

Keep composition fidelity and abstraction separate. A figure can preserve exact fish positions while rendering their anatomy in loose washes.

## Default design contract

When details are absent, use:

- Preserve subject relationships while adapting spacing and crop to the target.
- Balanced xieyi: recognizable anatomy, no photorealistic micro-detail.
- Strong negative space and a clear primary/secondary/tertiary hierarchy.
- Restrained traditional pigment families with density variation inside each hue.
- Controlled wet-edge mixing; retain pigment identity.
- Click to deposit ink and water; drag to push fluid directionally.
- Gentle adjustable recovery over roughly 3–6 seconds.
- Warm paper, subtle fibres/grain, no visible controls.
- Embeddable component plus minimal standalone demo.
- WebGL2 full effect with capability-based degradation and static fallback.

## Pre-build restatement

Before producing the blueprint, summarize the resolved contract in one short paragraph. Include subject, composition fidelity, abstraction, palette, mixing, recovery, interaction, aspect ratio, mobile behavior, and delivery context. This restatement is the definition of done for art direction.

## Two approval gates

1. **Blueprint gate:** Show the static composition. Ask only about hierarchy, size, spacing, crop, anatomy, palette, and abstraction.
2. **GPU gate:** Show a real Stable Fluids frame or recording. Ask only about pigment material, edge behavior, mixing, interaction force, recovery, and performance.

Do not use a blueprint screenshot as evidence that the fluid material is correct.
