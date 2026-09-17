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

- Open `<site URL>/api/event` in a browser. It should return JSON with
  `"code": "1234"` and `"storage": "blobs"`. HTML instead means the function
  was not deployed: check the Netlify deploy log for `netlify/functions`.
  `"storage": "memory"` means Netlify Blobs is unavailable on the site, so
  state is not shared between devices.
- If `VITE_API_URL` is set, make sure it matches the server URL exactly, with
  no trailing slash, and that the site was rebuilt after setting it.

### Real park map (data pipeline)

`tools/park-geodata.mjs` pulls Gröna Lund's real layout from OpenStreetMap
(park boundary, buildings, named attractions, coaster tracks, footpaths,
shoreline, food/toilets/entrances) and projects it into the app's map
coordinate space (`client/src/data/park-geo.json`), auto-rotated so the park
fills a portrait phone screen. `client/src/lib/geo.js` holds the same
projection for the client, so checkpoint pins and live GPS positions can be
placed on the illustrated map with lat/lon.

```
npm run geodata                                  # query Overpass and write park-geo.json
node tools/park-geodata.mjs convert --input tools/park-osm.raw.json   # re-convert offline
```

The Overpass query needs outbound network access to overpass-api.de. The
output carries an attribution string; keep "© OpenStreetMap contributors"
visible wherever the map is rendered (ODbL).
