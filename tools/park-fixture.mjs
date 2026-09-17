#!/usr/bin/env node
// Generates tools/park-fixture.json: an Overpass-shaped stand-in layout for
// developing the vector map without network access. It is NOT Gröna Lund's
// real geometry; convert it with --synthetic so the app labels it as a demo.
//
//   node tools/park-fixture.mjs && node tools/park-geodata.mjs convert --input tools/park-fixture.json --synthetic
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EVENT } from '../server/data.js'
import { metresPerDegree } from '../client/src/lib/geo.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LAT0 = 59.3235
const LON0 = 18.0965
const AXIS_DEG = -34 // long axis of the park, compass bearing
const { mPerDegLat, mPerDegLon } = metresPerDegree(LAT0)

// Local frame: u along the park's long axis, v across it (metres).
function toLatLon([u, v]) {
  const a = ((90 - AXIS_DEG) * Math.PI) / 180 // axis direction as a math angle
  const east = u * Math.cos(a) - v * Math.sin(a)
  const north = u * Math.sin(a) + v * Math.cos(a)
  return { lat: LAT0 + north / mPerDegLat, lon: LON0 + east / mPerDegLon }
}
const rect = (u, v, w, h) => [[u - w / 2, v - h / 2], [u + w / 2, v - h / 2], [u + w / 2, v + h / 2], [u - w / 2, v + h / 2], [u - w / 2, v - h / 2]]

let nextId = 1000
const elements = []
const way = (tags, pts) => elements.push({ type: 'way', id: nextId++, tags, geometry: pts.map(toLatLon) })
const node = (tags, pt) => elements.push({ type: 'node', id: nextId++, tags, ...toLatLon(pt) })

// Park plate: a long rounded shape, quay side along v = -105.
way({ tourism: 'theme_park', name: 'Gröna Lund' }, [
  [-235, -95], [-215, -105], [215, -105], [235, -90], [235, 80], [215, 105], [-30, 105], [-60, 70], [-215, 70], [-235, 40], [-235, -95],
])
// Water south of the quay and a shoreline.
way({ natural: 'water', name: 'Saltsjön' }, [[-420, -115], [420, -115], [420, -330], [-420, -330], [-420, -115]])
way({ natural: 'coastline' }, [[-420, -112], [420, -112]])

// Checkpoint rides: names come from the event data so pins land on them.
const KIND = {
  'Lustiga Huset': ['amusement_ride', 9], Twister: ['roller_coaster', 24], Jetline: ['roller_coaster', 30],
  Eclipse: ['swing_carousel', 121], Kvasten: ['roller_coaster', 14], 'Fritt Fall': ['drop_tower', 80],
  'Blå Tåget': ['dark_ride', 10], Insane: ['roller_coaster', 34], Katapulten: ['amusement_ride', 50],
}
const SLOTS = [[-190, -40], [-120, 40], [-40, -60], [30, 60], [90, -20], [150, 40], [190, -60], [-160, 20], [60, 10]]
EVENT.checkpoints.forEach((cp, i) => {
  const [kind, height] = KIND[cp.name] || ['amusement_ride', 12]
  const [u, v] = SLOTS[i % SLOTS.length]
  node({ attraction: kind, name: cp.name, height: String(height) }, [u, v])
  if (kind !== 'roller_coaster') way({ attraction: kind, name: cp.name, height: String(height) }, rect(u, v, 18, 18))
})
// A few extra named rides and buildings so labels and extrusions have variety.
node({ attraction: 'carousel', name: 'Cirkuskarusellen' }, [-80, 80])
node({ attraction: 'big_wheel', name: 'Pariserhjulet', height: '38' }, [120, 85])
way({ attraction: 'big_wheel', name: 'Pariserhjulet', height: '38' }, rect(120, 85, 16, 6))
way({ building: 'yes', name: 'Tyrolen', 'building:levels': '2' }, rect(-200, -80, 48, 22))
way({ building: 'yes', name: 'Stora Scen', height: '12' }, rect(200, 60, 40, 26))
way({ building: 'retail', name: 'Tivolishopen' }, rect(-100, -90, 22, 14))
way({ building: 'yes' }, rect(0, 90, 30, 12))
way({ building: 'yes' }, rect(-40, 20, 14, 14))
way({ building: 'yes', name: 'Entré', height: '7' }, rect(-230, 10, 12, 30))
way({ building: 'yes' }, rect(170, -90, 26, 12))
way({ building: 'yes' }, rect(100, -95, 20, 10))

// Coaster tracks as long snaking lines.
way({ roller_coaster: 'track', name: 'Jetline' }, [[-60, -95], [-20, -80], [10, -40], [-10, 0], [-40, -30], [-70, -20], [-60, -60], [-30, -90]])
way({ roller_coaster: 'track', name: 'Twister' }, [[-140, 60], [-110, 80], [-90, 50], [-120, 20], [-150, 40], [-140, 60]])
way({ roller_coaster: 'track', name: 'Insane' }, [[180, -80], [200, -60], [185, -40], [170, -60], [180, -80]])
way({ roller_coaster: 'track', name: 'Kvasten' }, [[-175, 40], [-150, 55], [-130, 30], [-160, 5], [-175, 40]])

// Footpaths: a loop plus spurs.
way({ highway: 'footway' }, [[-215, -60], [-150, -70], [-60, -75], [40, -70], [140, -75], [210, -60], [215, 40], [150, 70], [40, 80], [-20, 70], [-60, 40], [-160, 45], [-215, 30], [-215, -60]])
way({ highway: 'footway' }, [[-60, -75], [-40, -20], [-60, 40]])
way({ highway: 'footway' }, [[40, -70], [60, 10], [40, 80]])
way({ highway: 'pedestrian' }, [[-235, 10], [-215, 10]])

// Points of interest.
node({ amenity: 'toilets' }, [-100, 70])
node({ amenity: 'toilets' }, [130, -60])
node({ amenity: 'restaurant', name: 'Restaurang Kajen' }, [20, -95])
node({ amenity: 'cafe', name: 'Kaféet' }, [-10, 55])
node({ entrance: 'main', name: 'Huvudentré' }, [-235, 10])

const out = path.join(ROOT, 'tools/park-fixture.json')
await fs.writeFile(out, JSON.stringify({ elements }))
console.log(`wrote ${path.relative(ROOT, out)}: ${elements.length} elements (synthetic stand-in layout)`)
