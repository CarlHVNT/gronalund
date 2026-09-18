// Stylised 3D "assets" for the vector map, built from the real OpenStreetMap
// features. Each attraction becomes a small set of extruded polygons (shaft,
// gondola ring, canopy, seats, arms...) with a base and a height, coaster
// tracks become a ribbon on supports with a lift hill and decaying hills,
// buildings get a roof tier and trees a trunk and a crown. Everything is
// plain fill-extrusion geometry, so MapLibre lights and depth-sorts it like
// the rest of the map. Tones are resolved to colours in VectorMap's style.
import { metresPerDegree } from './geo.js'
import { mergeChains } from './sea.js'

export const MAX_MODEL_HEIGHT = 125
export const TONES = ['steel', 'steelDark', 'accent', 'gold', 'floor', 'canopy', 'canopy2', 'cup', 'wall', 'roof', 'track', 'trackDark', 'trackBlue', 'trackTeal', 'trackWood', 'wood', 'trunk', 'leaf']
const TWO_PI = Math.PI * 2

// Kinds we model from the ride's name, when OSM only says "amusement_ride".
const NAME_KINDS = [
  [/pariserhjul|ferris|big.?wheel/i, 'big_wheel'],
  [/eclipse|star.?flyer/i, 'star_flyer'],
  [/kättingflyg|wave.?swing|chairoplane/i, 'wave_swinger'],
  [/tekopp|tea.?cup/i, 'teacups'],
  [/flygande mattan|magic carpet/i, 'magic_carpet'],
  [/bläckfisk|octopus|rock-?jet|flygande elefant/i, 'arm_ride'],
  [/fritt fall|katapult|ikaros|free.?fall|drop/i, 'drop_tower'],
  [/insane/i, 'insane'],
]
const TOWER_KINDS = new Set(['drop_tower', 'star_flyer', 'big_wheel'])

// Per-coaster look: hill amplitude and wavelength (m), base height, ribbon
// width, tones and support spacing. Twister is Gröna Lund's wooden coaster.
const COASTER_STYLES = [
  { test: /monster/i, A: 26, lambda: 150, h0: 4, width: 0.9, tone: 'trackDark', support: 'steel', every: 12 },
  { test: /twister/i, A: 15, lambda: 90, h0: 3, width: 0.9, tone: 'trackWood', support: 'wood', every: 5, bent: 3.4 },
  { test: /jetline/i, A: 24, lambda: 130, h0: 4, width: 0.9, tone: 'trackBlue', support: 'steel', every: 12 },
  { test: /kvasten/i, A: 8, lambda: 70, h0: 4, width: 0.8, tone: 'trackTeal', support: 'steel', every: 10 },
  { test: /vilda musen|wild mouse/i, A: 7, lambda: 60, h0: 3, width: 0.7, tone: 'track', support: 'steel', every: 9 },
]
const SMALL_COASTER = { A: 2.2, lambda: 40, h0: 1.6, width: 0.6, tone: 'track', support: 'steel', every: 8 }
const coasterStyle = (name) => COASTER_STYLES.find((s) => s.test.test(name)) || SMALL_COASTER

function frameAt([lon0, lat0]) {
  const { mPerDegLat, mPerDegLon } = metresPerDegree(lat0)
  return {
    toLonLat: ([x, y]) => [lon0 + x / mPerDegLon, lat0 + y / mPerDegLat],
    toXY: ([lon, lat]) => [(lon - lon0) * mPerDegLon, (lat - lat0) * mPerDegLat],
  }
}

const circle = (cx, cy, r, n = 14) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos((TWO_PI * i) / n), cy + r * Math.sin((TWO_PI * i) / n)])
// Axis-aligned w x h box around (cx, cy), rotated by `angle` (w runs along the angle).
function rect(cx, cy, w, h, angle = 0) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const pt = (dx, dy) => [cx + dx * c - dy * s, cy + dx * s + dy * c]
  return [pt(-w / 2, -h / 2), pt(w / 2, -h / 2), pt(w / 2, h / 2), pt(-w / 2, h / 2), pt(-w / 2, -h / 2)]
}

function centroidOf(ring) {
  let x = 0
  let y = 0
  const n = ring.length - 1 || 1
  for (let i = 0; i < n; i++) {
    x += ring[i][0]
    y += ring[i][1]
  }
  return [x / n, y / n]
}

function areaOf(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return Math.abs(a / 2)
}

function longestEdgeAngle(ring) {
  let best = 0
  let angle = 0
  for (let i = 0; i < ring.length - 1; i++) {
    const dx = ring[i + 1][0] - ring[i][0]
    const dy = ring[i + 1][1] - ring[i][1]
    const len = Math.hypot(dx, dy)
    if (len > best) {
      best = len
      angle = Math.atan2(dy, dx)
    }
  }
  return angle
}

// Shrink a ring towards its centroid (a cheap "inset" for roof tiers).
const shrink = (ring, f) => {
  const [cx, cy] = centroidOf(ring)
  return ring.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f])
}

function hash(str) {
  let h = 2166136261
  for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return (h >>> 0) / 4294967295
}

const clampH = (h) => Math.max(0.5, Math.min(MAX_MODEL_HEIGHT, Number(h) || 0))
const cap = (h) => Math.min(MAX_MODEL_HEIGHT, h)

function refineKind(kind, name, H, nearTall) {
  for (const [re, k] of NAME_KINDS) if (re.test(name)) return k
  if (kind === 'swing_carousel') return H >= 60 || nearTall ? 'star_flyer' : 'wave_swinger'
  return kind
}

// Resample a polyline (metres) every ~3 m; returns [{x, y, s}] with s = distance along.
function resample(xy, step = 3) {
  const samples = []
  let s = 0
  for (let i = 0; i < xy.length - 1; i++) {
    const [x0, y0] = xy[i]
    const [x1, y1] = xy[i + 1]
    const len = Math.hypot(x1 - x0, y1 - y0)
    const steps = Math.max(1, Math.round(len / step))
    for (let k = 0; k < steps; k++) {
      const t = k / steps
      samples.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, s: s + len * t })
    }
    s += len
  }
  samples.push({ x: xy[xy.length - 1][0], y: xy[xy.length - 1][1], s })
  return samples
}

// A coaster ribbon along `xy` (metres) with its supports. Open chains start
// low (the station), climb the lift hill and roll on with decaying hills;
// closed loops get a whole number of hills so the profile meets itself.
function ribbon(add, xy, style, { loop = false, profile: custom } = {}) {
  const samples = resample(xy)
  const L = samples[samples.length - 1].s
  if (L < 1) return
  const lambda = loop ? L / Math.max(1, Math.round(L / style.lambda)) : style.lambda
  const profile = custom
    ? (d) => custom(d, L)
    : (d) => {
        const env = loop ? 1 : 1 - 0.5 * (d / L)
        return style.h0 + style.A * env * (0.5 - 0.5 * Math.cos((TWO_PI * d) / lambda))
      }
  let sinceSupport = style.every // a support right at the start
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i]
    const b = samples[i + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < 0.2) continue
    const nx = (-dy / len) * style.width
    const ny = (dx / len) * style.width
    const ha = profile(a.s)
    const hb = profile(b.s)
    add([[a.x + nx, a.y + ny], [b.x + nx, b.y + ny], [b.x - nx, b.y - ny], [a.x - nx, a.y - ny], [a.x + nx, a.y + ny]], Math.max(0, Math.min(ha, hb) - 0.9), Math.max(ha, hb), style.tone)
    sinceSupport += len
    if (sinceSupport >= style.every && ha > 1.6) {
      sinceSupport = 0
      const angle = Math.atan2(dy, dx)
      // Wooden coasters get a wide "bent" across the track, steel ones a post.
      if (style.bent) add(rect(a.x, a.y, style.bent, 0.35, angle + Math.PI / 2), 0, ha - 0.9, style.support)
      else add(rect(a.x, a.y, 0.7, 0.7, angle), 0, ha - 0.9, style.support)
    }
  }
}

export function buildModelFeatures(features) {
  const out = []
  const emit = (frame, ringXY, base, height, tone, extra = {}) => {
    if (!(height > base)) return
    out.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ringXY.map(frame.toLonLat)] },
      properties: { layer: 'model', base: Math.round(base * 10) / 10, height: Math.round(height * 10) / 10, tone, ...extra },
    })
  }

  // Tall "buildings" in the data are ride structures (Eclipse's 121 m mast is
  // an OSM building): they lend their height to the ride standing on them.
  const tall = []
  for (const f of features) {
    if (f.properties.layer !== 'building' || f.geometry.type !== 'Polygon') continue
    const h = Number(f.properties.height) || 0
    if (h >= 40) tall.push({ at: centroidOf(f.geometry.coordinates[0]), height: h })
  }

  // Coasters drawn from track lines, grouped by name.
  const tracksByName = new Map()
  for (const f of features) {
    if (f.properties.layer !== 'track' || f.geometry.type !== 'LineString') continue
    const key = f.properties.name || `track-${f.geometry.coordinates[0].join(',')}`
    if (!tracksByName.has(key)) tracksByName.set(key, [])
    tracksByName.get(key).push(f.geometry.coordinates)
  }
  const hasTrack = (name) => [...tracksByName.keys()].some((k) => k.toLowerCase() === String(name).toLowerCase())

  // --- attractions --------------------------------------------------------
  const footprints = new Map()
  for (const f of features) {
    if (f.properties.layer === 'attraction-footprint' && f.geometry.type === 'Polygon') footprints.set(f.properties.id || f.properties.name, f)
  }
  for (const f of features) {
    if (f.properties.layer !== 'attraction' || f.geometry.type !== 'Point') continue
    const p = f.properties
    const name = p.name || p.kind || 'ride'
    const frame = frameAt(f.geometry.coordinates)
    const fp = footprints.get(p.id || p.name)
    const ringXY = fp ? fp.geometry.coordinates[0].map(frame.toXY) : null
    const [cx, cy] = ringXY ? centroidOf(ringXY) : [0, 0]
    const rf = ringXY ? Math.sqrt(areaOf(ringXY) / Math.PI) : 6
    const nearTall = tall.find((t) => Math.hypot(...frame.toXY(t.at)) < 25)
    let H = clampH(p.height)
    const kind = refineKind(p.kind || 'amusement_ride', name, H, Boolean(nearTall))
    if (nearTall && TOWER_KINDS.has(kind)) H = clampH(Math.max(H, nearTall.height))
    const add = (ring, base, height, tone) => emit(frame, ring, base, height, tone, { name })

    if (kind === 'drop_tower') {
      add(circle(cx, cy, Math.max(4.5, rf * 0.8), 18), 0, 1.4, 'floor')
      add(circle(cx, cy, 1.8, 10), 0, H, 'steel')
      if (/fritt fall/i.test(name)) {
        // Four gondola cars around the tower and a machine house on top.
        for (let i = 0; i < 4; i++) {
          const a = (TWO_PI * i) / 4
          add(rect(cx + 3.2 * Math.cos(a), cy + 3.2 * Math.sin(a), 2.6, 2, a), H * 0.3, H * 0.3 + 3.2, 'accent')
        }
        add(rect(cx, cy, 6, 6), H - 4.5, H, 'steelDark')
      } else {
        add(circle(cx, cy, 4.8, 14), H * 0.28, H * 0.28 + 3, 'accent')
        add(circle(cx, cy, 2.9, 12), H - 3.5, H, 'accent')
      }
      add(circle(cx, cy, 0.5, 6), H, cap(H + 5), 'steel')
    } else if (kind === 'star_flyer') {
      add(circle(cx, cy, Math.max(7, rf * 0.9), 20), 0, 1.2, 'floor')
      add(circle(cx, cy, 1.5, 12), 0, H, 'steel')
      const zRing = H * 0.74
      add(circle(cx, cy, 6.5, 16), zRing, zRing + 3, 'accent')
      for (let i = 0; i < 12; i++) {
        const a = (TWO_PI * i) / 12
        add(rect(cx + 10 * Math.cos(a), cy + 10 * Math.sin(a), 1.2, 1.2, a), zRing - 3.4, zRing - 1.6, 'gold')
      }
      add(circle(cx, cy, 2.6, 12), H - 4, H, 'accent')
      add(circle(cx, cy, 0.5, 6), H, cap(H + 4), 'steel')
    } else if (kind === 'wave_swinger') {
      const r = Math.max(5.5, Math.min(7.5, rf * 1.1))
      add(circle(cx, cy, r + 0.6, 18), 0, 1, 'floor')
      add(circle(cx, cy, 0.8, 8), 1, 13, 'steel')
      add(circle(cx, cy, r, 18), 10.4, 11.8, 'canopy')
      add(circle(cx, cy, r * 0.6, 14), 11.8, 12.9, 'canopy2')
      add(circle(cx, cy, 0.5, 6), 12.9, 14.6, 'gold')
      for (let i = 0; i < 12; i++) {
        const a = (TWO_PI * i) / 12
        add(rect(cx + (r - 0.8) * Math.cos(a), cy + (r - 0.8) * Math.sin(a), 1, 1, a), 3.2, 4.2, 'gold')
      }
    } else if (kind === 'big_wheel') {
      const D = Math.max(12, Math.min(H, 50))
      const R = D / 2
      const hub = R + 3
      const dir = ringXY ? longestEdgeAngle(ringXY) : hash(name) * Math.PI // orientation of the wheel plane
      const ux = Math.cos(dir)
      const uy = Math.sin(dir)
      const n = 20
      for (let i = 0; i < n; i++) {
        const a = (TWO_PI * i) / n
        const along = R * Math.cos(a)
        const z = hub + R * Math.sin(a)
        add(rect(cx + ux * along, cy + uy * along, 1.6, 1.4, dir), z - 0.8, z + 0.8, 'gold')
      }
      add(rect(cx, cy, 2.2, 2.2, dir), hub - 1.2, hub + 1.2, 'steelDark')
      for (const side of [-1, 1]) add(rect(cx + ux * side * R * 0.55, cy + uy * side * R * 0.55, 1.2, 1.2, dir), 0, hub - 1, 'steel')
      add(rect(cx, cy, D + 4, 4, dir), 0, 0.8, 'floor')
    } else if (kind === 'carousel') {
      const r = Math.max(6, Math.min(10, rf || 8))
      add(circle(cx, cy, r, 18), 0, 1, 'floor')
      add(circle(cx, cy, 0.45, 8), 1, r * 0.95, 'steel')
      add(circle(cx, cy, r * 1.06, 18), r * 0.5, r * 0.65, 'canopy')
      add(circle(cx, cy, r * 0.75, 18), r * 0.65, r * 0.82, 'canopy2')
      add(circle(cx, cy, r * 0.45, 14), r * 0.82, r * 0.98, 'canopy')
      add(circle(cx, cy, 0.9, 8), r * 0.98, r * 1.2, 'gold')
    } else if (kind === 'teacups') {
      const r = Math.max(5, Math.min(9, rf || 7))
      add(circle(cx, cy, r, 18), 0, 0.5, 'floor')
      add(circle(cx, cy, 1.6, 10), 0.5, 2.6, 'accent') // the teapot
      add(circle(cx, cy, 0.5, 6), 2.6, 3.3, 'gold')
      for (let i = 0; i < 6; i++) {
        const a = (TWO_PI * i) / 6
        add(circle(cx + r * 0.6 * Math.cos(a), cy + r * 0.6 * Math.sin(a), 1.1, 8), 0.5, 1.9, 'cup')
      }
    } else if (kind === 'magic_carpet') {
      const ang = ringXY ? longestEdgeAngle(ringXY) : 0
      const half = Math.max(4, rf * 0.9)
      const ux = Math.cos(ang)
      const uy = Math.sin(ang)
      add(ringXY || rect(cx, cy, 12, 6, ang), 0, 0.6, 'floor')
      for (const s of [-1, 1]) add(rect(cx + ux * s * half, cy + uy * s * half, 1, 1.4, ang), 0, 12, 'steel')
      add(rect(cx, cy, half * 2 + 1, 0.8, ang), 11.4, 12.2, 'steel')
      add(rect(cx, cy, half * 2 - 3, 2.2, ang), 7.6, 8.4, 'accent') // the gondola
      for (const s of [-1, 1]) add(rect(cx + ux * s * (half - 2.5), cy + uy * s * (half - 2.5), 0.4, 0.4, ang), 8.4, 11.4, 'steel')
    } else if (kind === 'arm_ride') {
      const R = Math.max(4.5, rf * 0.8)
      const hubH = /rock-?jet/i.test(name) ? 7 : 6
      const podTone = /elefant/i.test(name) ? 'cup' : /rock-?jet/i.test(name) ? 'accent' : 'gold'
      add(ringXY || circle(cx, cy, R + 1.5, 16), 0, 0.6, 'floor')
      add(circle(cx, cy, 1.4, 10), 0.6, hubH, 'steel')
      for (let i = 0; i < 6; i++) {
        const a = (TWO_PI * i) / 6 + 0.3
        add(rect(cx + (R / 2) * Math.cos(a), cy + (R / 2) * Math.sin(a), R, 0.5, a), hubH - 0.6, hubH, 'steel')
        add(rect(cx + R * Math.cos(a), cy + R * Math.sin(a), 2, 1.3, a), hubH - 3.4, hubH - 2.2, podTone)
      }
    } else if (kind === 'bumper_car' && ringXY) {
      add(ringXY, 0, 1.2, 'floor')
      add(shrink(ringXY, 0.96), 4.2, 5.2, 'canopy')
      for (let i = 0; i < 4; i++) {
        const a = (TWO_PI * i) / 4 + Math.PI / 4
        add(rect(cx + rf * 0.7 * Math.cos(a), cy + rf * 0.7 * Math.sin(a), 0.5, 0.5), 0, 4.2, 'steel')
      }
    } else if (kind === 'roller_coaster' && ringXY && !hasTrack(name)) {
      // A coaster mapped only as an area (Jetline): run the ribbon around its edge.
      ribbon(add, shrink(ringXY, 0.88), coasterStyle(name), { loop: true })
    } else if (kind === 'insane' || kind === 'roller_coaster') {
      // Drawn from the track lines below.
    } else if (ringXY && areaOf(ringXY) < 8) {
      // A tiny footprint (Lyktan): a pole ride with a gondola.
      const h = Math.min(H, 12)
      add(circle(cx, cy, 2.2, 10), 0, 0.5, 'floor')
      add(circle(cx, cy, 0.45, 6), 0.5, h, 'steel')
      add(rect(cx, cy, 2.4, 2.4), h * 0.5, h * 0.5 + 2.2, 'gold')
      add(circle(cx, cy, 1.1, 8), h, h + 0.8, 'accent')
    } else if (ringXY) {
      // Dark rides, fun houses, game halls: the real footprint as walls plus a roof tier.
      const h = Math.min(H, kind === 'fun_house' ? 12 : 10)
      const roofH = Math.max(1.4, h * 0.18)
      add(ringXY, 0, h, 'wall')
      add(shrink(ringXY, 0.82), h, h + roofH, 'roof')
      if (kind === 'dark_ride' || kind === 'fun_house' || kind === 'maze') add(rect(cx, cy, 1.2, 1.2), h + roofH, h + roofH + 3, 'accent')
    }
  }

  // --- coasters from track lines --------------------------------------------
  for (const [name, lines] of tracksByName) {
    const chains = mergeChains(lines).filter((c) => c.length >= 2)
    if (!chains.length) continue
    if (/insane/i.test(name)) {
      // Insane is a compact vertical coaster: a tall steel frame with the track climbing through it.
      const chain = chains.reduce((a, b) => (b.length > a.length ? b : a))
      const frame = frameAt(chain[0])
      const xy = chain.map(frame.toXY)
      const add = (ring, base, height, tone) => emit(frame, ring, base, height, tone, { name })
      const [x0, y0] = xy[0]
      const [x1, y1] = xy[xy.length - 1]
      const mx = (x0 + x1) / 2
      const my = (y0 + y1) / 2
      const ang = Math.atan2(y1 - y0, x1 - x0)
      const ux = Math.cos(ang)
      const uy = Math.sin(ang)
      const len = Math.max(Math.hypot(x1 - x0, y1 - y0), 18)
      const wid = 9
      const hgt = 26
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        add(rect(mx + ux * sx * (len / 2) - uy * sy * (wid / 2), my + uy * sx * (len / 2) + ux * sy * (wid / 2), 1, 1, ang), 0, hgt, 'steel')
      }
      for (const s of [-1, 0, 1]) add(rect(mx - uy * s * (wid / 2), my + ux * s * (wid / 2), len + 1, 0.8, ang), hgt - 1.2, hgt, 'steel')
      ribbon(add, xy, { ...SMALL_COASTER, width: 0.8, tone: 'track', every: 1e9 }, { profile: (d, L) => 3 + 19 * (d / L) })
      continue
    }
    const style = coasterStyle(name)
    for (const chain of chains) {
      const frame = frameAt(chain[0])
      const add = (ring, base, height, tone) => emit(frame, ring, base, height, tone, { name })
      ribbon(add, chain.map(frame.toXY), style)
    }
  }

  // --- buildings in the park get a roof tier; tall ride structures are drawn as models above ---
  for (const f of features) {
    if (f.properties.layer !== 'building' || f.geometry.type !== 'Polygon' || f.properties.outside) continue
    const h = Number(f.properties.height) || 6
    if (h >= 40) continue
    const ring = f.geometry.coordinates[0]
    const frame = frameAt(ring[0])
    emit(frame, shrink(ring.map(frame.toXY), 0.85), h, h + Math.max(1.2, Math.min(3, h * 0.2)), 'roof', { name: f.properties.name || null })
  }

  // --- trees ---------------------------------------------------------------
  for (const f of features) {
    if (f.properties.layer !== 'tree' || f.geometry.type !== 'Point' || f.properties.outside) continue
    const frame = frameAt(f.geometry.coordinates)
    const h = Math.min(18, Math.max(4, Number(f.properties.height) || 8))
    const crown = Math.min(6, Math.max(1.6, (Number(f.properties.crown) || h * 0.55) / 2))
    emit(frame, circle(0, 0, 0.28, 6), 0, h * 0.4, 'trunk')
    emit(frame, circle(0, 0, crown, 8), h * 0.35, h, 'leaf')
  }

  return { features: out }
}
