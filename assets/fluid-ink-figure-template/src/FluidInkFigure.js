import {
  Color,
  DataTexture,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import {
  accumulateFragmentShader,
  advectionFragmentShader,
  attractorFragmentShader,
  curlFragmentShader,
  depositFragmentShader,
  divergenceFragmentShader,
  fullscreenVertexShader,
  gradientFragmentShader,
  humidityFragmentShader,
  paperFragmentShader,
  pressureFragmentShader,
  splatFragmentShader,
  vorticityFragmentShader,
  wetPigmentFragmentShader,
} from './shaders.js'

const TARGET_OPTIONS = {
  minFilter: LinearFilter,
  magFilter: LinearFilter,
  format: RGBAFormat,
  type: HalfFloatType,
  depthBuffer: false,
  stencilBuffer: false,
}

const fitResolution = (longest, aspect) => aspect >= 1
  ? { width: longest, height: Math.max(1, Math.round(longest / aspect)) }
  : { width: Math.max(1, Math.round(longest * aspect)), height: longest }

const createTarget = (width, height, filter = LinearFilter) => {
  const target = new WebGLRenderTarget(width, height, {
    ...TARGET_OPTIONS,
    minFilter: filter,
    magFilter: filter,
  })
  target.texture.generateMipmaps = false
  return target
}

const createPair = (width, height, filter = LinearFilter) => ({
  read: createTarget(width, height, filter),
  write: createTarget(width, height, filter),
  swap() {
    const previous = this.read
    this.read = this.write
    this.write = previous
  },
  dispose() {
    this.read.dispose()
    this.write.dispose()
  },
})

const material = (fragmentShader, uniforms) => new ShaderMaterial({
  vertexShader: fullscreenVertexShader,
  fragmentShader,
  uniforms,
  depthTest: false,
  depthWrite: false,
})

const normalizePigment = (pigment, index) => ({
  id: pigment.id || `pigment-${index + 1}`,
  color: pigment.color || '#252722',
  priority: Number.isFinite(pigment.priority) ? pigment.priority : 0,
  mergeable: pigment.mergeable !== false,
})

const colorDistance = (left, right) => {
  const a = new Color(left.color)
  const b = new Color(right.color)
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b)
}

function fitPigmentsToBudget(pigments, resolution, memoryBudgetMb) {
  const bytesPerBank = resolution.width * resolution.height * 8 * 4
  const affordableBanks = Math.max(1, Math.floor(memoryBudgetMb * 1024 * 1024 / bytesPerBank))
  const capacity = affordableBanks * 4
  if (pigments.length <= capacity) return { active: pigments, merges: [], bankCount: Math.ceil(pigments.length / 4) }

  const ranked = [...pigments].sort((a, b) => b.priority - a.priority)
  const active = ranked.slice(0, capacity)
  const merges = ranked.slice(capacity).map((pigment) => {
    const candidates = active.filter((candidate) => pigment.mergeable && candidate.mergeable)
    const target = (candidates.length ? candidates : active)
      .reduce((best, candidate) => colorDistance(pigment, candidate) < colorDistance(pigment, best) ? candidate : best)
    return { from: pigment.id, into: target.id }
  })
  return { active, merges, bankCount: affordableBanks }
}

function blankAttractor() {
  const texture = new DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, RGBAFormat, UnsignedByteType)
  texture.needsUpdate = true
  texture.userData.fluidInkOwned = true
  return texture
}

export class FluidInkFigure {
  constructor(container, options = {}) {
    if (!container) throw new Error('FluidInkFigure requires a container element.')
    this.container = container
    this.options = {
      attractionStrength: 0.75,
      recoveryDelay: 0.7,
      mixing: 0.32,
      interactionMode: 'standalone',
      memoryBudgetMb: 96,
      ...options,
    }
    this.sourcePigments = (options.pigments || [{ id: 'ink', color: '#22251f', priority: 10 }])
      .map(normalizePigment)
    this.attractorBanks = options.attractorBanks || []
    this.selectedPigmentId = this.sourcePigments[0].id
    this.interactionEnabled = this.options.interactionMode === 'standalone'
    this.paused = false
    this.disposed = false
    this.lastInputTime = -Infinity
    this.pointer = null

    this.renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    this.container.append(this.renderer.domElement)

    this.scene = new Scene()
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.geometry = new PlaneGeometry(2, 2)
    this.quad = new Mesh(this.geometry)
    this.scene.add(this.quad)
    this.clockStart = performance.now() / 1000
    this.previousFrame = this.clockStart
    this.pending = []

    this._bindEvents()
    this._resize()
    this.resizeObserver = new ResizeObserver(() => this._resize())
    this.resizeObserver.observe(this.container)
    this.frame = requestAnimationFrame((time) => this._tick(time))
  }

  _quality(width, height) {
    const maxTextureSize = this.renderer.capabilities.maxTextureSize
    const aspect = width / Math.max(height, 1)
    const high = width >= 1200 && maxTextureSize >= 4096
    const medium = width >= 720
    return {
      name: high ? 'high' : medium ? 'medium' : 'low',
      velocity: fitResolution(high ? 176 : medium ? 128 : 96, aspect),
      pigment: fitResolution(Math.min(maxTextureSize, high ? 1024 : medium ? 768 : 512), aspect),
      pressureIterations: high ? 18 : medium ? 14 : 10,
    }
  }

  _resize() {
    const width = Math.max(1, Math.round(this.container.clientWidth))
    const height = Math.max(1, Math.round(this.container.clientHeight))
    if (width === this.width && height === this.height) return
    this.width = width
    this.height = height
    this.aspect = width / height
    this.renderer.setSize(width, height, false)
    this._allocate()
  }

  _allocate() {
    this._disposeTargets()
    this.quality = this._quality(this.width, this.height)
    const fitted = fitPigmentsToBudget(this.sourcePigments, this.quality.pigment, this.options.memoryBudgetMb)
    this.pigments = fitted.active
    this.pigmentBankCount = fitted.bankCount
    this.options.onQuality?.({ quality: this.quality, pigments: this.pigments, merges: fitted.merges })

    this.velocityTexel = new Vector2(1 / this.quality.velocity.width, 1 / this.quality.velocity.height)
    this.pigmentTexel = new Vector2(1 / this.quality.pigment.width, 1 / this.quality.pigment.height)
    this.velocity = createPair(this.quality.velocity.width, this.quality.velocity.height)
    this.pressure = createPair(this.quality.velocity.width, this.quality.velocity.height, NearestFilter)
    this.curl = createTarget(this.quality.velocity.width, this.quality.velocity.height, NearestFilter)
    this.divergence = createTarget(this.quality.velocity.width, this.quality.velocity.height, NearestFilter)
    this.humidity = createPair(this.quality.pigment.width, this.quality.pigment.height)
    this.banks = Array.from({ length: this.pigmentBankCount }, () => ({
      wet: createPair(this.quality.pigment.width, this.quality.pigment.height),
      deposit: createPair(this.quality.pigment.width, this.quality.pigment.height),
    }))
    this.accum = createPair(this.quality.pigment.width, this.quality.pigment.height)
    this._createMaterials()
    this.reset()
  }

  _createMaterials() {
    this._disposeMaterials()
    this.materials = {
      splat: material(splatFragmentShader, {
        uTarget: { value: null },
        uPoint: { value: new Vector2() },
        uValue: { value: new Vector4() },
        uAspect: { value: this.aspect },
        uRadius: { value: 0.002 },
        uErase: { value: 0 },
      }),
      advection: material(advectionFragmentShader, {
        uVelocity: { value: null },
        uSource: { value: null },
        uVelocityTexel: { value: this.velocityTexel },
        uDelta: { value: 1 / 60 },
        uDissipation: { value: 1 },
      }),
      curl: material(curlFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: this.velocityTexel },
      }),
      vorticity: material(vorticityFragmentShader, {
        uVelocity: { value: null },
        uCurl: { value: this.curl.texture },
        uTexel: { value: this.velocityTexel },
        uDelta: { value: 1 / 60 },
        uStrength: { value: 18 },
      }),
      divergence: material(divergenceFragmentShader, {
        uVelocity: { value: null },
        uTexel: { value: this.velocityTexel },
      }),
      pressure: material(pressureFragmentShader, {
        uPressure: { value: null },
        uDivergence: { value: this.divergence.texture },
        uTexel: { value: this.velocityTexel },
      }),
      gradient: material(gradientFragmentShader, {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: { value: this.velocityTexel },
      }),
      humidity: material(humidityFragmentShader, {
        uHumidity: { value: null },
        uTexel: { value: this.pigmentTexel },
        uDelta: { value: 1 / 60 },
      }),
      wet: material(wetPigmentFragmentShader, {
        uWet: { value: null },
        uHumidity: { value: null },
        uTexel: { value: this.pigmentTexel },
        uDelta: { value: 1 / 60 },
      }),
      deposit: material(depositFragmentShader, {
        uDeposit: { value: null },
        uWet: { value: null },
        uHumidity: { value: null },
        uTexel: { value: this.pigmentTexel },
        uDelta: { value: 1 / 60 },
      }),
      attractor: material(attractorFragmentShader, {
        uWet: { value: null },
        uAttractor: { value: null },
        uDelta: { value: 1 / 60 },
        uStrength: { value: this.options.attractionStrength },
        uRecovery: { value: 1 },
      }),
      accumulate: material(accumulateFragmentShader, {
        uAccum: { value: null },
        uWet: { value: null },
        uDeposit: { value: null },
        uColor: { value: new Color() },
        uChannel: { value: 0 },
        uMixing: { value: this.options.mixing },
      }),
      paper: material(paperFragmentShader, {
        uAccum: { value: null },
        uHumidity: { value: null },
        uTime: { value: 0 },
      }),
    }

    while (this.attractorBanks.length < this.pigmentBankCount) this.attractorBanks.push(blankAttractor())
  }

  _render(pass, target) {
    this.quad.material = pass
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.scene, this.camera)
  }

  _clear(target) {
    this.renderer.setRenderTarget(target)
    this.renderer.clear(true, false, false)
  }

  _splat(pair, point, value, radius, erase = 0) {
    const uniforms = this.materials.splat.uniforms
    uniforms.uTarget.value = pair.read.texture
    uniforms.uPoint.value.set(point[0], point[1])
    uniforms.uValue.value.set(value[0], value[1], value[2], value[3])
    uniforms.uAspect.value = this.aspect
    uniforms.uRadius.value = radius
    uniforms.uErase.value = erase
    this._render(this.materials.splat, pair.write)
    pair.swap()
  }

  _applyInput(input) {
    if (input.force) this._splat(this.velocity, input.point, [input.force[0], input.force[1], 0, 0], input.radius * 0.7)
    if (input.water) this._splat(this.humidity, input.point, [input.water, input.clearWater || 0, 0, 0], input.radius * 1.7)
    if (input.erase) {
      this.banks.forEach((bank) => this._splat(bank.wet, input.point, [0, 0, 0, 0], input.radius, input.erase))
      return
    }
    if (Number.isInteger(input.channel)) {
      const bank = this.banks[Math.floor(input.channel / 4)]
      if (!bank) return
      const value = [0, 0, 0, 0]
      value[input.channel % 4] = input.amount
      this._splat(bank.wet, input.point, value, input.radius)
    }
  }

  _advect(pair, dt, dissipation = 1) {
    const uniforms = this.materials.advection.uniforms
    uniforms.uVelocity.value = this.velocity.read.texture
    uniforms.uSource.value = pair.read.texture
    uniforms.uDelta.value = dt
    uniforms.uDissipation.value = dissipation
    this._render(this.materials.advection, pair.write)
    pair.swap()
  }

  _step(dt, elapsed) {
    while (this.pending.length) this._applyInput(this.pending.shift())

    this._advect(this.velocity, dt, Math.pow(0.985, dt * 60))
    this.materials.curl.uniforms.uVelocity.value = this.velocity.read.texture
    this._render(this.materials.curl, this.curl)
    this.materials.vorticity.uniforms.uVelocity.value = this.velocity.read.texture
    this.materials.vorticity.uniforms.uDelta.value = dt
    this._render(this.materials.vorticity, this.velocity.write)
    this.velocity.swap()

    this.materials.divergence.uniforms.uVelocity.value = this.velocity.read.texture
    this._render(this.materials.divergence, this.divergence)
    this._clear(this.pressure.read)
    this._clear(this.pressure.write)
    for (let index = 0; index < this.quality.pressureIterations; index += 1) {
      this.materials.pressure.uniforms.uPressure.value = this.pressure.read.texture
      this._render(this.materials.pressure, this.pressure.write)
      this.pressure.swap()
    }
    this.materials.gradient.uniforms.uPressure.value = this.pressure.read.texture
    this.materials.gradient.uniforms.uVelocity.value = this.velocity.read.texture
    this._render(this.materials.gradient, this.velocity.write)
    this.velocity.swap()

    this._advect(this.humidity, dt)
    this.materials.humidity.uniforms.uHumidity.value = this.humidity.read.texture
    this.materials.humidity.uniforms.uDelta.value = dt
    this._render(this.materials.humidity, this.humidity.write)
    this.humidity.swap()

    const sinceInput = elapsed - this.lastInputTime
    const recovery = Math.max(0, Math.min(1, (sinceInput - this.options.recoveryDelay) / 0.65))
    this.banks.forEach((bank, bankIndex) => {
      this._advect(bank.wet, dt, Math.pow(0.9994, dt * 60))
      this.materials.wet.uniforms.uWet.value = bank.wet.read.texture
      this.materials.wet.uniforms.uHumidity.value = this.humidity.read.texture
      this.materials.wet.uniforms.uDelta.value = dt
      this._render(this.materials.wet, bank.wet.write)
      bank.wet.swap()

      this.materials.deposit.uniforms.uDeposit.value = bank.deposit.read.texture
      this.materials.deposit.uniforms.uWet.value = bank.wet.read.texture
      this.materials.deposit.uniforms.uHumidity.value = this.humidity.read.texture
      this.materials.deposit.uniforms.uDelta.value = dt
      this._render(this.materials.deposit, bank.deposit.write)
      bank.deposit.swap()

      this.materials.attractor.uniforms.uWet.value = bank.wet.read.texture
      this.materials.attractor.uniforms.uAttractor.value = this.attractorBanks[bankIndex]
      this.materials.attractor.uniforms.uDelta.value = dt
      this.materials.attractor.uniforms.uStrength.value = this.options.attractionStrength
      this.materials.attractor.uniforms.uRecovery.value = recovery
      this._render(this.materials.attractor, bank.wet.write)
      bank.wet.swap()
    })

    this._clear(this.accum.read)
    this._clear(this.accum.write)
    this.pigments.forEach((pigment, channel) => {
      const bank = this.banks[Math.floor(channel / 4)]
      const uniforms = this.materials.accumulate.uniforms
      uniforms.uAccum.value = this.accum.read.texture
      uniforms.uWet.value = bank.wet.read.texture
      uniforms.uDeposit.value = bank.deposit.read.texture
      uniforms.uColor.value.set(pigment.color)
      uniforms.uChannel.value = channel % 4
      uniforms.uMixing.value = this.options.mixing
      this._render(this.materials.accumulate, this.accum.write)
      this.accum.swap()
    })

    this.materials.paper.uniforms.uAccum.value = this.accum.read.texture
    this.materials.paper.uniforms.uHumidity.value = this.humidity.read.texture
    this.materials.paper.uniforms.uTime.value = elapsed
    this._render(this.materials.paper, null)
    this.renderer.setRenderTarget(null)
    this.container.dataset.fluidInkStatus = 'running'
    this.container.dataset.fluidInkChannels = String(this.pigments.length)
    this.container.dataset.fluidInkBanks = String(this.pigmentBankCount)
  }

  _tick(milliseconds) {
    if (this.disposed) return
    const now = milliseconds / 1000
    const dt = Math.min(1 / 30, Math.max(0.001, now - this.previousFrame))
    this.previousFrame = now
    if (!this.paused) this._step(dt, now - this.clockStart)
    this.frame = requestAnimationFrame((time) => this._tick(time))
  }

  _point(event) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    return [
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height)),
    ]
  }

  _bindEvents() {
    this.onPointerDown = (event) => {
      if (!this.interactionEnabled || event.button > 0) return
      event.preventDefault()
      const point = this._point(event)
      this.pointer = { id: event.pointerId, point, time: performance.now() }
      this.renderer.domElement.setPointerCapture(event.pointerId)
      this.splat({ point, pigmentId: this.selectedPigmentId, amount: 0.85, water: 0.7, radius: 0.0022 })
    }
    this.onPointerMove = (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId || !this.interactionEnabled) return
      event.preventDefault()
      const point = this._point(event)
      const now = performance.now()
      const seconds = Math.max(0.008, (now - this.pointer.time) / 1000)
      const force = [
        Math.max(-90, Math.min(90, (point[0] - this.pointer.point[0]) / seconds * 12)),
        Math.max(-90, Math.min(90, (point[1] - this.pointer.point[1]) / seconds * 12)),
      ]
      this.push({ from: this.pointer.point, to: point, force, radius: 0.002 })
      this.pointer = { id: event.pointerId, point, time: now }
    }
    this.onPointerUp = (event) => {
      if (!this.pointer || this.pointer.id !== event.pointerId) return
      if (this.renderer.domElement.hasPointerCapture(event.pointerId)) this.renderer.domElement.releasePointerCapture(event.pointerId)
      this.pointer = null
    }
    const canvas = this.renderer.domElement
    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
  }

  setPalette(pigments) {
    this.sourcePigments = pigments.map(normalizePigment)
    if (!this.sourcePigments.some((pigment) => pigment.id === this.selectedPigmentId)) {
      this.selectedPigmentId = this.sourcePigments[0]?.id
    }
    this._allocate()
  }

  setSelectedPigment(id) {
    if (this.sourcePigments.some((pigment) => pigment.id === id)) this.selectedPigmentId = id
  }

  setAttractionStrength(value) {
    this.options.attractionStrength = Math.max(0, Number(value) || 0)
  }

  setRecoveryDelay(seconds) {
    this.options.recoveryDelay = Math.max(0, Number(seconds) || 0)
  }

  setMixing(value) {
    this.options.mixing = Math.max(0, Math.min(1, Number(value) || 0))
  }

  setInteractionEnabled(value) {
    this.interactionEnabled = Boolean(value)
  }

  splat({ point, pigmentId = this.selectedPigmentId, amount = 0.65, water = 0.4, radius = 0.0018 }) {
    const channel = this.pigments.findIndex((pigment) => pigment.id === pigmentId)
    if (channel < 0) return
    this.pending.push({ point, channel, amount, water, radius })
    this.lastInputTime = performance.now() / 1000 - this.clockStart
  }

  push({ to, force, radius = 0.0018 }) {
    this.pending.push({ point: to, force, radius })
    this.lastInputTime = performance.now() / 1000 - this.clockStart
  }

  wash({ point, amount = 0.7, radius = 0.0025 }) {
    this.pending.push({ point, erase: Math.min(1, amount), water: 0.3, clearWater: amount, radius })
    this.lastInputTime = performance.now() / 1000 - this.clockStart
  }

  reset() {
    if (!this.velocity) return
    const previous = this.renderer.getRenderTarget()
    const color = this.renderer.getClearColor(new Color()).clone()
    const alpha = this.renderer.getClearAlpha()
    this.renderer.setClearColor(0x000000, 0)
    const targets = [
      this.velocity.read, this.velocity.write, this.pressure.read, this.pressure.write,
      this.curl, this.divergence, this.humidity.read, this.humidity.write,
      this.accum.read, this.accum.write,
      ...this.banks.flatMap((bank) => [bank.wet.read, bank.wet.write, bank.deposit.read, bank.deposit.write]),
    ]
    targets.forEach((target) => this._clear(target))
    this.banks.forEach((bank, bankIndex) => {
      const uniforms = this.materials.attractor.uniforms
      uniforms.uWet.value = bank.wet.read.texture
      uniforms.uAttractor.value = this.attractorBanks[bankIndex]
      uniforms.uDelta.value = 1
      uniforms.uStrength.value = 12
      uniforms.uRecovery.value = 1
      this._render(this.materials.attractor, bank.wet.write)
      bank.wet.swap()
    })
    this.renderer.setRenderTarget(previous)
    this.renderer.setClearColor(color, alpha)
    this.pending.length = 0
    this.lastInputTime = -Infinity
  }

  pause(value = true) {
    this.paused = Boolean(value)
  }

  _disposeTargets() {
    this.velocity?.dispose()
    this.pressure?.dispose()
    this.curl?.dispose()
    this.divergence?.dispose()
    this.humidity?.dispose()
    this.accum?.dispose()
    this.banks?.forEach((bank) => {
      bank.wet.dispose()
      bank.deposit.dispose()
    })
  }

  _disposeMaterials() {
    if (this.materials) Object.values(this.materials).forEach((entry) => entry.dispose())
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.resizeObserver?.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointercancel', this.onPointerUp)
    this._disposeMaterials()
    this._disposeTargets()
    this.attractorBanks.forEach((texture) => {
      if (texture.userData?.fluidInkOwned) texture.dispose()
    })
    this.geometry.dispose()
    this.renderer.dispose()
    canvas.remove()
  }
}
