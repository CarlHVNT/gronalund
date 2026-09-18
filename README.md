# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/ReadySet x Grona Lund Mockups.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `Copy of Sales UI mockups` project files (HTML prototypes, assets, components)

## The implemented prototype

The mockups in `project/` (turns 2 and 3 — the shipped-app skeleton in Gröna
Lund's colours, light + evening skins, with the isometric 3D map) have been
built out as a real, interactive web app:

- `client/` — React + Vite + Tailwind frontend (the phone-style screens:
  welcome/join, isometric map, checkpoints list, mission sheet for
  photo/quiz/clue challenges, live leaderboard, finish & reward).
- `server/` — the game API. `server/game.js` holds every route as one
  framework-agnostic handler with a pluggable team store; `server/index.js`
  wraps it in Express with an in-memory store for local dev (or a Render
  deploy), and `client/netlify/functions/api.mjs` wraps the same handler in a
  Netlify Function backed by Netlify Blobs for the deployed site. Either way,
  multiple browser tabs/devices join the same event code and share one live
  leaderboard.

**Onboarding.** A device's first visit gets a four-step intro carousel
(what the hunt is, the three mission types, points, the reward) before the
join form, swipeable and keyboard-navigable. Right after a team is in, a
short spotlight tour points out the map, the next-stop card and the tabs.
Phones that arrive through an invite link skip the carousel and get the
tour with a team greeting. Both are remembered per device (localStorage
keys `rs-gl-intro-seen` and `rs-gl-tour-done`) and can be replayed from the
menu. Every mission sheet carries a one-line instruction for its type.

The ☰ menu in the app holds how-to-play, an **invite** page (QR code +
link that lets teammates' phones join the same team and share progress),
park info, the light/evening theme toggle, leave-team, and a demo reset.

**Run it:**

```
npm run install:all   # installs client + server deps
npm run dev            # runs both — client on :5173, API on :4000
```

Then open http://localhost:5173, join with event code `1234`, and play
through. The gear icon (or the settings tab) has a light/evening theme
toggle, a way to leave your team, and a "reset the whole event" button for
re-running the demo.

### Deploying to Netlify

Netlify serves the static `client/` build **and** runs the API as a Netlify
Function (`client/netlify/functions/api.mjs`) at `/api/*`. Shared state
(teams, progress, leaderboard) lives in Netlify Blobs, so every visitor to
the site plays in the same live event. There is nothing to configure:

1. Connect this repo to Netlify (Add new site → Import from Git). The root
   `netlify.toml` builds from `client/` and picks up the function.
2. Open the Netlify URL and join with `1234`.

State persists in Blobs until someone presses "reset the whole event" in
the settings sheet.

**Running the API elsewhere instead** (e.g. Render, using `server/`, which
keeps state in memory): deploy `server/` (`server/render.yaml` has the
settings pre-filled), then set `VITE_API_URL` to that server's origin in the
Netlify site's environment variables and rebuild. The client then calls that
server instead of the Netlify Function.

**If the app shows "Kunde inte ladda eventet"**, it cannot reach the API.
The screen shows the exact problem and the API address the app tried:

- Open `<site URL>/api/health` in a browser. It writes, reads, lists and
  deletes a probe blob and reports `"ok": true` with timings and the
  consistency mode, or `"ok": false` with the exact error. HTML instead of
  JSON means the function was not deployed: check the Netlify deploy log for
  `netlify/functions`. `"storage": "memory"` means Netlify Blobs is
  unavailable on the site, so state is not shared between devices.
- Any 500 from the API now reads `Serverfel: <cause>` in the app, so the
  message on screen names the failing call. The same text is in the Netlify
  function log.
- If `VITE_API_URL` is set, make sure it matches the server URL exactly, with
  no trailing slash, and that the site was rebuilt after setting it.

### Real park map

Two map renderers share one data pipeline, and the map screen has a
"Ritad | 3D" switch in its top-right corner (also under menu → Inställningar):

- **Illustrated plate** (default): the isometric SVG in `IsoMap.jsx`.
- **3D vector map** (beta): MapLibre GL in `client/src/components/VectorMap.jsx`
  renders our own GeoJSON layers from OpenStreetMap in the brand palette:
  park plate with a soft glow, footpaths with casing, lawns, extruded
  buildings with roof tiers, stylised 3D models of the rides (see below),
  water and shoreline, points of interest, and a mask that fades everything
  outside the park. Numbered checkpoint pins land on the ride with the same
  name; name chips with icons for checkpoints, rides and food/toilets appear
  as you zoom, laid out without overlaps. Controls: 2D/3D pitch toggle,
  recentre, and a locate-me button whose position feeds distance hints (a
  "300 m" pill on the next-stop card, and a note in the mission sheet when
  the team is far from the stop). The camera frames the whole park inside
  the visible area at the chosen pitch, both styles follow the theme, the
  renderer is a lazily loaded chunk, and the choice is remembered per
  device. MapLibre's worker is bundled by Vite and handed over with
  `setWorkerUrl` (its default URL guessing does not work under a bundler).
  If the chunk fails to load, the reason is shown on the map and the plate
  stays.

**Installable and offline-tolerant.** `vite-plugin-pwa` precaches the app
shell (including the map chunk) and caches the event content; the API is
otherwise never cached. A new deploy takes over on the next visit. The menu
footer shows the build stamp (`Version <time> · <commit>`), so anyone can
tell which version a phone is running.

`tools/park-geodata.mjs` pulls the layout from OpenStreetMap (park
boundary, buildings with heights, named attractions, coaster tracks,
footpaths, shoreline, food/toilets/entrances) and writes both
`client/src/data/park-geo.json` (projected for the plate) and
`client/src/data/park.geojson.json` (WGS84 for the vector map, with the
park's centre, axis bearing and bounds in `meta`). `client/src/lib/geo.js`
holds the same projection for the client, and `client/src/lib/parkGeo.js`
resolves checkpoint positions (an explicit `geo: [lat, lon]` on a checkpoint
in `server/data.js` wins over name matching) and computes distances.

The easiest way to refresh the data is the **"Update park geodata"** GitHub
Actions workflow (Actions tab → Run workflow): it pulls from OpenStreetMap
on a GitHub runner, prints a report of which checkpoints matched a named
ride, commits the two data files to main and thereby triggers a Netlify
redeploy. Locally:

```
npm run geodata                                    # query Overpass and write both files
node tools/park-report.mjs                         # which checkpoints matched a ride by name
node tools/park-geodata.mjs convert --input tools/park-osm.raw.json   # re-convert offline
node tools/park-fixture.mjs && node tools/park-geodata.mjs convert --input tools/park-fixture.json --synthetic
```

**Optional street context.** Drop a Protomaps extract at
`client/public/context.pmtiles` and the vector map draws muted water, roads
and buildings around the park underneath the mask. Create it with the
`pmtiles` CLI, for example
`pmtiles extract https://build.protomaps.com/<date>.pmtiles context.pmtiles --bbox=18.085,59.315,18.110,59.332`.
Nothing happens when the file is absent.

The committed data is **real OpenStreetMap geometry** pulled by the workflow
(all nine checkpoints match their ride by name; the report in the workflow
summary shows the matches). The last line above regenerates the labelled
synthetic stand-in used for development; the vector map shows a banner when
that is what it is drawing. The Overpass query needs outbound network
access to overpass-api.de and identifies itself with a User-Agent, which
the public instance requires. The output carries an attribution string;
keep "© OpenStreetMap contributors" visible wherever the map is rendered
(ODbL).

Three derived pieces make the real data look like the park: OpenStreetMap has
no sea polygons, only coastline lines with land on the left, so
`client/src/lib/sea.js` builds the sea (and islands) inside the camera's
reach from those lines; `client/src/lib/bearing.js` picks the map
rotation that makes the park narrowest on a portrait screen, with north-up
as the tie-break, because the park's outline is nearly square; and
`client/src/lib/models.js` turns the rides into small 3D models.

**Ride models.** OpenStreetMap only gives each ride a point, a kind and, for
some, a footprint, so `models.js` builds stylised assets from that at load
time, as plain `fill-extrusion` polygons with a base, a height and a tone
(the tones map to colours in `VectorMap.jsx`, in both themes): drop towers
with a shaft, gondola ring and crown (Fritt fall gets its four cars and a
machine house), the Eclipse StarFlyer as a 121 m mast with a seat ring
(its height comes from the OSM "tower" building it stands on, which is no
longer drawn as a prism), Kättingflygaren as a wave swinger with a canopy
and hanging chairs, the Ferris wheel as a ring of gondolas on two supports,
the carousel with tiered canopies, teacups, the magic carpet, the octopus /
rocket / elephant arm rides, bumper cars under a canopy, dark rides and game
halls as their footprint with a roof tier, and every other building with a
roof tier. Coaster tracks become a ribbon on supports that starts low at
the station, climbs a lift hill and rolls on with decaying hills, each
coaster with its own height and colour (Monster dark green and tall, Twister
a cream track on wooden bents, Jetline blue around its footprint since OSM
maps it as an area, Kvasten teal, Vilda musen orange, Insane a steel frame
with the track climbing through it). Trees (`natural=tree`, and one every
7 m along `tree_row`s) get a trunk and a crown, and lawns / flower beds /
gardens become the `green` layer. Kinds OSM leaves as plain
"amusement_ride" are refined from the ride's name, so a renamed or new ride
falls back to a generic pavilion rather than disappearing. Draw order
matters for this: MapLibre paints flat layers over anything extruded, so
the style puts every flat layer (including the mask that fades the
surroundings and the sea) below the buildings and models. Because the mask
therefore cannot dim extruded shapes, `parkGeo.js` flags buildings and trees
outside the park (point-in-polygon against the park outline) and the style
draws those from their own faded layer.
