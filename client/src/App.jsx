import { useEffect, useState } from 'react'
import { api, API_BASE } from './lib/api'
import { THEMES, BRAND } from './lib/theme'
import { formatElapsed } from './lib/format'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { MapScreen } from './screens/MapScreen'
import { CheckpointsScreen } from './screens/CheckpointsScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { FinishScreen } from './screens/FinishScreen'
import { TabBar } from './components/TabBar'
import { MissionSheet } from './components/MissionSheet'
import { MenuSheet } from './components/MenuSheet'

const SESSION_KEY = 'rs-gl-session'
const THEME_KEY = 'rs-gl-theme'

export default function App() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const theme = THEMES[themeId]

  const [event, setEvent] = useState(null)
  const [session, setSession] = useState(() => {
    try {
      // Invite link from the menu: ?team=<id>&key=<token> joins that team on
      // this device too. The params are stripped so the URL stays shareable.
      const params = new URLSearchParams(window.location.search)
      const teamId = params.get('team')
      const token = params.get('key')
      if (teamId && token) {
        const invited = { teamId, token }
        localStorage.setItem(SESSION_KEY, JSON.stringify(invited))
        window.history.replaceState(null, '', window.location.pathname)
        return invited
      }
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [team, setTeam] = useState(null)
  const [appLoading, setAppLoading] = useState(true)
  const [bootError, setBootError] = useState(null)
  const [slowBoot, setSlowBoot] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState(null)

  const [screen, setScreen] = useState('map')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeCheckpointId, setActiveCheckpointId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])

  // Boot: load event content, and try to resume a saved team session.
  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const ev = await api.getEvent()
        if (!ev || !Array.isArray(ev.checkpoints)) {
          throw new Error('Oväntat svar från spelservern. Kontrollera att API-adressen pekar på servern.')
        }
        if (!cancelled) setEvent(ev)
      } catch (e) {
        // Shown on the loading screen so a broken API address is obvious.
        if (!cancelled) setBootError(e.message)
      }
      if (session?.teamId && session?.token) {
        try {
          const { team: t } = await api.getTeam(session.teamId, session.token)
          if (!cancelled) setTeam(t)
        } catch (e) {
          if (e.status === 401) {
            localStorage.removeItem(SESSION_KEY)
            if (!cancelled) setSession(null)
          } else if (!cancelled) {
            setBootError(e.message)
          }
        }
      }
      if (!cancelled) setAppLoading(false)
    }
    boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Free-tier hosts can take a while to wake up; say so instead of just spinning.
  useEffect(() => {
    if (!appLoading) return
    const id = setTimeout(() => setSlowBoot(true), 4000)
    return () => clearTimeout(id)
  }, [appLoading])

  // Live sync: one /sync call every few seconds (leaderboard + own team) so
  // several phones playing as one team see the same progress. Calls never
  // overlap, and nothing is fetched while the tab is in the background.
  useEffect(() => {
    if (!team || !session) return
    let cancelled = false
    let timer = null
    const schedule = () => {
      if (!cancelled) timer = setTimeout(tick, 5000)
    }
    async function tick() {
      if (document.visibilityState === 'hidden') return schedule()
      try {
        const { team: fresh, teams } = await api.sync(session.teamId, session.token)
        if (cancelled) return
        setLeaderboard(teams)
        if (fresh) setTeam((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh))
      } catch (e) {
        // The team is gone (event reset from another phone, or a bad invite
        // link): leave it here as well instead of failing on the next action.
        if (!cancelled && e.status === 401) return handleLeaveTeam()
      }
      schedule()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, session?.teamId, session?.token])

  function toggleTheme(dark) {
    const next = dark ? 'dark' : 'light'
    setThemeId(next)
    localStorage.setItem(THEME_KEY, next)
  }

  async function handleJoin({ teamName, code }) {
    setJoining(true)
    setJoinError(null)
    try {
      const { team: t, token } = await api.join({ teamName, code })
      if (!t?.id || !token) throw new Error('Oväntat svar från spelservern vid anslutning. Försök igen.')
      const nextSession = { teamId: t.id, token }
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
      setTeam(t)
      setScreen('map')
    } catch (e) {
      setJoinError(e.message)
    } finally {
      setJoining(false)
    }
  }

  function handleLeaveTeam() {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setTeam(null)
    setSettingsOpen(false)
    setScreen('map')
  }

  async function handleResetDemo() {
    if (!window.confirm('Detta nollställer alla lags framsteg i eventet. Fortsätt?')) return
    try {
      await api.resetDemo()
      handleLeaveTeam()
    } catch (e) {
      window.alert(`Kunde inte återställa eventet.\n${e.message}`)
    }
  }

  async function refreshTeam(updatedTeam) {
    setTeam(updatedTeam)
  }

  async function handleAttempt(checkpointId, payload) {
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await api.attempt(checkpointId, { ...payload, teamId: session.teamId, token: session.token })
      await refreshTeam(res.team)
    } catch (e) {
      if (e.status === 401) return handleLeaveTeam()
      setActionError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkip(checkpointId) {
    setSubmitting(true)
    setActionError(null)
    try {
      const res = await api.skip(checkpointId, { teamId: session.teamId, token: session.token })
      await refreshTeam(res.team)
      setActiveCheckpointId(null)
    } catch (e) {
      if (e.status === 401) return handleLeaveTeam()
      setActionError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleNavigate(key) {
    if (key === 'settings') {
      setSettingsOpen(true)
    } else {
      setSettingsOpen(false)
      setScreen(key)
    }
  }

  const shellStyle = {
    width: '100%',
    maxWidth: 460,
    height: '100dvh',
    background: theme.appBg,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  }

  if (appLoading || !event) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={shellStyle}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: 24,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {bootError ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Kunde inte ladda eventet</div>
                <div style={{ fontSize: 13, opacity: 0.85, wordBreak: 'break-word' }}>{bootError}</div>
                <div style={{ fontSize: 11, opacity: 0.55, wordBreak: 'break-all' }}>API: {API_BASE}</div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: 6,
                    height: 44,
                    padding: '0 22px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#fff',
                    color: '#111',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Försök igen
                </button>
              </>
            ) : (
              <>
                <div>Laddar {BRAND.name}…</div>
                {slowBoot && (
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    Spelservern startar upp. Första gången kan det ta upp till en minut.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={shellStyle} className="app-shell">
          <WelcomeScreen
            theme={theme}
            eventCode={event.code}
            eventTitle={event.title}
            eventTagline={event.tagline}
            onJoin={handleJoin}
            joining={joining}
            error={joinError}
          />
        </div>
      </div>
    )
  }

  const activeCheckpoint = event.checkpoints.find((c) => c.id === activeCheckpointId) || null
  const currentCheckpoint = event.checkpoints.find((c) => team.progress[c.id]?.status !== 'found') || null
  const myRankEntry = leaderboard.find((t) => t.id === team.id)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <div style={shellStyle} className="app-shell">
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {screen === 'map' && (
            <MapScreen
              theme={theme}
              checkpoints={event.checkpoints}
              progress={team.progress}
              currentId={currentCheckpoint?.id}
              onSelect={setActiveCheckpointId}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {screen === 'checkpoints' && (
            <CheckpointsScreen
              theme={theme}
              checkpoints={event.checkpoints}
              progress={team.progress}
              onSelect={setActiveCheckpointId}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          )}
          {screen === 'leaderboard' && (
            <LeaderboardScreen theme={theme} teams={leaderboard} myTeamId={team.id} onOpenSettings={() => setSettingsOpen(true)} />
          )}
          {screen === 'finish' && (
            <FinishScreen
              theme={theme}
              team={team}
              event={event}
              myRank={myRankEntry?.rank}
              elapsedLabel={formatElapsed(team.joinedAt)}
              onBackToMap={() => setScreen('map')}
            />
          )}

          {activeCheckpoint && (
            <MissionSheet
              theme={theme}
              checkpoint={activeCheckpoint}
              entry={team.progress[activeCheckpoint.id]}
              submitting={submitting}
              error={actionError}
              onAttempt={(payload) => handleAttempt(activeCheckpoint.id, payload)}
              onSkip={() => handleSkip(activeCheckpoint.id)}
              onClose={() => {
                setActiveCheckpointId(null)
                setActionError(null)
              }}
            />
          )}

          {settingsOpen && (
            <MenuSheet
              theme={theme}
              isDark={theme.isDark}
              onToggleTheme={toggleTheme}
              onLeaveTeam={handleLeaveTeam}
              onResetDemo={handleResetDemo}
              onClose={() => setSettingsOpen(false)}
              onNavigate={handleNavigate}
              team={team}
              rank={myRankEntry?.rank}
              event={event}
              inviteUrl={`${window.location.origin}${window.location.pathname}?team=${encodeURIComponent(session.teamId)}&key=${encodeURIComponent(session.token)}`}
            />
          )}
        </div>

        <TabBar theme={theme} screen={settingsOpen ? 'settings' : screen} onNavigate={handleNavigate} />
      </div>
    </div>
  )
}
