import { SecondaryButton, Sheet, Toggle } from './ui'

export function SettingsSheet({ theme, isDark, onToggleTheme, onLeaveTeam, onResetDemo, onClose, teamName }) {
  return (
    <Sheet theme={theme} onClose={onClose} title="Inställningar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: theme.text, fontSize: 14.5 }}>Kvällsläge</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Mörk skin för parken efter mörkrets inbrott</div>
          </div>
          <Toggle theme={theme} checked={isDark} onChange={onToggleTheme} />
        </div>

        <div style={{ height: 1, background: theme.neutralBorder }} />

        <div>
          <div style={{ fontWeight: 700, color: theme.text, fontSize: 14.5, marginBottom: 2 }}>Inloggat lag</div>
          <div style={{ fontSize: 13, color: theme.textMuted }}>{teamName}</div>
        </div>

        <SecondaryButton theme={theme} onClick={onLeaveTeam}>Byt lag / logga ut</SecondaryButton>

        <div style={{ height: 1, background: theme.neutralBorder }} />

        <div>
          <div style={{ fontWeight: 700, color: theme.text, fontSize: 14.5, marginBottom: 6 }}>Demo</div>
          <button
            type="button"
            onClick={onResetDemo}
            style={{ background: 'none', border: 'none', color: theme.missedFg, fontWeight: 600, fontSize: 13, padding: 0 }}
          >
            Återställ hela eventet för alla lag
          </button>
        </div>
      </div>
    </Sheet>
  )
}
