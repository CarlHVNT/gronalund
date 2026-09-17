// Sea polygons from OpenStreetMap coastline lines.
//
// OSM does not map the sea as a polygon: `natural=coastline` ways trace the
// shore with land on the LEFT and water on the RIGHT of their direction of
// travel. Within a clip box, each stretch of coast entering at A and leaving
// at B closes into a water polygon by walking the box edge clockwise from B
// back to A (always turning right keeps the water inside). Closed rings are
// islands (counter-clockwise, land inside) or, rarely, lakes (clockwise).
// Everything is done in [lon, lat]; the box is [[west, south], [east, north]].

const key = (p) => `${p[0]},${p[1]}`

// Join way pieces that share exact endpoints into longer chains, keeping direction.
export function mergeChains(lines) {
  const remaining = lines.map((l) => l.slice())
  const chains = []
  while (remaining.length) {
    let chain = remaining.pop()
    let grew = true
    while (grew) {
      grew = false
      for (let i = 0; i < remaining.length; i++) {
        const l = remaining[i]
        if (key(l[0]) === key(chain[chain.length - 1])) {
          chain = chain.concat(l.slice(1))
          remaining.splice(i, 1)
          grew = true
          break
        }
        if (key(l[l.length - 1]) === key(chain[0])) {
          chain = l.slice(0, -1).concat(chain)
          remaining.splice(i, 1)
          grew = true
          break
        }
      }
    }
    chains.push(chain)
  }
  return chains
}

const inside = ([x, y], [[w, s], [e, n]]) => x >= w && x <= e && y >= s && y <= n

// Liang-Barsky: the [t0, t1] portion of p0->p1 inside the box, or null.
function clipSegment(p0, p1, [[w, s], [e, n]]) {
  let t0 = 0
  let t1 = 1
  const dx = p1[0] - p0[0]
  const dy = p1[1] - p0[1]
  const checks = [
    [-dx, p0[0] - w],
    [dx, e - p0[0]],
    [-dy, p0[1] - s],
    [dy, n - p0[1]],
  ]
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null
      continue
    }
    const r = q / p
    if (p < 0) {
      if (r > t1) return null
      if (r > t0) t0 = r
    } else {
      if (r < t0) return null
      if (r < t1) t1 = r
    }
  }
  return [t0, t1]
}

const lerp = (p0, p1, t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]

// Split a polyline into the pieces that lie inside the box.
export function clipPolyline(points, box) {
  const pieces = []
  let current = null
  for (let i = 0; i < points.length - 1; i++) {
    const r = clipSegment(points[i], points[i + 1], box)
    if (!r) {
      if (current) {
        pieces.push(current)
        current = null
      }
      continue
    }
    const [t0, t1] = r
    const a = lerp(points[i], points[i + 1], t0)
    const b = lerp(points[i], points[i + 1], t1)
    if (!current) current = [a]
    else if (t0 > 0) {
      pieces.push(current)
      current = [a]
    }
    current.push(b)
    if (t1 < 1) {
      pieces.push(current)
      current = null
    }
  }
  if (current) pieces.push(current)
  return pieces
}

// Position of a point on the clockwise box perimeter, starting at the
// north-west corner and heading east.
function perimeterT(p, [[w, s], [e, n]]) {
  const W = e - w
  const H = n - s
  const eps = 1e-9
  if (Math.abs(p[1] - n) < eps) return p[0] - w // top edge, eastwards
  if (Math.abs(p[0] - e) < eps) return W + (n - p[1]) // east edge, southwards
  if (Math.abs(p[1] - s) < eps) return W + H + (e - p[0]) // bottom edge, westwards
  if (Math.abs(p[0] - w) < eps) return 2 * W + H + (p[1] - s) // west edge, northwards
  return null
}

function pointAtT(t, [[w, s], [e, n]]) {
  const W = e - w
  const H = n - s
  const P = 2 * (W + H)
  t = ((t % P) + P) % P
  if (t < W) return [w + t, n]
  if (t < W + H) return [e, n - (t - W)]
  if (t < 2 * W + H) return [e - (t - W - H), s]
  return [w, s + (t - 2 * W - H)]
}

// Extend an endpoint that is still inside the box (truncated data) straight
// on until it hits the box edge.
function extendToEdge(from, towards, box) {
  const [[w, s], [e, n]] = box
  const dx = towards[0] - from[0]
  const dy = towards[1] - from[1]
  if (dx === 0 && dy === 0) return towards
  let t = Infinity
  if (dx > 0) t = Math.min(t, (e - towards[0]) / dx)
  if (dx < 0) t = Math.min(t, (w - towards[0]) / dx)
  if (dy > 0) t = Math.min(t, (n - towards[1]) / dy)
  if (dy < 0) t = Math.min(t, (s - towards[1]) / dy)
  return [towards[0] + dx * t, towards[1] + dy * t]
}

function signedArea(ring) {
  let a = 0
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
  return a / 2
}

// Water polygons for open coast chains clipped to the box.
export function seaPolygons(coastLines, box) {
  const [[w, s], [e, n]] = box
  const W = e - w
  const H = n - s
  const P = 2 * (W + H)
  const polygons = []
  for (const chain of mergeChains(coastLines)) {
    if (key(chain[0]) === key(chain[chain.length - 1])) continue // islands handled separately
    for (const piece0 of clipPolyline(chain, box)) {
      const piece = piece0.slice()
      if (piece.length < 2) continue
      if (perimeterT(piece[0], box) === null) piece[0] = extendToEdge(piece[1], piece[0], box)
      const last = piece.length - 1
      if (perimeterT(piece[last], box) === null) piece[last] = extendToEdge(piece[last - 1], piece[last], box)
      const tA = perimeterT(piece[0], box)
      const tB = perimeterT(piece[last], box)
      if (tA === null || tB === null) continue
      const ring = piece.slice()
      // Walk the perimeter clockwise from B to A, adding the corners passed.
      let span = ((tA - tB) % P + P) % P
      if (span === 0) span = P
      for (const corner of [W, W + H, 2 * W + H, P]) {
        const rel = ((corner - tB) % P + P) % P
        if (rel > 0 && rel < span) ring.push({ rel, pt: pointAtT(corner, box) })
      }
      const corners = ring.filter((x) => x.rel !== undefined).sort((a, b) => a.rel - b.rel).map((x) => x.pt)
      const closed = [...piece, ...corners, piece[0]]
      if (Math.abs(signedArea(closed)) > 1e-12) polygons.push(closed)
    }
  }
  return polygons
}

// Closed coastline rings near the box: islands (land) or lakes (water).
export function closedCoastRings(coastLines, box) {
  const islands = []
  const lakes = []
  for (const ring of coastLines) {
    if (ring.length < 4 || key(ring[0]) !== key(ring[ring.length - 1])) continue
    if (!ring.some((p) => inside(p, box))) continue
    if (signedArea(ring) > 0) islands.push(ring)
    else lakes.push(ring)
  }
  return { islands, lakes }
}

// GeoJSON features to draw: 'sea' polygons and 'island' polygons.
export function coastFeatures(features, box) {
  const lines = features
    .filter((f) => f.properties.layer === 'water' && f.properties.kind === 'coastline')
    .map((f) => (f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates))
  const open = lines.filter((l) => key(l[0]) !== key(l[l.length - 1]))
  const out = []
  for (const ring of seaPolygons(open, box)) out.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { layer: 'sea' } })
  const { islands, lakes } = closedCoastRings(lines, box)
  for (const ring of islands) out.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { layer: 'island' } })
  for (const ring of lakes) out.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: { layer: 'sea' } })
  return out
}
