// Lat/lon -> map-space projection shared by the data pipeline
// (tools/park-geodata.mjs) and the client, so GPS positions and checkpoint
// coordinates land on the same illustrated map as the OpenStreetMap geometry.
//
// The projection is a local flat-earth approximation (fine for a ~500 m park):
// metres east/north of (lat0, lon0), rotated by rotateDeg, then scaled and
// translated into the SVG viewBox.

export function metresPerDegree(lat0) {
  const rad = (lat0 * Math.PI) / 180
  return {
    mPerDegLat: 111132.92 - 559.82 * Math.cos(2 * rad) + 1.175 * Math.cos(4 * rad),
    mPerDegLon: 111412.84 * Math.cos(rad) - 93.5 * Math.cos(3 * rad),
  }
}

export function makeProjector(p) {
  const rad = (p.rotateDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return function project(lat, lon) {
    const mx = (lon - p.lon0) * p.mPerDegLon
    const my = -(lat - p.lat0) * p.mPerDegLat // screen y grows downwards
    const rx = mx * cos - my * sin
    const ry = mx * sin + my * cos
    return { x: rx * p.scale + p.tx, y: ry * p.scale + p.ty }
  }
}
