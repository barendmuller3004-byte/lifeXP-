# Canopy push server

The one piece that makes reminders arrive even when Canopy (and the
browser) are completely closed. Everything else in Canopy runs with no
server at all — this is the deliberate exception, and it's optional.

**Honest status:** this was written without network access to actually
`npm install` and test a real push round-trip. It follows the standard,
documented usage of the `web-push` library (no hand-rolled crypto), but
verify it works before relying on it for anything time-sensitive.

## 1. Generate VAPID keys

VAPID keys are how a push service verifies pushes are actually coming
from you. One-time setup:

```bash
cd push-server
npm install
npx web-push generate-vapid-keys
```

This prints a public and private key. Copy `.env.example` to `.env` and
paste them in, plus make up a long random string for `SHARED_SECRET`
(this stops random people from posting fake reminders to your server —
treat it like a password).

```bash
cp .env.example .env
# then edit .env with your keys + secret
```

## 2. Run it locally to test

```bash
npm start
```

Visit `http://localhost:3000/` — you should see `{"ok":true,...}`.

## 3. Deploy it somewhere it stays running

Pick one (all have free tiers as of this writing — check current terms,
they change):

- **Render.com** — connect the repo, "New Web Service", root directory
  `push-server`, build command `npm install`, start command `npm start`.
  Add the three `.env` values as environment variables in Render's
  dashboard (don't commit `.env` itself).
- **Railway.app** — similar: new project from repo, set the same
  environment variables, deploy.
- **Fly.io** — works too, slightly more setup (needs `fly launch`).

Whichever you pick, you need the **public HTTPS URL** it gives you
(e.g. `https://your-app.onrender.com`) — that's what goes into Canopy.

Free tiers on these platforms commonly "sleep" the server after a period
of inactivity and take a few seconds to wake up on the next request —
fine here, since it's just checking a list once a minute, not serving
live traffic.

## 4. Connect Canopy to it

In Canopy: **Settings → Developer → Push Notifications**
(turn on Developer Mode first if you haven't) —

1. Paste your server's URL (e.g. `https://your-app.onrender.com`)
2. Paste the same `SHARED_SECRET` from your `.env`
3. Tap **Enable push**

Canopy will fetch the VAPID public key from your server automatically,
subscribe this browser to push, and send it. From then on, whenever a
reminder's schedule changes locally, Canopy re-syncs the list to your
server so it always knows what's due.

## Data & privacy, plainly

Once this is set up, reminder **titles and due times** leave your device
and live in `data.json` on whatever server you deployed — unencrypted,
readable by anyone with access to that server. Nothing else about your
Canopy data goes anywhere. If that trade-off isn't worth it for you,
don't set this up — everything else in Canopy still works exactly the
same without it, just tab/app-open-only for reminders.
