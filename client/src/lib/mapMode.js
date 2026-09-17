// Which map the map screen shows: the illustrated isometric plate or the
// MapLibre vector map. The vector map is the default once the bundled park
// data is real OpenStreetMap geometry; with the synthetic stand-in layout
// the plate stays default. Either way the choice is remembered per device.
import { PARK } from './parkGeo'

export const MAP_MODE_KEY = 'rs-gl-map-mode'
export const DEFAULT_MAP_MODE = PARK.meta?.synthetic ? 'iso' : 'vector'

export function readMapMode() {
  try {
    const stored = localStorage.getItem(MAP_MODE_KEY)
    if (stored === 'vector' || stored === 'iso') return stored
    return DEFAULT_MAP_MODE
  } catch {
    return DEFAULT_MAP_MODE
  }
}

export function writeMapMode(mode) {
  try {
    localStorage.setItem(MAP_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}
