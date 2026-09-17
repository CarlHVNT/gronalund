import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../lib/theme'
import { INTRO_STEPS } from '../lib/onboarding'
import { PrimaryButton } from './ui'

// Swipeable intro carousel: what the game is, the three mission types, points
// and the reward. Shown before the join form on first visit; replayable.
export function IntroScreen({ theme, onDone }) {
  const [i, setI] = useState(0)
  const startX = useRef(null)
  const last = i === INTRO_STEPS.length - 1
  const step = INTRO_STEPS[i]
  const go = (n) => setI(Math.max(0, Math.min(INTRO_STEPS.length - 1, n)))

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') go(i + 1)
      if (e.key === 'ArrowLeft') go(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i])

  const fg = theme.isDark ? '#fff' : theme.text

  return (
    <div
      data-intro
      style={{
        height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px',
        background: theme.splashBg, backgroundImage: theme.splashGlow, color: fg,
      }}
      onTouchStart={(e) => {
        startX.current = e.touches[0].clientX
      }}
      onTouchEnd={(e) => {
        if (startX.current === null) return
        const dx = e.changedTouches[0].clientX - startX.current
        startX.current = null
        if (dx < -40) go(i + 1)
        else if (dx > 40) go(i - 1)
      }}
    >
      <div style={{ height: 22 }} />
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={BRAND.logo} alt={BRAND.name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '.02em' }}>Skattjakten</div>
        </div>
        <button
          type="button"
          onClick={onDone}
          style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: 13, color: theme.isDark ? 'rgba(255,255,255,.75)' : theme.textMuted, padding: '8px 0 8px 12px' }}
        >
          Hoppa över
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <div key={step.key} className="intro-step" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div
          style={{
            width: 118, height: 118, borderRadius: '50%', fontSize: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: theme.isDark ? 'rgba(255,255,255,.1)' : '#fff',
            boxShadow: theme.isDark ? '0 18px 40px rgba(0,0,0,.4)' : 'inset 0 -8px 20px rgba(11,59,34,.08), 0 18px 40px rgba(11,59,34,.18)',
          }}
          aria-hidden="true"
        >
          {step.icon}
        </div>
        <h1 style={{ margin: '26px 0 0', fontSize: 25, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15 }}>{step.title}</h1>
        <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.5, fontWeight: 500, color: theme.isDark ? 'rgba(255,255,255,.78)' : theme.textMuted, maxWidth: 300 }}>
          {step.body}
        </p>
        {step.bullets && (
          <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {step.bullets.map(([icon, name, text]) => (
              <div
                key={name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '10px 14px', borderRadius: 14,
                  background: theme.isDark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.65)',
                }}
              >
                <span style={{ fontSize: 20 }} aria-hidden="true">{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                  <div style={{ fontSize: 12.5, color: theme.isDark ? 'rgba(255,255,255,.7)' : theme.textMuted }}>{text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 7, marginBottom: 18 }} aria-label={`Steg ${i + 1} av ${INTRO_STEPS.length}`}>
        {INTRO_STEPS.map((s, n) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Gå till steg ${n + 1}`}
            onClick={() => go(n)}
            style={{
              width: n === i ? 22 : 8, height: 8, borderRadius: 99, border: 'none', padding: 0,
              background: n === i ? theme.accent : theme.isDark ? 'rgba(255,255,255,.3)' : 'rgba(11,59,34,.22)',
              transition: 'width .2s ease',
            }}
          />
        ))}
      </div>
      <div style={{ width: '100%', paddingBottom: 36 }}>
        <PrimaryButton theme={theme} onClick={() => (last ? onDone() : go(i + 1))}>
          {last ? 'Kom igång' : 'Nästa'}
        </PrimaryButton>
      </div>
    </div>
  )
}
