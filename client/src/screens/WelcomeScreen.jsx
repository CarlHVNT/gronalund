import { useState } from 'react'
import { BRAND } from '../lib/theme'
import { PrimaryButton } from '../components/ui'

export function WelcomeScreen({ theme, eventCode, eventTitle, eventTagline, onJoin, joining, error }) {
  const [teamName, setTeamName] = useState('')
  const [code, setCode] = useState(eventCode || '')

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 28px',
        background: theme.splashBg,
        backgroundImage: theme.splashGlow,
      }}
    >
      <div style={{ height: 64 }} />
      <div
        style={{
          width: 168,
          height: 168,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: theme.isDark ? '0 22px 50px rgba(0,0,0,.45)' : `inset 0 -10px 24px rgba(11,59,34,.10), 0 22px 44px rgba(11,59,34,.22)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img src={BRAND.logo} alt={BRAND.name} style={{ width: 154, height: 154, objectFit: 'contain' }} />
      </div>
      <div style={{ marginTop: 30, fontSize: 27, color: theme.isDark ? 'rgba(255,255,255,.82)' : theme.text, fontWeight: 500 }}>
        Välkommen till
      </div>
      <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', color: theme.isDark ? '#fff' : theme.text, textTransform: 'uppercase', textAlign: 'center' }}>
        {BRAND.name}
      </div>
      <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: theme.textMuted, textAlign: 'center', maxWidth: 260 }}>
        {eventTitle} · {eventTagline}
      </div>

      <div style={{ flex: 1 }} />

      <form
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 36 }}
        onSubmit={(e) => {
          e.preventDefault()
          onJoin({ teamName, code })
        }}
      >
        {error && (
          <div style={{ background: theme.missedBg, border: `1px solid ${theme.missedBorder}`, color: theme.missedFg, borderRadius: 12, padding: '10px 14px', fontSize: 12.5, fontWeight: 600 }}>
            {error}
          </div>
        )}
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Lagnamn"
          maxLength={40}
          style={{
            height: 58,
            borderRadius: 12,
            border: 'none',
            padding: '0 18px',
            fontSize: 15,
            fontWeight: 500,
            background: theme.isDark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.55)',
            color: theme.isDark ? '#fff' : theme.text,
            boxSizing: 'border-box',
          }}
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Eventkod"
          style={{
            height: 58,
            borderRadius: 12,
            border: 'none',
            padding: '0 18px',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '.06em',
            background: theme.isDark ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.55)',
            color: theme.isDark ? '#fff' : theme.text,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.isDark ? 'rgba(255,255,255,.6)' : theme.text, marginBottom: 6 }}>
          Ange en kod för att fortsätta
        </div>
        <PrimaryButton theme={theme} type="submit" disabled={joining}>
          {joining ? 'Ansluter…' : 'Anslut med QR-kod'}
        </PrimaryButton>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, letterSpacing: '.06em', fontWeight: 600, color: theme.textFaint }}>
          Drivs av ReadySet
        </div>
      </form>
    </div>
  )
}
