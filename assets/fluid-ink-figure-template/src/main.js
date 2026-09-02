import { DataTexture, RGBAFormat, UnsignedByteType } from 'three'
import { FluidInkFigure } from './FluidInkFigure.js'
import './style.css'

function makeDemoAttractor(size = 512) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1)
      const v = y / (size - 1)
      const index = (y * size + x) * 4
      const upper = Math.exp(-(
        ((u - 0.58) / 0.22) ** 2
        + ((v - 0.65 - 0.09 * Math.sin(u * 8.0)) / 0.075) ** 2
      ) * 2.4)
      const lower = Math.exp(-(
        ((u - 0.48) / 0.25) ** 2
        + ((v - 0.35 + 0.10 * Math.sin(u * 7.0)) / 0.08) ** 2
      ) * 2.2)
      data[index] = Math.round(Math.min(1, upper) * 255)
      data[index + 1] = Math.round(Math.min(1, lower) * 255)
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType)
  texture.needsUpdate = true
  return texture
}

const container = document.querySelector('#ink-figure')
const demoAtlas = makeDemoAttractor()

const figure = new FluidInkFigure(container, {
  pigments: [
    { id: 'ink', color: '#20241f', priority: 10 },
    { id: 'cinnabar', color: '#a9412e', priority: 9 },
  ],
  attractorBanks: [demoAtlas],
  attractionStrength: 0.78,
  recoveryDelay: 0.65,
  mixing: 0.34,
  interactionMode: 'standalone',
})

window.fluidInkFigure = figure
