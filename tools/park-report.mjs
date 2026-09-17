#!/usr/bin/env node
// Prints what the geodata pipeline produced and which checkpoints found their
// ride by name. Also writes the same report to the GitHub Actions summary.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EVENT } from '../server/data.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const gj = JSON.parse(await fs.readFile(path.join(ROOT, 'client/src/data/park.geojson.json'), 'utf8'))
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9åäö]/g, '')

const perLayer = {}
for (const f of gj.features) perLayer[f.properties.layer] = (perLayer[f.properties.layer] || 0) + 1
const named = gj.features.filter((f) => f.properties.layer === 'attraction' && f.geometry.type === 'Point' && f.properties.name)
const byName = new Map(named.map((f) => [norm(f.properties.name), f]))

const lines = []
lines.push(`# Park geodata report`)
lines.push('')
lines.push(`- Synthetic stand-in: **${gj.meta.synthetic ? 'YES (not the real park)' : 'no, real OpenStreetMap data'}**`)
lines.push(`- Generated: ${gj.meta.generatedAt}`)
lines.push(`- Centre: ${gj.meta.center.join(', ')} · axis bearing ${gj.meta.bearingDeg}°`)
lines.push(`- Features per layer: ${Object.entries(perLayer).map(([k, v]) => `${k} ${v}`).join(', ')}`)
lines.push('')
lines.push(`## Checkpoints`)
lines.push('')
let matched = 0
for (const cp of EVENT.checkpoints) {
  let status
  if (Array.isArray(cp.geo)) status = `explicit coordinates ${cp.geo.join(', ')}`
  else {
    const hit = byName.get(norm(cp.name))
    if (hit) {
      matched++
      status = `matched "${hit.properties.name}" (${hit.properties.kind}) at ${hit.geometry.coordinates.join(', ')}`
    } else status = 'NOT FOUND by name, will fall back to a slot around the centre'
  }
  lines.push(`- ${cp.order}. ${cp.name}: ${status}`)
}
lines.push('')
lines.push(`${matched} of ${EVENT.checkpoints.length} checkpoints matched a named attraction.`)
lines.push('')
lines.push(`## Named attractions in the data (${named.length})`)
lines.push('')
lines.push(named.map((f) => `${f.properties.name} (${f.properties.kind})`).sort().join(', ') || '(none)')

const report = lines.join('\n')
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, report + '\n')
