import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const PAD = 8
const CARD_H = 200 // rough card height used for placement decisions

// Spotlight tour. Each step may name a target via data-tour="..."; the target
// is cut out of a dim overlay and a card is placed next to it. Steps whose
// target is not on screen are skipped. A target can fine-tune its cut-out with
// data-tour-adjust="top right bottom left" (px added to each edge, negative
// shrinks), e.g. to exclude a part hidden under another element.
function adjustmentsOf(el) {
  const raw = (el.getAttribute('data-tour-adjust') || '').trim()
  const [t = 0, r = 0, b = 0, l = 0] = raw ? raw.split(/\s+/).map(Number) : []
  return { t, r, b, l }
}
export function TourOverlay({ theme, steps, onClose }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const rootRef = useRef(null)
  const step = steps[i]

  useLayoutEffect(() => {
    if (!step) return undefined
    function measure() {
      const base = rootRef.current?.getBoundingClientRect()
      if (!step.target || !base) return setRect(null)
      const el = document.querySelector(`[data-tour="${step.target}"]`)
      if (!el) {
        // Nothing to point at (e.g. every stop is done): move on.
        setI((n) => n + 1)
        return
      }
      const r = el.getBoundingClientRect()
      const a = adjustmentsOf(el)
      setRect({
        x: r.left - base.left - a.l,
        y: r.top - base.top - a.t,
        w: r.width + a.l + a.r,
        h: r.height + a.t + a.b,
        W: base.width,
        H: base.height,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [i, step])

  // Ran past the last step (the final target was missing): close from an
  // effect, never during render.
  useEffect(() => {
    if (!step) onClose()
  }, [step, onClose])

  if (!step) return null

  const last = i === steps.length - 1
  let cardPos
  if (!rect) cardPos = { top: '50%', transform: 'translateY(-50%)' }
  else if (rect.y + rect.h + PAD + CARD_H < rect.H) cardPos = { top: rect.y + rect.h + PAD + 12 }
  else if (rect.y - PAD - CARD_H > 0) cardPos = { bottom: rect.H - rect.y + PAD + 12 }
  else cardPos = { top: Math.max(12, rect.y + rect.h - CARD_H - 16) }

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={step.title}
      data-tour-overlay
      style={{ position: 'absolute', inset: 0, zIndex: 60, overflow: 'hidden' }}
    >
      {rect ? (
        <div
          data-tour-spotlight
          style={{
            position: 'absolute',
            left: rect.x - PAD,
            top: rect.y - PAD,
            width: rect.w + PAD * 2,
            height: rect.h + PAD * 2,
            borderRadius: 24,
            boxShadow: '0 0 0 9999px rgba(0,0,0,.62)',
            border: '2px solid rgba(255,255,255,.9)',
            pointerEvents: 'none',
            transition: 'all .25s ease',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.62)' }} />
      )}

      <div
        key={step.key}
        className="intro-step"
        style={{
          position: 'absolute', left: 18, right: 18, ...cardPos,
          background: theme.sheetBg, color: theme.text, borderRadius: 22, padding: '18px 18px 16px',
          boxShadow: '0 18px 50px rgba(0,0,0,.35)',
        }}
      >
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: theme.textFaint }}>
          Rundtur · {i + 1} av {steps.length}
        </div>
        <div style={{ marginTop: 6, fontWeight: 800, fontSize: 19, letterSpacing: '-.02em' }}>{step.title}</div>
        <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: theme.textMuted }}>{step.body}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: 13, color: theme.textMuted, padding: '10px 4px' }}
          >
            Hoppa över
          </button>
          <button
            type="button"
            onClick={() => (last ? onClose() : setI(i + 1))}
            style={{ height: 44, padding: '0 22px', borderRadius: 12, border: 'none', background: theme.accent, color: theme.onAccent, fontWeight: 700, fontSize: 14 }}
          >
            {last ? 'Klart' : 'Nästa'}
          </button>
        </div>
      </div>
    </div>
  )
}
