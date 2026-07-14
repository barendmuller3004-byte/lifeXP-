# LifeXP

A calm, single-file personal life app: capture anything on your mind and it
sorts itself into tasks, goals, events, people, habits, and ideas — then
helps you decide what matters today.

No build step, no server, no account. It's one self-contained HTML file
that runs entirely in your browser, with all data stored locally via
`localStorage`.

## Features

- **Daily Briefing** — an opening read on your day (what's done, what's next,
  and a pattern-based observation pulled from your own history) rather than
  a wall of separate widgets.
- **Smart capture** — dump a thought in plain language and it's classified
  into the right type automatically, with dates, recurrence, and linked
  people resolved for you.
- **Today's Priorities** — a ranked, explained shortlist of what's worth
  doing today, based on due dates, goal alignment, and your own patterns.
- **Growth** — a plain-language read on how you're doing across life areas
  (health, learning, relationships, mind, money, discipline), not a
  gamified stat screen.
- **Universal Search** — one input that browses your whole history by day
  when empty, and searches everything (tasks, notes, goals, people,
  memories) the moment you type.
- **Life Model** — a compact, editable profile of your goals, focus areas,
  patterns, and preferences that gets sent with every AI request so
  suggestions stay personal instead of generic.
- **Optional AI** — bring your own [OpenRouter](https://openrouter.ai/keys)
  API key in Settings to sharpen capture, priorities, and reflections.
  Everything still works fully on local logic without one.
- **Developer Mode** — off by default; turns on raw model selection and an
  AI connection diagnostics screen for anyone who wants them.

## Running it

Just open `index.html` in a browser. That's it — no install, no dependencies.

To serve it locally instead of opening the file directly (useful for testing
on a phone on the same network):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000 on any device on your network
```

## Data & privacy

- All data lives in your browser's `localStorage` — nothing is sent to a
  server, ever, except the optional AI calls described below.
- If you add an OpenRouter API key, capture text, priorities, and search
  questions are sent to OpenRouter for that one request only. See
  Settings → Privacy → "Manage AI memory" in-app for exactly what's included.
- Use Settings → Privacy → **Export my data (.json)** to back up or move to
  another device, and **Import data (.json)** to restore it.

## Tech

Plain HTML/CSS/JS — no framework, no bundler, no npm install. Fonts are
pulled from Google Fonts via CDN; everything else is inline in `index.html`.

## License

MIT — see [LICENSE](LICENSE).
