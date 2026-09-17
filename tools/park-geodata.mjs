#!/usr/bin/env node
// Builds client/src/data/park-geo.json: Gröna Lund's real layout from
// OpenStreetMap, projected into the app's map coordinate space so the
// illustrated map can be drawn from true geometry.
//
//   node tools/park-geodata.mjs fetch                    # query Overpass, then convert
//   node tools/park-geodata.mjs convert --input raw.json # convert a saved Overpass response
//
// Options: --out <file>          default client/src/data/park-geo.json
//          --raw <file>          where `fetch` saves the raw response (default tools/park-osm.raw.json)
//          --bbox s,w,n,e        default is a box around the park
//          --width/--height      viewBox size, default 402 x 620 (matches IsoMap)
//          --padding <px>        default 24
//          --rotate <deg>        override the automatic rotation
//
// Data © OpenStreetMap contributors, ODbL: keep the attribution visible in the app.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeProjector, metresPerDegree } from '../client/src/lib/geo.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_BBOX = [59.3212, 18.092, 59.3262, 18.1015] // south, west, north, east
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export function overpassQuery(bbox) {
  const b = bbox.join(',')
  return `[out:json][timeout:90];
(
  nwr["tourism"="theme_park"](${b});
  nwr["attraction"](${b});
  way["building"](${b});
  way["highway"~"^(footway|pedestrian|path|steps|service)$"](${b});
  way["roller_coaster"](${b});
  way["natural"~"^(water|coastline)$"](${b});
  way["waterway"](${b});
  nwr["amenity"~"^(restaurant|cafe|fast_food|toilets|ice_cream)$"](${b});
  nwr["shop"](${b});
  nwr["tourism"~"^(information|attraction)$"](${b});
  node["entrance"](${b});
);
out geom;`
}

function parseArgs(argv) {
  const [command, ...rest] = argv
  const opts = { command }
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].replace(/^--/, '')
    opts[key] = rest[i + 1]
    i++
  }
  return opts
}

// --- geometry helpers -------------------------------------------------------

function ringsOf(el) {
  // Returns arrays of [lat, lon] for a way or a (multi)polygon relation.
  if (el.type === 'way' && el.geometry) return [el.geometry.map((g) => [g.lat, g.lon])]
  if (el.type === 'relation' && el.members) {
    return el.members
      .filter((m) => m.type === 'way' && m.geometry && (m.role === 'outer' || m.role === ''))
      .map((m) => m.geometry.map((g) => [g.lat, g.lon]))
  }
  return []
}

function centroid(points) {
  const n = points.length || 1
  return points.reduce((a, [x, y]) => [a[0] + x / n, a[1] + y / n], [0, 0])
}

function isClosed(ring) {
  const a = ring[0]
  const b = ring[ring.length - 1]
  return ring.length > 3 && a[0] === b[0] && a[1] === b[1]
}

// Principal axis (degrees) of a point cloud in metres: used to rotate the park
// so its long side runs along the tall side of the phone viewBox.
function principalAxisDeg(pts) {
  const [cx, cy] = centroid(pts)
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (const [x, y] of pts) {
    sxx += (x - cx) ** 2
    syy += (y - cy) ** 2
    sxy += (x - cx) * (y - cy)
  }
  return (Math.atan2(2 * sxy, sxx - syy) / 2) * (180 / Math.PI)
}

const round1 = (v) => Math.round(v * 10) / 10

// --- conversion ----------------------------------------------------------------

export function convert(raw, opts = {}) {
  const width = Number(opts.width || 402)
  const height = Number(opts.height || 620)
  const padding = Number(opts.padding || 24)
  const elements = raw.elements || []

  const parks = elements.filter((e) => e.tags?.tourism === 'theme_park' && ringsOf(e).length)
  if (parks.length === 0) throw new Error('No tourism=theme_park geometry in the input.')
  // Prefer the element named Gröna Lund, else the largest ring.
  const park = parks.find((e) => /gr[öo]na lund/i.test(e.tags?.name || '')) || parks[0]
  const parkRings = ringsOf(park)
  const parkPts = parkRings.flat()
  const [lat0, lon0] = centroid(parkPts)
  const { mPerDegLat, mPerDegLon } = metresPerDegree(lat0)
  const toMetres = ([lat, lon]) => [(lon - lon0) * mPerDegLon, -(lat - lat0) * mPerDegLat]

  // Rotation: park's long axis -> vertical (portrait), unless overridden.
  let rotateDeg
  if (opts.rotate !== undefined) rotateDeg = Number(opts.rotate)
  else {
    const axis = principalAxisDeg(parkPts.map(toMetres))
    rotateDeg = 90 - axis
    // Keep the rotation small-ish so north stays roughly "up-right" and labels read naturally.
    if (rotateDeg > 90) rotateDeg -= 180
    if (rotateDeg < -90) rotateDeg += 180
  }

  // Fit the rotated park into the viewBox.
  const unit = makeProjector({ lat0, lon0, mPerDegLat, mPerDegLon, rotateDeg, scale: 1, tx: 0, ty: 0 })
  const rotated = parkPts.map(([lat, lon]) => unit(lat, lon))
  const xs = rotated.map((p) => p.x)
  const ys = rotated.map((p) => p.y)
  const bw = Math.max(...xs) - Math.min(...xs)
  const bh = Math.max(...ys) - Math.min(...ys)
  const scale = Math.min((width - 2 * padding) / bw, (height - 2 * padding) / bh)
  const tx = width / 2 - ((Math.max(...xs) + Math.min(...xs)) / 2) * scale
  const ty = height / 2 - ((Math.max(...ys) + Math.min(...ys)) / 2) * scale
  const projection = { lat0, lon0, mPerDegLat, mPerDegLon, rotateDeg, scale, tx, ty, width, height }
  const project = makeProjector(projection)
  const toXY = ([lat, lon]) => {
    const p = project(lat, lon)
    return [round1(p.x), round1(p.y)]
  }
  const margin = 80
  const inView = (pts) => pts.some(([x, y]) => x > -margin && x < width + margin && y > -margin && y < height + margin)

  const out = {
    attribution: '© OpenStreetMap contributors (ODbL)',
    source: { bbox: opts.bbox || DEFAULT_BBOX, generatedAt: new Date().toISOString() },
    viewBox: [0, 0, width, height],
    projection,
    park: { name: park.tags?.name || 'Gröna Lund', rings: parkRings.map((r) => r.map(toXY)) },
    water: [],
    paths: [],
    buildings: [],
    tracks: [],
    attractions: [],
    pois: [],
  }

  for (const el of elements) {
    const tags = el.tags || {}
    if (el === park) continue
    const rings = ringsOf(el)
    const pts = rings.flat()
    const point = el.type === 'node' ? [el.lat, el.lon] : pts.length ? centroid(pts) : null

    if (tags.attraction) {
      if (!point) continue
      const [x, y] = toXY(point)
      const entry = { id: `${el.type}/${el.id}`, name: tags.name || null, kind: tags.attraction, x, y }
      if (rings.length && isClosed(rings[0])) entry.footprint = rings[0].map(toXY)
      if (inView([[x, y]])) out.attractions.push(entry)
      continue
    }
    if (tags.roller_coaster && rings.length) {
      for (const r of rings) if (inView(r.map(toXY))) out.tracks.push({ name: tags.name || null, points: r.map(toXY) })
      continue
    }
    if (tags.building && rings.length) {
      for (const r of rings) {
        const xy = r.map(toXY)
        if (inView(xy)) out.buildings.push({ name: tags.name || null, kind: tags.building, points: xy })
      }
      continue
    }
    if ((tags.natural === 'water' || tags.natural === 'coastline' || tags.waterway) && rings.length) {
      for (const r of rings) {
        const xy = r.map(toXY)
        if (inView(xy)) out.water.push({ kind: tags.natural || tags.waterway, closed: isClosed(r), points: xy })
      }
      continue
    }
    if (tags.highway && rings.length) {
      for (const r of rings) {
        const xy = r.map(toXY)
        if (inView(xy)) out.paths.push({ kind: tags.highway, points: xy })
      }
      continue
    }
    if ((tags.amenity || tags.shop || tags.tourism || tags.entrance) && point) {
      const [x, y] = toXY(point)
      if (inView([[x, y]])) {
        out.pois.push({ name: tags.name || null, kind: tags.amenity || tags.shop || tags.tourism || `entrance:${tags.entrance}`, x, y })
      }
    }
  }
  return out
}

// --- commands ------------------------------------------------------------------

async function fetchOverpass(bbox) {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(overpassQuery(bbox))}`,
  })
  if (!res.ok) throw new Error(`Overpass answered HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  return res.json()
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const outFile = path.resolve(ROOT, opts.out || 'client/src/data/park-geo.json')
  const bbox = opts.bbox ? opts.bbox.split(',').map(Number) : DEFAULT_BBOX
  let raw

  if (opts.command === 'fetch') {
    raw = await fetchOverpass(bbox)
    const rawFile = path.resolve(ROOT, opts.raw || 'tools/park-osm.raw.json')
    await fs.writeFile(rawFile, JSON.stringify(raw))
    console.log(`saved raw Overpass response (${raw.elements?.length ?? 0} elements) to ${path.relative(ROOT, rawFile)}`)
  } else if (opts.command === 'convert') {
    if (!opts.input) throw new Error('convert needs --input <overpass.json>')
    raw = JSON.parse(await fs.readFile(path.resolve(ROOT, opts.input), 'utf8'))
  } else {
    console.error('usage: node tools/park-geodata.mjs <fetch|convert> [options]')
    process.exit(2)
  }

  const geo = convert(raw, { ...opts, bbox })
  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, JSON.stringify(geo))
  const counts = Object.fromEntries(['water', 'paths', 'buildings', 'tracks', 'attractions', 'pois'].map((k) => [k, geo[k].length]))
  console.log(`wrote ${path.relative(ROOT, outFile)}: rotate ${geo.projection.rotateDeg.toFixed(1)}°, scale ${geo.projection.scale.toFixed(3)} px/m,`, counts)
  const named = geo.attractions.filter((a) => a.name).map((a) => `${a.name} (${a.kind})`)
  if (named.length) console.log('named attractions:', named.join(', '))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}
