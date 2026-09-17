import { useMemo, useState } from 'react'
import qrcode from 'qrcode-generator'
import { BRAND } from '../lib/theme'
import { PrimaryButton, SecondaryButton, Sheet, Toggle } from './ui'

const PARK_URL = 'https://www.gronalund.com'

function Chevron({ theme }) {
  return (
    <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M8 4l8 7-8 7" stroke={theme.textFaint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Row({ theme, icon, title, subtitle, onClick, trailing, danger }) {
  const inner = (
    <>
      <div
        style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0, fontSize: 18,
          background: danger ? theme.missedBg : theme.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: danger ? theme.missedFg : theme.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing !== undefined ? trailing : onClick ? <Chevron theme={theme} /> : null}
    </>
  )
  const style = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '9px 0',
    background: 'none', border: 'none', textAlign: 'left', color: theme.text,
  }
  return onClick ? (
    <button type="button" onClick={onClick} style={style}>
      {inner}
    </button>
  ) : (
    <div style={style}>{inner}</div>
  )
}

function SectionLabel({ theme, children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: theme.textFaint, margin: '12px 0 0' }}>
      {children}
    </div>
  )
}

function Divider({ theme }) {
  return <div style={{ height: 1, background: theme.neutralBorder, margin: '6px 0' }} />
}

function SubHeader({ theme, title, onBack }) {
  const glyph = theme.isDark ? '#fff' : theme.text
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="Tillbaka till menyn"
        style={{ width: 38, height: 38, borderRadius: 12, background: theme.accentSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <svg width="16" height="16" viewBox="0 0 17 17" fill="none">
          <path d="M10.5 3L5 8.5l5.5 5.5" stroke={glyph} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ fontWeight: 800, fontSize: 20, color: theme.text, letterSpacing: '-.02em' }}>{title}</div>
    </div>
  )
}

function Step({ theme, n, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 9, background: theme.gold, color: '#0B3B22', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {n}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.text }}>{title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: theme.textMuted, marginTop: 3 }}>{children}</div>
      </div>
    </div>
  )
}

// Renders a QR code as plain SVG rects so nothing needs innerHTML.
function QrCode({ value, size = 176, fg = '#0B3B22', bg = '#FFFFFF' }) {
  const { n, dark } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(value)
    qr.make()
    const count = qr.getModuleCount()
    const cells = []
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) if (qr.isDark(r, c)) cells.push([r, c])
    }
    return { n: count, dark: cells }
  }, [value])
  const margin = 2
  const total = n + margin * 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges" role="img" aria-label="QR-kod för att gå med i laget">
      <rect width={total} height={total} fill={bg} />
      {dark.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c + margin} y={r + margin} width={1} height={1} fill={fg} />
      ))}
    </svg>
  )
}

function HowToView({ theme, event, onBack }) {
  return (
    <>
      <SubHeader theme={theme} title="Så funkar Skattjakten" onBack={onBack} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Step theme={theme} n={1} title="Hitta hållplatserna">
          Kartan visar {event.checkpoints.length} hållplatser i parken. Gå dit, öppna hållplatsen i appen och lös uppdraget på plats.
        </Step>
        <Step theme={theme} n={2} title="Tre typer av uppdrag">
          ❓ Fråga: en klurig fråga om parken. 📷 Foto: en gruppbild på laget. 🧭 Ledtråd: hitta koden på skylten och skriv in den.
        </Step>
        <Step theme={theme} n={3} title="Samla poäng">
          Rätt svar ger poängen direkt. Fel svar? Försök igen. Hoppar ni över en hållplats blir det inga poäng för den.
        </Step>
        <Step theme={theme} n={4} title="Topplistan lever">
          Alla lag i kväll tävlar samtidigt och listan uppdateras direkt. Vid lika poäng rankas det lag som anslöt först högst.
        </Step>
        <Step theme={theme} n={5} title="Belöningen">
          När alla hållplatser är klara låses belöningen upp: {event.reward.title}. Visa koden under Mål för personalen.
        </Step>
      </div>
    </>
  )
}

function InviteView({ theme, inviteUrl, teamName, onBack }) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function share() {
    try {
      await navigator.share({ title: `Skattjakten · ${teamName}`, text: `Gå med i laget ${teamName} i Skattjakten på ${BRAND.name}`, url: inviteUrl })
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Kopiera länken:', inviteUrl)
    }
  }

  return (
    <>
      <SubHeader theme={theme} title="Bjud in lagkamrater" onBack={onBack} />
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: theme.textMuted }}>
        Låt lagkamraterna skanna koden eller öppna länken. Då spelar alla på laget <b style={{ color: theme.text }}>{teamName}</b> från sina egna mobiler och ser samma poäng.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 14, marginTop: 14, background: '#fff', borderRadius: 18 }}>
        <QrCode value={inviteUrl} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: theme.textFaint, wordBreak: 'break-all', textAlign: 'center' }}>{inviteUrl}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {canShare && (
          <PrimaryButton theme={theme} onClick={share}>Dela länk</PrimaryButton>
        )}
        <SecondaryButton theme={theme} onClick={copy}>{copied ? 'Kopierad ✓' : 'Kopiera länk'}</SecondaryButton>
      </div>
      <div style={{ marginTop: 12, fontSize: 11.5, color: theme.textFaint, textAlign: 'center' }}>
        Länken ger tillgång till ert lag, så dela den bara med lagkamrater.
      </div>
    </>
  )
}

function ParkView({ theme, onBack }) {
  return (
    <>
      <SubHeader theme={theme} title={`Om ${BRAND.name}`} onBack={onBack} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Row theme={theme} icon="🎡" title="Sveriges äldsta tivoli" subtitle="Öppnade 1883 på Djurgården i Stockholm, med kajen mot Saltsjön som granne." />
        <Row theme={theme} icon="📍" title="Hitta hit" subtitle="Lilla Allmänna Gränd 9, Djurgården. Spårvagn 7 till Liljevalchs/Gröna Lund eller Djurgårdsfärjan från Slussen." />
        <Row theme={theme} icon="🕒" title="Öppettider & kvällens program" subtitle="Varierar med säsong och konsertkvällar. Aktuella tider finns på gronalund.com." />
        <Row theme={theme} icon="💡" title="Tips för jakten" subtitle="Håll ihop laget, ha koll på batteriet och följ personalens anvisningar vid attraktionerna." />
      </div>
      <div style={{ marginTop: 14 }}>
        <a href={PARK_URL} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
          <SecondaryButton theme={theme} onClick={() => {}}>Öppna gronalund.com</SecondaryButton>
        </a>
      </div>
    </>
  )
}

export function MenuSheet({
  theme, isDark, onToggleTheme, onLeaveTeam, onResetDemo, onClose, onNavigate,
  team, rank, event, inviteUrl,
}) {
  const [view, setView] = useState('root')
  const back = () => setView('root')

  return (
    <Sheet theme={theme} onClose={onClose} title={view === 'root' ? 'Meny' : undefined}>
      {view === 'howto' && <HowToView theme={theme} event={event} onBack={back} />}
      {view === 'invite' && <InviteView theme={theme} inviteUrl={inviteUrl} teamName={team.name} onBack={back} />}
      {view === 'park' && <ParkView theme={theme} onBack={back} />}

      {view === 'root' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, background: theme.foundBg, border: `1px solid ${theme.foundBorder}` }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.accent, color: theme.onAccent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
              {team.name.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                {team.score} p · {team.foundCount} av {team.total} hållplatser{rank ? ` · plats ${rank}` : ''}
              </div>
            </div>
          </div>

          <SectionLabel theme={theme}>Spela</SectionLabel>
          <Row theme={theme} icon="📖" title="Så funkar Skattjakten" subtitle="Regler, poäng och de tre uppdragstyperna" onClick={() => setView('howto')} />
          <Row theme={theme} icon="👥" title="Bjud in lagkamrater" subtitle="Spela på samma lag från flera mobiler" onClick={() => setView('invite')} />
          <Row theme={theme} icon="🎁" title="Mål & belöning" subtitle={`${event.reward.title} när allt är klart`} onClick={() => { onNavigate('finish'); onClose() }} />

          <Divider theme={theme} />
          <SectionLabel theme={theme}>Parken</SectionLabel>
          <Row theme={theme} icon="🎡" title={`Om ${BRAND.name}`} subtitle="Hitta hit, öppettider och tips" onClick={() => setView('park')} />

          <Divider theme={theme} />
          <SectionLabel theme={theme}>Inställningar</SectionLabel>
          <Row
            theme={theme}
            icon="🌙"
            title="Kvällsläge"
            subtitle="Mörk skin för parken efter mörkrets inbrott"
            trailing={<Toggle theme={theme} checked={isDark} onChange={onToggleTheme} />}
          />
          <Row theme={theme} icon="🚪" title="Byt lag / logga ut" subtitle="Lämna laget på den här mobilen" onClick={onLeaveTeam} />

          <Divider theme={theme} />
          <SectionLabel theme={theme}>Demo</SectionLabel>
          <Row theme={theme} icon="♻️" title="Återställ hela eventet" subtitle="Nollställer alla lag och deras poäng" onClick={onResetDemo} danger />

          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: theme.textFaint }}>
            Skattjakten · {BRAND.name} × ReadySet · prototyp
          </div>
        </div>
      )}
    </Sheet>
  )
}
