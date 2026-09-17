import { IsoMap } from '../components/IsoMap'
import { GearButton } from '../components/ui'

export function MapScreen({ theme, checkpoints, progress, currentId, onSelect, onOpenSettings }) {
  const foundCount = Object.values(progress).filter((p) => p.status === 'found').length
  const current = checkpoints.find((c) => c.id === currentId)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div data-tour="map" data-tour-adjust="0 0 -36 0" style={{ flex: 1, position: 'relative', background: theme.mapBg, minHeight: 260 }}>
        <IsoMap theme={theme} checkpoints={checkpoints} progress={progress} currentId={currentId} onSelect={onSelect} />
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
              <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.text }}>{current.name}</div>
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
