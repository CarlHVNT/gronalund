// Seed content for the Gröna Lund "Skattjakten" white-label event.
// Pin coordinates match the isometric park-plate artwork on the client
// (same local coordinate space the map SVG draws in).

const CHECKPOINTS = [
  {
    id: 1,
    order: 1,
    name: 'Lustiga Huset',
    subtitle: 'Spökhuset från 1900-talet',
    type: 'quiz',
    points: 150,
    pin: { x: 158, y: 404, r: 16 },
    prompt: 'Hur många speglar måste ni gå förbi innan ni hittar utgången?',
    options: ['3', '5', '7', '9'],
    correctIndex: 2,
  },
  {
    id: 2,
    order: 2,
    name: 'Twister',
    subtitle: 'Klassisk berg- och dalbana',
    type: 'photo',
    points: 200,
    pin: { x: 103, y: 344, r: 16 },
    prompt: 'Ta en bild på hela laget med armarna i luften framför Twister.',
  },
  {
    id: 3,
    order: 3,
    name: 'Jetline',
    subtitle: 'Parkens snabbaste bana',
    type: 'clue',
    points: 130,
    pin: { x: 209, y: 374, r: 16 },
    prompt: 'Hitta skylten vid Jetlines köentré och skriv av koden ni ser.',
    hint: 'Koden börjar på "JET".',
    code: 'JET-7',
  },
  {
    id: 4,
    order: 4,
    name: 'Eclipse',
    subtitle: 'Kvällens huvudattraktion',
    type: 'quiz',
    points: 180,
    pin: { x: 231, y: 292, r: 19 },
    prompt: 'Hur många gånger vänder ni upp och ner under en tur med Eclipse?',
    options: ['0', '1', '2', '4'],
    correctIndex: 2,
  },
  {
    id: 5,
    order: 5,
    name: 'Kvasten',
    subtitle: 'Snurrig karusell',
    type: 'photo',
    points: 200,
    pin: { x: 142, y: 228, r: 16 },
    prompt: 'Fånga ett foto av laget mitt i snurren på Kvasten.',
  },
  {
    id: 6,
    order: 6,
    name: 'Fritt Fall',
    subtitle: 'Tornet alla pratar om',
    type: 'quiz',
    points: 150,
    pin: { x: 261, y: 112, r: 16 },
    prompt: 'Hur många sekunder känns fallet på Fritt Fall som?',
    options: ['1', '3', '5', '10'],
    correctIndex: 1,
  },
  {
    id: 7,
    order: 7,
    name: 'Blå Tåget',
    subtitle: 'Parkens äldsta åktur',
    type: 'clue',
    points: 130,
    pin: { x: 330, y: 196, r: 16 },
    prompt: 'Leta upp ledtråden inne i tunneln på Blå Tåget och skriv av ordet.',
    hint: 'Ordet är målat i blått.',
    code: 'DRAKEN',
  },
  {
    id: 8,
    order: 8,
    name: 'Insane',
    subtitle: 'Pendel högt över parken',
    type: 'photo',
    points: 200,
    pin: { x: 208, y: 134, r: 16 },
    prompt: 'Ta en actionbild av laget precis innan Insane svänger upp.',
  },
  {
    id: 9,
    order: 9,
    name: 'Katapulten',
    subtitle: 'Finalen — 0 till 90 på tre sekunder',
    type: 'quiz',
    points: 180,
    pin: { x: 330, y: 330, r: 16 },
    prompt: 'Vilken topphastighet skjuter Katapulten iväg med?',
    options: ['50 km/h', '70 km/h', '90 km/h', '120 km/h'],
    correctIndex: 2,
  },
]

const EVENT = {
  code: 'GRONA26',
  name: 'Tivoli Gröna Lund',
  title: 'Skattjakten',
  tagline: 'Nio hållplatser i parken. Spela som lag, en kväll.',
  reward: {
    title: 'En åktur på Fritt Fall',
    codePrefix: 'GL',
  },
  checkpoints: CHECKPOINTS,
}

// Strip everything a team shouldn't see before it has completed the stop.
function publicCheckpoint(cp) {
  const { correctIndex, code, ...rest } = cp
  return rest
}

function publicEvent() {
  return {
    code: EVENT.code,
    name: EVENT.name,
    title: EVENT.title,
    tagline: EVENT.tagline,
    reward: EVENT.reward,
    checkpoints: EVENT.checkpoints.map(publicCheckpoint),
  }
}

module.exports = { EVENT, publicEvent }
