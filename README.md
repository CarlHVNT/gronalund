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
- `server/` — small Express API with an in-memory store, so multiple
  browser tabs/devices can join the same event code and share one live
  leaderboard (this is a prototype: state resets when the server restarts).

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

Netlify only serves the static `client/` build — it can't run the
always-on `server/` process, so the API needs to live on a separate host.
The client already supports this: it calls a relative `/api` path in dev,
and an absolute URL (set via `VITE_API_URL`) in production. `server/`
already has CORS enabled, so this just works cross-origin.

1. **Deploy `server/` somewhere that runs a persistent Node process** —
   Render, Fly.io, and Railway all have free tiers. For Render:
   push this repo, create a new **Web Service**, point it at `server/`
   (`server/render.yaml` has the settings pre-filled — root dir `server`,
   build `npm install`, start `npm start`). Note the URL it gives you,
   e.g. `https://gronalund-server.onrender.com`.
2. **Connect this repo to Netlify** (Add new site → Import from Git). It
   already has a root `netlify.toml` telling Netlify to build from the
   `client/` subfolder, so the default settings should just work.
3. In the Netlify site's **Environment variables**, add
   `VITE_API_URL` = the server URL from step 1 (no trailing slash), then
   trigger a deploy (env var changes need a rebuild to take effect).
4. Open the Netlify URL, join with `GRONA26`, and it should behave exactly
   like the local dev version — including the shared leaderboard, since
   every visitor now hits the same live server.

Note this is still a prototype backend: state is in-memory and resets
whenever the server host restarts/redeploys/sleeps (free tiers on Render
spin down when idle and lose state on wake).
