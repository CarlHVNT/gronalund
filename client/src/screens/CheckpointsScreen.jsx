import { GearButton, StatusIcon, TypeLabel } from '../components/ui'

export function CheckpointsScreen({ theme, checkpoints, progress, onSelect, onOpenSettings }) {
  const foundCount = Object.values(progress).filter((p) => p.status === 'found').length
  const score = Object.values(progress).reduce((sum, p) => sum + (p.points || 0), 0)

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.appBg }}>
      <div style={{ padding: '28px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: theme.text }}>Hållplatser</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textMuted, marginTop: 4 }}>
            {foundCount} av {checkpoints.length} klara · {score} p
          </div>
        </div>
        <GearButton theme={theme} onClick={onOpenSettings} />
      </div>

      <div style={{ padding: '0 16px', margin: '4px 0 16px', height: 5, borderRadius: 99, background: theme.neutralBorder, overflow: 'hidden' }}>
        <div style={{ width: `${(foundCount / checkpoints.length) * 100}%`, height: '100%', background: theme.gold, borderRadius: 99, transition: 'width .3s ease' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {checkpoints.map((cp) => {
          const status = progress[cp.id]?.status
          const bg = status === 'found' ? theme.foundBg : status === 'missed' ? theme.missedBg : theme.neutralBg
          const border = status === 'found' ? theme.foundBorder : status === 'missed' ? theme.missedBorder : theme.neutralBorder
          const nameColor = status === 'missed' ? theme.missedFg : theme.text
          return (
            <button
              key={cp.id}
              type="button"
              onClick={() => onSelect(cp.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, height: 62, padding: '0 15px',
                borderRadius: 16, background: bg, border: `1px solid ${border}`, textAlign: 'left',
              }}
            >
              <StatusIcon theme={theme} type={cp.type} status={status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: nameColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cp.order}. {cp.name}
                </div>
                <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
                  {TypeLabel(cp.type)} · {cp.points} p
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <path d="M8 4l8 7-8 7" stroke={theme.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )
        })}
      </div>
    </div>
  )
}
