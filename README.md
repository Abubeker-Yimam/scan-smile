# Scan & Smile

> One scan, a lifetime of memories.

Every guest at a celebration gets a table card with their own QR code. They scan it and a page
opens that was written for them alone: a welcome by name, a note from the hosts, a photo, a short
video, and where they're sitting.

Built for weddings, Shengerena, graduations, birthdays, traditional ceremonies, anniversaries and
baby showers.

## Run it

```bash
docker run -d -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16   # or a Neon URL
npm install
cp .env.example .env   # set DATABASE_URL, and ADMIN_PASSWORD to something of your own
npm run setup          # applies migrations and loads a sample wedding
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` for the third step.

| Where | What |
| --- | --- |
| http://localhost:3000 | Public page, with a scannable sample card |
| http://localhost:3000/g/DEMO247 | A guest's page, as a guest sees it |
| http://localhost:3000/admin | Host dashboard — the password is your `ADMIN_PASSWORD` |

There is no default password. If `ADMIN_PASSWORD` is unset the dashboard refuses every login
rather than falling back to a value published in this repo.

## Testing a real scan

`localhost` on a phone means the phone itself, so a QR pointing there won't open. Put your
computer's LAN address in `.env` before generating codes you intend to scan:

```
NEXT_PUBLIC_BASE_URL="http://192.168.1.20:3000"
```

Then run `npm run dev -- -H 0.0.0.0` and scan from a phone on the same network. The URL is baked
into each code at render time, so changing it re-points every card at once — but re-print anything
already on a table.

Test scans count like real ones. Zero the counters once the cards are proven and before guests
arrive:

```bash
npm run db:reset-scans
```

## Running an event

Nothing here needs a developer. Everything a live event requires — creating it, naming the
occasion, choosing its colours, adding guests, writing their messages, uploading photos and
video, printing the cards — is a form in `/admin`.

| To do this | Go here |
| --- | --- |
| Book an event | `/admin`, "Book a new event" |
| Add guests, one at a time or a pasted list | `/admin/events/<id>` |
| Write a guest's message, add their photo and video | `/admin/events/<id>/guests/<guestId>` |
| Change the message or video every guest sees | `/admin/events/<id>`, "Event settings" |
| Name an occasion the list doesn't cover | "Word above the guest's name" |
| Give an event its own colours | "Card colours" — three hex codes |
| Print the table cards | "Print table cards", four to an A4 sheet |

The occasion list in [`src/lib/events.ts`](src/lib/events.ts) is a set of defaults, not a fixed
menu. A host who needs "Mahiber" or a colour scheme matched to their flowers sets the eyebrow and
the three thread colours on the event itself; the built-in palette only applies when those are
empty. Adding a *new named preset* to the dropdown is still a code change, but nothing is blocked
on one.

The one thing still hard-coded is **who can log in**: a single shared `ADMIN_PASSWORD` for the
whole dashboard. Every host who books an event uses the same password and can see every other
host's guest list. That is fine while you run the events yourself and wrong the moment clients log
in directly.

## Deploying

Three moving parts: the app, the database, and the media.

### The app

Vercel, Railway, Render, Fly.io and a plain VPS all work. This is not a static site and not a fit
for a pure edge runtime: it uses `sharp` to process images and streams video through a Node route.

Node 22 is required, pinned by `.nvmrc` and `engines`. If a builder picks an older version anyway,
set `NIXPACKS_NODE_VERSION=22` — Node 18 ships npm 9, which fails to install platform-specific
optional dependencies ([npm/cli#4828]) and the Tailwind native binary goes missing mid-build.

[npm/cli#4828]: https://github.com/npm/cli/issues/4828

Set these variables, then **generate a domain and set `APP_BASE_URL` to it before printing
anything** — that URL is baked into every QR code:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | your database connection string |
| `ADMIN_PASSWORD` | something only you know |
| `APP_BASE_URL` | your public URL, e.g. `https://scan-smile-production.up.railway.app` |
| `S3_*`, `MEDIA_BASE_URL` | see [Media storage](#media-storage) |

### The database

**Postgres, in development as well as production.** Neon, Supabase and Railway all have a usable
free tier; Neon's branching is pleasant for staging. Locally, Docker does the job:

```bash
docker run -d -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
```

This used to be SQLite, which was fine for one event at a time and wrong for everything else. One
file, one writer: every guest who scans writes a counter, so a few hundred people scanning as
dinner is announced contend for the write lock. It also pins the app to a single container with a
disk, which rules out most hosts.

Migrations are applied by `prisma migrate deploy`, which runs only committed migrations and never
drops a column. Do not put `prisma db push` in a start or build command — it silently reshapes a
live database to match whatever the schema file happens to say.

**Two URLs, not one.** `DATABASE_URL` serves traffic and `DIRECT_URL` is used only by
`prisma migrate`. On a plain Postgres they are the same string. They differ on a host that puts a
connection pooler in front, because a pooler in transaction mode hands your connection to someone
else between queries — fine for a query, fatal for a migration that holds a lock across several.

### Supabase, end to end

Supabase covers both the database and the media, so it is one signup rather than two.

**Database.** Project Settings → Database → Connection string, and take the *pooler* URLs. Both
are IPv4; the `db.<ref>.supabase.co` host shown at the top is IPv6-only and will not resolve from
Vercel, which is the single most common way this setup fails.

```
DATABASE_URL  …pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL    …pooler.supabase.com:5432/postgres
```

Port 6543 is the transaction pooler, for serving. `pgbouncer=true` tells Prisma to stop using
prepared statements, which do not survive that pooler. `connection_limit=1` keeps a swarm of
serverless functions from exhausting the pool. Port 5432 is the session pooler, for migrations.

**Storage.** Create a bucket and mark it **public** — guests are not signed in, and their browsers
fetch photos directly. Then Project Settings → Storage → S3 access keys, and generate one:

```
S3_BUCKET         your bucket name
S3_ENDPOINT       https://<ref>.supabase.co/storage/v1/s3
S3_REGION         your project's region, e.g. eu-central-1
MEDIA_BASE_URL    https://<ref>.supabase.co/storage/v1/object/public/<bucket>
```

The endpoint and the public base are different paths on purpose: the first is where the app writes
through the S3 API, the second is where browsers read. Supabase requires path-style addressing,
which the driver already uses whenever `S3_ENDPOINT` is set.

The free tier is 1GB stored and 5GB of egress a month. A 200-guest event is roughly 60MB of photos,
so the ceiling is egress — about 80 events' worth of guests loading their page a few times each.
Cloudflare R2 is the alternative and bills no egress at all; the variables are the same four.

### Deploying to Vercel

Works, with the media and database both off-box — which they now are. Set `S3_*` and
`MEDIA_BASE_URL` for storage, `DATABASE_URL` and `DIRECT_URL` for Postgres; there is no local disk
to fall back on, so neither is optional.

Vercel never runs a start command, so `prisma migrate deploy` would never fire from `start:prod`.
The `vercel-build` script exists for that: Vercel runs it in place of the default build command
and migrations are applied at build time. Local `npm run build` stays database-free.

**One limit to know:** Vercel caps serverless request bodies at 4.5MB, below the 50MB this app
allows for video. Photos are unaffected — the browser downscales to a few hundred KB before
sending. Video *uploads* over 4.5MB fail at the platform layer, before the request reaches the
app, so the error is an opaque 413 rather than the message in `uploads.ts`. Pasted YouTube and
Vimeo links are unaffected: they are just a URL in a text field and never touch an upload path.

Railway has no such cap, which is the main reason to prefer it if hosts will upload video files.

### Deploying to Railway

`railway.json` is already set up: `npm run build` to build, `npm run start:prod` to serve, which
applies pending migrations first. Add a Postgres service and Railway sets `DATABASE_URL` for you.

### Media storage

Two drivers, chosen by environment, behind one interface in
[`src/lib/storage.ts`](src/lib/storage.ts).

**Object storage is the recommendation** — set `S3_BUCKET` and the app uses it. Any S3-compatible
service works; **Cloudflare R2** is the one to pick, because egress is free and guest photos are
almost all egress. A 200-guest event with a photo each is roughly 60MB stored and pennies a month.

| Variable | Note |
| --- | --- |
| `S3_BUCKET` | Setting this switches the driver. The others then become required. |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com`. Omit for AWS S3. |
| `S3_REGION` | `auto` for R2. |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | An R2 API token scoped to this one bucket. |
| `MEDIA_BASE_URL` | Public base the *browser* fetches from — a custom domain on the bucket, or its `r2.dev` subdomain. Must be world-readable. |

Guests' browsers fetch photos straight from the bucket, so the app never sits in the path of a
download and a slow guest on hotel wifi cannot occupy a server connection. Objects are written
with a one-year immutable cache header; keys carry a random component and are never reused, so a
replaced photo gets a new URL rather than a stale cached one.

**Local disk** is the other driver, and the default when `S3_BUCKET` is unset. In development
files go to `public/uploads` and Next serves them directly. In a single-container deployment set
`UPLOAD_DIR=/data/uploads` on a mounted volume; that puts them outside `public/`, so
[`/media/[file]`](src/app/media/[file]/route.ts) serves them instead, with range requests so a
guest can scrub a video rather than download it whole. This ties the app to one container and one
disk you have to back up yourself, which is why it is not the recommendation.

Nothing above `storage()` knows which driver is active. `saveImage()` and `saveVideo()` return a
URL either way, and the URL is what lands in the database.

**Old media is cleaned up as it stops being used**, not on a schedule:

- replacing a guest's photo deletes the one it replaced
- "Remove photo" / "Remove video" deletes the file, not just the reference
- deleting a guest deletes their photo and video
- deleting an event deletes its cover, and every guest's media with it

Deletes happen *after* the database write, so a failure leaves an unreferenced file rather than a
guest page pointing at something that is gone. Pasted YouTube links and anything that does not
match a key this app generated are skipped, so cleanup can never reach outside its own bucket.
There is no periodic sweep for orphans; at the volume this app writes, an occasional stray object
costs a fraction of a cent and a sweep is a job scheduler nobody has to run.

## Photos and video: what's allowed

Enforced twice. The browser checks first — and for photos, fixes the problem rather than
complaining — so a host on venue wifi is not uploading 12MB to be told no. The server checks again
in [`src/lib/uploads.ts`](src/lib/uploads.ts), because a form can be posted without ever running
the browser code. Limits live in one place,
[`src/lib/upload-limits.ts`](src/lib/upload-limits.ts).

| Limit | Value | Why |
| --- | --- | --- |
| Photo, on the wire | 15MB | A 48MP phone photo is 8–14MB as JPEG. Accepts anything a phone makes; refuses a RAW file. |
| Photo, before the browser gives up | 40MB | Under this, an oversized photo is silently downscaled rather than rejected. Past it, it isn't a photograph. |
| Photo, decoded | 50 megapixels | File size is not a bound on decode cost. A small file can be gigabytes of pixels; this refuses it before allocating them. |
| Photo, stored | 2000px on the longest edge, WebP q80 | The guest page shows a photo at 608 CSS px and a printed card needs ~1000px at 300dpi. 2000px covers a 3× retina phone and print. |
| Video | 50MB | About a minute of 1080p phone video — the length these messages actually are. Longer belongs on YouTube, pasted as a link. |

Every image is re-encoded server-side regardless of what arrived. That normalises HEIC and 48MP
JPEG into one format the guest page can render, applies the EXIF rotation so portrait photos are
not sideways, and **drops EXIF**, so the GPS coordinates of someone's house do not ship inside a
wedding photo. A typical phone photo lands at 150–350KB, twenty to forty times smaller than it
started.

Video is stored exactly as uploaded. Transcoding needs ffmpeg and turns saving a form into a job
queue with workers to run it; the size cap is what makes that unnecessary.

## How the pieces fit

```
src/app/page.tsx                              public page; the hero is a live card
src/app/g/[code]/page.tsx                     what a guest sees after scanning
src/app/api/qr/[code]/route.ts                PNG + SVG codes, any size
src/app/admin/                                dashboard: events, guests, media, print sheet
src/app/admin/events/[id]/cards/page.tsx      four table cards to an A4 sheet
src/app/admin/media-inputs.tsx                browser-side checks and photo downscaling
src/lib/events.ts                             default occasions and their tibeb thread colours
src/lib/upload-limits.ts                      every size limit, in one place
src/lib/uploads.ts                            validation, image processing, cleanup
src/lib/storage.ts                            local disk or S3-compatible bucket
prisma/schema.prisma                          Event and Guest
prisma/migrations/                            applied by npm run start:prod on deploy
```

**Events hold the fallbacks, guests hold the exceptions.** Write one thank-you message on the
event and every guest gets it; write one on a guest and they get theirs instead. Same for video.
That's what makes a 200-guest wedding practical to set up in an evening.

**Codes are unique across every event** (`src/lib/codes.ts`) and avoid look-alike characters, so a
card can be read out loud and never opens the wrong page.

## Design

The guest page is a cotton-white card lying on a dark table, edged with a **tibeb** band — the
woven border of a netela — rendered in CSS from three thread colours. Each occasion carries a
default set of threads in `src/lib/events.ts` and any event can override them from the dashboard,
so one stylesheet dresses a wedding, a graduation and something nobody has thought of yet. The
band recurs as the divider between sections; it's the only ornament on the page.

The dashboard is deliberately plain by contrast: hairline rules, mono labels, dense tables. One is
a keepsake, the other is a tool.

## Before this goes live

- [ ] Give each host their own login if clients will use the dashboard directly — today it's a
      single shared `ADMIN_PASSWORD` and every host can see every other host's guest list.
- [ ] Guest pages are unlisted but public — anyone with a code can open one. If a host wants a card
      to stop working after the event, add an expiry check in `src/app/g/[code]/page.tsx`.
- [ ] Every scan writes a row, so link previews and crawlers inflate the counters. `X-Robots-Tag`
      keeps guest pages out of search results, but a messaging app that unfurls a link still counts
      as a scan.
