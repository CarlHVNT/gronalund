import { useEffect, useMemo, useRef, useState } from 'react'
import { AttributionControl, GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 derives its worker URL from import.meta.url at runtime, which
// neither the dev server nor the production bundle can serve. Let Vite bundle
// the worker (with its shared chunk) and hand MapLibre the resulting URL.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import park from '../data/park.geojson.json'

// Vector map of the park (option C): MapLibre GL rendering our own GeoJSON
// layers from OpenStreetMap in the brand palette. No tile server: the whole
// park is a few hundred KB of geometry bundled with the app. Loaded lazily
// from MapScreen so the join screen does not pay for the renderer.

setWorkerUrl(maplibreWorkerUrl)

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9åäö]/g, '')

function buildStyle(t) {
  const water = t.isDark ? '#0A2417' : '#B7D6E2'
  const ride = t.isDark ? '#1E5A34' : '#9FD3AE'
  const byLayer = (name) => ['==', ['get', 'layer'], name]
  const zoomWidth = (a, b, c) => ['interpolate', ['linear'], ['zoom'], 15, a, 17, b, 19, c]
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
        id: 'shore', type: 'line', source: 'park',
        filter: ['all', byLayer('water'), ['==', ['geometry-type'], 'LineString']],
        paint: { 'line-color': water, 'line-width': 4 },
      },
      { id: 'park', type: 'fill', source: 'park', filter: byLayer('park'), paint: { 'fill-color': t.mapPlate } },
      { id: 'park-edge', type: 'line', source: 'park', filter: byLayer('park'), paint: { 'line-color': t.mapPlateEdge, 'line-width': 3 } },
      {
        id: 'paths', type: 'line', source: 'park', filter: byLayer('path'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': t.mapWalkway, 'line-width': zoomWidth(1.5, 5, 14), 'line-opacity': 0.95 },
      },
      {
        id: 'buildings', type: 'fill-extrusion', source: 'park', filter: byLayer('building'),
        paint: {
          'fill-extrusion-color': t.mapBlockFill,
          'fill-extrusion-height': ['coalesce', ['get', 'height'], 6],
          'fill-extrusion-opacity': 0.96,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      {
        id: 'rides', type: 'fill-extrusion', source: 'park', filter: byLayer('attraction-footprint'),
        paint: {
          'fill-extrusion-color': ride,
          'fill-extrusion-height': ['min', ['coalesce', ['get', 'height'], 12], 40],
          'fill-extrusion-opacity': 0.92,
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

// Checkpoint pins land on the OSM attraction with the same name; anything
// unmatched gets a slot on a ring around the centre so nothing disappears.
function resolvePositions(checkpoints) {
  const byName = new Map()
  for (const f of park.features) {
    if (f.properties.layer === 'attraction' && f.geometry.type === 'Point' && f.properties.name) {
      byName.set(norm(f.properties.name), f.geometry.coordinates)
    }
  }
  const [lon, lat] = park.meta.center
  const positions = new Map()
  checkpoints.forEach((cp, i) => {
    const hit = byName.get(norm(cp.name))
    if (hit) positions.set(cp.id, hit)
    else {
      const a = (i / Math.max(1, checkpoints.length)) * Math.PI * 2
      positions.set(cp.id, [lon + Math.cos(a) * 0.0012, lat + Math.sin(a) * 0.0006])
    }
  })
  return positions
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

export default function VectorMap({ theme, checkpoints, progress, currentId, onSelect, onUnavailable }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pinsRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const [ready, setReady] = useState(false)
  const positions = useMemo(() => resolvePositions(checkpoints), [checkpoints])

  // One map per theme: the style is rebuilt from the theme's tokens.
  useEffect(() => {
    let map
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: buildStyle(theme),
        center: park.meta.center,
        zoom: 16.6,
        minZoom: 15.6,
        maxZoom: 19.5,
        pitch: 52,
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
    map.addControl(new NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right')
    map.addControl(
      new GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showAccuracyCircle: true }),
      'bottom-right',
    )
    map.on('load', () => {
      // Frame the whole park inside the visible part of the map: the status
      // chips sit at the top and the "Kartan" sheet overlaps the bottom.
      map.fitBounds(park.meta.bounds, {
        padding: { top: 84, bottom: 140, left: 30, right: 30 },
        bearing: park.meta.bearingDeg,
        pitch: 52,
        duration: 0,
      })
      setReady(true)
    })
    map.on('error', (e) => console.warn('maplibre:', e?.error?.message || e))
    mapRef.current = map
    window.__gronaMap = map // debugging and browser tests
    const pins = pinsRef.current
    return () => {
      for (const entry of pins.values()) entry.marker.remove()
      pins.clear()
      map.remove()
      mapRef.current = null
      setReady(false)
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

  // Names of the other rides as small chips, shown once zoomed in a bit.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const cpNames = new Set(checkpoints.map((c) => norm(c.name)))
    const markers = park.features
      .filter((f) => f.properties.layer === 'attraction' && f.geometry.type === 'Point' && f.properties.name && !cpNames.has(norm(f.properties.name)))
      .slice(0, 16)
      .map((f) => {
        const el = document.createElement('div')
        el.className = 'vm-label'
        el.textContent = f.properties.name
        Object.assign(el.style, { background: theme.isDark ? 'rgba(15,51,32,.92)' : 'rgba(255,255,255,.92)', color: theme.isDark ? '#fff' : theme.text })
        return new Marker({ element: el, anchor: 'top', offset: [0, 7] }).setLngLat(f.geometry.coordinates).addTo(map)
      })
    const update = () => {
      const show = map.getZoom() >= 17
      for (const m of markers) m.getElement().style.display = show ? '' : 'none'
    }
    update()
    map.on('zoom', update)
    return () => {
      map.off('zoom', update)
      for (const m of markers) m.remove()
    }
  }, [ready, checkpoints, theme])

  return (
    <div className="vector-map" style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {park.meta.synthetic && (
        <div className="vm-banner" style={{ background: theme.isDark ? 'rgba(15,51,32,.9)' : 'rgba(255,255,255,.9)', color: theme.textMuted }}>
          Demolayout, inte parkens riktiga geometri. Kör <code>npm run geodata</code> för riktig parkdata.
        </div>
      )}
    </div>
  )
}
