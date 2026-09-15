export function PrimaryButton({ theme, children, onClick, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 58,
        borderRadius: 14,
        background: disabled ? theme.textFaint : theme.accent,
        color: theme.onAccent,
        border: 'none',
        fontWeight: 700,
        fontSize: 16,
        width: '100%',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      className="transition active:scale-[0.98]"
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ theme, children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 58,
        borderRadius: 14,
        background: 'transparent',
        color: theme.accent === theme.gold ? theme.accent : theme.text,
        border: `1.5px solid ${theme.accentBorder}`,
        fontWeight: 600,
        fontSize: 15,
        width: '100%',
        opacity: disabled ? 0.5 : 1,
      }}
      className="transition active:scale-[0.98]"
    >
      {children}
    </button>
  )
}

export function GearButton({ theme, onClick, dark }) {
  const glyph = theme.isDark ? '#fff' : theme.text
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Inställningar"
      style={{
        width: 46,
        height: 46,
        borderRadius: 13,
        background: theme.isDark ? 'rgba(255,255,255,.14)' : '#fff',
        boxShadow: theme.isDark ? 'none' : theme.cardShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3" stroke={glyph} strokeWidth="1.6" />
        <path
          d="M10 1.8v2.4M10 15.8v2.4M2.6 10h2.4M15 10h2.4M4.8 4.8l1.7 1.7M13.5 13.5l1.7 1.7M15.2 4.8l-1.7 1.7M6.5 13.5l-1.7 1.7"
          stroke={glyph}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

export function BackButton({ theme, onClick }) {
  const glyph = theme.isDark ? '#fff' : theme.text
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tillbaka"
      style={{
        width: 46,
        height: 46,
        borderRadius: 13,
        background: theme.isDark ? 'rgba(255,255,255,.14)' : '#fff',
        boxShadow: theme.isDark ? 'none' : theme.cardShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M10.5 3L5 8.5l5.5 5.5" stroke={glyph} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function StatusIcon({ theme, type, status, size = 26 }) {
  const bg = status === 'found' ? theme.foundFg : status === 'missed' ? theme.missedFg : theme.textFaint
  const glyph = theme.isDark ? theme.appBg : '#fff'

  if (status === 'found') {
    return (
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="12" fill={bg} />
        <path d="M7.5 13.2l3.4 3.4 7.2-7.6" stroke={glyph} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === 'missed') {
    return (
      <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="12" fill={bg} />
        <path d="M9 9l8 8M17 9l-8 8" stroke={glyph} strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  const icons = {
    quiz: <path d="M9.8 10a3.2 3.2 0 016.4.2c0 2.2-3 2.3-3 4.3M13.1 18.4h.01" stroke={theme.textMuted} strokeWidth="1.9" strokeLinecap="round" />,
    photo: (
      <>
        <rect x="2" y="6" width="22" height="15" rx="4" fill="none" stroke={theme.textMuted} strokeWidth="1.6" />
        <circle cx="13" cy="13.5" r="4.2" fill="none" stroke={theme.textMuted} strokeWidth="1.6" />
      </>
    ),
    clue: (
      <path
        d="M13 2.5l3 6.6 7.2.6-5.5 4.8 1.7 7-6.4-3.8-6.4 3.8 1.7-7L2.8 9.7 10 9.1l3-6.6Z"
        fill="none"
        stroke={theme.textMuted}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  }
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="12" fill="none" stroke={theme.neutralBorder} strokeWidth="1.6" />
      {icons[type]}
    </svg>
  )
}

export function TypeLabel(type) {
  return { quiz: 'Fråga', photo: 'Foto', clue: 'Ledtråd' }[type] || type
}

export function Sheet({ theme, onClose, children, title }) {
  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
      />
      <div
        style={{
          position: 'relative',
          background: theme.sheetBg,
          borderRadius: '28px 28px 0 0',
          padding: '18px 20px 26px',
          maxHeight: '88%',
          overflowY: 'auto',
          boxShadow: '0 -20px 50px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 5, borderRadius: 99, background: theme.textFaint, opacity: 0.4 }} />
        </div>
        {title && (
          <div style={{ fontWeight: 800, fontSize: 20, color: theme.text, marginBottom: 14, letterSpacing: '-.02em' }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Toggle({ theme, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 99,
        background: checked ? theme.accent : theme.neutralBorder,
        position: 'relative',
        border: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      />
    </button>
  )
}
