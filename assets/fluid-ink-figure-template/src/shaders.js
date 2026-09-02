export const fullscreenVertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const splatFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform vec2 uPoint;
  uniform vec4 uValue;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uErase;
  void main() {
    vec2 delta = vUv - uPoint;
    delta.x *= uAspect;
    float bloom = exp(-dot(delta, delta) / max(uRadius, 0.000001));
    vec4 current = texture2D(uTarget, vUv);
    gl_FragColor = current * (1.0 - clamp(bloom * uErase, 0.0, 1.0)) + uValue * bloom;
  }
`

export const advectionFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uVelocityTexel;
  uniform float uDelta;
  uniform float uDissipation;
  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 coordinate = clamp(vUv - uDelta * velocity * uVelocityTexel, vec2(0.001), vec2(0.999));
    gl_FragColor = texture2D(uSource, coordinate) * uDissipation;
  }
`

export const curlFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float left = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
    float right = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
    float bottom = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
    float top = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
    gl_FragColor = vec4(0.5 * (right - left - top + bottom), 0.0, 0.0, 1.0);
  }
`

export const vorticityFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform vec2 uTexel;
  uniform float uDelta;
  uniform float uStrength;
  void main() {
    float left = abs(texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
    float right = abs(texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
    float bottom = abs(texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x);
    float top = abs(texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x);
    float center = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(top - bottom, right - left);
    force = force / (length(force) + 0.0001) * uStrength * center;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy + force * uDelta;
    float boundary = smoothstep(0.0, 0.014, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    gl_FragColor = vec4(velocity * boundary, 0.0, 1.0);
  }
`

export const divergenceFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float left = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float top = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    gl_FragColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
  }
`

export const pressureFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexel;
  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((left + right + bottom + top - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`

export const gradientFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy - 0.5 * vec2(right - left, top - bottom);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`

export const humidityFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uHumidity;
  uniform vec2 uTexel;
  uniform float uDelta;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    vec2 center = texture2D(uHumidity, vUv).rg;
    vec2 around = (
      texture2D(uHumidity, vUv - vec2(uTexel.x, 0.0)).rg
      + texture2D(uHumidity, vUv + vec2(uTexel.x, 0.0)).rg
      + texture2D(uHumidity, vUv - vec2(0.0, uTexel.y)).rg
      + texture2D(uHumidity, vUv + vec2(0.0, uTexel.y)).rg
    ) * 0.25;
    float fibre = hash21(floor(vUv * vec2(920.0, 430.0)));
    vec2 spread = clamp(uDelta * (vec2(0.55, 0.18) + center * vec2(1.5, 0.55)), 0.0, 0.11);
    vec2 moisture = mix(center, around, spread);
    moisture.x *= exp(-uDelta * mix(0.12, 0.24, fibre));
    moisture.y *= exp(-uDelta * mix(0.08, 0.18, fibre));
    gl_FragColor = vec4(clamp(moisture, 0.0, 1.4), 0.0, 1.0);
  }
`

export const wetPigmentFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uWet;
  uniform sampler2D uHumidity;
  uniform vec2 uTexel;
  uniform float uDelta;
  void main() {
    vec4 center = texture2D(uWet, vUv);
    vec4 around = (
      texture2D(uWet, vUv - vec2(uTexel.x, 0.0))
      + texture2D(uWet, vUv + vec2(uTexel.x, 0.0))
      + texture2D(uWet, vUv - vec2(0.0, uTexel.y))
      + texture2D(uWet, vUv + vec2(0.0, uTexel.y))
    ) * 0.25;
    vec2 moisture = texture2D(uHumidity, vUv).rg;
    float diffusion = clamp(uDelta * (0.018 + moisture.x * 0.72), 0.0, 0.08);
    vec4 wet = mix(center, around, diffusion);
    wet *= max(0.0, 1.0 - uDelta * (0.002 + moisture.y * 2.8));
    gl_FragColor = clamp(wet, 0.0, 1.8);
  }
`

export const depositFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uDeposit;
  uniform sampler2D uWet;
  uniform sampler2D uHumidity;
  uniform vec2 uTexel;
  uniform float uDelta;
  void main() {
    vec4 wet = texture2D(uWet, vUv);
    vec4 deposit = texture2D(uDeposit, vUv);
    float humidity = texture2D(uHumidity, vUv).r;
    vec4 right = texture2D(uWet, vUv + vec2(uTexel.x, 0.0));
    vec4 top = texture2D(uWet, vUv + vec2(0.0, uTexel.y));
    float edge = smoothstep(0.015, 0.25, length((right + top - wet * 2.0).rgba));
    float dry = 1.0 - smoothstep(0.08, 0.62, humidity);
    float transfer = uDelta * (0.006 + dry * 0.15 + edge * humidity * 0.035);
    gl_FragColor = clamp(deposit + wet * transfer, 0.0, 1.4);
  }
`

export const attractorFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uWet;
  uniform sampler2D uAttractor;
  uniform float uDelta;
  uniform float uStrength;
  uniform float uRecovery;
  void main() {
    vec4 current = texture2D(uWet, vUv);
    vec4 target = texture2D(uAttractor, vUv);
    float rate = (1.0 - exp(-max(uStrength, 0.0) * uDelta)) * uRecovery;
    vec4 outsideDecay = current * exp(-uDelta * uStrength * 0.06 * uRecovery);
    gl_FragColor = clamp(mix(outsideDecay, target, rate), 0.0, 1.8);
  }
`

export const accumulateFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uAccum;
  uniform sampler2D uWet;
  uniform sampler2D uDeposit;
  uniform vec3 uColor;
  uniform float uChannel;
  uniform float uMixing;
  float pick(vec4 value, float channel) {
    if (channel < 0.5) return value.r;
    if (channel < 1.5) return value.g;
    if (channel < 2.5) return value.b;
    return value.a;
  }
  void main() {
    vec4 accum = texture2D(uAccum, vUv);
    float wet = pick(texture2D(uWet, vUv), uChannel);
    float dry = pick(texture2D(uDeposit, vUv), uChannel);
    float density = wet + dry * 1.18;
    float opacity = 1.0 - exp(-density * 2.35);
    vec3 pigment = mix(uColor + vec3(0.16), uColor * 0.72, smoothstep(0.03, 0.85, density));
    float overlap = opacity * accum.a;
    pigment *= 1.0 - overlap * uMixing * 0.18;
    vec3 color = mix(accum.rgb, pigment, opacity * (1.0 - accum.a * 0.22));
    float alpha = 1.0 - (1.0 - accum.a) * (1.0 - opacity);
    gl_FragColor = vec4(color, alpha);
  }
`

export const paperFragmentShader = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uAccum;
  uniform sampler2D uHumidity;
  uniform float uTime;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    vec4 ink = texture2D(uAccum, vUv);
    float humidity = texture2D(uHumidity, vUv).r;
    float longFibre = noise(vUv * vec2(850.0, 54.0));
    float crossFibre = noise(vUv * vec2(78.0, 690.0));
    float grain = noise(vUv * vec2(177.0, 139.0));
    vec3 paper = vec3(0.953, 0.936, 0.893);
    paper += (longFibre - 0.5) * 0.015 + (crossFibre - 0.5) * 0.008 + (grain - 0.5) * 0.016;
    float vignette = smoothstep(0.42, 0.78, length((vUv - 0.5) * vec2(0.84, 1.0)));
    paper *= 1.0 - vignette * 0.03;
    paper += humidity * (1.0 - ink.a) * 0.012;
    gl_FragColor = vec4(mix(paper, ink.rgb, clamp(ink.a, 0.0, 0.985)), 1.0);
  }
`
