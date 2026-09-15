import { BRAND } from '../lib/theme'

function TabIcon({ theme, active, onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active}
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: active ? theme.tabActiveBg : theme.tabIdleBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
      }}
    >
      {children(active ? theme.tabActiveFg : theme.tabIdleFg)}
    </button>
  )
}

export function TabBar({ theme, screen, onNavigate }) {
  return (
    <div style={{ flex: 'none', height: 104, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', position: 'relative', background: theme.tabBarBg }}>
      <TabIcon theme={theme} active={screen === 'settings'} onClick={() => onNavigate('settings')} label="Meny">
        {(c) => (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="4" width="16" height="2.6" rx="1.3" fill={c} />
            <rect x="3" y="9.7" width="16" height="2.6" rx="1.3" fill={c} />
            <rect x="3" y="15.4" width="16" height="2.6" rx="1.3" fill={c} />
          </svg>
        )}
      </TabIcon>

      <TabIcon theme={theme} active={screen === 'checkpoints'} onClick={() => onNavigate('checkpoints')} label="Hållplatser">
        {(c) => (
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
            <path d="M13 2.5l3 6.6 7.2.6-5.5 4.8 1.7 7-6.4-3.8-6.4 3.8 1.7-7L2.8 9.7 10 9.1l3-6.6Z" fill={c} />
          </svg>
        )}
      </TabIcon>

      <div style={{ width: 76 }} />

      <TabIcon theme={theme} active={screen === 'leaderboard'} onClick={() => onNavigate('leaderboard')} label="Topplistan">
        {(c) => (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2.5" y="10" width="4.5" height="9" rx="1.4" fill={c} />
            <rect x="8.8" y="5" width="4.5" height="14" rx="1.4" fill={c} />
            <rect x="15.1" y="12.5" width="4.5" height="6.5" rx="1.4" fill={c} />
          </svg>
        )}
      </TabIcon>

      <TabIcon theme={theme} active={screen === 'finish'} onClick={() => onNavigate('finish')} label="Mål">
        {(c) => (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M6 3.5h10v4a5 5 0 01-10 0v-4Z" fill={c} />
            <path d="M9 13h4v3.5h-4zM6.5 18h9v1.6h-9z" fill={c} />
          </svg>
        )}
      </TabIcon>

      <button
        type="button"
        onClick={() => onNavigate('map')}
        aria-label="Kartan"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 34,
          width: 74,
          height: 74,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: `0 0 0 7px ${theme.centerRing}, 0 8px 20px rgba(0,0,0,.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: screen === 'map' ? `2px solid ${theme.accent}` : 'none',
          padding: 0,
        }}
      >
        <img src={BRAND.logo} alt={BRAND.name} style={{ width: 66, height: 66, objectFit: 'contain', display: 'block' }} />
      </button>
    </div>
  )
}
