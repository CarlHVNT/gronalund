// Map rotation that makes an outline as narrow as possible on a phone screen.
//
// MapLibre's `bearing` is the compass direction (clockwise from north) that
// points up on screen. For a point with local metres (east, north) the screen
// axes at bearing b are: up = (sin b, cos b), right = (cos b, -sin b).
// On a portrait phone with a pitched camera the width is what limits how far
// we can zoom in, so we pick the bearing with the smallest screen width and,
// when several are within a few percent, the one closest to north-up.
export function portraitBearing(points, fallback = 0) {
  if (!points || points.length < 3) return fallback
  const lat0 = points.reduce((a, p) => a + p[1], 0) / points.length
  const lon0 = points.reduce((a, p) => a + p[0], 0) / points.length
  const kLat = 111320
  const kLon = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const en = points.map(([lon, lat]) => [(lon - lon0) * kLon, (lat - lat0) * kLat])
  const widths = []
  for (let deg = -90; deg < 90; deg += 1) {
    const b = (deg * Math.PI) / 180
    const cos = Math.cos(b)
    const sin = Math.sin(b)
    let minX = Infinity
    let maxX = -Infinity
    for (const [e, n] of en) {
      const x = e * cos - n * sin
      if (x < minX) minX = x
      if (x > maxX) maxX = x
    }
    widths.push({ deg, w: maxX - minX })
  }
  const narrowest = Math.min(...widths.map((c) => c.w))
  const candidates = widths.filter((c) => c.w <= narrowest * 1.03)
  candidates.sort((a, b) => Math.abs(a.deg) - Math.abs(b.deg))
  return candidates[0].deg
}

// Screen box (width, height in metres) of an outline at a given bearing, for tests.
export function screenBoxAt(points, bearingDeg) {
  const lat0 = points.reduce((a, p) => a + p[1], 0) / points.length
  const lon0 = points.reduce((a, p) => a + p[0], 0) / points.length
  const kLat = 111320
  const kLon = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const b = (bearingDeg * Math.PI) / 180
  const xs = []
  const ys = []
  for (const [lon, lat] of points) {
    const e = (lon - lon0) * kLon
    const n = (lat - lat0) * kLat
    xs.push(e * Math.cos(b) - n * Math.sin(b))
    ys.push(e * Math.sin(b) + n * Math.cos(b))
  }
  return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}
