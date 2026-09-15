import { useState } from 'react'
import { BRAND } from '../lib/theme'
import { PrimaryButton } from '../components/ui'

export function FinishScreen({ theme, team, event, myRank, elapsedLabel, onBackToMap }) {
  const [redeemed, setRedeemed] = useState(false)
  const allFound = team.foundCount >= team.total
  const rewardCode = `${event.reward.codePrefix}-${team.score}`

  if (!allFound) {
    return (
      <div
        style={{
          height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px',
          background: theme.splashBg, backgroundImage: theme.splashGlow,
        }}
      >
        <div style={{ height: 84 }} />
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: theme.isDark ? 'rgba(255,255,255,.1)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
          🏆
        </div>
        <div style={{ marginTop: 24, fontSize: 22, fontWeight: 800, color: theme.isDark ? '#fff' : theme.text, textAlign: 'center' }}>
          {team.foundCount} av {team.total} hittade
        </div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: theme.textMuted, textAlign: 'center', maxWidth: 240 }}>
          Fortsätt jakten i parken — belöningen låses upp när alla hållplatser är klara.
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: '100%', paddingBottom: 36 }}>
          <PrimaryButton theme={theme} onClick={onBackToMap}>Fortsätt jakten</PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px',
        background: theme.splashBg, backgroundImage: theme.splashGlow,
      }}
    >
      <div style={{ height: 60 }} />
      <div
        style={{
          width: 126, height: 126, borderRadius: '50%', background: '#fff',
          boxShadow: theme.isDark ? '0 16px 34px rgba(0,0,0,.4)' : 'inset 0 -8px 20px rgba(11,59,34,.10), 0 16px 34px rgba(11,59,34,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <img src={BRAND.logo} alt={BRAND.name} style={{ width: 114, height: 114, objectFit: 'contain' }} />
      </div>
      <div style={{ marginTop: 26, fontSize: 22, fontWeight: 500, color: theme.isDark ? '#fff' : theme.text }}>Skattjakten klar</div>
      <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800, letterSpacing: '-.02em', color: theme.isDark ? '#fff' : theme.text }}>
        {team.foundCount} AV {team.total}
      </div>

      <div style={{ marginTop: 22, width: '100%', borderRadius: 20, background: theme.isDark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.62)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        <Stat theme={theme} value={team.score} label="Poäng" />
        <div style={{ width: 1, height: 30, background: theme.isDark ? 'rgba(255,255,255,.16)' : 'rgba(11,59,34,.14)' }} />
        <Stat theme={theme} value={myRank ? `${myRank}:a` : '—'} label="Placering" />
        <div style={{ width: 1, height: 30, background: theme.isDark ? 'rgba(255,255,255,.16)' : 'rgba(11,59,34,.14)' }} />
        <Stat theme={theme} value={elapsedLabel} label="Tid" />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ width: '100%', borderRadius: 20, background: theme.sheetBg, padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎁</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: theme.foundFg, marginBottom: 4 }}>Din belöning</div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.text }}>{event.reward.title}</div>
          <div style={{ marginTop: 3, fontSize: 11, fontWeight: 600, color: theme.textMuted }}>Kod {rewardCode} · giltig i kväll</div>
        </div>
      </div>
      <div style={{ width: '100%', marginTop: 10, paddingBottom: 36 }}>
        <PrimaryButton theme={theme} onClick={() => setRedeemed(true)}>
          {redeemed ? 'Visad för personalen ✓' : 'Visa i Tivolishopen'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function Stat({ theme, value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: theme.isDark ? '#fff' : theme.accent }}>{value}</div>
      <div style={{ marginTop: 5, fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: theme.textMuted }}>{label}</div>
    </div>
  )
}
