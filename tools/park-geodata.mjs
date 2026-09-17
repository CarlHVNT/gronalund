#!/usr/bin/env node
// Builds client/src/data/park-geo.json: Gröna Lund's real layout from
// OpenStreetMap, projected into the app's map coordinate space so the
// illustrated map can be drawn from true geometry.
//
//   node tools/park-geodata.mjs fetch                    # query Overpass, then convert
//   node tools/park-geodata.mjs convert --input raw.json # convert a saved Overpass response
//
// Writes two files: the projected plate data (--out) for the illustrated SVG
// map and WGS84 GeoJSON (--geojson-out) for the MapLibre vector map.
//
// Options: --out <file>          default client/src/data/park-geo.json
//          --geojson-out <file>  default client/src/data/park.geojson.json
//          --synthetic           mark the output as a stand-in layout (not the real park)
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
import { portraitBearing } from '../client/src/lib/bearing.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// Generous box around the park (south, west, north, east); the converter
// clips to the park itself plus a margin, so a big box only costs download time.
const DEFAULT_BBOX = [59.3195, 18.088, 59.3275, 18.1045]
// Public Overpass instances, tried in order. The main instance answers
// "406 Not Acceptable" to requests without a descriptive User-Agent.
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const USER_AGENT = 'gronalund-skattjakten-geodata/1.0 (+https://github.com/CarlHVNT/gronalund)'

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
    const next = rest[i + 1]
    if (next === undefined || next.startsWith('--')) opts[key] = true // boolean flag
    else {
      opts[key] = next
      i++
    }
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
const round6 = (v) => Math.round(v * 1e6) / 1e6

function closeRing(ring) {
  const a = ring[0]
  const b = ring[ring.length - 1]
  return a[0] === b[0] && a[1] === b[1] ? ring : [...ring, a]
}

// --- GeoJSON for the vector map ------------------------------------------------

// Default heights (m) for ride footprints when OSM has no height tag.
const ATTRACTION_HEIGHTS = {
  roller_coaster: 22, drop_tower: 60, big_wheel: 32, swing_carousel: 45, carousel: 8,
  dark_ride: 10, maze: 9, water_slide: 12, train: 4, bumper_car: 5, amusement_ride: 14,
}

function parseHeight(tags = {}, fallback) {
  for (const key of ['height', 'building:height']) {
    const m = tags[key] && String(tags[key]).match(/[\d.]+/)
    if (m) return Number(m[0])
  }
  const levels = Number(tags['building:levels'])
  if (levels) return Math.round(levels * 3.2 * 10) / 10
  return fallback
}

// Compass bearing (clockwise from north, in (-90, 90]) of the park's long axis,
// so the vector map can put that axis vertically like the illustrated plate.
function axisBearingDeg(parkPts) {
  return portraitBearing(parkPts.map(([lat, lon]) => [lon, lat]), 0)
}

export function toGeoJSON(raw, opts = {}) {
  const elements = raw.elements || []
  const parks = elements.filter((e) => e.tags?.tourism === 'theme_park' && ringsOf(e).length)
  if (parks.length === 0) throw new Error('No tourism=theme_park geometry in the input.')
  const park = parks.find((e) => /gr[öo]na lund/i.test(e.tags?.name || '')) || parks[0]
  const parkRings = ringsOf(park).map(closeRing)
  const parkPts = parkRings.flat()
  const [lat0, lon0] = centroid(parkPts)
  const { mPerDegLat, mPerDegLon } = metresPerDegree(lat0)
  const lats = parkPts.map((p) => p[0])
  const lons = parkPts.map((p) => p[1])
  const bounds = [[round6(Math.min(...lons)), round6(Math.min(...lats))], [round6(Math.max(...lons)), round6(Math.max(...lats))]]
  const padLat = 0.0018
  const padLon = padLat * (mPerDegLat / mPerDegLon)
  const maxBounds = [[round6(bounds[0][0] - padLon), round6(bounds[0][1] - padLat)], [round6(bounds[1][0] + padLon), round6(bounds[1][1] + padLat)]]

  const lonLat = ([lat, lon]) => [round6(lon), round6(lat)]
  // Keep the bundle small: only things in or right around the park, plus
  // water a bit further out for the shoreline.
  const near = ([lat, lon], mLat, mLon) => lat >= bounds[0][1] - mLat && lat <= bounds[1][1] + mLat && lon >= bounds[0][0] - mLon && lon <= bounds[1][0] + mLon
  const nearPark = (pt) => near(pt, 0.0009, 0.0018)
  const nearWater = (pts) => pts.some((pt) => near(pt, 0.004, 0.008))
  const features = []
  const push = (geometry, properties) => features.push({ type: 'Feature', geometry, properties })
  const polygon = (rings) => ({ type: 'Polygon', coordinates: rings.map((r) => closeRing(r).map(lonLat)) })
  const line = (ring) => ({ type: 'LineString', coordinates: ring.map(lonLat) })
  const point = (p) => ({ type: 'Point', coordinates: lonLat(p) })

  const parkGeometry = parkRings.length === 1 ? polygon(parkRings) : { type: 'MultiPolygon', coordinates: parkRings.map((r) => [r.map(lonLat)]) }
  push(parkGeometry, { layer: 'park', name: park.tags?.name || 'Gröna Lund' })
  // Mask: a large ring with the park cut out, drawn on top to fade the surroundings.
  const big = 0.03
  const outer = [[lat0 - big, lon0 - big], [lat0 - big, lon0 + big], [lat0 + big, lon0 + big], [lat0 + big, lon0 - big], [lat0 - big, lon0 - big]]
  push(polygon([outer, ...parkRings.map((r) => [...r].reverse())]), { layer: 'mask' })

  for (const el of elements) {
    if (el === park) continue
    const tags = el.tags || {}
    const rings = ringsOf(el)
    const pts = rings.flat()
    const pt = el.type === 'node' ? [el.lat, el.lon] : pts.length ? centroid(pts) : null

    if (tags.attraction) {
      if (!pt || !nearPark(pt)) continue
      const kind = tags.attraction
      const props = {
        layer: 'attraction', id: `${el.type}/${el.id}`, name: tags.name || null, kind,
        height: parseHeight(tags, ATTRACTION_HEIGHTS[kind] ?? ATTRACTION_HEIGHTS.amusement_ride),
      }
      push(point(pt), props)
      const closed = rings.filter(isClosed)
      if (closed.length) push(polygon(closed), { ...props, layer: 'attraction-footprint' })
      continue
    }
    if (tags.roller_coaster && rings.length) {
      if (pt && nearPark(pt)) for (const r of rings) push(line(r), { layer: 'track', name: tags.name || null })
      continue
    }
    if (tags.building && rings.length) {
      if (!pt || !nearPark(pt)) continue
      const closed = rings.filter(isClosed)
      if (closed.length) push(polygon(closed), { layer: 'building', name: tags.name || null, kind: tags.building, height: parseHeight(tags, 6) })
      continue
    }
    if ((tags.natural === 'water' || tags.natural === 'coastline' || tags.waterway) && rings.length) {
      for (const r of rings) if (nearWater(r)) push(isClosed(r) ? polygon([r]) : line(r), { layer: 'water', kind: tags.natural || tags.waterway })
      continue
    }
    if (tags.highway && rings.length) {
      for (const r of rings) if (r.some(nearPark)) push(line(r), { layer: 'path', kind: tags.highway })
      continue
    }
    if ((tags.amenity || tags.shop || tags.tourism || tags.entrance) && pt && nearPark(pt)) {
      push(point(pt), { layer: 'poi', name: tags.name || null, kind: tags.amenity || tags.shop || tags.tourism || `entrance:${tags.entrance}` })
    }
  }

  // A ride mapped both as a node and as an area would label twice: keep one
  // point per name, preferring the one that also has a footprint.
  const norm = (n) => String(n).toLowerCase().replace(/[^a-z0-9åäö]/g, '')
  const withFootprint = new Set(features.filter((f) => f.properties.layer === 'attraction-footprint' && f.properties.name).map((f) => f.properties.id))
  const seenNames = new Set()
  const deduped = []
  const points = features.filter((f) => f.properties.layer === 'attraction' && f.properties.name)
  points.sort((a, b) => Number(withFootprint.has(b.properties.id)) - Number(withFootprint.has(a.properties.id)))
  for (const f of features) {
    if (f.properties.layer === 'attraction' && f.properties.name) continue
    deduped.push(f)
  }
  for (const f of points) {
    const key = norm(f.properties.name)
    if (seenNames.has(key)) continue
    seenNames.add(key)
    deduped.push(f)
  }

  return {
    type: 'FeatureCollection',
    attribution: '© OpenStreetMap contributors (ODbL)',
    meta: {
      synthetic: Boolean(opts.synthetic),
      generatedAt: new Date().toISOString(),
      center: [round6(lon0), round6(lat0)],
      bearingDeg: axisBearingDeg(parkPts),
      bounds,
      maxBounds,
    },
    features: deduped,
  }
}

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
    source: { bbox: opts.bbox || DEFAULT_BBOX, generatedAt: new Date().toISOString(), synthetic: Boolean(opts.synthetic) },
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchOverpass(bbox) {
  const body = `data=${encodeURIComponent(overpassQuery(bbox))}`
  const errors = []
  for (const url of OVERPASS_URLS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Overpass: ${url} (attempt ${attempt})`)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', 'user-agent': USER_AGENT },
          body,
        })
        if (res.ok) {
          const json = await res.json()
          if (!Array.isArray(json.elements)) throw new Error('response has no elements array')
          return json
        }
        const text = (await res.text()).replace(/\s+/g, ' ').slice(0, 200)
        errors.push(`${url}: HTTP ${res.status} ${text}`)
        // 429 (rate limited) and 504 (timeout) are worth one retry after a pause; anything else, move on.
        if (res.status !== 429 && res.status !== 504) break
        await sleep(15000)
      } catch (e) {
        errors.push(`${url}: ${e.message}`)
        await sleep(3000)
      }
    }
  }
  throw new Error(`Every Overpass instance failed:\n  ${errors.join('\n  ')}`)
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
  const gj = toGeoJSON(raw, opts)
  const gjFile = path.resolve(ROOT, opts['geojson-out'] || 'client/src/data/park.geojson.json')
  await fs.mkdir(path.dirname(gjFile), { recursive: true })
  await fs.writeFile(gjFile, JSON.stringify(gj))
  const perLayer = {}
  for (const f of gj.features) perLayer[f.properties.layer] = (perLayer[f.properties.layer] || 0) + 1
  console.log(`wrote ${path.relative(ROOT, gjFile)}${gj.meta.synthetic ? ' (SYNTHETIC stand-in layout)' : ''}: center ${gj.meta.center}, bearing ${gj.meta.bearingDeg}°,`, perLayer)
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
