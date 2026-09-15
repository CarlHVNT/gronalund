import { GearButton } from '../components/ui'

export function LeaderboardScreen({ theme, teams, myTeamId, onOpenSettings }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.appBg }}>
      <div style={{ padding: '28px 20px 6px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: theme.text }}>Topplistan</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.foundFg, display: 'inline-block' }} />
            Uppdateras direkt · {teams.length} lag i kväll
          </div>
        </div>
        <GearButton theme={theme} onClick={onOpenSettings} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.length === 0 && (
          <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: 13, padding: '30px 0' }}>Inga lag har anslutit än.</div>
        )}
        {teams.map((t) => {
          const isMe = t.id === myTeamId
          const rankColor = t.rank <= 3 ? theme.gold : theme.textFaint
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, height: 58, padding: '0 15px', borderRadius: 16,
                background: isMe ? theme.foundBg : theme.neutralBg,
                border: `1px solid ${isMe ? theme.foundFg : theme.neutralBorder}`,
              }}
            >
              <div style={{ width: 24, fontWeight: 800, fontSize: 15, color: rankColor }}>{t.rank}</div>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: theme.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: theme.foundFg }}>
                {t.name.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: isMe ? 700 : 600, fontSize: 14.5, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.name}
                </div>
                {isMe && <div style={{ fontSize: 11, color: theme.foundFg, marginTop: 2, fontWeight: 600 }}>Ditt lag</div>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>{t.score}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
