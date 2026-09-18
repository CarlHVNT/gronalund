// Park geometry helpers shared by the vector map and the app (distances).
import park from '../data/park.geojson.json'
import { portraitBearing as bearingForOutline } from './bearing'
import { coastFeatures } from './sea'
import { buildModelFeatures } from './models'

export const PARK = park

// What the vector map draws: the pipeline's features plus sea and island
// polygons derived from the coastline lines (OSM has no sea polygons), built
// for a box comfortably larger than the camera can reach.
function withCoast(data) {
  const [[w, s], [e, n]] = data.meta?.maxBounds || data.meta?.bounds || [[0, 0], [0, 0]]
  const padLon = (e - w) * 0.6
  const padLat = (n - s) * 0.6
  const box = [[w - padLon, s - padLat], [e + padLon, n + padLat]]
  let extra = []
  try {
    extra = coastFeatures(data.features, box)
  } catch (err) {
    console.warn('Coast polygons skipped:', err?.message || err)
  }
  let models = []
  try {
    models = buildModelFeatures(data.features).features
  } catch (err) {
    console.warn('3D models skipped:', err?.message || err)
  }
  return { ...data, features: [...data.features, ...extra, ...models] }
}

export const MAP_DATA = withCoast(park)

export const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9åäö]/g, '')

// [lon, lat] for every checkpoint: an explicit `geo` ([lat, lon]) in the event
// data wins, then the OSM attraction with the same name, then a slot on a
// ring around the park centre so nothing disappears.
export function resolveCheckpointPositions(checkpoints) {
  const byName = new Map()
  for (const f of park.features) {
    if (f.properties.layer === 'attraction' && f.geometry.type === 'Point' && f.properties.name) {
      byName.set(norm(f.properties.name), f.geometry.coordinates)
    }
  }
  const [lon, lat] = park.meta.center
  const positions = new Map()
  checkpoints.forEach((cp, i) => {
    if (Array.isArray(cp.geo) && cp.geo.length === 2) {
      positions.set(cp.id, [cp.geo[1], cp.geo[0]])
      return
    }
    const hit = byName.get(norm(cp.name))
    if (hit) positions.set(cp.id, hit)
    else {
      const a = (i / Math.max(1, checkpoints.length)) * Math.PI * 2
      positions.set(cp.id, [lon + Math.cos(a) * 0.0012, lat + Math.sin(a) * 0.0006])
    }
  })
  return positions
}

// Great-circle distance in metres between two [lon, lat] points.
export function distanceMetres([lon1, lat1], [lon2, lat2]) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// All outline vertices of the park polygon(s) as [lon, lat].
export function parkOutline() {
  const pts = []
  for (const f of park.features) {
    if (f.properties.layer !== 'park') continue
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]
    for (const rings of polys) for (const ring of rings) for (const c of ring) pts.push(c)
  }
  return pts
}

// Map rotation for the park outline (see bearing.js).
export function portraitBearing(points = parkOutline()) {
  return bearingForOutline(points, park.meta?.bearingDeg || 0)
}

export function formatDistance(m) {
  if (m == null || !Number.isFinite(m)) return ''
  if (m < 1000) return `${Math.max(5, Math.round(m / 5) * 5)} m`
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`
}
