// Which map the map screen shows: the illustrated isometric plate (default)
// or the MapLibre vector map built from real park geometry (opt-in, beta).
export const MAP_MODE_KEY = 'rs-gl-map-mode'

export function readMapMode() {
  try {
    return localStorage.getItem(MAP_MODE_KEY) === 'vector' ? 'vector' : 'iso'
  } catch {
    return 'iso'
  }
}

export function writeMapMode(mode) {
  try {
    localStorage.setItem(MAP_MODE_KEY, mode)
  } catch {
    /* ignore */
  }
}
