import { useEffect, useRef, useState } from 'react'
import { PrimaryButton, SecondaryButton, Sheet, TypeLabel } from './ui'
import { formatDistance } from '../lib/parkGeo'

const TYPE_ICON = {
  quiz: '❓',
  photo: '📷',
  clue: '🧭',
}

// One line of instructions per mission type, shown under the prompt.
const TYPE_HELP = {
  quiz: 'Välj ett svar och tryck Skicka svar. Blir det fel får ni försöka igen.',
  photo: 'Ta en bild där hela laget syns framför attraktionen, tryck sedan Fortsätt.',
  clue: 'Koden står på skylten vid hållplatsen. Stora och små bokstäver spelar ingen roll.',
}

export function MissionSheet({ theme, checkpoint, entry, onAttempt, onSkip, onClose, submitting, error, distance }) {
  const [answerIndex, setAnswerIndex] = useState(null)
  const [code, setCode] = useState('')
  const [photo, setPhoto] = useState(null)
  const fileRef = useRef(null)

  // After a wrong/skipped attempt, clear the previous pick so the retry
  // doesn't visually read as "still marked correct".
  useEffect(() => {
    if (entry?.status === 'missed') {
      setAnswerIndex(null)
      setCode('')
    }
  }, [entry?.submittedAt, entry?.status])

  if (!checkpoint) return null

  const found = entry?.status === 'found'
  const justMissed = entry?.status === 'missed' && !found

  return (
    <Sheet theme={theme} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>{TYPE_ICON[checkpoint.type]}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 19, color: theme.text, letterSpacing: '-.02em' }}>{checkpoint.name}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }}>
            {TypeLabel(checkpoint.type)} · {checkpoint.points} p
          </div>
        </div>
      </div>

      {found ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ background: theme.foundBg, border: `1px solid ${theme.foundBorder}`, borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 28 }}>✅</div>
            <div>
              <div style={{ fontWeight: 700, color: theme.foundFg }}>Hållplats klar!</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 2 }}>Ni fick {entry.points} poäng.</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <PrimaryButton theme={theme} onClick={onClose}>Fortsätt</PrimaryButton>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {justMissed && (
            <div style={{ background: theme.missedBg, border: `1px solid ${theme.missedBorder}`, borderRadius: 14, padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: theme.missedFg }}>
              Inte riktigt — försök igen.
            </div>
          )}
          {error && (
            <div style={{ background: theme.missedBg, border: `1px solid ${theme.missedBorder}`, borderRadius: 14, padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: theme.missedFg, wordBreak: 'break-word' }}>
              Svaret kunde inte skickas. {error}
            </div>
          )}
          {distance != null && distance > 75 && (
            <div data-proximity style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, borderRadius: 14, padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: theme.text }}>
              📍 Ni verkar vara {formatDistance(distance)} från hållplatsen. Gå dit innan ni svarar.
            </div>
          )}

          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: theme.text, fontWeight: 600 }}>{checkpoint.prompt}</p>
          {TYPE_HELP[checkpoint.type] && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, lineHeight: 1.45, color: theme.textMuted, marginTop: -4 }}>
              <span aria-hidden="true">💡</span>
              <span>{TYPE_HELP[checkpoint.type]}</span>
            </div>
          )}

          {checkpoint.type === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {checkpoint.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswerIndex(i)}
                  style={{
                    textAlign: 'left',
                    height: 52,
                    padding: '0 16px',
                    borderRadius: 14,
                    border: `1.5px solid ${answerIndex === i ? theme.accent : theme.neutralBorder}`,
                    background: answerIndex === i ? theme.accentSoft : theme.neutralBg,
                    color: theme.text,
                    fontWeight: 600,
                    fontSize: 14.5,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {checkpoint.type === 'photo' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setPhoto(URL.createObjectURL(f))
                }}
              />
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  height: 180,
                  borderRadius: 16,
                  border: `1.5px dashed ${theme.accentBorder}`,
                  background: photo ? `center/cover no-repeat url(${photo})` : theme.neutralBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                {!photo && (
                  <>
                    <div style={{ fontSize: 28 }}>📷</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textMuted }}>Tryck för att ta bilden</div>
                  </>
                )}
              </div>
              {photo && (
                <button
                  type="button"
                  onClick={() => { setPhoto(null); fileRef.current?.click() }}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: theme.accent, fontWeight: 600, fontSize: 13 }}
                >
                  Ta om bilden
                </button>
              )}
            </div>
          )}

          {checkpoint.type === 'clue' && (
            <div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Skriv koden ni hittade"
                style={{
                  width: '100%',
                  height: 54,
                  borderRadius: 14,
                  border: `1.5px solid ${theme.neutralBorder}`,
                  background: theme.neutralBg,
                  color: theme.text,
                  padding: '0 16px',
                  fontSize: 15,
                  fontWeight: 600,
                  boxSizing: 'border-box',
                }}
              />
              {checkpoint.hint && (
                <div style={{ marginTop: 6, fontSize: 12, color: theme.textFaint }}>Ledtråd: {checkpoint.hint}</div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <PrimaryButton
              theme={theme}
              disabled={
                submitting ||
                (checkpoint.type === 'quiz' && answerIndex === null) ||
                (checkpoint.type === 'photo' && !photo) ||
                (checkpoint.type === 'clue' && !code.trim())
              }
              onClick={() => {
                if (checkpoint.type === 'quiz') onAttempt({ answerIndex })
                else if (checkpoint.type === 'photo') onAttempt({ hasPhoto: true })
                else onAttempt({ code })
              }}
            >
              {submitting ? 'Skickar…' : checkpoint.type === 'photo' ? 'Fortsätt' : 'Skicka svar'}
            </PrimaryButton>
            <SecondaryButton theme={theme} disabled={submitting} onClick={onSkip}>Hoppa över</SecondaryButton>
          </div>
        </div>
      )}
    </Sheet>
  )
}
