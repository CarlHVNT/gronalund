import { useEffect, useMemo, useRef, useState } from 'react'
import { AttributionControl, GeolocateControl, Map as MapLibreMap, Marker, addProtocol, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 derives its worker URL from import.meta.url at runtime, which
// neither the dev server nor the production bundle can serve. Let Vite bundle
// the worker (with its shared chunk) and hand MapLibre the resulting URL.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { PARK as park, norm, resolveCheckpointPositions } from '../lib/parkGeo'

// Vector map of the park (option C): MapLibre GL rendering our own GeoJSON
// layers from OpenStreetMap in the brand palette. No tile server: the whole
// park is a few hundred KB of geometry bundled with the app. Loaded lazily
// from MapScreen so the join screen does not pay for the renderer.

setWorkerUrl(maplibreWorkerUrl)

const PITCH = 52
// Screen area the park must fit in: status chips at the top, the "Kartan"
// sheet overlapping the bottom, a little air at the sides.
const SAFE = { top: 84, bottom: 140, left: 28, right: 28 }

// The park outline (every ring vertex) plus the pins: what the camera must
// keep inside the safe area.
function frameShape(pins) {
  const pts = [...pins]
  for (const f of park.features) {
    if (f.properties.layer !== 'park') continue
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]
    for (const rings of polys) for (const ring of rings) for (const c of ring) pts.push(c)
  }
  return pts
}

// Projected box of the shape at the current camera.
function projectedBox(map, shape) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const ll of shape) {
    const p = map.project(ll)
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY }
}

// Pan until the shape's projected box is centred in the safe area (a few
// rounds, because on a pitched map a pan also changes the box's size).
function centreShape(map, shape, safe) {
  for (let i = 0; i < 4; i++) {
    const b = projectedBox(map, shape)
    const dx = safe.cx - (b.minX + b.maxX) / 2
    const dy = safe.cy - (b.minY + b.maxY) / 2
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) break
    map.panBy([-dx, -dy], { animate: false })
  }
  return projectedBox(map, shape)
}

// Largest zoom at which the centred shape fits inside the safe area at the
// current pitch, found by binary search on what is actually on screen. This
// beats fitBounds, which frames the lon/lat bounding box of a slanted park
// and knows nothing about pitch.
function settle(map, shape) {
  const { width, height } = map.getContainer().getBoundingClientRect()
  const safe = { w: width - SAFE.left - SAFE.right, h: height - SAFE.top - SAFE.bottom, cx: SAFE.left + (width - SAFE.left - SAFE.right) / 2, cy: SAFE.top + (height - SAFE.top - SAFE.bottom) / 2 }
  let lo = 13
  let hi = 19.5
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2
    map.jumpTo({ zoom: mid })
    const b = centreShape(map, shape, safe)
    if (b.w <= safe.w && b.h <= safe.h) lo = mid
    else hi = mid
  }
  map.jumpTo({ zoom: lo })
  centreShape(map, shape, safe)
}

// Camera that shows the whole park and every pin inside the safe area at the
// given pitch. Returns the camera to jump or ease to; the map's current
// camera is left untouched.
function computeFraming(map, pins, pitched) {
  const saved = { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() }
  const shape = frameShape(pins)
  map.jumpTo({ center: park.meta.center, zoom: 16, pitch: pitched ? PITCH : 0, bearing: park.meta.bearingDeg })
  settle(map, shape)
  const framing = { center: map.getCenter(), zoom: map.getZoom(), pitch: pitched ? PITCH : 0, bearing: park.meta.bearingDeg }
  map.jumpTo(saved)
  return framing
}

const KIND_ICON = {
  roller_coaster: '🎢', drop_tower: '🗼', big_wheel: '🎡', carousel: '🎠', dark_ride: '👻', swing_carousel: '🌀',
  maze: '🏠', fun_house: '🏠', water_slide: '💦', train: '🚂', bumper_car: '🚗', amusement_ride: '⭐',
}
const POI_ICON = { toilets: '🚻', restaurant: '🍽️', fast_food: '🍔', cafe: '☕', ice_cream: '🍦', information: 'ℹ️' }
const BIG_KINDS = new Set(['roller_coaster', 'drop_tower', 'big_wheel', 'swing_carousel'])

function iconFor(props) {
  if (props.layer === 'poi') {
    if (String(props.kind || '').startsWith('entrance')) return '🚪'
    return POI_ICON[props.kind] || '📍'
  }
  return KIND_ICON[props.kind] || '⭐'
}

function buildStyle(t) {
  const water = t.isDark ? '#0A2417' : '#B7D6E2'
  const ride = t.isDark ? '#1E5A34' : '#9FD3AE'
  const byLayer = (name) => ['==', ['get', 'layer'], name]
  const zoomWidth = (a, b, c) => ['interpolate', ['linear'], ['zoom'], 15, a, 17, b, 19, c]
  const rideColor = ['match', ['get', 'kind'], 'roller_coaster', '#C8102E', ['drop_tower', 'swing_carousel', 'big_wheel'], t.gold, ride]
  const buildingColor = ['match', ['get', 'kind'], ['retail', 'commercial', 'kiosk'], t.isDark ? '#2F4A31' : '#E7DFC8', t.mapBlockFill]
  return {
    version: 8,
    sources: { park: { type: 'geojson', data: park } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': t.mapBg } },
      {
        id: 'water', type: 'fill', source: 'park',
        filter: ['all', byLayer('water'), ['==', ['geometry-type'], 'Polygon']],
        paint: { 'fill-color': water, 'fill-opacity': t.isDark ? 0.7 : 1 },
      },
      {
        id: 'water-edge', type: 'line', source: 'park', filter: byLayer('water'),
        paint: { 'line-color': t.isDark ? 'rgba(227,190,94,.25)' : '#FFFFFF', 'line-width': zoomWidth(1, 2, 4), 'line-opacity': 0.7 },
      },
      { id: 'park-glow', type: 'line', source: 'park', filter: byLayer('park'), paint: { 'line-color': t.mapPlateEdge, 'line-width': 16, 'line-blur': 12, 'line-opacity': 0.55 } },
      { id: 'park', type: 'fill', source: 'park', filter: byLayer('park'), paint: { 'fill-color': t.mapPlate } },
      { id: 'park-edge', type: 'line', source: 'park', filter: byLayer('park'), paint: { 'line-color': t.mapPlateEdge, 'line-width': 3 } },
      {
        id: 'paths-casing', type: 'line', source: 'park', filter: byLayer('path'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.isDark ? 'rgba(227,190,94,.16)' : 'rgba(11,59,34,.10)', 'line-width': zoomWidth(4, 9, 22) },
      },
      {
        id: 'paths', type: 'line', source: 'park', filter: byLayer('path'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.mapWalkway, 'line-width': zoomWidth(1.5, 5, 14), 'line-opacity': 0.95 },
      },
      {
        id: 'buildings', type: 'fill-extrusion', source: 'park', filter: byLayer('building'),
        paint: {
          'fill-extrusion-color': buildingColor,
          'fill-extrusion-height': ['coalesce', ['get', 'height'], 6],
          'fill-extrusion-opacity': 0.96,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'rides', type: 'fill-extrusion', source: 'park', filter: byLayer('attraction-footprint'),
        paint: {
          'fill-extrusion-color': rideColor,
          'fill-extrusion-height': ['min', ['coalesce', ['get', 'height'], 12], 40],
          'fill-extrusion-opacity': 0.9,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'tracks-shadow', type: 'line', source: 'park', filter: byLayer('track'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': 'rgba(11,59,34,.30)', 'line-width': zoomWidth(3, 7, 14), 'line-translate': [1, 3] },
      },
      {
        id: 'tracks', type: 'line', source: 'park', filter: byLayer('track'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#C8102E', 'line-width': zoomWidth(1.5, 3.5, 7) },
      },
      {
        id: 'attraction-dots', type: 'circle', source: 'park',
        filter: ['all', byLayer('attraction'), ['==', ['geometry-type'], 'Point']],
        paint: { 'circle-radius': zoomWidth(2, 4, 7), 'circle-color': t.gold, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 },
      },
      {
        id: 'pois', type: 'circle', source: 'park', filter: byLayer('poi'),
        paint: { 'circle-radius': zoomWidth(1.5, 3, 5), 'circle-color': t.isDark ? 'rgba(255,255,255,.55)' : 'rgba(11,59,34,.35)' },
      },
      // Drawn last: fades everything outside the park so it reads as the park, not a street map.
      { id: 'mask', type: 'fill', source: 'park', filter: byLayer('mask'), paint: { 'fill-color': t.appBg, 'fill-opacity': 0.72 } },
    ],
  }
}

function stylePin(el, cp, status, isCurrent, theme) {
  let bg = theme.pinIdleBg
  let fg = theme.pinIdleFg
  let border = `2px solid ${theme.pinIdleFg}`
  let ring = 'none'
  if (status === 'found') {
    bg = theme.pinFound
    fg = theme.pinFoundFg
    border = 'none'
  } else if (status === 'missed') {
    border = `2.5px solid ${theme.pinMissed}`
    fg = theme.pinMissed
  } else if (isCurrent) {
    bg = theme.pinCurrent
    fg = theme.pinCurrentFg
    border = '2px solid #fff'
    ring = `0 0 0 9px ${theme.youHalo}, 0 6px 16px rgba(0,0,0,.3)`
  }
  el.textContent = String(cp.order)
  el.dataset.status = status || (isCurrent ? 'current' : 'idle')
  el.dataset.current = String(isCurrent)
  Object.assign(el.style, { background: bg, color: fg, border, boxShadow: ring === 'none' ? '0 4px 12px rgba(0,0,0,.25)' : ring })
}

// Every named thing that may get a text chip, with a priority for collisions.
// zoomOffset is relative to the zoom that frames the whole park: checkpoint
// names show right away, other rides and points of interest as you zoom in.
function labelCandidates(checkpoints, positions) {
  const out = []
  const cpNames = new Set(checkpoints.map((c) => norm(c.name)))
  for (const cp of checkpoints) {
    const pos = positions.get(cp.id)
    if (pos) out.push({ key: `cp-${cp.id}`, text: cp.name, icon: null, lngLat: pos, priority: 0, zoomOffset: -1, offset: 26 })
  }
  for (const f of park.features) {
    const p = f.properties
    if (!p.name || f.geometry.type !== 'Point') continue
    if (p.layer === 'attraction') {
      if (cpNames.has(norm(p.name))) continue
      const big = BIG_KINDS.has(p.kind)
      out.push({ key: p.id || p.name, text: p.name, icon: iconFor(p), lngLat: f.geometry.coordinates, priority: big ? 1 : 2, zoomOffset: big ? 0.6 : 1.3, offset: 8 })
    } else if (p.layer === 'poi') {
      out.push({ key: `poi-${f.geometry.coordinates.join(',')}`, text: p.name, icon: iconFor(p), lngLat: f.geometry.coordinates, priority: 3, zoomOffset: 1.8, offset: 6 })
    }
  }
  return out
}

// Greedy collision avoidance: higher-priority chips are placed first, the
// rest hide when they would overlap or fall outside the view.
function layoutLabels(map, labels, baseZoom) {
  const zoom = map.getZoom()
  const { width, height } = map.getContainer().getBoundingClientRect()
  const placed = []
  const overlaps = (a, b) => !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
  for (const l of labels) {
    let show = zoom >= baseZoom + l.zoomOffset
    if (show) {
      const pt = map.project(l.lngLat)
      const gap = 3
      const w = (l.width || l.text.length * 6.4 + (l.icon ? 40 : 22)) + gap * 2
      const h = (l.height || 26) + gap * 2
      const box = { x: pt.x - w / 2, y: pt.y + l.offset - gap, w, h }
      show = box.x >= 2 && box.x + w <= width - 2 && box.y >= 60 && box.y + box.h <= height - 40 && !placed.some((b) => overlaps(box, b))
      if (show) placed.push(box)
    }
    l.el.style.visibility = show ? 'visible' : 'hidden'
  }
}

let pmtilesReady = false

// Optional street context around the park from a Protomaps extract dropped
// into client/public/context.pmtiles (see README). Skipped when absent.
async function addContextBasemap(map, t) {
  try {
    const head = await fetch('/context.pmtiles', { method: 'HEAD' })
    const type = head.headers.get('content-type') || ''
    if (!head.ok || type.includes('text/html')) return false
    if (!pmtilesReady) {
      const { Protocol } = await import('pmtiles')
      addProtocol('pmtiles', new Protocol().tile)
      pmtilesReady = true
    }
    if (!map.getStyle()) return false
    map.addSource('context', { type: 'vector', url: `pmtiles://${window.location.origin}/context.pmtiles` })
    const before = 'park-glow'
    const muted = t.isDark ? 'rgba(255,255,255,.08)' : 'rgba(11,59,34,.08)'
    map.addLayer({ id: 'ctx-water', type: 'fill', source: 'context', 'source-layer': 'water', paint: { 'fill-color': t.isDark ? '#0A2417' : '#B7D6E2', 'fill-opacity': 0.9 } }, before)
    map.addLayer({ id: 'ctx-buildings', type: 'fill', source: 'context', 'source-layer': 'buildings', paint: { 'fill-color': muted } }, before)
    map.addLayer({ id: 'ctx-roads', type: 'line', source: 'context', 'source-layer': 'roads', paint: { 'line-color': t.isDark ? 'rgba(227,190,94,.25)' : 'rgba(255,255,255,.9)', 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1, 18, 6] } }, before)
    return true
  } catch (e) {
    console.warn('Context basemap skipped:', e?.message || e)
    return false
  }
}

function ControlButton({ theme, label, onClick, children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: 13, border: 'none', fontWeight: 800, fontSize: 13,
        background: theme.isDark ? 'rgba(15,51,32,.92)' : '#fff', color: theme.isDark ? '#fff' : theme.text,
        boxShadow: theme.isDark ? '0 4px 14px rgba(0,0,0,.35)' : theme.cardShadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

export default function VectorMap({ theme, checkpoints, progress, currentId, onSelect, onUnavailable, onPosition }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pinsRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const onPositionRef = useRef(onPosition)
  onSelectRef.current = onSelect
  onPositionRef.current = onPosition
  const [ready, setReady] = useState(false)
  const [pitched, setPitched] = useState(true)
  const [lastError, setLastError] = useState(null)
  const [context, setContext] = useState(false)
  const baseZoomRef = useRef(16)
  const positions = useMemo(() => resolveCheckpointPositions(checkpoints), [checkpoints])
  const positionsRef = useRef(positions)
  positionsRef.current = positions

  // One map per theme: the style is rebuilt from the theme's tokens.
  useEffect(() => {
    let map
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: buildStyle(theme),
        center: park.meta.center,
        zoom: 16.6,
        minZoom: 14.5,
        maxZoom: 19.5,
        pitch: PITCH,
        bearing: park.meta.bearingDeg,
        maxBounds: park.meta.maxBounds,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      })
    } catch (e) {
      console.warn('Vector map unavailable on this device:', e?.message || e)
      onUnavailable?.(e)
      return undefined
    }
    map.touchZoomRotate.disableRotation()
    map.addControl(new AttributionControl({ compact: true, customAttribution: park.attribution }), 'bottom-left')
    const geolocate = new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showAccuracyCircle: true })
    map.addControl(geolocate, 'bottom-right')
    geolocate.on('geolocate', (e) => {
      const c = e?.coords
      if (c) onPositionRef.current?.({ lat: c.latitude, lon: c.longitude, accuracy: c.accuracy })
    })
    map.on('load', () => {
      // Frame the whole park (every pin) inside the visible part of the map.
      const framing = computeFraming(map, [...positionsRef.current.values()], true)
      map.jumpTo(framing)
      baseZoomRef.current = framing.zoom
      setReady(true)
      addContextBasemap(map, theme).then((added) => added && setContext(true))
    })
    map.on('error', (e) => {
      const msg = e?.error?.message || String(e?.error || e)
      console.warn('maplibre:', msg)
      setLastError(msg)
    })
    mapRef.current = map
    window.__gronaMap = map // debugging and browser tests
    const pins = pinsRef.current
    return () => {
      for (const entry of pins.values()) entry.marker.remove()
      pins.clear()
      map.remove()
      mapRef.current = null
      setReady(false)
      setPitched(true)
      setContext(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.id])

  // Checkpoint pins as DOM markers, restyled whenever progress changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const seen = new Set()
    for (const cp of checkpoints) {
      const pos = positions.get(cp.id)
      if (!pos) continue
      seen.add(cp.id)
      let entry = pinsRef.current.get(cp.id)
      if (!entry) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'vm-pin'
        el.setAttribute('aria-label', cp.name)
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelectRef.current(cp.id)
        })
        const marker = new Marker({ element: el, anchor: 'center' }).setLngLat(pos).addTo(map)
        entry = { marker, el }
        pinsRef.current.set(cp.id, entry)
      }
      stylePin(entry.el, cp, progress[cp.id]?.status, cp.id === currentId, theme)
    }
    for (const [id, entry] of pinsRef.current) {
      if (!seen.has(id)) {
        entry.marker.remove()
        pinsRef.current.delete(id)
      }
    }
  }, [ready, checkpoints, progress, currentId, theme, positions])

  // Name chips with icons for checkpoints, rides and points of interest,
  // laid out without overlaps on every move.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const labels = labelCandidates(checkpoints, positions).sort((a, b) => a.priority - b.priority)
    for (const l of labels) {
      const el = document.createElement('div')
      el.className = 'vm-label'
      el.dataset.priority = String(l.priority)
      Object.assign(el.style, {
        background: theme.isDark ? 'rgba(15,51,32,.92)' : 'rgba(255,255,255,.94)',
        color: theme.isDark ? '#fff' : theme.text,
        visibility: 'hidden',
      })
      if (l.icon) {
        const ico = document.createElement('span')
        ico.className = 'vm-ico'
        ico.textContent = l.icon
        el.appendChild(ico)
      }
      el.appendChild(document.createTextNode(l.text))
      l.el = el
      l.marker = new Marker({ element: el, anchor: 'top', offset: [0, l.offset] }).setLngLat(l.lngLat).addTo(map)
    }
    // Measure once for accurate collision boxes, then lay out.
    for (const l of labels) {
      const r = l.el.getBoundingClientRect()
      l.width = r.width || undefined
      l.height = r.height || undefined
    }
    let frame = null
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        layoutLabels(map, labels, baseZoomRef.current)
      })
    }
    schedule()
    map.on('move', schedule)
    map.on('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      map.off('move', schedule)
      map.off('resize', schedule)
      for (const l of labels) l.marker.remove()
    }
  }, [ready, checkpoints, theme, positions])

  function togglePitch() {
    const map = mapRef.current
    if (!map) return
    const next = !pitched
    setPitched(next)
    map.easeTo({ pitch: next ? PITCH : 0, duration: 500 })
  }

  function recenter() {
    const map = mapRef.current
    if (!map) return
    map.easeTo({ ...computeFraming(map, [...positions.values()], pitched), duration: 600 })
  }

  const ctrlBg = theme.isDark ? 'rgba(15,51,32,.92)' : '#fff'
  const ctrlFg = theme.isDark ? '#fff' : theme.text

  return (
    <div className="vector-map" style={{ position: 'absolute', inset: 0, '--vm-ctrl-bg': ctrlBg, '--vm-ctrl-fg': ctrlFg }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {ready && (
        <div className="vm-controls">
          <ControlButton theme={theme} label={pitched ? 'Visa kartan platt' : 'Visa kartan i 3D'} onClick={togglePitch} data-vm-pitch aria-pressed={pitched}>
            {pitched ? '2D' : '3D'}
          </ControlButton>
          <ControlButton theme={theme} label="Centrera kartan över parken" onClick={recenter} data-vm-recenter>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </ControlButton>
        </div>
      )}
      {(park.meta.synthetic || lastError) && (
        <div className="vm-banner" style={{ background: theme.isDark ? 'rgba(15,51,32,.9)' : 'rgba(255,255,255,.9)', color: lastError ? theme.missedFg : theme.textMuted }}>
          {lastError ? (
            <>Kartfel: {lastError}</>
          ) : (
            <>
              Demolayout, inte parkens riktiga geometri. Kör <code>npm run geodata</code> för riktig parkdata.
              {context ? ' Omgivning från context.pmtiles.' : ''}
            </>
          )}
        </div>
      )}
    </div>
  )
}
