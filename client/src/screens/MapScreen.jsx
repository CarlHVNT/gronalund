import { Component, Suspense, lazy } from 'react'
import { IsoMap } from '../components/IsoMap'
import { GearButton } from '../components/ui'
import { formatDistance } from '../lib/parkGeo'

// The MapLibre renderer is a separate chunk, fetched only when the vector map is on.
const VectorMap = lazy(() => import('../components/VectorMap'))

// If the vector map chunk fails to load or the renderer throws, show the
// reason on screen and keep the illustrated plate underneath instead of a
// blank map or a silent fallback.
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.warn('Vector map failed:', error)
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children
  }
}

function MapModeSwitch({ theme, mapMode, onChange }) {
  const option = (mode, label) => {
    const active = mapMode === mode
    return (
      <button
        key={mode}
        type="button"
        onClick={() => onChange(mode)}
        aria-pressed={active}
        data-map-mode-option={mode}
        style={{
          height: 34, padding: '0 12px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 12,
          background: active ? theme.accent : 'transparent', color: active ? theme.onAccent : theme.isDark ? '#fff' : theme.text,
        }}
      >
        {label}
      </button>
    )
  }
  return (
    <div
      data-map-mode-switch
      role="group"
      aria-label="Kartläge"
      style={{
        position: 'absolute', top: 18, right: 72, height: 46, padding: 6, borderRadius: 13,
        display: 'flex', gap: 2, background: theme.isDark ? 'rgba(255,255,255,.14)' : '#fff',
        boxShadow: theme.isDark ? 'none' : theme.cardShadow,
      }}
    >
      {option('iso', 'Ritad')}
      {option('vector', '3D')}
    </div>
  )
}

export function MapScreen({
  theme, checkpoints, progress, currentId, onSelect, onOpenSettings, mapMode = 'iso', onChangeMapMode, onMapUnavailable,
  onPosition, currentDistance,
}) {
  const foundCount = Object.values(progress).filter((p) => p.status === 'found').length
  const current = checkpoints.find((c) => c.id === currentId)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div data-tour="map" data-tour-adjust="0 0 -36 0" style={{ flex: 1, position: 'relative', background: theme.mapBg, minHeight: 260 }}>
        {mapMode === 'vector' ? (
          <MapErrorBoundary
            key={theme.id}
            fallback={(error) => (
              <>
                <IsoMap theme={theme} checkpoints={checkpoints} progress={progress} currentId={currentId} onSelect={onSelect} />
                <div
                  data-map-error
                  style={{
                    position: 'absolute', left: 12, right: 12, bottom: 56, padding: '10px 12px', borderRadius: 12, fontSize: 12, lineHeight: 1.4,
                    background: theme.missedBg, border: `1px solid ${theme.missedBorder}`, color: theme.missedFg, fontWeight: 600, wordBreak: 'break-word',
                  }}
                >
                  3D-kartan kunde inte laddas: {error?.message || String(error)}
                  <button
                    type="button"
                    onClick={() => onChangeMapMode?.('iso')}
                    style={{ display: 'block', marginTop: 6, background: 'none', border: 'none', padding: 0, color: theme.missedFg, fontWeight: 800, fontSize: 12 }}
                  >
                    Använd den illustrerade kartan
                  </button>
                </div>
              </>
            )}
          >
            <Suspense fallback={<IsoMap theme={theme} checkpoints={checkpoints} progress={progress} currentId={currentId} onSelect={onSelect} />}>
              <VectorMap
                key={theme.id}
                theme={theme}
                checkpoints={checkpoints}
                progress={progress}
                currentId={currentId}
                onSelect={onSelect}
                onUnavailable={onMapUnavailable}
                onPosition={onPosition}
              />
            </Suspense>
          </MapErrorBoundary>
        ) : (
          <IsoMap theme={theme} checkpoints={checkpoints} progress={progress} currentId={currentId} onSelect={onSelect} />
        )}
        {onChangeMapMode && <MapModeSwitch theme={theme} mapMode={mapMode} onChange={onChangeMapMode} />}
        <div
          style={{
            position: 'absolute', left: 18, top: 18, height: 46, borderRadius: 13,
            background: theme.isDark ? 'rgba(255,255,255,.14)' : '#fff',
            boxShadow: theme.isDark ? 'none' : theme.cardShadow,
            display: 'flex', alignItems: 'center', padding: '0 16px',
            fontWeight: 700, fontSize: 13, color: theme.isDark ? '#fff' : theme.text,
          }}
        >
          {foundCount} av {checkpoints.length} hittade
        </div>
        <div style={{ position: 'absolute', right: 18, top: 18 }}>
          <GearButton theme={theme} onClick={onOpenSettings} />
        </div>
      </div>

      <div
        style={{
          flex: 'none',
          borderRadius: '36px 36px 0 0',
          // clip-path (not just border-radius) so the rounded-off corners
          // don't swallow clicks meant for the map pins peeking out behind them
          clipPath: 'inset(0 round 36px 36px 0 0)',
          background: theme.sheetBg,
          marginTop: -36,
          // Bottom padding clears the tab bar's raised centre button (it pokes
          // ~11px above the bar incl. its ring) with a comfortable gap.
          padding: '24px 18px 32px',
          position: 'relative',
          zIndex: 2,
          boxShadow: theme.isDark ? 'none' : '0 -12px 30px rgba(11,59,34,.10)',
        }}
      >
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: theme.text, marginBottom: 16 }}>
          Kartan
        </div>
        {current ? (
          <div
            data-tour="next"
            style={{
              display: 'flex', alignItems: 'center', gap: 13, height: 64, padding: '0 15px',
              borderRadius: 18, background: theme.foundBg, border: `1px solid ${theme.foundBorder}`,
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#0B3B22', flexShrink: 0 }}>
              {current.order}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.name}</div>
                {currentDistance != null && (
                  <span data-distance style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: theme.gold, color: '#0B3B22' }}>
                    {formatDistance(currentDistance)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Nästa hållplats · {current.subtitle}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelect(current.id)}
              style={{ borderRadius: 99, background: theme.accent, padding: '11px 17px', fontWeight: 700, fontSize: 12, color: theme.onAccent, border: 'none' }}
            >
              Öppna
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontWeight: 700, color: theme.foundFg, padding: '10px 0' }}>
            Alla hållplatser hittade! 🎉
          </div>
        )}
      </div>
    </div>
  )
}
