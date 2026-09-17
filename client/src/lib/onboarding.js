// Copy and persistence for the two onboarding layers:
//  - the intro carousel shown before the join form on a device's first visit
//  - the guided tour that spotlights the map, the next-stop card and the tabs
//    right after a team is in.
// Both can be replayed from the menu.

export const INTRO_SEEN_KEY = 'rs-gl-intro-seen'
export const TOUR_DONE_KEY = 'rs-gl-tour-done'

export const INTRO_STEPS = [
  {
    key: 'welcome',
    icon: '🎡',
    title: 'Välkommen till Skattjakten',
    body: 'Nio hållplatser runt Gröna Lund. Ni spelar som lag, letar er fram till varje plats och löser ett uppdrag där.',
  },
  {
    key: 'missions',
    icon: '🧭',
    title: 'Tre typer av uppdrag',
    body: 'Varje hållplats har ett uppdrag att klara på plats.',
    bullets: [
      ['❓', 'Fråga', 'En klurig fråga om parken. Välj rätt svar.'],
      ['📷', 'Foto', 'En gruppbild på laget framför attraktionen.'],
      ['🧭', 'Ledtråd', 'Hitta koden på skylten och skriv in den.'],
    ],
  },
  {
    key: 'points',
    icon: '🏆',
    title: 'Samla poäng och tävla live',
    body: 'Rätt svar ger poäng direkt. Fel svar? Försök igen. Topplistan uppdateras hela tiden och alla lag i kväll tävlar samtidigt.',
  },
  {
    key: 'reward',
    icon: '🎁',
    title: 'Belöningen väntar i mål',
    body: 'När alla hållplatser är klara låses belöningen upp. Visa koden för personalen så får ni den.',
  },
]

export function tourSteps(teamName) {
  return [
    {
      key: 'hello',
      title: `Välkommen, ${teamName}!`,
      body: 'Ni är med i Skattjakten. Här är en snabb rundtur, den tar tio sekunder.',
    },
    {
      key: 'map',
      target: 'map',
      title: 'Kartan',
      body: 'Alla hållplatser är utsatta med nummer. Nästa hållplats är markerad, klara fylls i och missade får en röd ring. Tryck på en siffra för att öppna uppdraget.',
    },
    {
      key: 'next',
      target: 'next',
      title: 'Nästa hållplats',
      body: 'Här ser ni alltid vart ni ska härnäst. Tryck Öppna när ni står på plats.',
    },
    {
      key: 'tabs',
      target: 'tabs',
      title: 'Hitta runt i appen',
      body: 'Hållplatslistan, topplistan och målet finns här nere. Menyn har regler, parkinfo och en inbjudan så fler mobiler kan spela i ert lag.',
    },
  ]
}

export function readFlag(key) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export function writeFlag(key) {
  try {
    localStorage.setItem(key, '1')
  } catch {
    /* private mode etc.: the flow simply shows again next time */
  }
}
